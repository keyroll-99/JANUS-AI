# Shared Components

Reużywalne komponenty wykorzystywane w całej aplikacji.

## Ant Design Components

Aplikacja używa Ant Design jako głównej biblioteki UI. Komponenty są importowane z `antd`:

```tsx
import { Button, Card, Table, Form } from 'antd';
import { UserOutlined, SettingOutlined } from '@ant-design/icons';
```

## Custom Components

### PortfolioCard
Komponent wyświetlający statystyki portfela z indykacją wzrostu/spadku.

```tsx
<PortfolioCard
  title="Wartość portfela"
  value={125000}
  change={5000}
  changePercent={4.17}
  suffix="PLN"
  precision={2}
/>
```

### ErrorBoundary
Komponent do obsługi błędów React.

## Styling

- Komponenty używają Ant Design theme zdefiniowanego w `shared/config/antd-theme.ts`
- Nadpisanie stylów w `shared/styles/_antd-theme.scss`
- Używaj targeted imports dla optymalizacji bundle size

## Best Practices

1. **Targeted Imports**: Importuj tylko potrzebne komponenty
   ```tsx
   // ✅ Dobrze
   import { Button, Form } from 'antd';
   
   // ❌ Źle
   import Antd from 'antd';
   ```

2. **TypeScript**: Używaj typów z Ant Design
   ```tsx
   import type { FormInstance } from 'antd';
   ```

3. **Responsywność**: Wykorzystuj Grid system Ant Design
   ```tsx
   <Row gutter={16}>
     <Col xs={24} sm={12} md={8}>
       <Card>Content</Card>
     </Col>
   </Row>
   ```
