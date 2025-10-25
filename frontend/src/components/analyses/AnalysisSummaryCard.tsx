/**
 * AnalysisSummaryCard - Displays AI analysis summary and metadata
 */

import { Card, Descriptions, Typography, Tag, Divider } from 'antd';
import { ThunderboltOutlined, RobotOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import './AnalysisSummaryCard.scss';

const { Title, Paragraph } = Typography;

interface AnalysisSummaryCardProps {
  analysisDate: string;
  portfolioValue: number;
  aiModel: string;
  analysisSummary: string;
  analysisPrompt?: string;
}

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

/**
 * Get model display name and color
 */
const getModelInfo = (model: string): { name: string; color: string } => {
  const lowerModel = model.toLowerCase();
  if (lowerModel.includes('claude')) {
    return { name: '🧠 Claude AI', color: 'purple' };
  }
  if (lowerModel.includes('gemini')) {
    return { name: '💎 Google Gemini', color: 'blue' };
  }
  if (lowerModel.includes('gpt')) {
    return { name: '🤖 ChatGPT', color: 'green' };
  }
  return { name: `🔮 ${model}`, color: 'default' };
};

export const AnalysisSummaryCard = ({
  analysisDate,
  portfolioValue,
  aiModel,
  analysisSummary,
  analysisPrompt,
}: AnalysisSummaryCardProps) => {
  const modelInfo = getModelInfo(aiModel);

  return (
    <Card className="analysis-summary-card">
      <Title level={3}>
        <ThunderboltOutlined /> Podsumowanie analizy
      </Title>

      <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
        <Descriptions.Item 
          label={<><CalendarOutlined /> Data analizy</>}
        >
          {formatDate(analysisDate)}
        </Descriptions.Item>
        <Descriptions.Item 
          label={<><DollarOutlined /> Wartość portfela</>}
        >
          <strong>{formatCurrency(portfolioValue)}</strong>
        </Descriptions.Item>
        <Descriptions.Item 
          label={<><RobotOutlined /> Model AI</>}
        >
          <Tag color={modelInfo.color}>{modelInfo.name}</Tag>
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <div className="analysis-summary-card__content">
        <Title level={4}>Analiza AI</Title>
        <Paragraph className="analysis-summary-card__summary">
          {analysisSummary}
        </Paragraph>
      </div>

      {analysisPrompt && (
        <>
          <Divider />
          <div className="analysis-summary-card__prompt">
            <Title level={5}>Użyty prompt</Title>
            <Paragraph type="secondary" className="analysis-summary-card__prompt-text">
              {analysisPrompt}
            </Paragraph>
          </div>
        </>
      )}
    </Card>
  );
};
