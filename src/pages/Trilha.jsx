import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import NodeModal from '../components/NodeModal.jsx';
import RoadmapGraph from '../components/RoadmapGraph.jsx';
import '../styles/trilha.css';

const TRAIL_META = {
  frontend: {
    nome: 'Frontend',
    descricao: 'Roteiro para criar interfaces web com HTML, CSS e JavaScript.',
    icone: '💻',
  },
  backend: {
    nome: 'Backend',
    descricao: 'Roteiro para desenvolver APIs e lógica de servidor com Node.js.',
    icone: '⚙️',
  },
  'banco-de-dados': {
    nome: 'Banco de Dados',
    descricao: 'Roteiro para aprender modelagem, SQL e bancos relacionais.',
    icone: '🗄️',
  },
};

const TRAIL_IDS = Object.keys(TRAIL_META);

export default function Trilha() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTrailId, setActiveTrailId] = useState('frontend');
  const [collapsed, setCollapsed] = useState(false);

  const queryTrailId = searchParams.get('id');
  const trailId = queryTrailId || 'frontend';
  const activeMeta = TRAIL_META[activeTrailId] || TRAIL_META.frontend;

  useEffect(() => {
    if (!queryTrailId) {
      setActiveTrailId('frontend');
      setSearchParams({ id: 'frontend' }, { replace: true });
      return;
    }

    if (!TRAIL_META[queryTrailId]) {
      navigate('/', { replace: true });
      return;
    }

    setActiveTrailId(queryTrailId);
  }, [navigate, queryTrailId, setSearchParams]);

  useEffect(() => {
    const meta = TRAIL_META[activeTrailId];

    if (meta) {
      document.title = `PPT | Trilha ${meta.nome}`;
    }
  }, [activeTrailId]);

  useEffect(() => {
    if (!TRAIL_META[trailId]) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadTrailData() {
      try {
        setLoading(true);
        setError(null);
        setNodes([]);

        const response = await fetch(`/api/trilha?id=${trailId}`, {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Falha ao carregar dados da trilha (${response.status}).`);
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Os dados da trilha estão vazios ou inválidos.');
        }

        setNodes(data);
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          return;
        }

        console.error(fetchError);
        setError('Não foi possível carregar a trilha. Tente novamente mais tarde.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadTrailData();

    return () => {
      controller.abort();
    };
  }, [trailId]);

  function handleTrailSelect(selectedTrailId) {
    if (!TRAIL_META[selectedTrailId]) {
      return;
    }

    setSearchParams({ id: selectedTrailId });
  }

  return (
    <main className="page-main">
      <section className="trail-hero surface-panel">
        <div>
          <p className="eyebrow">Trilha de aprendizado</p>
          <h1 id="trail-title">{activeMeta.nome}</h1>
          <span id="breadcrumb-current" className="trail-breadcrumb">
            {activeMeta.nome}
          </span>
          <p id="trail-description" className="trail-description">
            {activeMeta.descricao}
          </p>
        </div>
        <div className="trail-hero-actions">
          <Link className="button button-secondary" to="/">
            Ver outras trilhas
          </Link>
          <Link className="button button-primary" to="/mapa">
            Mapa de conexão
          </Link>
        </div>
      </section>

      <div className="page-grid">
        <div className="trail-tabs" role="tablist" aria-label="Seleção de trilhas">
          {TRAIL_IDS.map((id) => {
            const selected = activeTrailId === id;
            const meta = TRAIL_META[id];

            return (
              <button
                key={id}
                type="button"
                className={`trail-tab${selected ? ' active' : ''}`}
                data-trail-id={id}
                aria-selected={String(selected)}
                onClick={() => handleTrailSelect(id)}
              >
                {meta.nome}
              </button>
            );
          })}
        </div>

        <section className="roadmap-wrapper">
          {loading && <div className="roadmap-container" aria-live="polite"><div className="loading">Carregando roadmap...</div></div>}
          {!loading && error && <div className="roadmap-container" aria-live="polite"><div className="error">{error}</div></div>}
          {!loading && !error && <RoadmapGraph nodes={nodes} />}
        </section>

        <aside className="sidebar" id="legend">
          <div id="trail-indicator" className="trail-indicator">
            {activeMeta.icone} {activeMeta.nome}
          </div>
          <button
            id="legend-toggle"
            className="sidebar-toggle"
            type="button"
            aria-expanded={String(!collapsed)}
            onClick={() => setCollapsed((current) => !current)}
          >
            Legenda
          </button>
          <div className={`sidebar-panel${collapsed ? ' sidebar-panel-collapsed' : ''}`}>
            <h2>Legenda do roadmap</h2>
            <ul className="legend-list">
              <li>
                <span className="legend-badge legend-badge-iniciante"></span>Iniciante
              </li>
              <li>
                <span className="legend-badge legend-badge-intermediario"></span>Intermediário
              </li>
              <li>
                <span className="legend-badge legend-badge-avancado"></span>Avançado
              </li>
              <li>
                <span className="legend-line legend-line-main"></span>Fluxo principal
              </li>
              <li>
                <span className="legend-line legend-line-fork"></span>Fork opcional
              </li>
              <li>
                <span className="legend-icon">⚠</span>Deprecado
              </li>
              <li>
                <span className="legend-icon">🔧</span>Em revisão
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {!loading && !error && <NodeModal nodes={nodes} />}
    </main>
  );
}
