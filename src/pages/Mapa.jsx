import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/mapa.css';

const fallbackCenter = { lat: -23.5325, lng: -46.731 };

function buildRouteUrl(lat, lng) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
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

function normalizeWifiPoint(point, index) {
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    id: point?.id || `ponto-wifi-${index}`,
    nome: point?.nome || point?.title || 'Ponto de Wi-Fi',
    endereco: point?.endereco || 'Endereço não informado',
    tipo: point?.tipo || 'outro',
    horario: point?.horario || 'Horário não informado',
    lat,
    lng,
  };
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

async function loadWifiPoints() {
  const response = await fetch('/api/pontos-wifi', { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('Não foi possível carregar os pontos de Wi-Fi.');
  }

  const data = await response.json();

  const points = Array.isArray(data?.pontos) ? data.pontos.map(normalizeWifiPoint).filter(Boolean) : [];

  if (points.length === 0) {
    throw new Error('Nenhum ponto de Wi-Fi disponível.');
  }

  return points;
}

export default function Mapa() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const resizeObserverRef = useRef(null);
  const pointRefs = useRef(new Map());
  const [points, setPoints] = useState([]);
  const [activePointId, setActivePointId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'PPT | Pontos de Wi-Fi Gratuito';
  }, []);

  useEffect(() => {
    let cancelled = false;
    let resizeHandler = null;

    async function initializeMap() {
      try {
        setLoading(true);
        setError(null);
        const [center, wifiPoints] = await Promise.all([getUserLocation(), loadWifiPoints()]);

        if (cancelled || !mapContainerRef.current) {
          return;
        }

        const map = L.map(mapContainerRef.current, {
          center: [center.lat, center.lng],
          zoom: 14,
          zoomControl: true,
        });

        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        wifiPoints.forEach((point) => {
          const marker = L.marker([point.lat, point.lng]).addTo(map);

          marker.bindPopup(createPopupContent(point), {
            maxWidth: 280,
            autoClose: false,
            closeOnClick: false,
            closeButton: true,
          });

          marker.on('popupopen', () => {
            setActivePointId(point.id);
          });

          marker.pointId = point.id;
          markersRef.current.set(point.id, marker);
        });

        if (window.ResizeObserver) {
          resizeObserverRef.current = new ResizeObserver(() => map.invalidateSize());
          resizeObserverRef.current.observe(mapContainerRef.current);
        }

        resizeHandler = () => map.invalidateSize();
        window.addEventListener('resize', resizeHandler);

        setPoints(wifiPoints);
        setActivePointId(wifiPoints[0].id);
        markersRef.current.get(wifiPoints[0].id)?.openPopup();
      } catch (mapError) {
        if (!cancelled) {
          console.error(mapError);
          setError('Falha ao carregar os pontos de Wi-Fi. Tente novamente mais tarde.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initializeMap();

    return () => {
      cancelled = true;

      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      markersRef.current.clear();

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!activePointId) {
      return;
    }

    const activeItem = pointRefs.current.get(activePointId);

    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activePointId]);

  function openMarkerPopup(pointId) {
    const marker = markersRef.current.get(pointId);

    if (!marker) {
      return;
    }

    marker.openPopup();
    setActivePointId(pointId);
  }

  return (
    <main className="mapa-page">
      <section className="hero">
        <h1>Pontos de Wi-Fi Gratuito</h1>
        <p>Encontre locais com internet gratuita na região para estudar programação fora da escola.</p>
      </section>

      <section className="content-grid">
        <div className="map-layout">
          <div className="map-panel">
            <div ref={mapContainerRef} id="mapa-container"></div>
          </div>
          <aside className="sidebar" aria-label="Lista de pontos de Wi-Fi gratuito">
            <h2>Pontos de Wi-Fi</h2>
            <div id="pontos-list">
              {loading && <div className="ponto-item">Carregando pontos de Wi-Fi...</div>}
              {error && <div className="ponto-item error-text">{error}</div>}
              {!loading &&
                !error &&
                points.map((point) => (
                  <article
                    key={point.id}
                    ref={(element) => {
                      if (element) {
                        pointRefs.current.set(point.id, element);
                      } else {
                        pointRefs.current.delete(point.id);
                      }
                    }}
                    className={`ponto-item${activePointId === point.id ? ' active' : ''}`}
                    data-point-id={point.id}
                    onClick={() => openMarkerPopup(point.id)}
                  >
                    <h3>{point.nome}</h3>
                    <p>{point.endereco}</p>
                    <div className="ponto-meta">
                      <span>Tipo: {point.tipo}</span>
                      <span>Horário: {point.horario}</span>
                    </div>
                    <a
                      className="btn-route"
                      href={buildRouteUrl(point.lat, point.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Como chegar
                    </a>
                  </article>
                ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
