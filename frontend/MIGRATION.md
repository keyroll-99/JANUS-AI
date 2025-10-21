# Migration Guide - Ant Design Integration

## Przegląd zmian

Aplikacja została zaktualizowana z samodzielnie stylizowanych komponentów na **Ant Design** jako główną bibliotekę UI.

## Dodane zależności

```json
{
  "antd": "^5.22.7",
  "@ant-design/icons": "^5.5.2",
  "@ant-design/charts": "^2.2.3",
  "zod": "^3.24.1",
  "date-fns": "^4.1.0",
  "react-error-boundary": "^4.1.2"
}
```

## Usunięte zależności

Żadne zależności nie zostały usunięte, ale następujące nie będą już używane:
- **react-hook-form** → zastąpione przez Ant Design Form
- (recharts był zaplanowany, ale nie był jeszcze zainstalowany)

## Nowe pliki

### Konfiguracja
- `src/shared/config/antd-theme.ts` - TypeScript konfiguracja motywu Ant Design
- `src/shared/styles/_antd-theme.scss` - SCSS nadpisania stylów Ant Design

### Komponenty
- `src/components/shared/PortfolioCard.tsx` - Przykładowy komponent używający Ant Design
- `src/components/shared/README.md` - Dokumentacja shared components

### Hooks
- `src/shared/hooks/useAntForm.ts` - Hook do integracji Ant Design Form z Zod

### Przykłady
- `src/pages/auth/Login.example.tsx` - Przykład formularza logowania
- `src/pages/Dashboard.example.tsx` - Przykład dashboard z wykresami

### Dokumentacja
- `frontend/README.md` - Kompletna dokumentacja frontendu

## Zmodyfikowane pliki

### `src/App.tsx`
```tsx
// Dodano ConfigProvider dla Ant Design
import { ConfigProvider } from 'antd';
import plPL from 'antd/locale/pl_PL';
import { antdTheme } from './shared/config/antd-theme';

function App() {
  return (
    <ConfigProvider theme={antdTheme} locale={plPL}>
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}
```

### `src/shared/styles/index.scss`
```scss
// Dodano import theme Ant Design
@import './antd-theme';
```

### `package.json`
Zaktualizowano zależności (patrz wyżej).

## Migracja istniejących komponentów

### Formularze

**Przed (react-hook-form):**
```tsx
import { useForm } from 'react-hook-form';

const { register, handleSubmit } = useForm();

<input {...register('email')} />
```

**Teraz (Ant Design Form):**
```tsx
import { Form, Input } from 'antd';

<Form onFinish={handleSubmit}>
  <Form.Item name="email">
    <Input />
  </Form.Item>
</Form>
```

### Tabele

**Przed (custom):**
```tsx
<table>
  <thead>
    <tr><th>Symbol</th></tr>
  </thead>
  <tbody>
    {data.map(item => <tr key={item.id}><td>{item.symbol}</td></tr>)}
  </tbody>
</table>
```

**Teraz (Ant Design Table):**
```tsx
import { Table } from 'antd';

const columns = [
  { title: 'Symbol', dataIndex: 'symbol', key: 'symbol' }
];

<Table columns={columns} dataSource={data} />
```

### Karty/Cards

**Przed (custom):**
```tsx
<div className="card">
  <h3>Title</h3>
  <p>Content</p>
</div>
```

**Teraz (Ant Design Card):**
```tsx
import { Card } from 'antd';

<Card title="Title">
  <p>Content</p>
</Card>
```

## Styling Guidelines

### 1. Używaj Ant Design komponentów tam gdzie możliwe

```tsx
// ✅ Dobrze
import { Button } from 'antd';
<Button type="primary">Click me</Button>

// ❌ Unikaj custom button jeśli Ant Design ma odpowiednik
<button className="custom-button">Click me</button>
```

### 2. Nadpisywanie stylów

Jeśli musisz nadpisać style, użyj SCSS w `_antd-theme.scss`:

```scss
.ant-btn-primary {
  background-color: $color-primary;
  
  &:hover {
    background-color: $color-primary-hover;
  }
}
```

### 3. Targeted Imports

```tsx
// ✅ Dobrze - tree-shaking działa
import { Button, Form } from 'antd';

// ❌ Źle - importuje wszystko
import Antd from 'antd';
```

## Walidacja formularzy

Kombinuj Ant Design Form z Zod:

```tsx
import { Form } from 'antd';
import { z } from 'zod';
import { useAntForm } from '@/shared/hooks';

const schema = z.object({
  email: z.string().email(),
});

const { handleSubmit, loading, error } = useAntForm(schema, async (data) => {
  // Submit logic
});

<Form onFinish={(values) => handleSubmit(values, form)}>
  {/* Form fields */}
</Form>
```

## Wykresy

Używaj `@ant-design/charts` zamiast własnych implementacji:

```tsx
import { Line, Pie, Column } from '@ant-design/charts';

const config = {
  data: portfolioData,
  xField: 'date',
  yField: 'value',
};

<Line {...config} />
```

## Ikony

```tsx
import { 
  UserOutlined, 
  LockOutlined, 
  ArrowUpOutlined 
} from '@ant-design/icons';

<UserOutlined style={{ fontSize: 24, color: '#1890ff' }} />
```

## Grid System

```tsx
import { Row, Col } from 'antd';

<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} md={8} lg={6}>
    <Card>Content</Card>
  </Col>
</Row>
```

## Theme Customization

Edytuj `src/shared/config/antd-theme.ts`:

```ts
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#3b82f6',
    borderRadius: 6,
    // ... inne tokeny
  },
};
```

## Resources

- [Ant Design Documentation](https://ant.design/)
- [Ant Design Charts](https://charts.ant.design/)
- [Przykłady w kodzie](./src/pages/*.example.tsx)
- [Frontend README](./README.md)

## Następne kroki

1. ✅ Konfiguracja Ant Design - **DONE**
2. ⏳ Migracja istniejących komponentów
3. ⏳ Implementacja Dashboard z wykresami
4. ⏳ Implementacja formularzy (Login, Register)
5. ⏳ Implementacja tabel transakcji
6. ⏳ Testy komponentów

## Pytania?

Zobacz przykłady w folderze `src/pages/*.example.tsx` lub sprawdź [Ant Design Docs](https://ant.design/).
