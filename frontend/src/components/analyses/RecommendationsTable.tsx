/**
 * RecommendationsTable - Displays AI recommendations in a table format
 */

import { Card, Table, Tag, Typography, Tooltip } from 'antd';
import { 
  RiseOutlined, 
  FallOutlined, 
  MinusCircleOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';
import { RecommendationDto } from '../../shared/types/analysis.types';
import './RecommendationsTable.scss';

const { Title, Paragraph } = Typography;

interface RecommendationsTableProps {
  recommendations: RecommendationDto[];
}

/**
 * Get icon and color for action type
 */
const getActionConfig = (action: string): { icon: React.ReactElement; color: string; text: string } => {
  const lowerAction = action.toLowerCase();
  
  if (lowerAction.includes('buy') || lowerAction.includes('kup')) {
    return {
      icon: <RiseOutlined />,
      color: 'success',
      text: 'KUP',
    };
  }
  
  if (lowerAction.includes('sell') || lowerAction.includes('sprzedaj')) {
    return {
      icon: <FallOutlined />,
      color: 'error',
      text: 'SPRZEDAJ',
    };
  }
  
  if (lowerAction.includes('hold') || lowerAction.includes('trzymaj')) {
    return {
      icon: <MinusCircleOutlined />,
      color: 'default',
      text: 'TRZYMAJ',
    };
  }
  
  return {
    icon: <InfoCircleOutlined />,
    color: 'processing',
    text: action.toUpperCase(),
  };
};

/**
 * Get confidence badge color
 */
const getConfidenceColor = (confidence: string | null): string => {
  if (!confidence) return 'default';
  
  const lowerConfidence = confidence.toLowerCase();
  if (lowerConfidence.includes('high') || lowerConfidence.includes('wysoka')) {
    return 'green';
  }
  if (lowerConfidence.includes('medium') || lowerConfidence.includes('średnia')) {
    return 'orange';
  }
  if (lowerConfidence.includes('low') || lowerConfidence.includes('niska')) {
    return 'red';
  }
  return 'default';
};

export const RecommendationsTable = ({ recommendations }: RecommendationsTableProps) => {
  const columns = [
    {
      title: 'Ticker',
      dataIndex: 'ticker',
      key: 'ticker',
      width: 120,
      render: (ticker: string) => (
        <strong className="recommendations-table__ticker">{ticker}</strong>
      ),
    },
    {
      title: 'Akcja',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      render: (action: string) => {
        const config = getActionConfig(action);
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: 'Uzasadnienie',
      dataIndex: 'reasoning',
      key: 'reasoning',
      render: (reasoning: string) => (
        <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'więcej' }}>
          {reasoning}
        </Paragraph>
      ),
    },
    {
      title: 'Pewność',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 120,
      render: (confidence: string | null) => {
        if (!confidence) return <Tag>Brak danych</Tag>;
        return (
          <Tooltip title="Poziom pewności AI co do rekomendacji">
            <Tag color={getConfidenceColor(confidence)}>{confidence}</Tag>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Card className="recommendations-table">
      <Title level={3}>
        <InfoCircleOutlined /> Rekomendacje ({recommendations.length})
      </Title>
      
      <Table
        dataSource={recommendations}
        columns={columns}
        rowKey="id"
        pagination={false}
        scroll={{ x: 800 }}
        className="recommendations-table__table"
      />
    </Card>
  );
};
