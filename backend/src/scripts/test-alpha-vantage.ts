/**
 * Test script for Alpha Vantage API integration
 * Run with: npx ts-node src/scripts/test-alpha-vantage.ts
 */

import dotenv from 'dotenv';
dotenv.config();

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '4ZR0J8PDDPVMFZMK';
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

interface TestCase {
  ticker: string;
  symbol: string; // Symbol format for Alpha Vantage
  description: string;
}

const testCases: TestCase[] = [
  { ticker: 'CDR.PL', symbol: 'CDR.WAR', description: 'CD Projekt (Polish gaming company)' },
  { ticker: 'PKO.PL', symbol: 'PKO.WAR', description: 'PKO Bank Polski' },
  { ticker: 'PKN.PL', symbol: 'PKN.WAR', description: 'PKN Orlen' },
];

async function testAlphaVantage(ticker: string, symbol: string, description: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Testing: ${description}`);
  console.log(`   Ticker: ${ticker} → Alpha Vantage: ${symbol}`);
  console.log(`${'='.repeat(60)}`);

  try {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    console.log(`🌐 URL: ${url.replace(ALPHA_VANTAGE_API_KEY, '***')}`);

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    console.log(`\n📦 Raw Response:`);
    console.log(JSON.stringify(data, null, 2));

    // Check for API rate limit or error messages
    if (data['Note']) {
      console.warn(`⚠️  Rate Limit: ${data['Note']}`);
      return false;
    }

    if (data['Error Message']) {
      console.error(`❌ API Error: ${data['Error Message']}`);
      return false;
    }

    const quote = data['Global Quote'];
    if (quote && quote['05. price']) {
      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change'] || '0');
      const changePercent = quote['10. change percent'] || 'N/A';
      
      console.log(`\n✅ SUCCESS!`);
      console.log(`   Price: ${price} PLN`);
      console.log(`   Change: ${change > 0 ? '+' : ''}${change} (${changePercent})`);
      console.log(`   Last Updated: ${quote['07. latest trading day']}`);
      return true;
    } else {
      console.error(`❌ No valid price data in response`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error:`, error);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing Alpha Vantage API Integration');
  console.log(`🔑 API Key: ${ALPHA_VANTAGE_API_KEY ? '***' + ALPHA_VANTAGE_API_KEY.slice(-4) : 'NOT SET'}`);
  console.log(`🌐 Base URL: ${ALPHA_VANTAGE_BASE_URL}\n`);

  if (!ALPHA_VANTAGE_API_KEY) {
    console.error('❌ ALPHA_VANTAGE_API_KEY is not set!');
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const success = await testAlphaVantage(testCase.ticker, testCase.symbol, testCase.description);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    
    // Wait 12 seconds between requests (5 calls/minute for free tier)
    if (testCase !== testCases[testCases.length - 1]) {
      console.log(`\n⏳ Waiting 12 seconds to respect API rate limits...`);
      await new Promise(resolve => setTimeout(resolve, 12000));
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Final Results: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(60)}\n`);

  if (failed === 0) {
    console.log('✅ All tests passed! Alpha Vantage integration is working correctly.');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Check the logs above for details.');
    process.exit(1);
  }
}

main();
