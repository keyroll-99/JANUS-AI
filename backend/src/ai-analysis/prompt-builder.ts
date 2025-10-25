/**
 * Advanced Prompt Builder for Portfolio Analysis
 * 
 * Constructs sophisticated prompts that guide AI models to generate
 * high-quality, actionable portfolio analysis and recommendations.
 */

import { PortfolioData, Position } from './providers';

/**
 * Portfolio metrics calculated for better analysis context
 */
interface PortfolioMetrics {
  concentration: {
    topPosition: number;
    top3Positions: number;
    top5Positions: number;
  };
  diversification: {
    numberOfPositions: number;
    effectiveDiversification: number; // Herfindahl index
  };
  performance: {
    totalProfitLoss: number;
    totalProfitLossPercentage: number;
    winnersCount: number;
    losersCount: number;
  };
}

export class PromptBuilder {
  /**
   * Build comprehensive analysis prompt
   */
  static buildAnalysisPrompt(portfolioData: PortfolioData): string {
    const metrics = this.calculateMetrics(portfolioData);
    
    return `${this.buildSystemInstructions()}

${this.buildPortfolioContext(portfolioData, metrics)}

${this.buildAnalysisRequirements(portfolioData)}

${this.buildOutputFormat()}`;
  }

  /**
   * System instructions - define AI role and behavior
   */
  private static buildSystemInstructions(): string {
    return `# ROLA
Jesteś ekspertem-doradcą finansowym specjalizującym się w analizie portfeli inwestycyjnych i optymalizacji strategii. Twoim celem jest dostarczanie konkretnych, opartych na danych rekomendacji, które pomogą inwestorom osiągnąć cele finansowe przy odpowiednim zarządzaniu ryzykiem.

# PODSTAWOWE ZASADY
1. **Świadomość Ryzyka**: Zawsze uwzględniaj tolerancję ryzyka inwestora i horyzont czasowy
2. **Oparte na Faktach**: Bazuj rekomendacje na metrykach portfela, fundamentach rynkowych i celach inwestycyjnych
3. **Konkretne Akcje**: Podawaj KONKRETNE, wykonalne rekomendacje z jasnym uzasadnieniem (np. "KUP 50 akcji XYZ", "SPRZEDAJ całą pozycję ABC")
4. **Wyważone**: Rozważ zarówno szanse, jak i ryzyka; unikaj skrajnego optymizmu lub pesymizmu
5. **Edukacyjne**: Pomóż inwestorowi zrozumieć uzasadnienie rekomendacji

# FRAMEWORK ANALIZY
- Oceń skład portfela i dywersyfikację
- Zidentyfikuj ryzyko koncentracji i ekspozycji
- Sprawdź zgodność ze strategią inwestycyjną
- Znajdź możliwości optymalizacji
- Podaj priorytetowe, KONKRETNE rekomendacje akcji (KUP/SPRZEDAJ/ZWIĘKSZ/ZMNIEJSZ/TRZYMAJ)

**KRYTYCZNE WYMAGANIE**: 
- Wszystkie odpowiedzi MUSZĄ być w języku polskim
- KAŻDA rekomendacja MUSI odnosić się do KONKRETNEGO ticker-a (symbolu spółki)
- KAŻDA rekomendacja MUSI zawierać KONKRETNĄ akcję: BUY, SELL, HOLD, REDUCE lub INCREASE
- ZABRONIONE są ogólne stwierdzenia typu "rozważ dywersyfikację" bez podania konkretnej spółki
- Jeśli sugerujesz kupno, MUSISZ podać konkretny ticker spółki do kupienia`;
  }

