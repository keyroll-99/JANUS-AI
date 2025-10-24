import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Modal,
  Space,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useTransactions } from '../shared/hooks';
import { TransactionFilters } from '../components/transactions/TransactionFilters';
import { TransactionsTable } from '../components/transactions/TransactionsTable';
import { TransactionFormModal } from '../components/transactions/TransactionFormModal';
import { ImportTransactionsModal } from '../components/transactions/ImportTransactionsModal';
import type { TransactionDto, TransactionFormValues } from '../shared/types';
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPES_FILTER_OPTIONS,
  TRANSACTION_TYPES,
  TRANSACTION_TYPES_FILTER_OPTIONS,
} from '../shared/constants/transactions';

const { Title, Text } = Typography;

const Transactions = () => {
  const {
    transactions,
    pagination,
    loading,
    error,
    sortBy,
    order,
    filters,
    setPage,
    setPageSize,
    setSort,
    updateFilters,
    clearFilters,
    refresh,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions,
    saving,
    deletingId,
    importing,
  } = useTransactions();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDto | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<TransactionDto | null>(null);

  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEditTransaction = (transaction: TransactionDto) => {
    setSelectedTransaction(transaction);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDeleteTransaction = (transaction: TransactionDto) => {
    setTransactionToDelete(transaction);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) {
      return;
    }

    try {
      await deleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
    } catch {
      // komunikat błędu wyświetlany w hooku; pozostaw modal do ewentualnej ponownej próby
    }
  };

  const handleFormSubmit = async (values: TransactionFormValues) => {
    try {
      if (formMode === 'create') {
        await createTransaction(values);
      } else if (selectedTransaction) {
        await updateTransaction(selectedTransaction.id, values);
      }
      setFormOpen(false);
      setSelectedTransaction(null);
    } catch {
      // errors are handled by hook; keep modal open for corrections
    }
  };

  const handleImport = async (file: File, accountTypeId?: number) => {
    const result = await importTransactions(file, accountTypeId);
    return result;
  };

  const tableHasData = transactions.length > 0;

  const handlePaginationChange = (page: number, pageSize: number) => {
    if (pageSize !== pagination.limit) {
      setPageSize(pageSize);
      return;
    }
    if (page !== pagination.currentPage) {
      setPage(page);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
        <Title level={2} style={{ margin: 0 }}>
          Transakcje
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
            Odśwież
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>
            Importuj z XTB
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTransaction}>
            Dodaj transakcję
          </Button>
        </Space>
      </Space>

      {error && (
        <Alert
          type="error"
          message="Nie udało się pobrać transakcji"
          description={error}
          showIcon
        />
      )}

      <Card>
        <TransactionFilters
          initialValues={filters}
          transactionTypeOptions={TRANSACTION_TYPES_FILTER_OPTIONS}
          accountTypeOptions={ACCOUNT_TYPES_FILTER_OPTIONS}
          onChange={updateFilters}
          onReset={clearFilters}
          disabled={loading}
        />
      </Card>

      <Card>
        {tableHasData || loading ? (
          <TransactionsTable
            data={transactions}
            loading={loading}
            pagination={pagination}
            sortBy={sortBy}
            order={order}
            deletingId={deletingId}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onPaginationChange={handlePaginationChange}
            onSortChange={setSort}
          />
        ) : (
          <Empty description="Brak transakcji. Dodaj pierwszą transakcję lub zaimportuj dane." />
        )}
      </Card>

      <TransactionFormModal
        open={formOpen}
        mode={formMode}
        initialValues={formMode === 'edit' ? selectedTransaction : undefined}
        transactionTypes={TRANSACTION_TYPES}
        accountTypes={ACCOUNT_TYPES}
        loading={saving}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setFormOpen(false);
          setSelectedTransaction(null);
        }}
      />

      <ImportTransactionsModal
        open={importModalOpen}
        importing={importing}
        onImport={handleImport}
        onClose={() => setImportModalOpen(false)}
      />

      <Modal
        open={!!transactionToDelete}
        title="Usuń transakcję"
        okText="Usuń"
        cancelText="Anuluj"
        okButtonProps={{ danger: true }}
        confirmLoading={Boolean(
          transactionToDelete && deletingId === transactionToDelete.id
        )}
        onOk={handleConfirmDelete}
        onCancel={() => setTransactionToDelete(null)}
      >
        {transactionToDelete && (
          <Space align="start">
            <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 20, marginTop: 4 }} />
            <Text>
              Czy na pewno chcesz usunąć transakcję z dnia{' '}
              <strong>{' '}
                {new Date(transactionToDelete.transactionDate).toLocaleString()}
              </strong>
              ?
            </Text>
          </Space>
        )}
      </Modal>
    </Space>
  );
};

export const Component = Transactions;
