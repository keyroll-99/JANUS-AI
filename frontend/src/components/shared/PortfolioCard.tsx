import React from 'react';
import { Card, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface PortfolioCardProps {
  title: string;
  value: number;
  change?: number;
  changePercent?: number;
  suffix?: string;
  precision?: number;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({
  title,
  value,
  change,
  changePercent,
  suffix = 'PLN',
  precision = 2,
}) => {
  const isPositive = (change ?? 0) >= 0;
  const valueStyle = { 
    color: change !== undefined ? (isPositive ? '#3f8600' : '#cf1322') : undefined 
  };

  return (
    <Card>
      <Statistic
        title={title}
        value={value}
        precision={precision}
        valueStyle={valueStyle}
        prefix={change !== undefined ? (isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />) : undefined}
        suffix={suffix}
      />
      {changePercent !== undefined && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
          {isPositive ? '+' : ''}{changePercent.toFixed(2)}% zmiana
        </div>
      )}
    </Card>
  );
};

export default PortfolioCard;
