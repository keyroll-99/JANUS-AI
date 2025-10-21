import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, message } from 'antd';
import {
  DashboardOutlined,
  TransactionOutlined,
  BarChartOutlined,
  BulbOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../shared/contexts/AuthContext';
import { logoutUser } from '../../shared/api/auth.api';
import './RootLayout.scss';

const { Header, Sider, Content, Footer } = Layout;

/**
 * Główny layout aplikacji
 * Zgodnie z ui-plan.md: Layout z bocznym Sider (menu) i Header z przyciskiem wyloguj
 */
const RootLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      message.success('Wylogowano pomyślnie');
      navigate('/login');
    } catch (error) {
      // Nawet jeśli API zwróci błąd, wyloguj użytkownika lokalnie
      logout();
      navigate('/login');
    }
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Wyloguj
      </Menu.Item>
    </Menu>
  );

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '/transactions',
      icon: <TransactionOutlined />,
      label: 'Transakcje',
      onClick: () => navigate('/transactions'),
    },
    {
      key: '/strategy',
      icon: <BulbOutlined />,
      label: 'Strategia',
      onClick: () => navigate('/strategy'),
    },
    {
      key: '/analysis',
      icon: <BarChartOutlined />,
      label: 'Analizy',
      onClick: () => navigate('/analysis'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Boczne menu nawigacyjne */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        collapsedWidth={80}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 20 : 24,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'J' : 'Janus AI'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>

      {/* Layout główny z Header i Content */}
      <Layout style={{ marginLeft: collapsed ? 80 : 200 }}>
        {/* Header z avatar i wylogowaniem */}
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 500 }}>
            {menuItems.find((item) => item.key === location.pathname)?.label || 'Janus AI'}
          </div>
          <Dropdown overlay={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.email}</span>
            </div>
          </Dropdown>
        </Header>

        {/* Główna treść */}
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
            <Outlet />
          </div>
        </Content>

        {/* Stopka */}
        <Footer style={{ textAlign: 'center' }}>
          Janus AI ©{new Date().getFullYear()} - Inteligentne zarządzanie portfelem
        </Footer>
      </Layout>
    </Layout>
  );
};

export default RootLayout;