  /**
   * Portfolio context - comprehensive data presentation
   */
  private static buildPortfolioContext(
    portfolioData: PortfolioData,
    metrics: PortfolioMetrics
  ): string {
    const { totalValue, positions, strategy } = portfolioData;

    return `
# PRZEGLĄD PORTFELA

## Profil Inwestycyjny
- **Całkowita Wartość Portfela**: $${totalValue.toFixed(2)}
- **Liczba Pozycji**: ${metrics.diversification.numberOfPositions}
- **Strategia Inwestycyjna**: ${this.formatStrategy(strategy)}

## Profil Ryzyka
- **Tolerancja Ryzyka**: ${strategy.riskLevel}
  ${this.getRiskLevelDescription(strategy.riskLevel)}
- **Horyzont Czasowy**: ${strategy.timeHorizon}
  ${this.getTimeHorizonDescription(strategy.timeHorizon)}
- **Cele Inwestycyjne**: ${strategy.investmentGoals}

## Metryki Portfela

### Ryzyko Koncentracji
- **Największa Pozycja**: ${metrics.concentration.topPosition.toFixed(1)}% portfela
- **Top 3 Pozycje**: ${metrics.concentration.top3Positions.toFixed(1)}% portfela
- **Top 5 Pozycji**: ${metrics.concentration.top5Positions.toFixed(1)}% portfela
- **Wskaźnik Dywersyfikacji**: ${this.getDiversificationScore(metrics.diversification.effectiveDiversification)}

### Wyniki
- **Całkowity P&L**: $${metrics.performance.totalProfitLoss.toFixed(2)} (${metrics.performance.totalProfitLossPercentage.toFixed(2)}%)
- **Pozycje Zyskowne**: ${metrics.performance.winnersCount}
- **Pozycje Stratne**: ${metrics.performance.losersCount}

## Aktualne Pozycje

${this.buildPositionsTable(positions)}

${this.buildDetailedPositions(positions)}`;
  }

  /**
   * Analysis requirements - what AI should focus on
   */
  private static buildAnalysisRequirements(portfolioData: PortfolioData): string {
    const { strategy } = portfolioData;

    return `
# WYMAGANIA ANALIZY

## Kluczowe Pytania
1. **Dywersyfikacja**: Czy portfel jest odpowiednio zdywersyfikowany dla podanego poziomu ryzyka?
2. **Koncentracja**: Czy występują niepokojące ryzyka koncentracji?
3. **Zgodność ze Strategią**: Czy aktualne pozycje są zgodne ze strategią i celami inwestycyjnymi?
4. **Zarządzanie Ryzykiem**: Czy portfel jest odpowiednio ustawiony dla tolerancji ryzyka inwestora?
5. **Optymalizacja**: Jakie zmiany poprawią stosunek zysku do ryzyka?

## Szczególne Uwagi
- Horyzont Czasowy: ${this.getTimeHorizonGuidance(strategy.timeHorizon)}
- Poziom Ryzyka: ${this.getRiskLevelGuidance(strategy.riskLevel)}
- Cele Inwestycyjne: Rozważ jak rekomendacje wspierają: "${strategy.investmentGoals}"

## Priorytety Rekomendacji
1. **KRYTYCZNE**: Usuń znaczące ryzyka lub niezgodności (użyj SELL/REDUCE z konkretnymi ticker-ami)
2. **WAŻNE**: Popraw dywersyfikację i zgodność ze strategią (użyj BUY/INCREASE z konkretnymi ticker-ami)
3. **OPTYMALIZACJA**: Dostosuj alokacje dla lepszej równowagi (użyj HOLD z wskazówkami)

## Poziomy Pewności
- **HIGH**: Silne dowody z metryk portfela i wyraźna niezgodność ze strategią
- **MEDIUM**: Rozsądne dowody, ale zależy od warunków rynkowych lub dodatkowych czynników
- **LOW**: Sugestie oparte na ogólnych najlepszych praktykach, wymaga oceny inwestora

**PAMIĘTAJ**: Każda rekomendacja musi odnosić się do KONKRETNEJ spółki (ticker) i zawierać KONKRETNĄ akcję (np. "KUP", "SPRZEDAJ całą pozycję", "ZWIĘKSZ o 5%").

## PRZYKŁADY PRAWIDŁOWYCH REKOMENDACJI:
✅ {"ticker": "AAPL", "action": "SELL", "reasoning": "Pozycja stanowi 40% portfela, co stwarza nadmierne ryzyko koncentracji..."}
✅ {"ticker": "MSFT", "action": "BUY", "reasoning": "Brak ekspozycji na sektor technologiczny. Microsoft oferuje stabilny wzrost..."}
✅ {"ticker": "GOOGL", "action": "REDUCE", "reasoning": "Zmniejsz pozycję z 25% do 15% aby poprawić dywersyfikację...", "currentAllocation": 25.0, "targetAllocation": 15.0}

## PRZYKŁADY NIEPRAWIDŁOWYCH REKOMENDACJI (ZABRONIONE):
❌ {"ticker": "DIVERSIFY", "action": "BUY", ...} - "DIVERSIFY" to nie jest ticker!
❌ {"ticker": "N/A", "action": "HOLD", ...} - MUSISZ podać konkretny ticker!
❌ Reasoning: "Rozważ zwiększenie ekspozycji na technologie" - BEZ podania konkretnego ticker-a to ZABRONIONE!
❌ Summary: "Portfel wymaga większej dywersyfikacji" - MUSISZ podać konkretne ticker-y w recommendations!`;
  }

