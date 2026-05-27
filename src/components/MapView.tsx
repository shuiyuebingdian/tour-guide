import { useEffect, useRef, useState } from 'react';
import type { Attraction, ScenicArea } from '../types';
import './MapView.css';

declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: { securityJsCode: string };
  }
}

interface MapViewProps {
  userLocation: number[] | null;
  areas: ScenicArea[];
  attractions: Attraction[];
  selectedAreaId: string | null;
  onAreaClick: (areaId: string) => void;
  onAreaBack: () => void;
  onAttractionClick: (attraction: Attraction) => void;
}

const AREA_COLORS: Record<string, string> = {
  gugong: '#c62828',
  yiheyuan: '#2e7d32',
  tiantan: '#1565c0',
  badaling: '#e65100',
};

function areaMarkerHtml(icon: string, name: string): string {
  return `<div style="text-align:center;pointer-events:none;">
    <div style="font-size:36px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${icon}</div>
    <div style="background:rgba(0,0,0,0.65);color:#fff;padding:2px 10px;border-radius:10px;font-size:12px;white-space:nowrap;margin-top:2px;font-weight:500;">${name}</div>
  </div>`;
}

function attractionMarkerHtml(color: string): string {
  return `<div style="background:${color};width:10px;height:10px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 6px rgba(0,0,0,0.3);"></div>`;
}

export default function MapView({
  userLocation,
  areas,
  attractions,
  selectedAreaId,
  onAreaClick,
  onAreaBack,
  onAttractionClick,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const areaMarkersRef = useRef<any[]>([]);
  const attractionMarkersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const amapRef = useRef<any>(null);
  const onAttractionClickRef = useRef(onAttractionClick);
  const onAreaClickRef = useRef(onAreaClick);
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const prevSelectedAreaRef = useRef<string | null>(null);

  onAttractionClickRef.current = onAttractionClick;
  onAreaClickRef.current = onAreaClick;

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

  const clearAreaMarkers = (map: any) => {
    areaMarkersRef.current.forEach((m) => map.remove(m));
    areaMarkersRef.current = [];
  };

  const clearAttractionMarkers = (map: any) => {
    attractionMarkersRef.current.forEach((m) => map.remove(m));
    attractionMarkersRef.current = [];
  };

  // Render scenic area markers (emoji icon + name label)
  const renderAreaMarkers = (map: any, AMap: any) => {
    clearAreaMarkers(map);
    areas.forEach((area) => {
      const marker = new AMap.Marker({
        position: area.center,
        title: area.name,
        content: areaMarkerHtml(area.icon, area.name),
        offset: new AMap.Pixel(0, -24),
        zIndex: 100,
      });
      marker.on('click', () => {
        closeInfoWindow();
        onAreaClickRef.current(area.id);
      });
      map.add(marker);
      areaMarkersRef.current.push(marker);
    });
  };

  // Render individual attraction markers for a specific area
  const renderAttractionMarkers = (map: any, AMap: any, areaId: string) => {
    clearAttractionMarkers(map);
    const areaAttractions = attractions.filter(
      (a) => a.areaId === areaId && !a.id.endsWith('-overview'),
    );
    areaAttractions.forEach((attraction) => {
      const color = AREA_COLORS[attraction.areaId] || '#1a73e8';
      const marker = new AMap.Marker({
        position: attraction.location,
        title: attraction.name,
        content: attractionMarkerHtml(color),
        label: {
          content: `<span style="font-size:11px;color:#333;background:rgba(255,255,255,0.85);padding:1px 6px;border-radius:4px;white-space:nowrap;">${attraction.name}</span>`,
          direction: 'top',
          offset: new AMap.Pixel(0, -14),
        },
        offset: new AMap.Pixel(-7, -7),
      });
      marker.on('click', () => {
        closeInfoWindow();
        const btnId = `iw-btn-${attraction.id}`;
        const content = `<div style="padding:8px 12px;min-width:120px;text-align:center;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#333;">${attraction.name}</p>
          <button id="${btnId}" style="padding:6px 20px;background:#1a73e8;color:#fff;border:none;border-radius:14px;font-size:13px;cursor:pointer;">开始讲解</button>
        </div>`;
        const infoWindow = new AMap.InfoWindow({
          content,
          offset: new AMap.Pixel(0, -24),
        });
        infoWindow.open(map, marker.getPosition());
        infoWindowRef.current = infoWindow;

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
      attractionMarkersRef.current.push(marker);
    });
  };

  // Phase 2: GPS arrives — create map or update existing one
  useEffect(() => {
    if (!sdkReady || !userLocation || !amapRef.current) return;

    const AMap = amapRef.current;

    if (mapRef.current) {
      // Map was pre-created by timeout at default center — destroy and rebuild at GPS
      mapRef.current.destroy();
      areaMarkersRef.current = [];
      attractionMarkersRef.current = [];
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
      renderAreaMarkers(map, AMap);
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
    renderAreaMarkers(map, AMap);
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
      renderAreaMarkers(map, AMap);
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

  // Handle area selection: zoom to area bounds and show attraction markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.AMap) return;

    const prev = prevSelectedAreaRef.current;
    prevSelectedAreaRef.current = selectedAreaId;

    if (selectedAreaId) {
      // Entering area detail view
      const area = areas.find((a) => a.id === selectedAreaId);
      if (!area) return;

      clearAreaMarkers(map);
      clearAttractionMarkers(map);
      closeInfoWindow();

      // Zoom to area bounds based on radius
      const center = new window.AMap.LngLat(area.center[0], area.center[1]);
      // Approximate: radius in meters → map zoom
      const zoomByRadius = (r: number) => {
        if (r <= 500) return 15;
        if (r <= 1000) return 14;
        if (r <= 2000) return 13;
        return 12;
      };
      map.setZoomAndCenter(zoomByRadius(area.radius), center);

      renderAttractionMarkers(map, window.AMap, selectedAreaId);
    } else if (prev && !selectedAreaId) {
      // Exiting area detail view — back to area overview
      clearAttractionMarkers(map);
      closeInfoWindow();
      renderAreaMarkers(map, window.AMap);

      // Zoom back out to show all areas
      if (userLocation) {
        map.setZoomAndCenter(13, userLocation);
      }
    }
  }, [selectedAreaId]);

  // Re-render area markers when areas list changes (and no area selected)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.AMap || selectedAreaId) return;
    renderAreaMarkers(map, window.AMap);
  }, [areas, selectedAreaId]);

  return (
    <div className="map-view">
      {loading && (
        <div className="map-loading">
          {!sdkReady ? '地图加载中...' : '定位中...'}
        </div>
      )}
      <div id="map-container" ref={containerRef} className="map-container" />
      {selectedAreaId && (
        <button className="map-zoom-out" onClick={onAreaBack}>
          ← 返回景区列表
        </button>
      )}
    </div>
  );
}
