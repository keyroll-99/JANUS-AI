import ExcelJS from 'exceljs';

/**
 * Interface representing a raw transaction row from XTB Excel file
 */
export interface XtbTransactionRow {
  id: number;
  type: string;
  time: Date;
  comment: string;
  symbol: string | null;
  amount: number;
}

/**
 * Interface for parsed and mapped transaction ready for database insert
 */
export interface ParsedTransaction {
  transactionDate: string;
  transactionTypeId: number;
  accountTypeId: number;
  ticker: string | null;
  quantity: number | null;
  price: number | null;
  totalAmount: number;
  commission: number;
  notes: string;
}

/**
 * XTB Excel file parser
 * Parses CASH OPERATION HISTORY worksheet and maps to our transaction format
 */
export class XtbParser {
  private static readonly WORKSHEET_NAME = 'CASH OPERATION HISTORY';
  private static readonly HEADER_ROW = 11;
  private static readonly DATA_START_ROW = 12;

  // Column indices (0-based, but Excel uses 1-based so we subtract 1)
  private static readonly COL_ID = 1; // Column B
  private static readonly COL_TYPE = 2; // Column C
  private static readonly COL_TIME = 3; // Column D
  private static readonly COL_COMMENT = 4; // Column E
  private static readonly COL_SYMBOL = 5; // Column F
  private static readonly COL_AMOUNT = 6; // Column G

  /**
   * Parse XTB Excel file from buffer
   * @param buffer File buffer from multer
   * @returns Array of parsed transactions
   * @throws Error if file format is invalid
   */
  async parseFile(buffer: Buffer): Promise<XtbTransactionRow[]> {
    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.getWorksheet(XtbParser.WORKSHEET_NAME);
    if (!worksheet) {
      throw new Error(
        `Worksheet "${XtbParser.WORKSHEET_NAME}" not found in Excel file. Please upload a valid XTB export file.`
      );
    }

    const transactions: XtbTransactionRow[] = [];

    // Iterate through rows starting from DATA_START_ROW
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber < XtbParser.DATA_START_ROW) {
        return;
      }

      try {
        const transaction = this.parseRow(row);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        // Log error but continue parsing other rows
        console.warn(`Warning: Failed to parse row ${rowNumber}:`, error);
      }
    });

    if (transactions.length === 0) {
      throw new Error('No valid transactions found in the Excel file.');
    }

    return transactions;
  }

  /**
   * Parse a single row into XtbTransactionRow
   * @param row ExcelJS row
   * @returns Parsed transaction or null if row is invalid
   */
  private parseRow(row: ExcelJS.Row): XtbTransactionRow | null {
    const id = this.getCellValue(row, XtbParser.COL_ID);
    const type = this.getCellValue(row, XtbParser.COL_TYPE);
    const time = this.getCellValue(row, XtbParser.COL_TIME);
    const comment = this.getCellValue(row, XtbParser.COL_COMMENT);
    const symbol = this.getCellValue(row, XtbParser.COL_SYMBOL);
    const amount = this.getCellValue(row, XtbParser.COL_AMOUNT);

    // Skip rows without required fields
    if (!id || !type || !time || !amount) {
      return null;
    }

    return {
      id: Number(id),
      type: String(type),
      time: this.parseDate(time),
      comment: String(comment || ''),
      symbol: symbol ? String(symbol).toUpperCase() : null,
      amount: Number(amount),
    };
  }

  /**
   * Get cell value by column index
   * @param row ExcelJS row
   * @param colIndex Column index (0-based)
   * @returns Cell value or null
   */
  private getCellValue(row: ExcelJS.Row, colIndex: number): unknown {
    const cell = row.getCell(colIndex + 1); // ExcelJS uses 1-based indexing
    return cell.value;
  }

  /**
   * Parse date from various formats
   * @param value Date value from Excel
   * @returns Date object
   */
  private parseDate(value: unknown): Date {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    throw new Error(`Invalid date format: ${value}`);
  }

  /**
   * Map XTB transaction type to our transaction_type_id
   * @param xtbType XTB transaction type string
   * @returns transaction_type_id
   */
  static mapTransactionType(xtbType: string): number {
    const type = xtbType.toLowerCase();

    // BUY - Stock purchase
    if (type.includes('stock purchase') || type.includes('buy')) {
      return 1; // BUY
    }

    // SELL - Stock sale
    if (type.includes('stock sale') || type.includes('sell')) {
      return 2; // SELL
    }

    // DIVIDEND - Dividend payment
    if (type.includes('dividend')) {
      return 3; // DIVIDEND
    }

    // DEPOSIT - Money deposit
    if (
      type.includes('deposit') ||
      type.includes('blik') ||
      type.includes('transfer in')
    ) {
      return 4; // DEPOSIT
    }

    // WITHDRAWAL - Money withdrawal
    if (type.includes('withdrawal') || type.includes('transfer out')) {
      return 5; // WITHDRAWAL
    }

    // FEE - Commission or fee
    if (
      type.includes('fee') ||
      type.includes('commission') ||
      type.includes('charge')
    ) {
      return 6; // FEE
    }

    // Default to DEPOSIT for unknown types
    console.warn(`Unknown transaction type: ${xtbType}, defaulting to DEPOSIT`);
    return 4;
  }

  /**
   * Determine account type from comment
   * Defaults to MAIN (1), unless IKE/IKZE is mentioned
   * @param comment Transaction comment
   * @returns account_type_id
   */
  static mapAccountType(comment: string): number {
    const commentLower = comment.toLowerCase();

    if (commentLower.includes('ike') && commentLower.includes('ikze')) {
      // If both mentioned, default to MAIN
      return 1; // MAIN
    }

    if (commentLower.includes('ikze')) {
      return 3; // IKZE
    }

    if (commentLower.includes('ike')) {
      return 2; // IKE
    }

    return 1; // MAIN (default)
  }

  /**
   * Extract quantity from comment
   * Looks for patterns like "OPEN BUY 10 @ 150.50" or "SELL 5 @"
   * @param comment Transaction comment
   * @returns Quantity or null
   */
  static extractQuantity(comment: string): number | null {
    // Pattern: "OPEN BUY 10 @ price" or "BUY 10 @" or "SELL 5.5 @"
    const match = comment.match(/(?:BUY|SELL)\s+([\d.]+)(?:\s*@|\/)/i);
    if (match) {
      return parseFloat(match[1]);
    }
    return null;
  }

  /**
   * Extract price from comment
   * Looks for patterns like "@ 150.50" or "@ 10.992"
   * @param comment Transaction comment
   * @returns Price or null
   */
  static extractPrice(comment: string): number | null {
    // Pattern: "@ 150.50" or "@150.50"
    const match = comment.match(/@\s*([\d.]+)/);
    if (match) {
      return parseFloat(match[1]);
    }
    return null;
  }
}
