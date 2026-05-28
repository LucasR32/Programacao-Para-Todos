const MAP_CONTAINER_ID = 'mapa-container';
const POINTS_LIST_ID = 'pontos-list';
const fallbackCenter = { lat: -23.5325, lng: -46.7310 };
let map;
let markers = new Map();
let activeListItem = null;
let resizeObserver = null;

function sendError(message) {
  const list = document.getElementById(POINTS_LIST_ID);
  list.innerHTML = `<div class="ponto-item error-text">${message}</div>`;
}

function buildRouteUrl(lat, lng) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
}

function highlightListItem(itemId) {
  if (activeListItem) {
    activeListItem.classList.remove('active');
  }
  const nextItem = document.querySelector(`[data-point-id="${itemId}"]`);
  if (nextItem) {
    nextItem.classList.add('active');
    nextItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    activeListItem = nextItem;
  }
}

function createPopupContent(point) {
  return `
    <div style="max-width:240px; font-family: 'IBM Plex Sans', system-ui, sans-serif;">
      <h3 style="margin:0 0 8px; font-size:1rem;">${point.nome}</h3>
      <p style="margin:0 0 6px; color:#334155; font-size:0.95rem;">${point.endereco}</p>
      <p style="margin:0 0 6px; font-size:0.9rem; color:#475569;"><strong>Tipo:</strong> ${point.tipo}</p>
      <p style="margin:0; font-size:0.9rem; color:#475569;"><strong>Horário:</strong> ${point.horario}</p>
    </div>
  `;
}

function openMarkerPopup(pointId) {
  const marker = markers.get(pointId);
  if (!marker) return;
  marker.openPopup();
  highlightListItem(pointId);
}

function buildSidebarItem(point) {
  const item = document.createElement('article');
  item.className = 'ponto-item';
  item.dataset.pointId = point.id;
  item.innerHTML = `
    <h3>${point.nome}</h3>
    <p>${point.endereco}</p>
    <div class="ponto-meta"><span>Tipo: ${point.tipo}</span><span>Horário: ${point.horario}</span></div>
    <a class="btn-route" href="${buildRouteUrl(point.lat, point.lng)}" target="_blank" rel="noopener noreferrer">Como chegar</a>
  `;
  item.addEventListener('click', () => openMarkerPopup(point.id));
  return item;
}

function createMarker(point) {
  const marker = L.marker([point.lat, point.lng]).addTo(map);
  marker.bindPopup(createPopupContent(point), {
    maxWidth: 280,
    autoClose: false,
    closeOnClick: false,
    closeButton: true
  });
  marker.on('popupopen', () => {
    highlightListItem(point.id);
  });
  marker.pointId = point.id;
  return marker;
}

function renderPoints(points) {
  const list = document.getElementById(POINTS_LIST_ID);
  list.innerHTML = '';
  markers.clear();

  points.forEach((point) => {
    const marker = createMarker(point);
    markers.set(point.id, marker);
    const item = buildSidebarItem(point);
    list.appendChild(item);
  });

  if (points.length > 0) {
    openMarkerPopup(points[0].id);
  }
}

function loadPointsAndRender() {
  fetch('data/pontos-wifi.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Não foi possível carregar os pontos de Wi-Fi.');
      }
      return response.json();
    })
    .then((data) => {
      if (!data?.pontos || !Array.isArray(data.pontos) || data.pontos.length === 0) {
        throw new Error('Nenhum ponto de Wi-Fi disponível.');
      }
      renderPoints(data.pontos);
    })
    .catch((error) => {
      console.error(error);
      sendError('Falha ao carregar os pontos de Wi-Fi. Tente novamente mais tarde.');
    });
}

function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(fallbackCenter);
      return;
    }

    let settled = false;
    const onSuccess = (position) => {
      if (settled) return;
      settled = true;
      resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
    };
    const onFailure = () => {
      if (settled) return;
      settled = true;
      resolve(fallbackCenter);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onFailure, { timeout: 4000 });
    setTimeout(() => onFailure(), 4200);
  });
}

function initMap(center) {
  const container = document.getElementById(MAP_CONTAINER_ID);
  map = L.map(container, {
    center: [center.lat, center.lng],
    zoom: 14,
    zoomControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(container);
  }

  window.addEventListener('resize', () => map.invalidateSize());
  loadPointsAndRender();
}

function initialize() {
  getUserLocation().then(initMap);
}

initialize();
