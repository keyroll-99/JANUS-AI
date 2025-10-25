/**
 * AnalysisDetailPage - Detailed view of a single AI portfolio analysis
 * Shows AI summary, recommendations, and metadata
 */

import { Layout, Button, Breadcrumb, Typography, Card, Empty, Skeleton, Alert, Space } from 'antd';
import { ArrowLeftOutlined, HomeOutlined, ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnalysisDetail } from '../../shared/hooks';
import { AnalysisSummaryCard } from '../../components/analyses/AnalysisSummaryCard';
import { RecommendationsTable } from '../../components/analyses/RecommendationsTable';
import './AnalysisDetailPage.scss';

const { Content } = Layout;
const { Title } = Typography;

export const AnalysisDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { analysis, loading, error, refetch } = useAnalysisDetail(id || '');

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    navigate('/analysis');
  };

  /**
   * Render loading skeleton
   */
  if (loading) {
    return (
      <Content className="analysis-detail-page">
        <Breadcrumb className="analysis-detail-page__breadcrumb">
          <Breadcrumb.Item href="/dashboard">
            <HomeOutlined />
          </Breadcrumb.Item>
          <Breadcrumb.Item href="/analysis">
            <ThunderboltOutlined />
            <span>Analizy</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Szczegóły</Breadcrumb.Item>
        </Breadcrumb>

        <div className="analysis-detail-page__header">
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Powrót do listy
          </Button>
        </div>

        <Card>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
        <Card style={{ marginTop: 24 }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </Content>
    );
  }

  /**
   * Render error state
   */
  if (error || !analysis) {
    return (
      <Content className="analysis-detail-page">
        <Breadcrumb className="analysis-detail-page__breadcrumb">
          <Breadcrumb.Item href="/dashboard">
            <HomeOutlined />
          </Breadcrumb.Item>
          <Breadcrumb.Item href="/analysis">
            <ThunderboltOutlined />
            <span>Analizy</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Błąd</Breadcrumb.Item>
        </Breadcrumb>

        <div className="analysis-detail-page__header">
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Powrót do listy
          </Button>
        </div>

        <Card>
          <Empty
            description={
              <Space direction="vertical" align="center">
                <span>{error || 'Nie znaleziono analizy'}</span>
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />} 
                  onClick={refetch}
                >
                  Spróbuj ponownie
                </Button>
              </Space>
            }
          />
        </Card>
      </Content>
    );
  }

  /**
   * Render analysis details
   */
  return (
    <Content className="analysis-detail-page">
      <Breadcrumb className="analysis-detail-page__breadcrumb">
        <Breadcrumb.Item href="/dashboard">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/analysis">
          <ThunderboltOutlined />
          <span>Analizy</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          {new Date(analysis.analysisDate).toLocaleDateString('pl-PL')}
        </Breadcrumb.Item>
      </Breadcrumb>

      <div className="analysis-detail-page__header">
        <div>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
            className="analysis-detail-page__back-btn"
          >
            Powrót do listy
          </Button>
          <Title level={2} className="analysis-detail-page__title">
            Szczegóły analizy
          </Title>
        </div>
      </div>

      {analysis.recommendations.length === 0 && (
        <Alert
          message="Brak rekomendacji"
          description="Ta analiza nie zawiera żadnych rekomendacji inwestycyjnych."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <AnalysisSummaryCard
        analysisDate={analysis.analysisDate}
        portfolioValue={analysis.portfolioValue}
        aiModel={analysis.aiModel}
        analysisSummary={analysis.analysisSummary}
        analysisPrompt={analysis.analysisPrompt}
      />

      {analysis.recommendations.length > 0 && (
        <RecommendationsTable recommendations={analysis.recommendations} />
      )}
    </Content>
  );
};
