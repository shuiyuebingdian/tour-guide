import { useEffect, useRef } from 'react';

interface MediaSessionInfo {
  title: string;
  artist: string;
  state: 'playing' | 'paused' | 'idle';
}

interface MediaSessionActions {
  onPlay: () => void;
  onPause: () => void;
  onPrevTrack: (() => void) | null;
  onNextTrack: (() => void) | null;
  onStop: () => void;
}

export function useMediaSession(
  info: MediaSessionInfo,
  actions: MediaSessionActions,
) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: info.title,
      artist: info.artist,
      album: '随身导游',
    });

    navigator.mediaSession.playbackState =
      info.state === 'playing' ? 'playing' : 'paused';
  }, [info.title, info.artist, info.state]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const handler = () => actionsRef.current.onPlay();
    navigator.mediaSession.setActionHandler('play', handler);
    return () => {
      navigator.mediaSession.setActionHandler('play', null);
    };
  }, []);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const handler = () => actionsRef.current.onPause();
    navigator.mediaSession.setActionHandler('pause', handler);
    return () => {
      navigator.mediaSession.setActionHandler('pause', null);
    };
  }, []);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (actions.onPrevTrack) {
      const handler = () => actionsRef.current.onPrevTrack?.();
      navigator.mediaSession.setActionHandler('previoustrack', handler);
      return () => {
        navigator.mediaSession.setActionHandler('previoustrack', null);
      };
    }
  }, [actions.onPrevTrack]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (actions.onNextTrack) {
      const handler = () => actionsRef.current.onNextTrack?.();
      navigator.mediaSession.setActionHandler('nexttrack', handler);
      return () => {
        navigator.mediaSession.setActionHandler('nexttrack', null);
      };
    }
  }, [actions.onNextTrack]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const handler = () => actionsRef.current.onStop();
    navigator.mediaSession.setActionHandler('stop', handler);
    return () => {
      navigator.mediaSession.setActionHandler('stop', null);
    };
  }, []);
}
