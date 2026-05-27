import { useEffect, useRef } from 'react';
import './NetworkToast.css';

interface NetworkToastProps {
  type: 'offline' | 'online' | null;
  onDone: () => void;
}

export default function NetworkToast({ type, onDone }: NetworkToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!type) return;

    timerRef.current = setTimeout(() => {
      onDoneRef.current();
    }, 3000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [type]);

  if (!type) return null;

  const isOnline = type === 'online';

  return (
    <div className={`network-toast ${isOnline ? 'toast-online' : 'toast-offline'}`}>
      <span className="network-toast-icon">{isOnline ? '✅' : '⚠'}</span>
      <span className="network-toast-text">
        {isOnline ? '网络已恢复' : '当前离线 — 已缓存内容仍可浏览'}
      </span>
      <button
        className="network-toast-close"
        onClick={onDone}
        aria-label="关闭"
      >
        ✕
      </button>
    </div>
  );
}
