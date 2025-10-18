import { Link } from 'react-router-dom';
import './Header.scss';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="header-logo">
          <h1>Janus</h1>
        </Link>
        <nav className="header-nav">
          <Link to="/">Dashboard</Link>
          <Link to="/transactions">Transakcje</Link>
          <Link to="/strategy">Strategia</Link>
          <Link to="/analysis">Analizy</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
