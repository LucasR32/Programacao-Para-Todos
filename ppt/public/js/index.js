const trailsGrid = document.getElementById('trails-grid');
const errorMessage = document.getElementById('trails-error');
const mapEmbed = document.getElementById('map-embed');

const WIFI_POINTS = [
  { title: 'Escola Estadual Tito Prates da Fonseca', lat: -23.550520, lng: -46.633308 },
  { title: 'Praça Central', lat: -23.548000, lng: -46.634000 },
  { title: 'Biblioteca Comunitária', lat: -23.549500, lng: -46.632500 }
];

function createSkeletonCard() {
  const card = document.createElement('article');
  card.className = 'trail-card skeleton';
  card.innerHTML = `
    <div class="trail-icon"></div>
    <div class="trail-content">
      <div class="skeleton-line title"></div>
      <div class="skeleton-line text"></div>
      <div class="skeleton-line text"></div>
      <div class="trail-meta">
        <span class="skeleton-line badge"></span>
        <span class="skeleton-line badge"></span>
      </div>
    </div>
  `;
  return card;
}

function renderSkeletons() {
  trailsGrid.innerHTML = '';
  for (let i = 0; i < 3; i += 1) {
    trailsGrid.appendChild(createSkeletonCard());
  }
}

function showError(message) {
  trailsGrid.innerHTML = '';
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function createTrailCard(trail, topicsCount) {
  const card = document.createElement('article');
  card.className = 'trail-card';
  card.innerHTML = `
    <div class="trail-icon">${trail.icone}</div>
    <div class="trail-content">
      <h3>${trail.titulo}</h3>
      <p>${trail.descricao}</p>
      <div class="trail-details">
        <span>Nível inicial: Iniciante</span>
        <span>${topicsCount} tópicos</span>
      </div>
      <a class="button button-secondary" href="trilha.html?id=${trail.id}">Ver trilha</a>
    </div>
  `;
  return card;
}

function fetchTrailTopicsCount(trail) {
  return fetch(`data/${trail.arquivo}`, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) {
        return Promise.resolve('?');
      }
      return response.json();
    })
    .then((data) => (Array.isArray(data) ? data.length : '?'))
    .catch(() => '?');
}

function loadTrails() {
  renderSkeletons();
  errorMessage.hidden = true;

  fetch('data/trilhas.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Não foi possível carregar as trilhas.');
      }
      return response.json();
    })
    .then(async (trails) => {
      if (!Array.isArray(trails) || trails.length === 0) {
        throw new Error('Nenhuma trilha disponível.');
      }

      const counts = await Promise.all(trails.map((trail) => fetchTrailTopicsCount(trail)));
      trailsGrid.innerHTML = '';
      trails.forEach((trail, index) => {
        trailsGrid.appendChild(createTrailCard(trail, counts[index]));
      });
    })
    .catch((error) => {
      console.error(error);
      showError('Houve um problema ao carregar as trilhas. Tente novamente mais tarde.');
    });
}

function getMapsApiKey() {
  const meta = document.querySelector('meta[name="google-maps-api-key"]');
  return meta?.content?.trim() || '';
}

function initMap() {
  const apiKey = getMapsApiKey();
  if (!apiKey) {
    mapEmbed.textContent = 'Chave do Google Maps não configurada.';
    return;
  }

  window.initMap = () => {
    const map = new google.maps.Map(mapEmbed, {
      center: { lat: -23.5495, lng: -46.6333 },
      zoom: 15,
      disableDefaultUI: true
    });

    WIFI_POINTS.forEach((point) => {
      new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map,
        title: point.title
      });
    });
  };

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=initMap`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

function init() {
  loadTrails();
  initMap();
}

init();
