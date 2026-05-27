import RoadmapGraph from './roadmap-graph.js';
import NodeModal from './node-modal.js';

const TRAIL_META = {
  frontend: {
    nome: 'Frontend',
    descricao: 'Roteiro para criar interfaces web com HTML, CSS e JavaScript.',
    icone: '💻'
  },
  backend: {
    nome: 'Backend',
    descricao: 'Roteiro para desenvolver APIs e lógica de servidor com Node.js.',
    icone: '⚙️'
  },
  'banco-de-dados': {
    nome: 'Banco de Dados',
    descricao: 'Roteiro para aprender modelagem, SQL e bancos relacionais.',
    icone: '🗄️'
  }
};

const container = document.getElementById('roadmap-container');
const titleElement = document.getElementById('trail-title');
const descriptionElement = document.getElementById('trail-description');
const breadcrumbCurrent = document.getElementById('breadcrumb-current');
const trailIndicator = document.getElementById('trail-indicator');
const legendToggle = document.getElementById('legend-toggle');
const legendPanel = document.querySelector('.sidebar-panel');
const trailTabs = document.querySelectorAll('.trail-tab');

let currentGraph = null;
let currentModal = null;
let activeTrailId = '';

function getTrailId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function redirectHome() {
  window.location.href = 'index.html';
}

function showLoading() {
  container.innerHTML = '<div class="loading">Carregando roadmap...</div>';
}

function showError(message) {
  container.innerHTML = `<div class="error">${message}</div>`;
}

function updatePageMeta(trailId) {
  const meta = TRAIL_META[trailId];
  if (!meta) return;
  document.title = `PPT | Trilha ${meta.nome}`;
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = meta.nome;
  titleElement.textContent = meta.nome;
  descriptionElement.textContent = meta.descricao;
  if (trailIndicator) trailIndicator.textContent = `${meta.icone} ${meta.nome}`;
}

function setActiveTab(trailId) {
  trailTabs.forEach((tab) => {
    const selected = tab.dataset.trailId === trailId;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
  });
}

function destroyCurrentTrail() {
  if (currentGraph) {
    currentGraph.destroy();
    currentGraph = null;
  }
  if (currentModal) {
    currentModal.destroy();
    currentModal = null;
  }
}

function selectTrail(trailId, replaceState = true) {
  if (!TRAIL_META[trailId]) return;
  if (trailId === activeTrailId) {
    if (replaceState) {
      history.replaceState({}, '', `?id=${encodeURIComponent(trailId)}`);
    }
    return;
  }

  activeTrailId = trailId;
  setActiveTab(trailId);
  updatePageMeta(trailId);
  if (replaceState) {
    history.replaceState({}, '', `?id=${encodeURIComponent(trailId)}`);
  }

  destroyCurrentTrail();
  showLoading();

  loadTrailData(trailId)
    .then((nodes) => {
      if (!Array.isArray(nodes) || nodes.length === 0) {
        throw new Error('Os dados da trilha estão vazios ou inválidos.');
      }

      currentGraph = new RoadmapGraph(container, nodes);
      currentModal = new NodeModal(document.body, buildDataMap(nodes));
    })
    .catch((error) => {
      console.error(error);
      showError('Não foi possível carregar a trilha. Tente novamente mais tarde.');
    });
}

function buildDataMap(nodes) {
  return new Map(nodes.map((node) => [node.id, node]));
}

function loadTrailData(trailId) {
  return fetch(`data/trilha-${trailId}.json`, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Falha ao carregar dados da trilha (${response.status}).`);
      }
      return response.json();
    });
}

function setupLegendToggle() {
  legendToggle.addEventListener('click', () => {
    const expanded = legendToggle.getAttribute('aria-expanded') === 'true';
    legendToggle.setAttribute('aria-expanded', String(!expanded));
    legendPanel.classList.toggle('sidebar-panel-collapsed', expanded);
  });
}

function initialize() {
  const trailId = getTrailId() || 'frontend';
  if (!TRAIL_META[trailId]) {
    redirectHome();
    return;
  }

  setupLegendToggle();
  trailTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const selectedTrail = tab.dataset.trailId;
      if (selectedTrail) {
        selectTrail(selectedTrail);
      }
    });
  });

  selectTrail(trailId, !getTrailId());
}

initialize();
