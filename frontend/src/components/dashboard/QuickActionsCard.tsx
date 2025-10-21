import { Card, Button, Space } from 'antd';
import { ThunderboltOutlined, FileTextOutlined, SettingOutlined } from '@ant-design/icons';

interface QuickActionsCardProps {
  onAnalyzeClick: () => void;
  onTransactionsClick?: () => void;
  onStrategyClick?: () => void;
  disabled?: boolean;
}

/**
 * Component displaying quick action buttons for common operations
 */
export const QuickActionsCard = ({
  onAnalyzeClick,
  onTransactionsClick,
  onStrategyClick,
  disabled = false,
}: QuickActionsCardProps) => {
  return (
    <Card title="Szybkie akcje">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          size="large"
          onClick={onAnalyzeClick}
          disabled={disabled}
          block
        >
          Analizuj portfel
        </Button>
        
        {onTransactionsClick && (
          <Button
            icon={<FileTextOutlined />}
            size="large"
            onClick={onTransactionsClick}
            disabled={disabled}
            block
          >
            Zobacz transakcje
          </Button>
        )}
        
        {onStrategyClick && (
          <Button
            icon={<SettingOutlined />}
            size="large"
            onClick={onStrategyClick}
            disabled={disabled}
            block
          >
            Edytuj strategię
          </Button>
        )}
      </Space>
    </Card>
  );
};
