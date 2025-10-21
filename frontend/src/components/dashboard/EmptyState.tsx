import { Empty, Button, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface EmptyStateProps {
  onImportClick: () => void;
}

/**
 * Component displayed when user has no transactions yet
 * Provides a call-to-action to import transactions
 */
export const EmptyState = ({ onImportClick }: EmptyStateProps) => {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <Empty
        image={<InboxOutlined style={{ fontSize: '64px', color: '#bfbfbf' }} />}
        description={
          <>
            <Title level={4}>Brak danych portfela</Title>
            <Text type="secondary">
              Wygląda na to, że nie masz jeszcze żadnych transakcji.
              <br />
              Zacznij od zaimportowania swoich transakcji z pliku XTB.
            </Text>
          </>
        }
      >
        <Button type="primary" size="large" onClick={onImportClick}>
          Zaimportuj transakcje
        </Button>
      </Empty>
    </div>
  );
};
