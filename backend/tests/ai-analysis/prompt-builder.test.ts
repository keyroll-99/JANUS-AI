/**
 * Unit tests for PromptBuilder
 */

import { PromptBuilder } from '../../src/ai-analysis/prompt-builder';
import { PortfolioData } from '../../src/ai-analysis/providers';

describe('PromptBuilder', () => {
  const mockPortfolio: PortfolioData = {
    userId: 'test-user-123',
    totalValue: 10000,
    positions: [
      {
        ticker: 'AAPL',
        quantity: 10,
        averagePrice: 150,
        currentPrice: 180,
        totalValue: 1800,
        percentageOfPortfolio: 18,
        profitLoss: 300,
        profitLossPercentage: 20,
      },
      {
        ticker: 'MSFT',
        quantity: 5,
        averagePrice: 300,
        currentPrice: 320,
        totalValue: 1600,
        percentageOfPortfolio: 16,
        profitLoss: 100,
        profitLossPercentage: 6.67,
      },
      {
        ticker: 'GOOGL',
        quantity: 8,
        averagePrice: 140,
        currentPrice: 130,
        totalValue: 1040,
        percentageOfPortfolio: 10.4,
        profitLoss: -80,
        profitLossPercentage: -7.14,
      },
    ],
    strategy: {
      riskLevel: 'MEDIUM',
      timeHorizon: 'LONG_TERM',
      investmentGoals: 'Retirement savings',
    },
  };

  describe('buildAnalysisPrompt', () => {
    it('should generate a complete prompt with all sections', () => {
      const prompt = PromptBuilder.buildAnalysisPrompt(mockPortfolio);

      // Check for main sections (in Polish)
      expect(prompt).toContain('# ROLA');
      expect(prompt).toContain('# PODSTAWOWE ZASADY');
      expect(prompt).toContain('# PRZEGLĄD PORTFELA');
      expect(prompt).toContain('## Profil Inwestycyjny');
      expect(prompt).toContain('## Profil Ryzyka');
      expect(prompt).toContain('## Metryki Portfela');
      expect(prompt).toContain('# WYMAGANIA ANALIZY');
      expect(prompt).toContain('# FORMAT ODPOWIEDZI');
    });

    it('should include portfolio value and position count', () => {
      const prompt = PromptBuilder.buildAnalysisPrompt(mockPortfolio);

      expect(prompt).toContain('$10000.00');
      expect(prompt).toContain('3'); // Number of positions
    });

    it('should include risk profile information', () => {
      const prompt = PromptBuilder.buildAnalysisPrompt(mockPortfolio);

      expect(prompt).toContain('MEDIUM');
      expect(prompt).toContain('LONG_TERM');
      expect(prompt).toContain('Retirement savings');
    });

    it('should include concentration metrics', () => {
      const prompt = PromptBuilder.buildAnalysisPrompt(mockPortfolio);

      expect(prompt).toContain('Ryzyko Koncentracji');
      expect(prompt).toContain('Największa Pozycja**:');
      expect(prompt).toContain('Top 3 Pozycje**:');
      expect(prompt).toContain('Top 5 Pozycji**:');
      expect(prompt).toContain('Wskaźnik Dywersyfikacji**:');
    });

    it('should include performance metrics', () => {
      const prompt = PromptBuilder.buildAnalysisPrompt(mockPortfolio);

      expect(prompt).toContain('Wyniki');
      expect(prompt).toContain('Całkowity P&L**:');
      expect(prompt).toContain('Pozycje Zyskowne**:');
      expect(prompt).toContain('Pozycje Stratne**:');
    });

    it('should include all position tickers', () => {
      const prompt = PromptBuilder.buildAnalysisPrompt(mockPortfolio);

      expect(prompt).toContain('AAPL');
      expect(prompt).toContain('MSFT');
      expect(prompt).toContain('GOOGL');
    });

    it('should include position details with profit/loss indicators', () => {
      const prompt = PromptBuilder.buildAnalysisPrompt(mockPortfolio);

      // Profitable positions
      expect(prompt).toContain('📈 Pozycja Zyskowna');
      // Loss positions
      expect(prompt).toContain('📉 Pozycja Stratna');
    });

    it('should include JSON format specification', () => {
      const prompt = PromptBuilder.buildAnalysisPrompt(mockPortfolio);

      expect(prompt).toContain('"summary"');
      expect(prompt).toContain('"recommendations"');
      expect(prompt).toContain('"ticker"');
      expect(prompt).toContain('"action"');
      expect(prompt).toContain('"reasoning"');
      expect(prompt).toContain('"confidence"');
    });

    it('should include action definitions', () => {
      const prompt = PromptBuilder.buildAnalysisPrompt(mockPortfolio);

      expect(prompt).toContain('BUY');
      expect(prompt).toContain('SELL');
      expect(prompt).toContain('HOLD');
      expect(prompt).toContain('REDUCE');
      expect(prompt).toContain('INCREASE');
    });

    it('should include confidence level guidance', () => {
      const prompt = PromptBuilder.buildAnalysisPrompt(mockPortfolio);

      expect(prompt).toContain('HIGH');
      expect(prompt).toContain('MEDIUM');
      expect(prompt).toContain('LOW');
    });

    it('should personalize guidance based on risk level', () => {
      const lowRiskPortfolio: PortfolioData = {
        ...mockPortfolio,
        strategy: {
          ...mockPortfolio.strategy,
          riskLevel: 'LOW',
        },
      };

      const prompt = PromptBuilder.buildAnalysisPrompt(lowRiskPortfolio);

      expect(prompt).toContain('stabiln');
      expect(prompt).toContain('Konserwatywny');
    });

    it('should personalize guidance based on time horizon', () => {
      const shortTermPortfolio: PortfolioData = {
        ...mockPortfolio,
        strategy: {
          ...mockPortfolio.strategy,
          timeHorizon: 'SHORT_TERM',
        },
      };

      const prompt = PromptBuilder.buildAnalysisPrompt(shortTermPortfolio);

      expect(prompt).toContain('stabiln');
      expect(prompt).toContain('płynności');
    });
  });

  describe('Portfolio Metrics Calculation', () => {
    it('should correctly identify top position percentage', () => {
      const prompt = PromptBuilder.buildAnalysisPrompt(mockPortfolio);

      // AAPL is 18% - the largest position
      expect(prompt).toMatch(/Największa Pozycja\*\*:.*18\.0%/);
    });

    it('should calculate winners and losers correctly', () => {
      const prompt = PromptBuilder.buildAnalysisPrompt(mockPortfolio);

      // 2 winning positions (AAPL, MSFT)
      expect(prompt).toMatch(/Pozycje Zyskowne\*\*:.*2/);
      // 1 losing position (GOOGL)
      expect(prompt).toMatch(/Pozycje Stratne\*\*:.*1/);
    });

    it('should sort positions by portfolio percentage', () => {
      const prompt = PromptBuilder.buildAnalysisPrompt(mockPortfolio);

      // Check that AAPL (18%) appears before GOOGL (10.4%) in the table
      const aaplIndex = prompt.indexOf('AAPL');
      const googlIndex = prompt.indexOf('GOOGL');
      expect(aaplIndex).toBeLessThan(googlIndex);
    });
  });

  describe('Edge Cases', () => {
    it('should handle portfolio with single position', () => {
      const singlePositionPortfolio: PortfolioData = {
        ...mockPortfolio,
        positions: [mockPortfolio.positions[0]],
      };

      const prompt = PromptBuilder.buildAnalysisPrompt(singlePositionPortfolio);

      expect(prompt).toContain('Liczba Pozycji**: 1');
      expect(prompt).toMatch(/Największa Pozycja\*\*:.*18\.0%/);
    });

    it('should handle portfolio with no profit/loss', () => {
      const neutralPortfolio: PortfolioData = {
        ...mockPortfolio,
        positions: [
          {
            ...mockPortfolio.positions[0],
            profitLoss: 0,
            profitLossPercentage: 0,
            currentPrice: 150,
          },
        ],
      };

      const prompt = PromptBuilder.buildAnalysisPrompt(neutralPortfolio);

      expect(prompt).toMatch(/Całkowity P&L\*\*:.*\$0\.00/);
    });

    it('should handle high risk, short term strategy', () => {
      const aggressivePortfolio: PortfolioData = {
        ...mockPortfolio,
        strategy: {
          riskLevel: 'HIGH',
          timeHorizon: 'SHORT_TERM',
          investmentGoals: 'Quick gains',
        },
      };

      const prompt = PromptBuilder.buildAnalysisPrompt(aggressivePortfolio);

      expect(prompt).toContain('HIGH');
      expect(prompt).toContain('SHORT_TERM');
      expect(prompt).toContain('Agresywny');
      expect(prompt).toContain('Quick gains');
    });

    it('should handle empty investment goals', () => {
      const noGoalsPortfolio: PortfolioData = {
        ...mockPortfolio,
        strategy: {
          ...mockPortfolio.strategy,
          investmentGoals: '',
        },
      };

      const prompt = PromptBuilder.buildAnalysisPrompt(noGoalsPortfolio);

      // Should still generate valid prompt
      expect(prompt).toContain('# ROLA');
      expect(prompt).toContain('Cele Inwestycyjne:');
    });
  });
});
