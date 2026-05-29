import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import TrailCard from '../components/TrailCard.jsx';
import '../styles/index.css';

const WIFI_POINTS = [
  { title: 'Escola Estadual Tito Prates da Fonseca', lat: -23.55052, lng: -46.633308 },
  { title: 'Praça Central', lat: -23.548, lng: -46.634 },
  { title: 'Biblioteca Comunitária', lat: -23.5495, lng: -46.6325 },
];

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
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);

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

    const center = { lat: -23.5325, lng: -46.731 };
    const map = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    WIFI_POINTS.forEach((point) => {
      const marker = L.marker([point.lat, point.lng]).addTo(map);

      if (point.title) {
        marker.bindPopup(`<strong>${point.title}</strong>`);
      }
    });

    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

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
            <h2>Um laboratório de aprendizado tech  para estudantes</h2>
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
          <p className="map-link">
            <a href="/mapa">Ver página dedicada do mapa</a>
          </p>
        </div>
      </section>
    </main>
  );
}
