import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
  location: number[] | null; // [lng, lat]
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ location: null, error: '设备不支持定位', loading: false });
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          location: [pos.coords.longitude, pos.coords.latitude],
          error: null,
          loading: false,
        });
      },
      (err) => {
        let msg = '定位失败';
        if (err.code === 1) msg = '请开启位置权限';
        if (err.code === 2) msg = '无法获取位置信息';
        if (err.code === 3) msg = '定位超时';
        setState((s) => ({ ...s, error: msg, loading: false }));
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return { ...state, refresh, clearError };
}
