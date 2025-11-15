# E2E Test Fixtures

This directory contains test data files for E2E tests.

## Files

### test-xtb-sample.xlsx
Sample XTB export file with test transactions. Contains:
- 10 AAPL buy transactions
- 5 GOOGL buy transactions
- 3 TSLA buy/sell transactions
- 1 dividend payment
- Mix of MAIN, IKE, and IKZE accounts

**Note**: This file should be created manually or generated using a script.
The structure should match the XTB Station export format.

## Creating Test Data

To create test Excel files:
1. Export a real file from XTB Station
2. Anonymize the data
3. Reduce transaction count to ~20 for faster tests
4. Save as `test-xtb-sample.xlsx`

Or use the backend script:
```bash
cd backend
npm run generate-test-xtb
```