  /**
   * Output format specification - ensure consistent, parseable responses
   */
  private static buildOutputFormat(): string {
    return `
# FORMAT ODPOWIEDZI

Odpowiedz WYŁĄCZNIE w formacie JSON (bez dodatkowego tekstu ani formatowania markdown):

{
  "summary": "Kompleksowe podsumowanie w 3-5 zdaniach po polsku, obejmujące: stan portfela, główne mocne strony, główne obawy i ogólny kierunek rekomendacji.",
  "recommendations": [
    {
      "ticker": "AAPL",
      "action": "SELL",
      "reasoning": "Szczegółowe wyjaśnienie PO POLSKU (2-4 zdania): dlaczego ta akcja, jak się wpisuje w strategię, jaki problem rozwiązuje lub jaką szansę wykorzystuje",
      "confidence": "HIGH",
      "targetAllocation": null,
      "currentAllocation": 40.0
    },
    {
      "ticker": "MSFT",
      "action": "BUY",
      "reasoning": "Konkretne uzasadnienie kupna tej spółki...",
      "confidence": "MEDIUM",
      "targetAllocation": 15.0,
      "currentAllocation": 0.0
    }
  ]
}

## Definicje Akcji (ZAWSZE dla konkretnej spółki)
- **BUY**: Kup nową pozycję (ticker obecnie nie w portfelu) - podaj konkretny ticker spółki giełdowej
- **SELL**: Sprzedaj CAŁĄ pozycję ze względu na niezgodność lub ryzyko - podaj ticker
- **HOLD**: Utrzymaj obecną pozycję, jest dobrze dopasowana - podaj ticker
- **REDUCE**: Zmniejsz wielkość pozycji z powodu nadmiernej koncentracji - podaj ticker i docelową alokację
- **INCREASE**: Zwiększ istniejącą pozycję dla lepszej dywersyfikacji - podaj ticker i docelową alokację

## Standardy Jakości
1. Podsumowanie musi być zwięzłe, ale kompleksowe (PO POLSKU)
2. Każda rekomendacja musi mieć jasne, konkretne uzasadnienie (PO POLSKU)
3. Poziomy pewności muszą być uzasadnione dowodami
4. Alokacje powinny być podane gdy istotne (zwłaszcza dla INCREASE/REDUCE/BUY)
5. Rekomendacje powinny być uporządkowane według priorytetu (najważniejsze najpierw)
6. KAŻDA rekomendacja MUSI odnosić się do KONKRETNEJ spółki (ticker) - np. "AAPL", "MSFT", "GOOGL"
7. Pole "ticker" NIE MOŻE zawierać wartości typu: "N/A", "DIVERSIFY", "PORTFOLIO", "GENERAL" itp.

## Ważne Uwagi
- Podaj 3-8 rekomendacji (skup się na najbardziej wpływowych akcjach)
- Równoważ zarządzanie ryzykiem z wykorzystaniem okazji
- Uwzględnij koszty transakcyjne w rekomendacjach
- Unikaj rekomendowania zmian w dobrze działających, odpowiednio dużych pozycjach
- **KRYTYCZNE**: Wszystko w języku polskim, każda rekomendacja dla konkretnego ticker-a spółki giełdowej

**Zwróć TYLKO obiekt JSON, bez dodatkowego tekstu czy formatowania markdown.**`;
  }

