import { useEffect, useRef, useState } from 'react';
import type { Attraction } from '../types';
import './MapView.css';

declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: { securityJsCode: string };
  }
}

interface MapViewProps {
  userLocation: number[] | null;
  attractions: Attraction[];
  onAttractionClick: (attraction: Attraction) => void;
}

export default function MapView({
  userLocation,
  attractions,
  onAttractionClick,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const AMapLoader = await import('@amap/amap-jsapi-loader');
      window._AMapSecurityConfig = {
        securityJsCode: 'ac84cb27cdf872f3b8a0c644c7272351',
      };
      const AMap = await AMapLoader.default.load({
        key: '089304f00db3546bb73a3c8294c6733a',
        version: '2.0',
      });

      if (cancelled || !containerRef.current) return;

      const map = new AMap.Map(containerRef.current, {
        zoom: 15,
        center: userLocation || [116.397428, 39.908723],
      });
      mapRef.current = map;
      setLoading(false);
    }

    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    const AMap = window.AMap;
    if (!AMap) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = new AMap.Marker({
        position: userLocation,
      });
      mapRef.current.add(userMarkerRef.current);
    } else {
      userMarkerRef.current.setPosition(userLocation);
    }
  }, [userLocation]);

  useEffect(() => {
    if (!mapRef.current) return;
    const AMap = window.AMap;
    if (!AMap) return;

    markersRef.current.forEach((m) => mapRef.current.remove(m));
    markersRef.current = [];

    attractions.forEach((attraction) => {
      const marker = new AMap.Marker({
        position: attraction.location,
        title: attraction.name,
      });
      marker.on('click', () => onAttractionClick(attraction));
      mapRef.current.add(marker);
      markersRef.current.push(marker);
    });
  }, [attractions, onAttractionClick]);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    mapRef.current.setCenter(userLocation);
  }, [userLocation]);

  return (
    <div className="map-view">
      {loading && <div className="map-loading">地图加载中...</div>}
      <div id="map-container" ref={containerRef} className="map-container" />
    </div>
  );
}
