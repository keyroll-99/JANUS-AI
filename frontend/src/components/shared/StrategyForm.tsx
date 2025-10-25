import { Form, Select, Input, Button, Space } from 'antd';
import { useEffect } from 'react';
import { StrategyRequestDto, StrategyResponseDto } from '../../shared/types/strategy.types';

const { TextArea } = Input;

interface StrategyFormProps {
  initialValues?: StrategyResponseDto;
  onSubmit: (values: StrategyRequestDto) => Promise<void>;
  loading: boolean;
  onValuesChange?: () => void;
}

/**
 * Formularz strategii inwestycyjnej
 * Używany zarówno do tworzenia jak i edycji strategii
 */
export const StrategyForm = ({
  initialValues,
  onSubmit,
  loading,
  onValuesChange,
}: StrategyFormProps) => {
  const [form] = Form.useForm<StrategyRequestDto>();

  // Ustaw początkowe wartości gdy się zmienią
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        timeHorizon: initialValues.timeHorizon,
        riskLevel: initialValues.riskLevel,
        investmentGoals: initialValues.investmentGoals,
      });
    }
  }, [initialValues, form]);

  const handleSubmit = async (values: StrategyRequestDto) => {
    await onSubmit(values);
  };

  return (
    <Form<StrategyRequestDto>
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      onValuesChange={onValuesChange}
      autoComplete="off"
    >
      <Form.Item
        label="Horyzont czasowy"
        name="timeHorizon"
        rules={[
          {
            required: true,
            message: 'Wybierz horyzont czasowy',
          },
        ]}
        tooltip="Określa, jak długo planujesz trzymać swoje inwestycje"
      >
        <Select
          placeholder="Wybierz horyzont czasowy"
          disabled={loading}
          options={[
            {
              value: 'SHORT',
              label: 'Krótkoterminowy (do 1 roku)',
            },
            {
              value: 'MEDIUM',
              label: 'Średnioterminowy (1-5 lat)',
            },
            {
              value: 'LONG',
              label: 'Długoterminowy (ponad 5 lat)',
            },
          ]}
        />
      </Form.Item>

      <Form.Item
        label="Poziom ryzyka"
        name="riskLevel"
        rules={[
          {
            required: true,
            message: 'Wybierz poziom ryzyka',
          },
        ]}
        tooltip="Określa, jak dużą zmienność portfela możesz zaakceptować"
      >
        <Select
          placeholder="Wybierz poziom ryzyka"
          disabled={loading}
          options={[
            {
              value: 'LOW',
              label: 'Niskie ryzyko - stabilne inwestycje',
            },
            {
              value: 'MEDIUM',
              label: 'Umiarkowane ryzyko - zrównoważony portfel',
            },
            {
              value: 'HIGH',
              label: 'Wysokie ryzyko - agresywny wzrost',
            },
          ]}
        />
      </Form.Item>

      <Form.Item
        label="Cele inwestycyjne"
        name="investmentGoals"
        rules={[
          {
            required: true,
            message: 'Opisz swoje cele inwestycyjne',
          },
          {
            min: 10,
            message: 'Cele inwestycyjne muszą zawierać co najmniej 10 znaków',
          },
          {
            max: 500,
            message: 'Cele inwestycyjne nie mogą przekraczać 500 znaków',
          },
        ]}
        tooltip="Opisz, co chcesz osiągnąć poprzez inwestowanie"
      >
        <TextArea
          placeholder="Np. Oszczędzam na emeryturę, planuję kupno mieszkania za 5 lat, chcę zabezpieczyć przyszłość dzieci..."
          rows={4}
          disabled={loading}
          showCount
          maxLength={500}
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialValues ? 'Zapisz zmiany' : 'Utwórz strategię'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
