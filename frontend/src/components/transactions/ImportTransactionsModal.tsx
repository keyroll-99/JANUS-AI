import { useState } from 'react';
import { Modal, Upload, Alert, Typography, Space, Button, Select } from 'antd';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import { InboxOutlined } from '@ant-design/icons';
import type { ImportResult } from '../../shared/types';
import {
  TRANSACTION_IMPORT_ALLOWED_TYPES,
  TRANSACTION_IMPORT_MAX_SIZE_MB,
  ACCOUNT_TYPES_FORM_OPTIONS,
} from '../../shared/constants/transactions';

interface ImportTransactionsModalProps {
  open: boolean;
  importing: boolean;
  onImport: (file: File, accountTypeId?: number) => Promise<ImportResult>;
  onClose: () => void;
}

const MAX_SIZE_BYTES = TRANSACTION_IMPORT_MAX_SIZE_MB * 1024 * 1024;

export const ImportTransactionsModal = ({
  open,
  importing,
  onImport,
  onClose,
}: ImportTransactionsModalProps) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<RcFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [accountSelection, setAccountSelection] = useState<string>('auto');

  const accountOptions = [
    {
      value: 'auto',
      label: 'Wykryj konto na podstawie pliku (domyślnie)',
    },
    ...ACCOUNT_TYPES_FORM_OPTIONS.map((option) => ({
      value: String(option.value),
      label: option.label,
    })),
  ];

  const resetState = () => {
    setFileList([]);
    setSelectedFile(null);
    setError(null);
    setSuccessMessage(null);
    setAccountSelection('auto');
  };

  const handleBeforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (!TRANSACTION_IMPORT_ALLOWED_TYPES.includes(file.type)) {
      setError('Nieprawidłowy typ pliku. Dozwolone: .xls, .xlsx');
      return Upload.LIST_IGNORE;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`Plik jest zbyt duży. Maksymalny rozmiar to ${TRANSACTION_IMPORT_MAX_SIZE_MB} MB.`);
      return Upload.LIST_IGNORE;
    }

    setError(null);
    setSuccessMessage(null);
    setSelectedFile(file as RcFile);
    setFileList([
      {
        uid: file.uid,
        name: file.name,
        status: 'done',
        size: file.size,
        originFileObj: file as RcFile,
      },
    ]);
    return false; // prevent auto upload
  };

  const handleRemove = () => {
    resetState();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Wybierz plik do importu.');
      return;
    }

    setError(null);
    try {
      const accountTypeIdCandidate =
        accountSelection === 'auto' ? undefined : Number(accountSelection);
      const accountTypeId =
        accountTypeIdCandidate !== undefined && Number.isNaN(accountTypeIdCandidate)
          ? undefined
          : accountTypeIdCandidate;
      const result = await onImport(selectedFile as File, accountTypeId);
      setSuccessMessage(`Zaimportowano ${result.importedCount} transakcji.`);
      setTimeout(() => {
        resetState();
        onClose();
      }, 1800);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nie udało się zaimportować pliku.';
      setError(message);
    }
  };

  return (
    <Modal
      title="Import transakcji z XTB"
      open={open}
      onCancel={() => {
        resetState();
        onClose();
      }}
      footer={null}
      destroyOnClose
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Typography.Paragraph>
          Wybierz plik Excel wygenerowany z XTB Station. Obsługiwane formaty: .xls, .xlsx (maks. {TRANSACTION_IMPORT_MAX_SIZE_MB} MB).
        </Typography.Paragraph>

        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Typography.Text>Przypisz transakcje do konta</Typography.Text>
          <Select
            value={accountSelection}
            onChange={(value) => setAccountSelection(value)}
            options={accountOptions}
            disabled={importing}
            style={{ width: '100%' }}
          />
          <Typography.Text type="secondary">
            Jeśli wybierzesz ręcznie typ konta, wszystkie importowane transakcje zostaną przypisane do niego. W trybie automatycznym konto zostanie wykryte na podstawie komentarzy w pliku.
          </Typography.Text>
        </Space>

        <Upload.Dragger
          multiple={false}
          fileList={fileList}
          beforeUpload={handleBeforeUpload}
          accept={TRANSACTION_IMPORT_ALLOWED_TYPES.join(',')}
          onRemove={handleRemove}
          disabled={importing}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Przeciągnij i upuść plik tutaj lub kliknij, aby wybrać</p>
          <p className="ant-upload-hint">Plik powinien pochodzić z raportu historii transakcji XTB.</p>
        </Upload.Dragger>

        {error && <Alert type="error" message={error} showIcon />}
        {successMessage && <Alert type="success" message={successMessage} showIcon />}

        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={() => {
            resetState();
            onClose();
          }}>
            Anuluj
          </Button>
          <Button type="primary" onClick={handleUpload} loading={importing} disabled={!fileList.length}>
            Importuj
          </Button>
        </Space>
      </Space>
    </Modal>
  );
};
