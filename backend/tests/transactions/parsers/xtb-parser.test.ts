import { XtbParser } from '../../../src/transactions/xtb-parser';

describe('XtbParser', () => {
  describe('mapTransactionType', () => {
    it('should map "Stock purchase" to BUY (1)', () => {
      expect(XtbParser.mapTransactionType('Stock purchase')).toBe(1);
    });

    it('should map "Stock sale" to SELL (2)', () => {
      expect(XtbParser.mapTransactionType('Stock sale')).toBe(2);
    });

    it('should map "dividend" to DIVIDEND (3)', () => {
      expect(XtbParser.mapTransactionType('dividend payment')).toBe(3);
    });

    it('should map "deposit" to DEPOSIT (4)', () => {
      expect(XtbParser.mapTransactionType('deposit')).toBe(4);
      expect(XtbParser.mapTransactionType('BLIK deposit')).toBe(4);
    });

    it('should map "withdrawal" to WITHDRAWAL (5)', () => {
      expect(XtbParser.mapTransactionType('withdrawal')).toBe(5);
    });

    it('should map "IKE Deposit" to DEPOSIT (4)', () => {
      expect(XtbParser.mapTransactionType('IKE Deposit')).toBe(4);
    });

    it('should default unknown types to DEPOSIT (4)', () => {
      expect(XtbParser.mapTransactionType('unknown type')).toBe(4);
    });
  });

  describe('mapAccountType', () => {
    it('should map IKE mention to IKE (2)', () => {
      expect(
        XtbParser.mapAccountType('Transfer out operation on account with id 51307109 IKE')
      ).toBe(2);
    });

    it('should map IKZE mention to IKZE (3)', () => {
      expect(XtbParser.mapAccountType('IKZE deposit operation')).toBe(3);
    });

    it('should default to MAIN (1) when no mention', () => {
      expect(XtbParser.mapAccountType('OPEN BUY 10 @ 150.50')).toBe(1);
    });

    it('should default to MAIN (1) when both IKE and IKZE mentioned', () => {
      expect(XtbParser.mapAccountType('Transfer from IKE to IKZE')).toBe(1);
    });
  });

  describe('extractQuantity', () => {
    it('should extract quantity from "OPEN BUY 10 @ 150.50"', () => {
      expect(XtbParser.extractQuantity('OPEN BUY 10 @ 150.50')).toBe(10);
    });

    it('should extract decimal quantity from "OPEN BUY 0.2344 @ 10.992"', () => {
      expect(XtbParser.extractQuantity('OPEN BUY 0.2344 @ 10.992')).toBe(0.2344);
    });

    it('should extract quantity from "SELL 5.5 @ 200"', () => {
      expect(XtbParser.extractQuantity('SELL 5.5 @ 200')).toBe(5.5);
    });

    it('should extract quantity with slash notation "BUY 3/3.2344 @ 10.992"', () => {
      expect(XtbParser.extractQuantity('OPEN BUY 3/3.2344 @ 10.992')).toBe(3);
    });

    it('should return null when no quantity found', () => {
      expect(XtbParser.extractQuantity('dividend payment')).toBeNull();
    });
  });

  describe('extractPrice', () => {
    it('should extract price from "OPEN BUY 10 @ 150.50"', () => {
      expect(XtbParser.extractPrice('OPEN BUY 10 @ 150.50')).toBe(150.5);
    });

    it('should extract price from "@ 10.992"', () => {
      expect(XtbParser.extractPrice('OPEN BUY 0.2344 @ 10.992')).toBe(10.992);
    });

    it('should extract price without space "BUY 1@65.94"', () => {
      expect(XtbParser.extractPrice('OPEN BUY 1@65.94')).toBe(65.94);
    });

    it('should return null when no price found', () => {
      expect(XtbParser.extractPrice('deposit operation')).toBeNull();
    });
  });
});
