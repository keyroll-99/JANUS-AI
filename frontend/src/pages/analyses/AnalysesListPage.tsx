/**
 * AnalysesListPage - Main view for listing AI portfolio analyses
 * Displays paginated list of historical analyses with ability to create new ones
 */

import { useState, useEffect } from 'react';
import { Layout, Card, Typography, List, Pagination, Statistic, Space, Button, Empty, Modal, Skeleton } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAnalyses } from '../../shared/hooks';
import { AnalysisListItem } from '../../components/analyses/AnalysisListItem';
import './AnalysesListPage.scss';

const { Content } = Layout;
const { Title } = Typography;

export const AnalysesListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { analyses, pagination, loading, creating, error, createAnalysis } = useAnalyses();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const page = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    console.log('[AnalysesListPage] confirmModalOpen changed to:', confirmModalOpen);
  }, [confirmModalOpen]);

  /**
   * Handle page change in pagination
   */
  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: String(newPage) });
  };

  /**
   * Handle new analysis creation with confirmation modal
   */
  const handleNewAnalysis = () => {
    console.log('[AnalysesListPage] handleNewAnalysis called');
    console.log('[AnalysesListPage] Setting confirmModalOpen to true');
    setConfirmModalOpen(true);
    console.log('[AnalysesListPage] confirmModalOpen state should be true now');
  };

  /**
   * Handle modal confirmation
   */
  const handleConfirm = async () => {
    console.log('[AnalysesListPage] handleConfirm called');
    try {
      const analysisId = await createAnalysis();
      console.log('[AnalysesListPage] Analysis created:', analysisId);
      setConfirmModalOpen(false);
      navigate(`/analysis/${analysisId}`);
    } catch (err) {
      console.error('[AnalysesListPage] Failed to create analysis:', err);
      // Modal remains open on error
    }
  };

  /**
   * Handle modal cancel
   */
  const handleCancel = () => {
    setConfirmModalOpen(false);
  };

  /**
   * Render loading skeleton
   */
  if (loading && analyses.length === 0) {
    return (
      <Content className="analyses-list-page">
        <div className="analyses-list-page__header">
          <Title level={2}>Historia analiz</Title>
        </div>
        <Card>
          <List
            itemLayout="horizontal"
            dataSource={[1, 2, 3, 4, 5]}
            renderItem={() => (
              <List.Item>
                <Skeleton avatar active paragraph={{ rows: 2 }} />
              </List.Item>
            )}
          />
        </Card>

        <Modal
          title={
            <span>
              <ThunderboltOutlined style={{ marginRight: 8 }} />
              Nowa analiza AI
            </span>
          }
          open={confirmModalOpen}
          onOk={handleConfirm}
          onCancel={handleCancel}
          okText="Tak, rozpocznij"
          cancelText="Anuluj"
          confirmLoading={creating}
        >
          <p>Analiza Twojego portfela potrwa 30-60 sekund.</p>
          <p>Czy chcesz kontynuować?</p>
        </Modal>
      </Content>
    );
  }

  /**
   * Render empty state
   */
  if (analyses.length === 0 && !loading) {
    return (
      <Content className="analyses-list-page">
        <div className="analyses-list-page__header">
          <Title level={2}>Historia analiz</Title>
        </div>
        <Card>
          <Empty
            description="Nie masz jeszcze żadnych analiz portfela"
            image={<ThunderboltOutlined style={{ fontSize: 64, color: '#1890ff' }} />}
          >
            <Button
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={handleNewAnalysis}
              loading={creating}
            >
              Wykonaj pierwszą analizę
            </Button>
          </Empty>
        </Card>

        <Modal
          title={
            <span>
              <ThunderboltOutlined style={{ marginRight: 8 }} />
              Nowa analiza AI
            </span>
          }
          open={confirmModalOpen}
          onOk={handleConfirm}
          onCancel={handleCancel}
          okText="Tak, rozpocznij"
          cancelText="Anuluj"
          confirmLoading={creating}
        >
          <p>Analiza Twojego portfela potrwa 30-60 sekund.</p>
          <p>Czy chcesz kontynuować?</p>
        </Modal>
      </Content>
    );
  }

  /**
   * Get last analysis for statistics
   */
  const lastAnalysis = analyses[0];

  /**
   * Render main content
   */
  return (
    <Content className="analyses-list-page">
      <div className="analyses-list-page__header">
        <Title level={2}>Historia analiz</Title>
        
        <Space size="large" className="analyses-list-page__stats">
          <Statistic 
            title="Liczba analiz" 
            value={pagination?.totalItems || 0} 
            prefix={<ThunderboltOutlined />}
          />
          {lastAnalysis && (
            <Statistic
              title="Ostatnia analiza"
              value={new Date(lastAnalysis.analysisDate).toLocaleDateString('pl-PL', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            />
          )}
        </Space>

        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          onClick={handleNewAnalysis}
          loading={creating}
          className="analyses-list-page__new-btn"
        >
          Nowa analiza AI
        </Button>
      </div>

      {error && (
        <Card style={{ marginBottom: 16 }}>
          <Empty description={error} />
        </Card>
      )}

      <Card>
        <List
          itemLayout="horizontal"
          loading={loading}
          dataSource={analyses}
          renderItem={(analysis) => (
            <AnalysisListItem
              analysis={analysis}
              onClick={(id) => navigate(`/analysis/${id}`)}
            />
          )}
        />

        {pagination && pagination.totalPages > 1 && (
          <Pagination
            current={page}
            total={pagination.totalItems}
            pageSize={pagination.itemsPerPage}
            onChange={handlePageChange}
            showSizeChanger={false}
            showTotal={(total, range) => 
              `${range[0]}-${range[1]} z ${total} analiz`
            }
            className="analyses-list-page__pagination"
          />
        )}
      </Card>

      {(() => {
        console.log('[AnalysesListPage] Rendering Modal, open:', confirmModalOpen, 'creating:', creating);
        return null;
      })()}
      
      <Modal
        title={
          <span>
            <ThunderboltOutlined style={{ marginRight: 8 }} />
            Nowa analiza AI
          </span>
        }
        open={confirmModalOpen}
        onOk={handleConfirm}
        onCancel={handleCancel}
        okText="Tak, rozpocznij"
        cancelText="Anuluj"
        confirmLoading={creating}
      >
        <p>Analiza Twojego portfela potrwa 30-60 sekund.</p>
        <p>Czy chcesz kontynuować?</p>
      </Modal>
    </Content>
  );
};
