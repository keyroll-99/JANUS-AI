import { useEffect, useMemo, useRef } from 'react';
import { Form, Input, Select, Button, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { FilterFormValues } from '../../shared/types';
import { useDebounce } from '../../shared/hooks/useDebounce';
import { TRANSACTIONS_TICKER_DEBOUNCE_MS } from '../../shared/constants/transactions';

interface Option {
  label: string;
  value: string;
}

interface TransactionFiltersProps {
  initialValues?: FilterFormValues;
  transactionTypeOptions: Option[];
  accountTypeOptions: Option[];
  onChange: (values: FilterFormValues) => void;
  onReset?: () => void;
  disabled?: boolean;
}

const areFiltersEqual = (a: FilterFormValues, b: FilterFormValues): boolean =>
  (a.ticker || undefined) === (b.ticker || undefined) &&
  (a.type || undefined) === (b.type || undefined) &&
  (a.account || undefined) === (b.account || undefined);

export const TransactionFilters = ({
  initialValues,
  transactionTypeOptions,
  accountTypeOptions,
  onChange,
  onReset,
  disabled,
}: TransactionFiltersProps) => {
  const [form] = Form.useForm<FilterFormValues>();
  const values = Form.useWatch([], form) || {};
  const debounceTicker = useDebounce(values.ticker, TRANSACTIONS_TICKER_DEBOUNCE_MS);
  const lastEmittedRef = useRef<FilterFormValues>({});

  useEffect(() => {
    form.setFieldsValue({
      ticker: initialValues?.ticker || undefined,
      type: initialValues?.type || undefined,
      account: initialValues?.account || undefined,
    });
  }, [form, initialValues?.ticker, initialValues?.type, initialValues?.account]);

  const normalizedValues = useMemo<FilterFormValues>(() => {
    const ticker = debounceTicker?.trim();
    return {
      ticker: ticker ? ticker.toUpperCase() : undefined,
      type: values.type || undefined,
      account: values.account || undefined,
    };
  }, [debounceTicker, values.type, values.account]);

  useEffect(() => {
    if (!areFiltersEqual(normalizedValues, lastEmittedRef.current)) {
      lastEmittedRef.current = normalizedValues;
      onChange(normalizedValues);
    }
  }, [normalizedValues, onChange]);

  const handleReset = () => {
    form.resetFields();
    lastEmittedRef.current = {};
    onChange({});
    onReset?.();
  };

  return (
    <Form
      form={form}
      layout="inline"
      style={{ marginBottom: 16 }}
      disabled={disabled}
    >
      <Form.Item name="ticker">
        <Input
          allowClear
          placeholder="Ticker"
          prefix={<SearchOutlined />}
          maxLength={20}
        />
      </Form.Item>

      <Form.Item name="type">
        <Select
          allowClear
          placeholder="Typ transakcji"
          options={transactionTypeOptions}
          style={{ minWidth: 180 }}
        />
      </Form.Item>

      <Form.Item name="account">
        <Select
          allowClear
          placeholder="Typ konta"
          options={accountTypeOptions}
          style={{ minWidth: 160 }}
        />
      </Form.Item>

      <Form.Item shouldUpdate>
        {() => (
          <Space>
            <Button type="default" onClick={handleReset} disabled={disabled}>
              Wyczyść filtry
            </Button>
          </Space>
        )}
      </Form.Item>
    </Form>
  );
};
