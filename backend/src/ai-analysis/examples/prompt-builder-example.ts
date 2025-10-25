/**
 * Example: Using the Advanced Prompt Builder
 * 
 * This file demonstrates how the PromptBuilder generates comprehensive
 * analysis prompts for AI portfolio analysis.
 */

import { PromptBuilder } from '../prompt-builder';
import { PortfolioData } from '../providers';

/**
 * Example Portfolio Data
 */
const examplePortfolio: PortfolioData = {
  userId: 'example-user-123',
  totalValue: 50000,
  positions: [
    {
      ticker: 'AAPL',
      quantity: 50,
      averagePrice: 180,
      currentPrice: 195,
      totalValue: 9750,
      percentageOfPortfolio: 19.5,
      profitLoss: 750,
      profitLossPercentage: 8.33,
    },
    {
      ticker: 'MSFT',
      quantity: 40,
      averagePrice: 350,
      currentPrice: 380,
      totalValue: 15200,
      percentageOfPortfolio: 30.4,
      profitLoss: 1200,
      profitLossPercentage: 8.57,
    },
    {
      ticker: 'GOOGL',
      quantity: 30,
      averagePrice: 140,
      currentPrice: 135,
      totalValue: 4050,
      percentageOfPortfolio: 8.1,
      profitLoss: -150,
      profitLossPercentage: -3.57,
    },
    {
      ticker: 'TSLA',
      quantity: 25,
      averagePrice: 240,
      currentPrice: 250,
      totalValue: 6250,
      percentageOfPortfolio: 12.5,
      profitLoss: 250,
      profitLossPercentage: 4.17,
    },
    {
      ticker: 'NVDA',
      quantity: 20,
      averagePrice: 480,
      currentPrice: 520,
      totalValue: 10400,
      percentageOfPortfolio: 20.8,
      profitLoss: 800,
      profitLossPercentage: 8.33,
    },
    {
      ticker: 'AMZN',
      quantity: 15,
      averagePrice: 145,
      currentPrice: 150,
      totalValue: 2250,
      percentageOfPortfolio: 4.5,
      profitLoss: 75,
      profitLossPercentage: 3.45,
    },
    {
      ticker: 'META',
      quantity: 10,
      averagePrice: 310,
      currentPrice: 305,
      totalValue: 3050,
      percentageOfPortfolio: 6.1,
      profitLoss: -50,
      profitLossPercentage: -1.61,
    },
  ],
  strategy: {
    riskLevel: 'MEDIUM',
    timeHorizon: 'LONG_TERM',
    investmentGoals:
      'Building wealth for retirement in 20+ years. Focus on technology sector growth while maintaining reasonable diversification.',
  },
};

/**
 * Generate and display the prompt
 */
function demonstratePromptBuilder() {
  console.log('='.repeat(80));
  console.log('EXAMPLE: Advanced Prompt Builder for AI Portfolio Analysis');
  console.log('='.repeat(80));
  console.log('\n📊 Portfolio Summary:');
  console.log(`  Total Value: $${examplePortfolio.totalValue.toLocaleString()}`);
  console.log(`  Positions: ${examplePortfolio.positions.length}`);
  console.log(
    `  Risk Profile: ${examplePortfolio.strategy.riskLevel} / ${examplePortfolio.strategy.timeHorizon}`
  );
  console.log('\n' + '='.repeat(80));
  console.log('GENERATED PROMPT:');
  console.log('='.repeat(80));

  const prompt = PromptBuilder.buildAnalysisPrompt(examplePortfolio);
  console.log(prompt);

  console.log('\n' + '='.repeat(80));
  console.log('✅ Prompt Generated Successfully!');
  console.log('='.repeat(80));
  console.log('\n📝 Key Features of the Generated Prompt:');
  console.log('  ✓ System instructions defining AI role');
  console.log('  ✓ Complete portfolio context with metrics');
  console.log('  ✓ Calculated concentration risk (Top 1/3/5)');
  console.log('  ✓ Diversification score (Herfindahl Index)');
  console.log('  ✓ Performance overview (P&L, winners/losers)');
  console.log('  ✓ Detailed position breakdown');
  console.log('  ✓ Personalized guidance based on risk/horizon');
  console.log('  ✓ Precise JSON output format specification');
  console.log('\n🎯 This prompt will guide AI to generate:');
  console.log('  • Comprehensive portfolio health summary');
  console.log('  • Specific buy/sell/hold recommendations');
  console.log('  • Clear reasoning for each recommendation');
  console.log('  • Confidence levels and target allocations');
  console.log('');
}

// Run the demonstration
if (require.main === module) {
  demonstratePromptBuilder();
}

export { examplePortfolio };
