import type { ScenicArea } from '../types';
import './AreaCard.css';

interface AreaCardProps {
  area: ScenicArea;
  distance: number;
  attractionCount: number;
  onClick: () => void;
}

export default function AreaCard({
  area,
  distance,
  attractionCount,
  onClick,
}: AreaCardProps) {
  const distStr = distance >= 1000 ? `${(distance / 1000).toFixed(1)}km` : `${Math.round(distance)}m`;

  return (
    <div className="area-card" onClick={onClick}>
      <div className="area-card-icon">{area.icon}</div>
      <div className="area-card-info">
        <span className="area-card-name">{area.name}</span>
        <span className="area-card-meta">
          {distStr} · {attractionCount} 个景点
        </span>
      </div>
      <span className="area-card-arrow">›</span>
    </div>
  );
}
