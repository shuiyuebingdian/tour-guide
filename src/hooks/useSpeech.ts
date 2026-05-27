import { useState, useCallback, useRef, useEffect } from 'react';

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
  const charIndexRef = useRef(0);
  const stateRef = useRef<SpeechState>('idle');
  const onEndRef = useRef(onEnd);
  const onBoundaryRef = useRef(onBoundary);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);
  useEffect(() => { onBoundaryRef.current = onBoundary; }, [onBoundary]);

  // Preload voices — load eagerly and listen for async changes
  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) voicesRef.current = v;
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () =>
      window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const pickVoice = (): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current.length
      ? voicesRef.current
      : window.speechSynthesis.getVoices();
    const zhCN = voices.find((v) => v.lang === 'zh-CN' && v.localService);
    if (zhCN) return zhCN;
    const zh = voices.find((v) => v.lang.startsWith('zh') && v.localService);
    if (zh) return zh;
    const any = voices.find((v) => v.lang.startsWith('zh'));
    return any || null;
  };

  // Re-speak from current position when rate changes during playback
  useEffect(() => {
    if (stateRef.current !== 'playing' || !textRef.current) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      textRef.current.slice(charIndexRef.current),
    );
    utterance.lang = 'zh-CN';
    utterance.rate = rate;
    const voice = pickVoice();
    if (voice) utterance.voice = voice;

    utterance.onboundary = (e) => {
      if (e.charIndex !== undefined) {
        const idx = charIndexRef.current + e.charIndex;
        setCurrentCharIndex(idx);
        onBoundaryRef.current?.(idx);
      }
    };

    utterance.onend = () => {
      setState('idle');
      setCurrentCharIndex(0);
      onEndRef.current?.();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled') setState('idle');
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [rate]);

  const speak = useCallback(
    (text: string, startFrom = 0) => {
      // Only cancel if there's an active utterance to avoid Chrome bug
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
      textRef.current = text;
      charIndexRef.current = startFrom;

      const utterance = new SpeechSynthesisUtterance(text.slice(startFrom));
      utterance.lang = 'zh-CN';
      utterance.rate = rate;
      const voice = pickVoice();
      if (voice) utterance.voice = voice;

      utterance.onboundary = (e) => {
        if (e.charIndex !== undefined) {
          const idx = startFrom + e.charIndex;
          setCurrentCharIndex(idx);
          charIndexRef.current = idx;
          onBoundary?.(idx);
        }
      };

      utterance.onend = () => {
        setState('idle');
        setCurrentCharIndex(0);
        utteranceRef.current = null;
        onEnd?.();
      };

      utterance.onerror = (e) => {
        if (e.error !== 'canceled') setState('idle');
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
    utteranceRef.current = null;
    setState('idle');
    setCurrentCharIndex(0);
  }, []);

  return { state, currentCharIndex, speak, pause, resume, stop };
}
