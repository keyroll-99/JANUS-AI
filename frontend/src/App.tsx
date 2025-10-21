import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import plPL from 'antd/locale/pl_PL';
import RootLayout from './components/layouts/RootLayout';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { antdTheme } from './shared/config/antd-theme';
import { AuthProvider } from './shared/contexts/AuthContext';

const router = createBrowserRouter([
  // Strona główna - przekierowanie na dashboard lub login
  {
    path: '/',
    lazy: () => import('./pages/Home'),
    errorElement: <ErrorBoundary />,
  },
  // Publiczne route (auth) - bez layoutu
  {
    path: '/login',
    lazy: () => import('./pages/auth/Login'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/register',
    lazy: () => import('./pages/auth/Register'),
    errorElement: <ErrorBoundary />,
  },
  // Prywatne route - z layoutem
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: 'dashboard',
        lazy: () => import('./pages/Dashboard'),
      },
      {
        path: 'onboarding',
        lazy: () => import('./pages/Onboarding'),
      },
      {
        path: 'transactions',
        lazy: () => import('./pages/Transactions'),
      },
      {
        path: 'strategy',
        lazy: () => import('./pages/Strategy'),
      },
      {
        path: 'analysis',
        children: [
          {
            index: true,
            lazy: () => import('./pages/analysis/AnalysisList'),
          },
          {
            path: ':id',
            lazy: () => import('./pages/analysis/AnalysisDetail'),
          },
        ],
      },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <ConfigProvider theme={antdTheme} locale={plPL}>
        <RouterProvider router={router} />
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;
