// Przykład Dashboard z Ant Design Charts

import { Card, Row, Col, Statistic, Table } from 'antd';
import { ArrowUpOutlined } from '@ant-design/icons';
import { Line, Pie } from '@ant-design/charts';
import type { ColumnsType } from 'antd/es/table';

// Mock data
const portfolioHistory = [
  { date: '2025-01', value: 100000 },
  { date: '2025-02', value: 105000 },
  { date: '2025-03', value: 103000 },
  { date: '2025-04', value: 110000 },
  { date: '2025-05', value: 115000 },
  { date: '2025-06', value: 120000 },
];

const portfolioDiversification = [
  { type: 'Apple Inc.', value: 35 },
  { type: 'Microsoft', value: 25 },
  { type: 'Tesla', value: 20 },
  { type: 'Amazon', value: 12 },
  { type: 'Inne', value: 8 },
];

interface Position {
  key: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  change: number;
  changePercent: number;
}

const positions: Position[] = [
  {
    key: '1',
    symbol: 'AAPL',
    quantity: 50,
    avgPrice: 180.0,
    currentPrice: 195.5,
    value: 9775,
    change: 775,
    changePercent: 8.61,
  },
  // ... więcej pozycji
];

export function Component() {
  // Konfiguracja wykresu liniowego
  const lineConfig = {
    data: portfolioHistory,
    xField: 'date',
    yField: 'value',
    smooth: true,
    color: '#1890ff',
    point: {
      size: 5,
      shape: 'circle',
    },
    label: {
      style: {
        fill: '#aaa',
      },
    },
    tooltip: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (datum: any) => {
        return { name: 'Wartość', value: `${datum.value.toLocaleString('pl-PL')} PLN` };
      },
    },
  };

  // Konfiguracja wykresu kołowego
  const pieConfig = {
    data: portfolioDiversification,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
  };

  // Kolumny tabeli
  const columns: ColumnsType<Position> = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 100,
    },
    {
      title: 'Ilość',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
    },
    {
      title: 'Cena śr.',
      dataIndex: 'avgPrice',
      key: 'avgPrice',
      align: 'right',
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      title: 'Cena aktual.',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      align: 'right',
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      title: 'Wartość',
      dataIndex: 'value',
      key: 'value',
      align: 'right',
      render: (value) => `$${value.toLocaleString('en-US')}`,
    },
    {
      title: 'Zmiana',
      key: 'change',
      align: 'right',
      render: (_, record) => (
        <span style={{ color: record.change >= 0 ? '#3f8600' : '#cf1322' }}>
          {record.change >= 0 ? '+' : ''}
          {record.changePercent.toFixed(2)}%
        </span>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>Dashboard</h1>

      {/* Statystyki */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Wartość portfela"
              value={120000}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix="PLN"
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              +20% od początku roku
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Liczba pozycji"
              value={12}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Dzienny zwrot"
              value={1250.50}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix="PLN"
            />
          </Card>
        </Col>
      </Row>

      {/* Wykresy */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
          <Card title="Historia wartości portfela">
            <Line {...lineConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Dywersyfikacja">
            <Pie {...pieConfig} />
          </Card>
        </Col>
      </Row>

      {/* Tabela pozycji */}
      <Card title="Moje pozycje">
        <Table 
          columns={columns} 
          dataSource={positions} 
          pagination={false}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}

Component.displayName = 'DashboardPage';
