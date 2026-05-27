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

const AREA_COLORS: Record<string, string> = {
  gugong: '#c62828',
  yiheyuan: '#2e7d32',
  tiantan: '#1565c0',
  badaling: '#e65100',
};

function markerHtml(color: string, isOverview: boolean): string {
  const size = isOverview ? 18 : 12;
  const border = isOverview ? '3px solid #fff' : '2px solid #fff';
  const star = isOverview ? '★' : '';
  return `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:${border};box-shadow:0 0 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;">${star}</div>`;
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
  const amapRef = useRef<any>(null);
  const onAttractionClickRef = useRef(onAttractionClick);
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(true);

  onAttractionClickRef.current = onAttractionClick;

  // Phase 1: Load AMap SDK (don't create map yet)
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const AMapLoader = await import('@amap/amap-jsapi-loader');
      window._AMapSecurityConfig = {
        securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE,
      };
      const AMap = await AMapLoader.default.load({
        key: import.meta.env.VITE_AMAP_KEY,
        version: '2.0',
      });

      if (cancelled || !containerRef.current) return;
      amapRef.current = AMap;
      setSdkReady(true);
    }

    init();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  const infoWindowRef = useRef<any>(null);

  const closeInfoWindow = () => {
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }
  };

  // Shared helper: create attraction markers on a map
  const addAttractionMarkers = (map: any, AMap: any) => {
    markersRef.current.forEach((m) => map.remove(m));
    markersRef.current = [];
    attractions.forEach((attraction) => {
      const color = AREA_COLORS[attraction.areaId] || '#1a73e8';
      const isOverview = attraction.id.endsWith('-overview');
      const marker = new AMap.Marker({
        position: attraction.location,
        title: attraction.name,
        content: markerHtml(color, isOverview),
        offset: new AMap.Pixel(isOverview ? -11 : -8, isOverview ? -11 : -8),
      });
      marker.on('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
          infoWindowRef.current = null;
        }
        const btnId = `iw-btn-${attraction.id}`;
        const content = `<div style="padding:8px 12px;min-width:120px;text-align:center;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#333;">${attraction.name}</p>
          <button id="${btnId}" style="padding:6px 20px;background:#1a73e8;color:#fff;border:none;border-radius:14px;font-size:13px;cursor:pointer;">开始讲解</button>
        </div>`;
        const infoWindow = new AMap.InfoWindow({
          content,
          offset: new AMap.Pixel(0, -36),
        });
        infoWindow.open(map, marker.getPosition());
        infoWindowRef.current = infoWindow;

        // Bind click after InfoWindow DOM is rendered
        setTimeout(() => {
          const btn = document.getElementById(btnId);
          if (btn) {
            btn.onclick = () => {
              infoWindow.close();
              infoWindowRef.current = null;
              onAttractionClickRef.current(attraction);
            };
          }
        }, 0);
      });
      map.add(marker);
      markersRef.current.push(marker);
    });
  };

  // Phase 2: GPS arrives — create map or update existing one
  useEffect(() => {
    if (!sdkReady || !userLocation || !amapRef.current) return;

    const AMap = amapRef.current;

    if (mapRef.current) {
      // Map was pre-created by timeout at default center — destroy and rebuild at GPS
      mapRef.current.destroy();
      markersRef.current = [];
      userMarkerRef.current = null;

      const map = new AMap.Map(containerRef.current, {
        zoom: 15,
        center: userLocation,
      });
      mapRef.current = map;
      map.on('click', closeInfoWindow);

      userMarkerRef.current = new AMap.Marker({
        position: userLocation,
        content:
          '<div style="background:#1a73e8;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px rgba(26,115,232,0.5),0 2px 6px rgba(0,0,0,0.2);"></div>',
        offset: new AMap.Pixel(-10, -10),
      });
      map.add(userMarkerRef.current);
      addAttractionMarkers(map, AMap);
      setLoading(false);
      return;
    }

    // Happy path: create map directly at GPS location
    const map = new AMap.Map(containerRef.current, {
      zoom: 15,
      center: userLocation,
    });
    mapRef.current = map;
    map.on('click', closeInfoWindow);

    userMarkerRef.current = new AMap.Marker({
      position: userLocation,
      content:
        '<div style="background:#1a73e8;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px rgba(26,115,232,0.5),0 2px 6px rgba(0,0,0,0.2);"></div>',
      offset: new AMap.Pixel(-10, -10),
    });
    map.add(userMarkerRef.current);
    addAttractionMarkers(map, AMap);
    setLoading(false);
  }, [sdkReady, userLocation]);

  // Timeout: pre-create map at default center if GPS is slow (keep overlay)
  useEffect(() => {
    if (!sdkReady || !amapRef.current || !loading) return;
    const t = setTimeout(() => {
      if (mapRef.current) return; // Phase 2 beat us to it

      const AMap = amapRef.current;
      const map = new AMap.Map(containerRef.current, {
        zoom: 15,
        center: [116.397428, 39.908723],
      });
      mapRef.current = map;
      map.on('click', closeInfoWindow);
      addAttractionMarkers(map, AMap);
      // loading stays true — wait for Phase 2 to reveal
    }, 8000);
    return () => clearTimeout(t);
  }, [sdkReady, loading, attractions]);

  // Ultimate fallback: reveal map after long wait even without GPS
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 20000);
    return () => clearTimeout(t);
  }, [loading]);

  // Keep user marker in sync when location updates after initial creation
  useEffect(() => {
    if (!mapRef.current || !userLocation || !userMarkerRef.current) return;
    userMarkerRef.current.setPosition(userLocation);
  }, [userLocation]);

  // Recreate attraction markers when attractions list changes
  useEffect(() => {
    if (!mapRef.current) return;
    addAttractionMarkers(mapRef.current, window.AMap);
  }, [attractions, onAttractionClick]);

  return (
    <div className="map-view">
      {loading && (
        <div className="map-loading">
          {!sdkReady ? '地图加载中...' : '定位中...'}
        </div>
      )}
      <div id="map-container" ref={containerRef} className="map-container" />
    </div>
  );
}
