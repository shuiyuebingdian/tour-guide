import { useState, useCallback, useEffect } from 'react';
import type { Attraction } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { usePlayHistory } from '../hooks/usePlayHistory';
import './PlayerView.css';

interface PlayerViewProps {
  attraction: Attraction;
  onBack: () => void;
  onComplete: () => void;
}

export default function PlayerView({
  attraction,
  onBack,
  onComplete,
}: PlayerViewProps) {
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [rate, setRate] = useState(0.9);
  const { markPlayed } = usePlayHistory();

  const handleSegmentEnd = useCallback(() => {
    if (segmentIndex < attraction.segments.length - 1) {
      setSegmentIndex((i) => i + 1);
    } else {
      markPlayed(attraction.id);
      onComplete();
    }
  }, [segmentIndex, attraction, markPlayed, onComplete]);

  const { state, speak, pause, resume, stop } = useSpeech({
    rate,
    onEnd: handleSegmentEnd,
  });

  const segment = attraction.segments[segmentIndex];

  useEffect(() => {
    if (segment) {
      speak(segment.text);
    }
    return () => { stop(); };
  }, [segmentIndex]);

  const handlePlayPause = () => {
    if (state === 'playing') pause();
    else if (state === 'paused') resume();
    else speak(segment.text);
  };

  const handleNext = () => {
    stop();
    if (segmentIndex < attraction.segments.length - 1) {
      setSegmentIndex((i) => i + 1);
    } else {
      markPlayed(attraction.id);
      onComplete();
    }
  };

  const handlePrev = () => {
    stop();
    if (segmentIndex > 0) {
      setSegmentIndex((i) => i - 1);
    }
  };

  return (
    <div className="player-view">
      <header className="player-header">
        <button className="player-back" onClick={onBack}>← 返回</button>
        <div className="player-title">
          <h2>{attraction.name}</h2>
          {segment.heading && <span className="segment-heading">{segment.heading}</span>}
        </div>
      </header>

      <div className="player-image-area">
        {attraction.image ? (
          <img src={attraction.image} alt={attraction.name} className="player-image" />
        ) : (
          <div className="player-image-placeholder">🏛️</div>
        )}
      </div>

      <div className="player-text">
        <p>{segment.text}</p>
      </div>

      <div className="player-segment-indicator">
        {attraction.segments.map((_, i) => (
          <span
            key={i}
            className={`dot ${i === segmentIndex ? 'dot-active' : ''} ${i < segmentIndex ? 'dot-done' : ''}`}
          />
        ))}
      </div>

      <div className="player-controls">
        <button onClick={handlePrev} disabled={segmentIndex === 0}>⏮</button>
        <button className="btn-play" onClick={handlePlayPause}>
          {state === 'playing' ? '⏸' : '▶'}
        </button>
        <button onClick={handleNext}>⏭</button>
      </div>

      <div className="player-rate">
        <label>语速: </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
        />
        <span>{rate}x</span>
      </div>
    </div>
  );
}
