import { useEffect } from 'react';
import { Modal, Form, DatePicker, Select, Input, InputNumber } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import type { TransactionDto, TransactionFormValues } from '../../shared/types';
import {
  AccountTypeDefinition,
  TRANSACTION_NOTES_MAX_LENGTH,
  TransactionTypeDefinition,
  TRANSACTION_TYPES_REQUIRING_INSTRUMENT,
  TICKER_REGEX,
} from '../../shared/constants/transactions';

interface TransactionFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialValues?: TransactionDto | null;
  transactionTypes: TransactionTypeDefinition[];
  accountTypes: AccountTypeDefinition[];
  loading?: boolean;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  onCancel: () => void;
}

const normalizeFormValues = (values: TransactionFormValues) => ({
  ...values,
  ticker: values.ticker?.trim().toUpperCase() || null,
  quantity: values.quantity ?? null,
  price: values.price ?? null,
  notes: values.notes?.trim() || null,
});

const mapTransactionDtoToFormValues = (
  transaction?: TransactionDto | null,
  transactionTypes?: TransactionTypeDefinition[],
  accountTypes?: AccountTypeDefinition[]
): (TransactionFormValues & { transactionDatePicker: Dayjs }) | undefined => {
  if (!transaction) return undefined;

  const transactionType = transactionTypes?.find(
    (type) => type.code === transaction.transactionType
  );
  const accountType = accountTypes?.find((type) => type.code === transaction.accountType);

  return {
    transactionDate: transaction.transactionDate,
    transactionDatePicker: dayjs(transaction.transactionDate),
    transactionTypeId: transactionType?.id ?? NaN,
    accountTypeId: accountType?.id ?? NaN,
    ticker: transaction.ticker,
    quantity: transaction.quantity,
    price: transaction.price,
    totalAmount: transaction.totalAmount,
    commission: transaction.commission,
    notes: transaction.notes,
  };
};

export const TransactionFormModal = ({
  open,
  mode,
  initialValues,
  transactionTypes,
  accountTypes,
  loading,
  onSubmit,
  onCancel,
}: TransactionFormModalProps) => {
  const [form] = Form.useForm<TransactionFormValues & { transactionDatePicker: Dayjs }>();
  const isEditing = mode === 'edit';

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }

    if (initialValues) {
      const formValues = mapTransactionDtoToFormValues(initialValues, transactionTypes, accountTypes);
      if (formValues) {
        form.setFieldsValue(formValues);
      }
    } else {
      form.resetFields();
      form.setFieldsValue({
        commission: 0,
        totalAmount: 0,
      });
    }
  }, [open, initialValues, transactionTypes, accountTypes, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: TransactionFormValues = normalizeFormValues({
        transactionDate: values.transactionDatePicker.toISOString(),
        transactionTypeId: values.transactionTypeId,
        accountTypeId: values.accountTypeId,
        ticker: values.ticker ?? null,
        quantity: values.quantity ?? null,
        price: values.price ?? null,
        totalAmount: values.totalAmount,
        commission: values.commission,
        notes: values.notes ?? null,
      });
      await onSubmit(payload);
      form.resetFields();
    } catch {
      // validation errors handled by form
    }
  };

  const transactionTypeId = Form.useWatch('transactionTypeId', form);
  const requiresStockFields = transactionTypeId
    ? TRANSACTION_TYPES_REQUIRING_INSTRUMENT.has(transactionTypeId)
    : false;

  return (
    <Modal
      title={isEditing ? 'Edytuj transakcję' : 'Dodaj transakcję'}
      open={open}
      onOk={handleSubmit}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={loading}
      okText={isEditing ? 'Zapisz' : 'Dodaj'}
      cancelText="Anuluj"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          commission: 0,
          totalAmount: 0,
        }}
      >
        <Form.Item<TransactionFormValues & { transactionDatePicker: Dayjs }>
          name="transactionDatePicker"
          label="Data transakcji"
          rules={[
            { required: true, message: 'Data jest wymagana' },
            {
              validator: (_, value: Dayjs) => {
                if (!value) return Promise.resolve();
                if (value.isAfter(dayjs(), 'minute')) {
                  return Promise.reject(new Error('Data nie może być w przyszłości'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <DatePicker
            format="YYYY-MM-DD HH:mm"
            showTime={{ format: 'HH:mm' }}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="transactionTypeId"
          label="Typ transakcji"
          rules={[{ required: true, message: 'Wybierz typ transakcji' }]}
        >
          <Select
            placeholder="Wybierz typ"
            options={transactionTypes.map((type) => ({
              value: type.id,
              label: type.label,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="accountTypeId"
          label="Typ konta"
          rules={[{ required: true, message: 'Wybierz typ konta' }]}
        >
          <Select
            placeholder="Wybierz konto"
            options={accountTypes.map((type) => ({
              value: type.id,
              label: type.label,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="ticker"
          label="Ticker"
          rules={[
            {
              validator: (_, value: string | null) => {
                if (!requiresStockFields) {
                  return Promise.resolve();
                }
                if (!value || !value.trim()) {
                  return Promise.reject(new Error('Ticker jest wymagany dla transakcji BUY/SELL'));
                }
                const normalized = value.trim().toUpperCase();
                if (!TICKER_REGEX.test(normalized)) {
                  return Promise.reject(new Error('Nieprawidłowy format tickera (dozwolone litery, cyfry oraz kropka/myślnik)'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder="Np. AAPL, BRK.B" maxLength={12} />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Ilość"
          rules={[
            {
              validator: (_, value: number | null) => {
                if (!requiresStockFields) {
                  return Promise.resolve();
                }
                if (value === null || value === undefined) {
                  return Promise.reject(new Error('Ilość jest wymagana dla transakcji BUY/SELL'));
                }
                if (value <= 0) {
                  return Promise.reject(new Error('Ilość musi być większa od 0'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber min={0} style={{ width: '100%' }} precision={4} />
        </Form.Item>

        <Form.Item
          name="price"
          label="Cena"
          rules={[
            {
              validator: (_, value: number | null) => {
                if (!requiresStockFields) {
                  return Promise.resolve();
                }
                if (value === null || value === undefined) {
                  return Promise.reject(new Error('Cena jest wymagana dla transakcji BUY/SELL'));
                }
                if (value <= 0) {
                  return Promise.reject(new Error('Cena musi być większa od 0'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber min={0} style={{ width: '100%' }} precision={4} />
        </Form.Item>

        <Form.Item
          name="totalAmount"
          label="Wartość transakcji"
          rules={[
            { required: true, message: 'Wartość transakcji jest wymagana' },
            {
              validator: (_, value: number) => {
                if (value <= 0) {
                  return Promise.reject(new Error('Wartość transakcji musi być większa od 0'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber min={0} style={{ width: '100%' }} precision={2} />
        </Form.Item>

        <Form.Item
          name="commission"
          label="Prowizja"
          rules={[
            {
              validator: (_, value: number | null) => {
                if (value === null || value === undefined) {
                  return Promise.resolve();
                }
                if (value < 0) {
                  return Promise.reject(new Error('Prowizja nie może być ujemna'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber min={0} style={{ width: '100%' }} precision={2} />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Notatki"
          rules={[{ max: TRANSACTION_NOTES_MAX_LENGTH, message: `Notatki mogą mieć maksymalnie ${TRANSACTION_NOTES_MAX_LENGTH} znaków` }]}
        >
          <Input.TextArea rows={3} placeholder="Opcjonalne notatki" maxLength={TRANSACTION_NOTES_MAX_LENGTH} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