  /**
   * Calculate portfolio metrics for analysis
   */
  private static calculateMetrics(portfolioData: PortfolioData): PortfolioMetrics {
    const { positions, totalValue } = portfolioData;

    // Sort positions by value descending
    const sortedPositions = [...positions].sort((a, b) => b.totalValue - a.totalValue);

    // Concentration metrics
    const topPosition = sortedPositions[0]?.percentageOfPortfolio || 0;
    const top3Positions = sortedPositions
      .slice(0, 3)
      .reduce((sum, p) => sum + p.percentageOfPortfolio, 0);
    const top5Positions = sortedPositions
      .slice(0, 5)
      .reduce((sum, p) => sum + p.percentageOfPortfolio, 0);

    // Herfindahl index for diversification (lower = better diversified)
    const herfindahlIndex = positions.reduce(
      (sum, p) => sum + Math.pow(p.percentageOfPortfolio / 100, 2),
      0
    );

    // Performance metrics
    const totalProfitLoss = positions.reduce((sum, p) => sum + p.profitLoss, 0);
    const totalProfitLossPercentage = totalValue > 0 
      ? (totalProfitLoss / (totalValue - totalProfitLoss)) * 100 
      : 0;
    const winnersCount = positions.filter(p => p.profitLoss > 0).length;
    const losersCount = positions.filter(p => p.profitLoss < 0).length;

    return {
      concentration: {
        topPosition,
        top3Positions,
        top5Positions,
      },
      diversification: {
        numberOfPositions: positions.length,
        effectiveDiversification: herfindahlIndex,
      },
      performance: {
        totalProfitLoss,
        totalProfitLossPercentage,
        winnersCount,
        losersCount,
      },
    };
  }

  /**
   * Helper: Format strategy for display
   */
  private static formatStrategy(strategy: any): string {
    const risk = strategy.riskLevel.toLowerCase().replace('_', ' ');
    const horizon = strategy.timeHorizon.toLowerCase().replace('_', ' ');
    return `${risk} risk, ${horizon} horizon`;
  }

  /**
   * Helper: Get risk level description
   */
  private static getRiskLevelDescription(riskLevel: string): string {
    const descriptions = {
      LOW: '  (Konserwatywny: Ochrona kapitału, stabilne zwroty, minimalna zmienność)',
      MEDIUM: '  (Zrównoważony: Wzrost z umiarkowanym ryzykiem, zdywersyfikowane podejście)',
      HIGH: '  (Agresywny: Maksymalny potencjał wzrostu, akceptuje wysoką zmienność)',
    };
    return descriptions[riskLevel as keyof typeof descriptions] || '';
  }

  /**
   * Helper: Get time horizon description
   */
  private static getTimeHorizonDescription(timeHorizon: string): string {
    const descriptions = {
      SHORT_TERM: '  (< 3 lata: Potrzeba płynności wkrótce, niższa tolerancja ryzyka czasowego)',
      MEDIUM_TERM: '  (3-10 lat: Budowanie majątku, fokus na zrównoważony wzrost)',
      LONG_TERM: '  (10+ lat: Emerytura/cele długoterminowe, może przetrzymać zmienność)',
    };
    return descriptions[timeHorizon as keyof typeof descriptions] || '';
  }

