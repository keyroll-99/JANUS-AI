# Janus AI - Frontend

Frontend aplikacji Janus AI zbudowany w React z Ant Design.

## 📦 Tech Stack

- **React 19.2** - UI Framework
- **React Router 7.9** - Routing
- **Ant Design 5.22** - UI Component Library
- **@ant-design/charts 2.2** - Wykresy i wizualizacje
- **TypeScript 5.9** - Type safety
- **Vite 7.1** - Build tool & dev server
- **SCSS** - Styling & theme customization
- **Zod 3.24** - Schema validation
- **date-fns 4.1** - Date utilities

## 🚀 Quick Start

### Instalacja dependencies

```bash
npm install
```

### Uruchomienie dev server

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:5173`

### Build production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## 🧪 Testing

```bash
# Uruchom testy
npm run test

# Testy w trybie watch
npm run test:watch

# Coverage
npm run test:coverage
```

## 🎨 Styling & Theme

### Ant Design Theme

Główna konfiguracja theme znajduje się w `src/shared/config/antd-theme.ts`.

```tsx
import { antdTheme } from './shared/config/antd-theme';

<ConfigProvider theme={antdTheme}>
  {/* Your app */}
</ConfigProvider>
```

### SCSS Customization

Nadpisanie stylów Ant Design w `src/shared/styles/_antd-theme.scss`.

```scss
// Przykład customizacji
.ant-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
```

### Variables

Zmienne SCSS w `src/shared/styles/_variables.scss`:

```scss
$color-primary: #3b82f6;
$color-success: #10b981;
$color-error: #ef4444;
```

## 📁 Struktura projektu

```
src/
├── components/
│   ├── layouts/          # Layout components (Header, RootLayout)
│   └── shared/           # Reusable components (PortfolioCard, ErrorBoundary)
├── pages/                # Page components (routed views)
│   ├── auth/             # Login, Register
│   └── analysis/         # Analysis pages
├── shared/
│   ├── api/              # API client
│   ├── config/           # Configuration (antd theme, app config)
│   ├── hooks/            # Custom React hooks
│   ├── styles/           # Global styles & SCSS
│   └── types/            # TypeScript types
├── App.tsx               # Root component with routing
└── main.tsx              # Entry point
```

## 🎯 Best Practices

### 1. Ant Design Imports

Używaj **targeted imports** dla optymalizacji bundle size:

```tsx
// ✅ Dobrze
import { Button, Form, Table } from 'antd';
import { UserOutlined } from '@ant-design/icons';

// ❌ Źle
import Antd from 'antd';
```

### 2. TypeScript Types

Wykorzystuj typy z Ant Design:

```tsx
import type { FormInstance, TableProps } from 'antd';
```

### 3. Responsywność

Używaj Grid system Ant Design:

```tsx
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} md={8} lg={6}>
    <Card>Content</Card>
  </Col>
</Row>
```

### 4. Formularze

Kombinuj Ant Design Form z Zod validation:

```tsx
import { Form, Input, Button } from 'antd';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const MyForm = () => {
  const onFinish = (values: any) => {
    const validated = schema.parse(values);
    // Handle form submission
  };

  return (
    <Form onFinish={onFinish}>
      <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>
        <Input placeholder="Email" />
      </Form.Item>
      {/* ... */}
    </Form>
  );
};
```

## 📊 Wykresy

Używamy `@ant-design/charts` dla wizualizacji:

```tsx
import { Line, Pie, Area } from '@ant-design/charts';

// Line chart dla historii portfela
const config = {
  data: portfolioHistory,
  xField: 'date',
  yField: 'value',
  smooth: true,
};

<Line {...config} />
```

## 🔧 Linting & Formatting

### Lint code

```bash
npm run lint
npm run lint:fix
```

### Format code

```bash
npm run format
npm run format:check
```

## 🌍 Internationalization

Aplikacja używa polskiej lokalizacji Ant Design:

```tsx
import plPL from 'antd/locale/pl_PL';

<ConfigProvider locale={plPL}>
  {/* App */}
</ConfigProvider>
```

## 📝 Environment Variables

Skopiuj `.env.example` do `.env`:

```bash
cp .env.example .env
```

Dostępne zmienne:

```
VITE_API_URL=http://localhost:3000/api
```

## 🐛 Debugging

### React DevTools

Zainstaluj [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)

### Vite Debug

```bash
DEBUG=vite:* npm run dev
```

## 📦 Bundle Analysis

Analiza rozmiaru bundle:

```bash
npm run build -- --mode analyze
```

## 🤝 Contributing

1. Przestrzegaj [Coding Guidelines](../.github/copilot-instructions.md)
2. Używaj Conventional Commits
3. Uruchom testy przed commitem
4. Formatuj kod przed commitem (prettier + eslint)

## 📚 Dokumentacja

- [Ant Design Docs](https://ant.design/docs/react/introduce)
- [Ant Design Charts](https://charts.ant.design/en)
- [React Router](https://reactrouter.com/)
- [Vite](https://vitejs.dev/)
- [Zod](https://zod.dev/)
