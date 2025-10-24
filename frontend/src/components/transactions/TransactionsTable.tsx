import { Table, Tag, Space, Button } from 'antd';
import type { ColumnsType, TablePaginationConfig, TableProps } from 'antd/es/table';
import type { SortOrder as AntSortOrder } from 'antd/es/table/interface';
import type { Key } from 'react';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import type {
  PaginationDto,
  TransactionDto,
  TransactionSortField,
} from '../../shared/types';
import {
  ACCOUNT_TYPE_TAG_COLORS,
  DEFAULT_TRANSACTIONS_SORT_FIELD,
  DEFAULT_TRANSACTIONS_SORT_ORDER,
  TRANSACTION_SORT_OPTIONS,
  TRANSACTIONS_PAGE_SIZE_OPTIONS,
  TRANSACTION_TYPE_TAG_COLORS,
} from '../../shared/constants/transactions';

interface TransactionsTableProps {
  data: TransactionDto[];
  loading: boolean;
  pagination: PaginationDto;
  sortBy: TransactionSortField;
  order: 'asc' | 'desc';
  deletingId?: string | null;
  onEdit: (transaction: TransactionDto) => void;
  onDelete: (transaction: TransactionDto) => void;
  onPaginationChange: (page: number, pageSize: number) => void;
  onSortChange: (sortBy: TransactionSortField, order: 'asc' | 'desc') => void;
}

const moneyFormatter = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
});

const numberFormatter = new Intl.NumberFormat('pl-PL', {
  maximumFractionDigits: 4,
});

const mapOrderToAntd = (order: 'asc' | 'desc'): AntSortOrder =>
  order === 'asc' ? 'ascend' : 'descend';

const mapColumnKeyToSortField = (
  columnKey?: Key
): TransactionSortField | undefined => {
  if (!columnKey) return undefined;
  const key = String(columnKey) as TransactionSortField;
  const allowed = TRANSACTION_SORT_OPTIONS.some((option) => option.value === key);
  return allowed ? key : undefined;
};

const formatDate = (value: string): string => {
  try {
    return format(new Date(value), 'yyyy-MM-dd HH:mm');
  } catch {
    return value;
  }
};

export const TransactionsTable = ({
  data,
  loading,
  pagination,
  sortBy,
  order,
  deletingId,
  onEdit,
  onDelete,
  onPaginationChange,
  onSortChange,
}: TransactionsTableProps) => {
  const columns: ColumnsType<TransactionDto> = [
    {
      title: 'Data transakcji',
      dataIndex: 'transactionDate',
      key: 'transaction_date',
      sorter: true,
      sortOrder: sortBy === 'transaction_date' ? mapOrderToAntd(order) : undefined,
      render: (value: string) => formatDate(value),
      width: 180,
    },
    {
      title: 'Typ',
      dataIndex: 'transactionType',
      key: 'transaction_type_id',
      sorter: true,
      sortOrder: sortBy === 'transaction_type_id' ? mapOrderToAntd(order) : undefined,
      render: (value: string) => (
        <Tag color={TRANSACTION_TYPE_TAG_COLORS[value] || 'default'}>{value}</Tag>
      ),
      width: 140,
    },
    {
      title: 'Konto',
      dataIndex: 'accountType',
      key: 'account_type',
      render: (value: string) => (
        <Tag color={ACCOUNT_TYPE_TAG_COLORS[value] || 'default'}>{value}</Tag>
      ),
      width: 120,
    },
    {
      title: 'Ticker',
      dataIndex: 'ticker',
      key: 'ticker',
      sorter: true,
      sortOrder: sortBy === 'ticker' ? mapOrderToAntd(order) : undefined,
      render: (value: string | null) => value || '—',
      width: 120,
    },
    {
      title: 'Ilość',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (value: number | null) => (value === null ? '—' : numberFormatter.format(value)),
      width: 120,
      align: 'right',
    },
    {
      title: 'Cena',
      dataIndex: 'price',
      key: 'price',
      render: (value: number | null) => (value === null ? '—' : numberFormatter.format(value)),
      width: 120,
      align: 'right',
    },
    {
      title: 'Wartość',
      dataIndex: 'totalAmount',
      key: 'total_amount',
      sorter: true,
      sortOrder: sortBy === 'total_amount' ? mapOrderToAntd(order) : undefined,
      render: (value: number) => moneyFormatter.format(value),
      width: 140,
      align: 'right',
    },
    {
      title: 'Prowizja',
      dataIndex: 'commission',
      key: 'commission',
      render: (value: number) => moneyFormatter.format(value),
      width: 120,
      align: 'right',
    },
    {
      title: 'Akcje',
      key: 'actions',
      fixed: 'right',
      width: 140,
      render: (_value, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onEdit(record);
            }}
          >
            Edytuj
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDelete(record);
            }}
            loading={deletingId === record.id}
          >
            Usuń
          </Button>
        </Space>
      ),
    },
  ];

  const handleTableChange: TableProps<TransactionDto>['onChange'] = (
    nextPagination,
    _filters,
    sorter
  ) => {
    if (nextPagination) {
      const nextPage = nextPagination.current ?? pagination.currentPage;
      const nextPageSize = nextPagination.pageSize ?? pagination.limit;
      if (
        nextPage !== pagination.currentPage ||
        nextPageSize !== pagination.limit
      ) {
        onPaginationChange(nextPage, nextPageSize);
      }
    }

    if (!Array.isArray(sorter)) {
      const sortField = mapColumnKeyToSortField(sorter.columnKey);
      if (sortField) {
        if (sorter.order) {
          const nextOrder: 'asc' | 'desc' = sorter.order === 'ascend' ? 'asc' : 'desc';
          if (sortField !== sortBy || nextOrder !== order) {
            onSortChange(sortField, nextOrder);
          }
        } else if (
          sortBy !== DEFAULT_TRANSACTIONS_SORT_FIELD ||
          order !== DEFAULT_TRANSACTIONS_SORT_ORDER
        ) {
          onSortChange(DEFAULT_TRANSACTIONS_SORT_FIELD, DEFAULT_TRANSACTIONS_SORT_ORDER);
        }
      }
    }
  };

  const tablePagination: TablePaginationConfig = {
    current: pagination.currentPage,
    pageSize: pagination.limit,
    total: pagination.totalItems,
    showSizeChanger: true,
    pageSizeOptions: TRANSACTIONS_PAGE_SIZE_OPTIONS.map(String),
    showTotal: (total) => `${total} transakcji`,
  };

  return (
    <Table<TransactionDto>
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={tablePagination}
      onChange={handleTableChange}
      scroll={{ x: 1000 }}
    />
  );
};
