import { Card, Statistic, Row, Col, Skeleton } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { DashboardSummaryDto } from '../../shared/types';

interface PortfolioSummaryCardProps {
  summary: DashboardSummaryDto;
  loading?: boolean;
}

/**
 * Component displaying portfolio summary with key metrics:
 * - Total portfolio value
 * - Daily change in absolute value
 * - Daily change in percentage
 */
export const PortfolioSummaryCard = ({ summary, loading }: PortfolioSummaryCardProps) => {
  if (loading) {
    return (
      <Card title="Podsumowanie portfela">
        <Skeleton active paragraph={{ rows: 3 }} />
      </Card>
    );
  }

  const isPositiveChange = summary.change.value >= 0;
  const changeColor = isPositiveChange ? '#3f8600' : '#cf1322';
  const TrendIcon = isPositiveChange ? ArrowUpOutlined : ArrowDownOutlined;

  return (
    <Card title="Podsumowanie portfela">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Statistic
            title="Całkowita wartość"
            value={summary.totalValue}
            precision={2}
            suffix={summary.currency}
            valueStyle={{ fontSize: '28px', fontWeight: 'bold' }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Zmiana dzienna"
            value={Math.abs(summary.change.value)}
            precision={2}
            prefix={isPositiveChange ? '+' : '-'}
            suffix={summary.currency}
            valueStyle={{ color: changeColor }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Zmiana %"
            value={Math.abs(summary.change.percentage)}
            precision={2}
            prefix={<TrendIcon />}
            suffix="%"
            valueStyle={{ color: changeColor }}
          />
        </Col>
      </Row>
    </Card>
  );
};
