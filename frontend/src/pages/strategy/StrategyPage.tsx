import { useState } from 'react';
import { Layout, Card, Typography, Skeleton, Alert, Descriptions, Empty, Button } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import { useStrategy } from '../../shared/hooks';
import { StrategyForm } from '../../components/shared/StrategyForm';
import { StrategyRequestDto } from '../../shared/types/strategy.types';
import './StrategyPage.scss';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

/**
 * Strona zarządzania strategią inwestycyjną
 * Umożliwia przeglądanie i edycję strategii użytkownika
 */
export const StrategyPage = () => {
  const { strategy, loading, updating, error, updateStrategy, createStrategy } = useStrategy();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleSubmit = async (values: StrategyRequestDto) => {
    try {
      if (strategy) {
        await updateStrategy(values);
      } else {
        await createStrategy(values);
      }
      setShowCreateForm(false);
    } catch (_err) {
      // Błąd jest już obsłużony w hooku (message.error)
    }
  };

  // Loading state
  if (loading) {
    return (
      <Content className="strategy-page">
        <div className="strategy-page__header">
          <Skeleton.Input style={{ width: 300 }} active />
          <Skeleton paragraph={{ rows: 1 }} active />
        </div>
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </Content>
    );
  }

  // Empty state - brak strategii
  if (!strategy && !showCreateForm) {
    return (
      <Content className="strategy-page">
        <div className="strategy-page__header">
          <Title level={2}>Strategia inwestycyjna</Title>
          <Paragraph>
            Twoja strategia pomaga AI w generowaniu spersonalizowanych rekomendacji.
          </Paragraph>
        </div>

        <Card>
          <Empty
            description="Nie masz jeszcze strategii inwestycyjnej"
            image={<BarChartOutlined style={{ fontSize: 64, color: '#1890ff' }} />}
          >
            <Button type="primary" onClick={() => setShowCreateForm(true)}>
              Utwórz strategię
            </Button>
          </Empty>
        </Card>
      </Content>
    );
  }

  // Form view - tworzenie lub edycja
  return (
    <Content className="strategy-page">
      <div className="strategy-page__header">
        <Title level={2}>Strategia inwestycyjna</Title>
        <Paragraph>
          Twoja strategia pomaga AI w generowaniu spersonalizowanych rekomendacji.
          Pamiętaj, aby aktualizować ją wraz ze zmianą Twoich celów.
        </Paragraph>
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

      <Card title={strategy ? 'Edytuj strategię' : 'Utwórz strategię'}>
        <StrategyForm
          initialValues={strategy || undefined}
          onSubmit={handleSubmit}
          loading={updating}
        />
      </Card>

      {strategy && (
        <Card title="Informacje" style={{ marginTop: '16px' }}>
          <Descriptions column={1}>
            <Descriptions.Item label="Ostatnia aktualizacja">
              {new Date(strategy.updatedAt).toLocaleString('pl-PL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Descriptions.Item>
            <Descriptions.Item label="ID strategii">
              {strategy.id}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </Content>
  );
};
