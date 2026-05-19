import { useState, useCallback, useRef } from 'react';

export type SpeechState = 'idle' | 'playing' | 'paused';

interface UseSpeechOptions {
  rate?: number;
  onEnd?: () => void;
  onBoundary?: (charIndex: number) => void;
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const { rate = 0.9, onEnd, onBoundary } = options;
  const [state, setState] = useState<SpeechState>('idle');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textRef = useRef<string>('');

  const speak = useCallback(
    (text: string, startFrom = 0) => {
      window.speechSynthesis.cancel();
      textRef.current = text;

      const utterance = new SpeechSynthesisUtterance(text.slice(startFrom));
      utterance.lang = 'zh-CN';
      utterance.rate = rate;

      utterance.onboundary = (e) => {
        if (e.charIndex !== undefined) {
          setCurrentCharIndex(startFrom + e.charIndex);
          onBoundary?.(startFrom + e.charIndex);
        }
      };

      utterance.onend = () => {
        setState('idle');
        setCurrentCharIndex(0);
        onEnd?.();
      };

      utterance.onerror = () => {
        setState('idle');
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setState('playing');
    },
    [rate, onEnd, onBoundary],
  );

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setState('paused');
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setState('playing');
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setState('idle');
    setCurrentCharIndex(0);
  }, []);

  const setRate = useCallback(
    (_newRate: number) => {
      options.rate = _newRate;
    },
    [],
  );

  return { state, currentCharIndex, speak, pause, resume, stop, setRate };
}
