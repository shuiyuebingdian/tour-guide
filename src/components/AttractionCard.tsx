import type { Attraction } from '../types';
import './AttractionCard.css';

interface AttractionCardProps {
  attraction: Attraction;
  distance: number;
  isActive: boolean;
  onClick: (attraction: Attraction) => void;
}

export default function AttractionCard({
  attraction,
  distance,
  isActive,
  onClick,
}: AttractionCardProps) {
  const distText = distance < 1000
    ? `${Math.round(distance)}m`
    : `${(distance / 1000).toFixed(1)}km`;

  return (
    <div
      className={`attraction-card ${isActive ? 'card-active' : ''}`}
      onClick={() => onClick(attraction)}
    >
      <div className="card-info">
        <h3 className="card-name">{attraction.name}</h3>
        <span className="card-distance">距你 {distText}</span>
      </div>
      <button className="card-play-btn" aria-label="开始讲解">
        ▶
      </button>
    </div>
  );
}
