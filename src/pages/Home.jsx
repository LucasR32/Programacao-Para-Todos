import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import TrailCard from '../components/TrailCard.jsx';
import '../styles/index.css';

const fallbackCenter = { lat: -23.5325, lng: -46.731 };

function normalizeWifiPoint(point, index) {
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    id: point?.id || `ponto-wifi-${index}`,
    nome: point?.nome || point?.title || 'Ponto de Wi-Fi',
    lat,
    lng,
  };
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

function TrailCardSkeleton() {
  return (
    <article className="trail-card skeleton">
      <div className="trail-icon"></div>
      <div className="trail-content">
        <div className="skeleton-line title"></div>
        <div className="skeleton-line text"></div>
        <div className="skeleton-line text"></div>
        <div className="trail-meta">
          <span className="skeleton-line badge"></span>
          <span className="skeleton-line badge"></span>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [trilhas, setTrilhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wifiPoints, setWifiPoints] = useState([]);
  const [wifiError, setWifiError] = useState(null);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const wifiMarkersRef = useRef([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchTrailTopicsCount(trail) {
      try {
        const response = await fetch(`/api/trilha?id=${trail.id}`, { cache: 'no-store' });

        if (!response.ok) {
          return '?';
        }

        const data = await response.json();
        return Array.isArray(data) ? data.length : '?';
      } catch {
        return '?';
      }
    }

    async function loadTrails() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/trilhas', { cache: 'no-store' });

        if (!response.ok) {
          throw new Error('Não foi possível carregar as trilhas.');
        }

        const trails = await response.json();

        if (!Array.isArray(trails) || trails.length === 0) {
          throw new Error('Nenhuma trilha disponível.');
        }

        const counts = await Promise.all(trails.map((trail) => fetchTrailTopicsCount(trail)));
        const trailsWithCounts = trails.map((trail, index) => ({
          ...trail,
          topicsCount: counts[index],
        }));

        if (isMounted) {
          setTrilhas(trailsWithCounts);
        }
      } catch (fetchError) {
        console.error(fetchError);

        if (isMounted) {
          setTrilhas([]);
          setError('Houve um problema ao carregar as trilhas. Tente novamente mais tarde.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTrails();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) {
      return undefined;
    }

    const map = L.map(mapRef.current, {
      center: [fallbackCenter.lat, fallbackCenter.lng],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    leafletMapRef.current = map;

    return () => {
      wifiMarkersRef.current.forEach((marker) => marker.remove());
      wifiMarkersRef.current = [];
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadHomeWifiPoints() {
      try {
        setWifiError(null);
        const points = await loadWifiPoints();

        if (isMounted) {
          setWifiPoints(points);
        }
      } catch (fetchError) {
        console.error(fetchError);

        if (isMounted) {
          setWifiPoints([]);
          setWifiError('Falha ao carregar os pontos de Wi-Fi. Tente novamente mais tarde.');
        }
      }
    }

    loadHomeWifiPoints();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!leafletMapRef.current) {
      return;
    }

    wifiMarkersRef.current.forEach((marker) => marker.remove());
    wifiMarkersRef.current = wifiPoints.map((point) => {
      const marker = L.marker([point.lat, point.lng]).addTo(leafletMapRef.current);
      marker.bindPopup(`<strong>${point.nome}</strong>`);
      return marker;
    });
  }, [wifiPoints]);

  return (
    <main>
      <section className="hero">
        <div className="container hero-content">
          <div>
            <p className="eyebrow">Educação técnica com foco comunitário</p>
            <h1>Trilhas de programação claras para começar hoje.</h1>
            <p className="hero-text">
              Aprenda frontend, backend e banco de dados com aplicações reais, orientação direta e suporte a conexões
              lentas.
            </p>
            <a className="button button-primary" href="#trilhas">
              Ver trilhas
            </a>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-card">HTML</div>
            <div className="hero-card hero-card-large">JS</div>
            <div className="hero-card hero-card-small">API</div>
          </div>
        </div>
      </section>

      <section id="trilhas" className="section-trails">
        <div className="container">
          <div className="section-header">
            <p className="eyebrow">Trilhas disponíveis</p>
            <h2>Escolha a sua trilha e avance com confiança</h2>
          </div>
          <div id="trails-grid" className="trails-grid" aria-live="polite">
            {loading && [0, 1, 2].map((item) => <TrailCardSkeleton key={item} />)}
            {!loading &&
              !error &&
              trilhas.map((trail) => <TrailCard key={trail.id} trail={trail} topicsCount={trail.topicsCount} />)}
          </div>
          <div id="trails-error" className="fetch-error" hidden={!error}>
            {error}
          </div>
        </div>
      </section>

      <section id="sobre" className="section-about">
        <div className="container">
          <div className="section-header">
            <p className="eyebrow">Sobre o projeto</p>
            <h2>Um laboratório de aprendizado para estudantes locais</h2>
          </div>
          <p>
            O PPT oferece trilhas de programação gratuitas para estudantes da Escola Estadual Tito Prates da Fonseca e
            da comunidade local, em parceria com o programa Conectados pela Comunidade do SENAI. Nosso objetivo é levar
            habilidades digitais e acesso a conteúdo técnico de qualidade para quem está começando.
          </p>
        </div>
      </section>

      <section className="section-map">
        <div className="container">
          <div className="section-header">
            <p className="eyebrow">Mapa de Wi-Fi</p>
            <h2>Pontos de acesso gratuitos próximos</h2>
          </div>
          <div ref={mapRef} className="map-frame" id="map-embed" aria-label="Mapa de pontos de Wi-Fi gratuito"></div>
          <div className="fetch-error" hidden={!wifiError}>
            {wifiError}
          </div>
          <p className="map-link">
            <a href="/mapa">Ver página dedicada do mapa</a>
          </p>
        </div>
      </section>
    </main>
  );
}
