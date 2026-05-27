import { useState, useCallback, useRef } from 'react';
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
  const [rate, setRate] = useState(1.0);
  const { markPlayed } = usePlayHistory();
  const speakRef = useRef<(text: string) => void>(() => {});
  const segments = attraction.segments;

  const handleSegmentEnd = useCallback(() => {
    setSegmentIndex((i) => {
      if (i < segments.length - 1) {
        const next = i + 1;
        // Use setTimeout to let React process the state update first
        setTimeout(() => speakRef.current(segments[next].text), 0);
        return next;
      } else {
        markPlayed(attraction.id);
        onComplete();
        return i;
      }
    });
  }, [segments, attraction.id, markPlayed, onComplete]);

  const { state: speechState, speak, pause, resume, stop, currentCharIndex } = useSpeech({
    rate,
    onEnd: handleSegmentEnd,
  });

  speakRef.current = speak;

  const segment = segments[segmentIndex];

  const handlePlayPause = () => {
    if (speechState === 'playing') pause();
    else if (speechState === 'paused') resume();
    else speak(segment.text);
  };

  const handleNext = () => {
    stop();
    if (segmentIndex < segments.length - 1) {
      const next = segmentIndex + 1;
      setSegmentIndex(next);
      setTimeout(() => speakRef.current(segments[next].text), 0);
    } else {
      markPlayed(attraction.id);
      onComplete();
    }
  };

  const handlePrev = () => {
    stop();
    if (segmentIndex > 0) {
      const prev = segmentIndex - 1;
      setSegmentIndex(prev);
      setTimeout(() => speakRef.current(segments[prev].text), 0);
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
        <p>
          {speechState !== 'idle' ? (
            <>
              <mark className="text-read">{segment.text.slice(0, currentCharIndex)}</mark>
              {segment.text.slice(currentCharIndex)}
            </>
          ) : (
            segment.text
          )}
        </p>
      </div>

      <div className="player-segment-indicator">
        {segments.map((_, i) => (
          <span
            key={i}
            className={`dot ${i === segmentIndex ? 'dot-active' : ''} ${i < segmentIndex ? 'dot-done' : ''}`}
          />
        ))}
      </div>

      <div className="player-controls">
        <button onClick={handlePrev} disabled={segmentIndex === 0}>⏮</button>
        <button className="btn-play" onClick={handlePlayPause}>
          {speechState === 'playing' ? '⏸' : '▶'}
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
