import { Outlet } from 'react-router-dom';
import Header from './Header';
import './RootLayout.scss';

const RootLayout = () => {
  return (
    <div className="root-layout">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;
