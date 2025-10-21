import { Card, Empty, Skeleton } from 'antd';
import { Pie } from '@ant-design/charts';
import type { DiversificationItemDto } from '../../shared/types';

interface DiversificationCardProps {
  diversification: DiversificationItemDto[];
  loading?: boolean;
  onTickerClick?: (ticker: string) => void;
}

/**
 * Component displaying portfolio diversification as a pie chart
 */
export const DiversificationCard = ({
  diversification,
  loading,
  onTickerClick,
}: DiversificationCardProps) => {
  if (loading) {
    return (
      <Card title="Dywersyfikacja portfela">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (!diversification || diversification.length === 0) {
    return (
      <Card title="Dywersyfikacja portfela">
        <Empty description="Brak aktywów w portfelu" />
      </Card>
    );
  }

  const config = {
    data: diversification,
    angleField: 'value',
    colorField: 'ticker',
    radius: 0.8,
    label: {
      type: 'outer' as const,
      content: '{name} {percentage}',
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
    legend: {
      position: 'bottom' as const,
    },
    tooltip: {
      formatter: (datum: DiversificationItemDto) => ({
        name: datum.ticker,
        value: `${datum.value.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN (${datum.percentage.toFixed(2)}%)`,
      }),
    },
    onReady: (plot: any) => {
      if (onTickerClick) {
        plot.on('element:click', (evt: any) => {
          const ticker = evt.data?.data?.ticker;
          if (ticker) {
            onTickerClick(ticker);
          }
        });
      }
    },
  };

  return (
    <Card title="Dywersyfikacja portfela">
      <Pie {...config} />
    </Card>
  );
};
