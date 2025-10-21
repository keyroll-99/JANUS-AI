import type { ThemeConfig } from 'antd';

// Konfiguracja motywu Ant Design dla Janus AI
// Dokumentacja: https://ant.design/docs/react/customize-theme

export const antdTheme: ThemeConfig = {
  token: {
    // Główne kolory
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    
    // Typography
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    
    // Border radius
    borderRadius: 6,
    
    // Spacing
    controlHeight: 32,
    
    // Layout
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f5f5f5',
  },
  
  components: {
    // Customizacja Card
    Card: {
      borderRadiusLG: 8,
      boxShadowTertiary: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    
    // Customizacja Button
    Button: {
      controlHeight: 36,
      borderRadius: 6,
    },
    
    // Customizacja Table
    Table: {
      headerBg: '#fafafa',
      headerColor: 'rgba(0, 0, 0, 0.88)',
      borderColor: '#f0f0f0',
    },
    
    // Customizacja Form
    Form: {
      labelFontSize: 14,
      labelColor: 'rgba(0, 0, 0, 0.88)',
    },
    
    // Customizacja Statistic
    Statistic: {
      titleFontSize: 14,
      contentFontSize: 24,
    },
  },
};
