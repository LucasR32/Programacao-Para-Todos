import { Link } from 'react-router-dom';

export default function TrailCard({ trail, topicsCount }) {
  return (
    <article className="trail-card">
      <div className="trail-icon">{trail.icone}</div>
      <div className="trail-content">
        <h3>{trail.titulo}</h3>
        <p>{trail.descricao}</p>
        <div className="trail-details">
          <span>Nível inicial: Iniciante</span>
          <span>{topicsCount} tópicos</span>
        </div>
        <Link className="button button-secondary" to={`/trilha?id=${trail.id}`}>
          Ver trilha
        </Link>
      </div>
    </article>
  );
}
