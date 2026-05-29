import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Mapa from './pages/Mapa.jsx';
import Trilha from './pages/Trilha.jsx';

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />
      <Route
        path="/trilha"
        element={
          <Layout>
            <Trilha />
          </Layout>
        }
      />
      <Route
        path="/mapa"
        element={
          <Layout>
            <Mapa />
          </Layout>
        }
      />
    </Routes>
  );
}
