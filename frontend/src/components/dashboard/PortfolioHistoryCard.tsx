import { Card, Empty, Skeleton } from 'antd';
import { Area } from '@ant-design/charts';
import type { PortfolioHistoryPointDto } from '../../shared/types';

interface PortfolioHistoryCardProps {
  history: PortfolioHistoryPointDto[];
  loading?: boolean;
}

/**
 * Component displaying portfolio value history as an area chart
 */
export const PortfolioHistoryCard = ({ history, loading }: PortfolioHistoryCardProps) => {
  if (loading) {
    return (
      <Card title="Historia wartości portfela">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (!history || history.length < 2) {
    return (
      <Card title="Historia wartości portfela">
        <Empty description="Za mało danych do wyświetlenia wykresu" />
      </Card>
    );
  }

  const config = {
    data: history,
    xField: 'date',
    yField: 'value',
    smooth: true,
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
    },
    xAxis: {
      type: 'time' as const,
      tickCount: 8,
    },
    yAxis: {
      label: {
        formatter: (v: string) => `${parseFloat(v).toLocaleString('pl-PL')} PLN`,
      },
    },
    tooltip: {
      formatter: (datum: PortfolioHistoryPointDto) => ({
        name: 'Wartość',
        value: `${datum.value.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN`,
      }),
    },
  };

  return (
    <Card title="Historia wartości portfela">
      <Area {...config} />
    </Card>
  );
};
