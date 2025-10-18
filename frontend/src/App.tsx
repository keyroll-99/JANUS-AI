import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RootLayout from './components/layouts/RootLayout';
import ErrorBoundary from './components/shared/ErrorBoundary';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        lazy: () => import('./pages/Dashboard'),
      },
      {
        path: 'login',
        lazy: () => import('./pages/auth/Login'),
      },
      {
        path: 'register',
        lazy: () => import('./pages/auth/Register'),
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
  return <RouterProvider router={router} />;
}

export default App;
