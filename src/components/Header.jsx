import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/">
          PPT • Programação Para Todos
        </Link>
        <nav aria-label="Navegação principal" className="main-nav">
          <Link to="/trilha?id=frontend">Trilhas</Link>
          <Link to="/mapa">Mapa Wi-Fi</Link>
          <Link to="/#sobre">Sobre</Link>
        </nav>
      </div>
    </header>
  );
}
