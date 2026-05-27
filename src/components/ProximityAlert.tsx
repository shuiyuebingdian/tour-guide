import type { Attraction } from '../types';
import './ProximityAlert.css';

interface ProximityAlertProps {
  attraction: Attraction;
  distance: number;
  onPlay: (attraction: Attraction) => void;
  onDismiss: () => void;
}

export default function ProximityAlert({
  attraction,
  distance,
  onPlay,
  onDismiss,
}: ProximityAlertProps) {
  const distText =
    distance < 1000
      ? `${Math.round(distance)}m`
      : `${(distance / 1000).toFixed(1)}km`;

  return (
    <div className="proximity-alert">
      <div className="proximity-alert-content">
        <div className="proximity-alert-info">
          <span className="proximity-alert-label">你已进入</span>
          <h3 className="proximity-alert-name">{attraction.name}</h3>
          <span className="proximity-alert-distance">距你 {distText}</span>
        </div>
        <div className="proximity-alert-actions">
          <button
            className="proximity-alert-play"
            onClick={() => onPlay(attraction)}
          >
            开始讲解
          </button>
          <button
            className="proximity-alert-close"
            onClick={onDismiss}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
