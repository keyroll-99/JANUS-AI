import { useState } from 'react';
import type { FormInstance } from 'antd';

/**
 * Hook do zarządzania stanem Ant Design Form z walidacją Zod
 * 
 * @example
 * const { loading, error, handleSubmit } = useAntForm(mySchema, async (data) => {
 *   await api.post('/endpoint', data);
 * });
 */
export function useAntForm<T>(
  schema: any, // Zod schema
  onSubmit: (data: T) => Promise<void>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: T, form?: FormInstance) => {
    setLoading(true);
    setError(null);

    try {
      // Walidacja z Zod
      const validated = schema.parse(values);
      
      // Submit
      await onSubmit(validated);
      
      // Reset form po sukcesie
      form?.resetFields();
    } catch (err: any) {
      if (err.name === 'ZodError') {
        setError('Błąd walidacji formularza');
        // Możesz też ustawić błędy bezpośrednio na polach formularza
        form?.setFields(
          err.errors.map((e: any) => ({
            name: e.path,
            errors: [e.message],
          }))
        );
      } else {
        setError(err.message || 'Wystąpił błąd');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleSubmit,
    clearError: () => setError(null),
  };
}