  /**
   * Helper: Get time horizon guidance
   */
  private static getTimeHorizonGuidance(timeHorizon: string): string {
    const guidance = {
      SHORT_TERM: 'Skup się na stabilności i płynności. Unikaj wysoce zmiennych pozycji.',
      MEDIUM_TERM: 'Równowaga wzrostu i stabilności. Rozważ jakościowe spółki wzrostowe.',
      LONG_TERM: 'Można zaakceptować zmienność dla wzrostu. Rozważ niedowartościowane okazje.',
    };
    return guidance[timeHorizon as keyof typeof guidance] || '';
  }

  /**
   * Helper: Get risk level guidance
   */
  private static getRiskLevelGuidance(riskLevel: string): string {
    const guidance = {
      LOW: 'Priorytet: stabilne spółki dywidendowe. Unikaj spekulacyjnych pozycji.',
      MEDIUM: 'Mix stabilnych blue-chipów i okazji wzrostowych. Umiarkowana dywersyfikacja.',
      HIGH: 'Można realizować okazje wzrostowe. Akceptuj koncentrację w przekonujących grach.',
    };
    return guidance[riskLevel as keyof typeof guidance] || '';
  }

  /**
   * Helper: Calculate diversification score
   */
  private static getDiversificationScore(herfindahlIndex: number): string {
    if (herfindahlIndex > 0.25) return 'Słaba (Wysokie ryzyko koncentracji)';
    if (herfindahlIndex > 0.15) return 'Przeciętna (Umiarkowana koncentracja)';
    if (herfindahlIndex > 0.10) return 'Dobra (Dobrze zdywersyfikowana)';
    return 'Doskonała (Wysoko zdywersyfikowana)';
  }

  /**
   * Helper: Build positions summary table
   */
  private static buildPositionsTable(positions: Position[]): string {
    const rows = positions
      .sort((a, b) => b.percentageOfPortfolio - a.percentageOfPortfolio)
      .map((p) => {
        const plSign = p.profitLoss >= 0 ? '+' : '';
        return `| ${p.ticker.padEnd(8)} | $${p.totalValue.toFixed(2).padStart(12)} | ${p.percentageOfPortfolio.toFixed(1).padStart(6)}% | ${plSign}$${p.profitLoss.toFixed(2).padStart(10)} | ${plSign}${p.profitLossPercentage.toFixed(1).padStart(7)}% |`;
      })
      .join('\n');

    return `| Ticker   | Wartość      | % Port. | P&L          | P&L %    |
|----------|--------------|---------|--------------|----------|
${rows}`;
  }

  /**
   * Helper: Build detailed position information
   */
  private static buildDetailedPositions(positions: Position[]): string {
    return positions
      .sort((a, b) => b.percentageOfPortfolio - a.percentageOfPortfolio)
      .map((p) => {
        const plStatus = p.profitLoss >= 0 ? '📈 Pozycja Zyskowna' : '📉 Pozycja Stratna';
        return `### ${p.ticker} (${p.percentageOfPortfolio.toFixed(1)}% portfela)
- **Wielkość Pozycji**: ${p.quantity} akcji @ $${p.averagePrice.toFixed(2)} śr.
- **Aktualna Wartość**: $${p.totalValue.toFixed(2)} (cena bieżąca: $${p.currentPrice.toFixed(2)})
- **Wynik**: ${plStatus} - ${p.profitLoss >= 0 ? '+' : ''}$${p.profitLoss.toFixed(2)} (${p.profitLoss >= 0 ? '+' : ''}${p.profitLossPercentage.toFixed(2)}%)`;
      })
      .join('\n\n');
  }
}
