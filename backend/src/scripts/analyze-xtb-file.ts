/**
 * Script to analyze XTB Excel file structure
 * Used for development purposes only
 */

import ExcelJS from 'exceljs';
import path from 'path';

async function analyzeXtbFile() {
  const filePath = path.join(__dirname, '../../../tmp/account_51307109_pl_xlsx_2005-12-31_2025-10-17.xlsx');
  
  console.log('Analyzing XTB Excel file:', filePath);
  console.log('---');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  console.log('Number of worksheets:', workbook.worksheets.length);
  console.log('---');

  workbook.worksheets.forEach((worksheet, index) => {
    // Only analyze CASH OPERATION HISTORY worksheet
    if (worksheet.name !== 'CASH OPERATION HISTORY') {
      return;
    }

    console.log(`\nWorksheet ${index + 1}: "${worksheet.name}"`);
    console.log(`Rows: ${worksheet.rowCount}, Columns: ${worksheet.columnCount}`);
    
    // Print first 20 rows to see headers and data
    console.log('\nFirst 20 rows:');
    let rowsPrinted = 0;
    worksheet.eachRow((row, rowNumber) => {
      if (rowsPrinted < 20) {
        const values: unknown[] = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          values[colNumber - 1] = cell.value;
        });
        console.log(`Row ${rowNumber}:`, JSON.stringify(values));
        rowsPrinted++;
      }
    });
    console.log('---');
  });
}

analyzeXtbFile().catch(console.error);
