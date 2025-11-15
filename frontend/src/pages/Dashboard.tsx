import { useNavigate } from 'react-router-dom';
import { Row, Col, Button, Alert, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useDashboardData } from '../shared/hooks/useDashboardData';
import { PortfolioSummaryCard } from '../components/dashboard/PortfolioSummaryCard';
import { QuickActionsCard } from '../components/dashboard/QuickActionsCard';
import { PortfolioHistoryCard } from '../components/dashboard/PortfolioHistoryCard';
import { DiversificationCard } from '../components/dashboard/DiversificationCard';
import { EmptyState } from '../components/dashboard/EmptyState';

/**
 * Main Dashboard page component
 * Displays portfolio summary, history, diversification and quick actions
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { data, loading, error, refreshing, refresh } = useDashboardData();

  const handleImportClick = () => {
    navigate('/transactions');
  };

  const handleAnalyzeClick = () => {
    navigate('/analysis');
  };

  const handleTransactionsClick = () => {
    navigate('/transactions');
  };

  const handleStrategyClick = () => {
    navigate('/strategy');
  };

  const handleTickerClick = (ticker: string) => {
    navigate(`/transactions?ticker=${ticker}`);
  };

  const handleRefresh = async () => {
    await refresh();
    message.success('Dane zostały odświeżone');
  };

  const isEmpty = !loading && (!data || !data.summary || data.summary.totalValue === 0);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Dashboard</h1>
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={refreshing}
          disabled={loading}
        >
          Odśwież
        </Button>
      </div>

      {error && (
        <Alert
          message="Błąd"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />
      )}

      {isEmpty ? (
        <EmptyState onImportClick={handleImportClick} />
      ) : data && data.summary ? (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <PortfolioSummaryCard summary={data.summary} loading={loading} />
            </Col>
            <Col xs={24} lg={12}>
              <QuickActionsCard
                onAnalyzeClick={handleAnalyzeClick}
                onTransactionsClick={handleTransactionsClick}
                onStrategyClick={handleStrategyClick}
                disabled={loading || refreshing}
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            <Col span={24}>
              <PortfolioHistoryCard history={data?.history || []} loading={loading} />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            <Col xs={24} lg={16}>
              <DiversificationCard
                diversification={data?.diversification || []}
                loading={loading}
                onTickerClick={handleTickerClick}
              />
            </Col>
          </Row>
        </>
      ) : null}
    </div>
  );
};

export const Component = Dashboard;
