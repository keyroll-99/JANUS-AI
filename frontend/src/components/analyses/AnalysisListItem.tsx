/**
 * AnalysisListItem component
 * Displays a single analysis in the list with key metadata
 */

import { List, Avatar, Typography, Button, Tag } from 'antd';
import { AnalysisListItemDto } from '../../shared/types/analysis.types';
import './AnalysisListItem.scss';

const { Text } = Typography;

interface AnalysisListItemProps {
  analysis: AnalysisListItemDto;
  onClick: (id: string) => void;
}

/**
 * Get emoji icon based on AI model name
 */
const getModelIcon = (model: string): string => {
  const lowerModel = model.toLowerCase();
  if (lowerModel.includes('claude')) return '🧠';
  if (lowerModel.includes('gemini')) return '💎';
  if (lowerModel.includes('gpt')) return '🤖';
  return '🔮';
};

/**
 * Check if analysis is older than 30 days
 */
const isAnalysisOld = (analysisDate: string): boolean => {
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  const analysisTime = new Date(analysisDate).getTime();
  const now = new Date().getTime();
  return now - analysisTime > thirtyDaysInMs;
};

/**
 * Format date to Polish locale
 */
const formatDate = (date: string): string => {
  return new Date(date).toLocaleString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format currency to PLN
 */
const formatCurrency = (value: number): string => {
  return value.toLocaleString('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
  });
};

export const AnalysisListItem = ({
  analysis,
  onClick,
}: AnalysisListItemProps) => {
  const isOld = isAnalysisOld(analysis.analysisDate);

  return (
    <List.Item
      className="analysis-list-item"
      onClick={() => onClick(analysis.id)}
      actions={[
        <Button type="link" key="details">
          Zobacz szczegóły
        </Button>,
      ]}
    >
      <List.Item.Meta
        avatar={
          <Avatar size="large" className="analysis-list-item__avatar">
            {getModelIcon(analysis.aiModel)}
          </Avatar>
        }
        title={
          <div className="analysis-list-item__title">
            <span>{formatDate(analysis.analysisDate)}</span>
            {isOld && (
              <Tag color="orange" style={{ marginLeft: 8 }}>
                Nieaktualna
              </Tag>
            )}
          </div>
        }
        description={
          <div className="analysis-list-item__description">
            <Text type="secondary">Model: {analysis.aiModel}</Text>
            <br />
            <Text strong>
              Wartość portfela: {formatCurrency(analysis.portfolioValue)}
            </Text>
          </div>
        }
      />
    </List.Item>
  );
};
