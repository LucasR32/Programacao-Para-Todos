const MAP_CONTAINER_ID = 'mapa-container';
const POINTS_LIST_ID = 'pontos-list';
const GOOGLE_MAPS_API_KEY_META = 'google-maps-api-key';
const fallbackCenter = { lat: -23.5325, lng: -46.7310 };
let map;
let infoWindow;
let markers = new Map();
let activeListItem = null;

function getApiKey() {
  const meta = document.querySelector(`meta[name="${GOOGLE_MAPS_API_KEY_META}"]`);
  return meta?.content?.trim() || '';
}

function sendError(message) {
  const list = document.getElementById(POINTS_LIST_ID);
  list.innerHTML = `<div class="ponto-item error-text">${message}</div>`;
}

function buildRouteUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
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

function createInfoWindowContent(point) {
  return `
    <div style="max-width:240px; font-family: 'IBM Plex Sans', system-ui, sans-serif;">
      <h3 style="margin:0 0 8px; font-size:1rem;">${point.nome}</h3>
      <p style="margin:0 0 6px; color:#334155; font-size:0.95rem;">${point.endereco}</p>
      <p style="margin:0 0 6px; font-size:0.9rem; color:#475569;"><strong>Tipo:</strong> ${point.tipo}</p>
      <p style="margin:0; font-size:0.9rem; color:#475569;"><strong>Horário:</strong> ${point.horario}</p>
    </div>
  `;
}

function openInfoWindow(pointId) {
  const marker = markers.get(pointId);
  if (!marker) return;
  const point = marker.pointData;
  infoWindow.setContent(createInfoWindowContent(point));
  infoWindow.open(map, marker);
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
  item.addEventListener('click', () => openInfoWindow(point.id));
  return item;
}

function createMarker(point) {
  const icon = {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
        <path fill="#2563eb" d="M12 2C8.13 2 5 5.13 5 9c0 4.88 5.14 10.64 6.17 11.77.39.4 1.02.4 1.41 0C13.86 19.64 19 13.88 19 9c0-3.87-3.13-7-7-7zM12 12.5c-1.93 0-3.5-1.57-3.5-3.5S10.07 5.5 12 5.5s3.5 1.57 3.5 3.5S13.93 12.5 12 12.5z"/>
      </svg>`),
    scaledSize: new google.maps.Size(36, 36),
    anchor: new google.maps.Point(18, 36)
  };

  const marker = new google.maps.Marker({
    position: { lat: point.lat, lng: point.lng },
    map,
    icon,
    title: point.nome
  });
  marker.pointData = point;
  marker.addListener('click', () => {
    openInfoWindow(point.id);
  });
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
    openInfoWindow(points[0].id);
  }
}

function loadPointsAndRender() {
  fetch('/data/pontos-wifi.json', { cache: 'no-store' })
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
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        resolve(fallbackCenter);
      },
      { timeout: 4000 }
    );
  });
}

function initMap(center) {
  const container = document.getElementById(MAP_CONTAINER_ID);
  map = new google.maps.Map(container, {
    center,
    zoom: 14,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false
  });
  infoWindow = new google.maps.InfoWindow();
  loadPointsAndRender();
}

function loadGoogleMapsScript(apiKey) {
  window.initMap = async () => {
    const center = await getUserLocation();
    initMap(center);
  };

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=initMap`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

function initialize() {
  const apiKey = getApiKey();
  if (!apiKey) {
    sendError('Chave da API do Google Maps não configurada.');
    return;
  }
  loadGoogleMapsScript(apiKey);
}

initialize();
