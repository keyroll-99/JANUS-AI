/**
 * Test script for Stooq API integration (Polish stocks)
 * Run with: npx ts-node src/scripts/test-stooq.ts
 */

interface TestCase {
  ticker: string;
  symbol: string;
  description: string;
}

const testCases: TestCase[] = [
  { ticker: 'CDR.PL', symbol: 'cdr', description: 'CD Projekt (Polish gaming company)' },
  { ticker: 'PKO.PL', symbol: 'pko', description: 'PKO Bank Polski' },
  { ticker: 'PKN.PL', symbol: 'pkn', description: 'PKN Orlen (Oil & Gas)' },
  { ticker: 'PZU.PL', symbol: 'pzu', description: 'PZU (Insurance)' },
];

async function testStooq(ticker: string, symbol: string, description: string): Promise<boolean> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Testing: ${description}`);
  console.log(`   Ticker: ${ticker} → Stooq symbol: ${symbol}`);
  console.log(`${'='.repeat(60)}`);

  try {
    const url = `https://stooq.com/q/l/?s=${symbol}&f=sd2t2ohlcv&h&e=json`;
    console.log(`🌐 URL: ${url}`);

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    console.log(`\n📦 Raw Response:`);
    console.log(JSON.stringify(data, null, 2));

    if (data.symbols && data.symbols.length > 0) {
      const symbolData = data.symbols[0];
      const price = parseFloat(symbolData.close);
      const open = parseFloat(symbolData.open);
      const high = parseFloat(symbolData.high);
      const low = parseFloat(symbolData.low);
      const volume = symbolData.volume;
      const date = symbolData.date;
      const time = symbolData.time;
      
      if (price && price > 0) {
        console.log(`\n✅ SUCCESS!`);
        console.log(`   Close Price: ${price} PLN`);
        console.log(`   Open: ${open} PLN`);
        console.log(`   High: ${high} PLN`);
        console.log(`   Low: ${low} PLN`);
        console.log(`   Volume: ${volume.toLocaleString()}`);
        console.log(`   Last Updated: ${date} ${time}`);
        
        const change = price - open;
        const changePercent = ((change / open) * 100).toFixed(2);
        console.log(`   Change: ${change > 0 ? '+' : ''}${change.toFixed(2)} PLN (${changePercent}%)`);
        
        return true;
      }
    }

    console.error(`❌ No valid price data in response`);
    return false;
  } catch (error) {
    console.error(`❌ Error:`, error);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing Stooq API Integration for Polish Stocks');
  console.log(`🌐 Base URL: https://stooq.com/q/l/`);
  console.log(`✅ No API key needed - completely free!\n`);

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const success = await testStooq(testCase.ticker, testCase.symbol, testCase.description);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay to be respectful to the API
    if (testCase !== testCases[testCases.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Final Results: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(60)}\n`);

  if (failed === 0) {
    console.log('✅ All tests passed! Stooq API integration is working correctly.');
    console.log('🎉 Polish stocks can now be fetched without any API key!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Check the logs above for details.');
    process.exit(1);
  }
}

main();
