import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Attraction } from './types';
import { useGeolocation } from './hooks/useGeolocation';
import { useNearbyAttractions } from './hooks/useNearbyAttractions';
import { useProximityAlert, clearAlertHistory } from './hooks/useProximityAlert';
import { clearPlayHistory } from './hooks/usePlayHistory';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useAutoPlayPreference } from './hooks/useAutoPlayPreference';
import { useTriggerDistance } from './hooks/useTriggerDistance';
import { useWakeLock } from './hooks/useWakeLock';
import NetworkToast from './components/NetworkToast';
import { haversineDistance, wgs84ToGcj02 } from './utils/geo';
import MapView from './components/MapView';
import AreaCard from './components/AreaCard';
import ProximityAlert from './components/ProximityAlert';
import PlayerView from './components/PlayerView';
import ListView from './components/ListView';
import citiesData from './data/cities.json';
import areasData from './data/areas.json';
import beijingAttractions from './data/attractions/beijing.json';
import './App.css';

type View = 'map' | 'list' | 'player';

const overviewAttractions: Attraction[] = areasData.map((area) => ({
  id: `${area.id}-overview`,
  name: `${area.name}（概览）`,
  areaId: area.id,
  location: area.center,
  radius: area.radius,
  image: '',
  segments: area.overviewSegments,
}));

const allAttractions: Attraction[] = [...overviewAttractions, ...beijingAttractions];
const DEFAULT_CENTER = citiesData[0]?.center || [116.397428, 39.908723];

function App() {
  const [view, setView] = useState<View>('map');
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const { location, error, refresh, clearError } = useGeolocation();
  const [triggerDistance, setTriggerDistance] = useTriggerDistance();
  const [wakeLockEnabled, setWakeLockEnabled] = useWakeLock();
  const { unplayedNearby } = useNearbyAttractions(location, allAttractions, triggerDistance);

  // Debug helpers — type `__toGcj02()` in Console to see converted coords
  useEffect(() => {
    window.__attractions = allAttractions;
    window.__areas = areasData;
    window.__wgs84ToGcj02 = wgs84ToGcj02;
  }, []);

  const handleProximityPlay = useCallback((attraction: Attraction) => {
    setSelectedAttraction(attraction);
    setView('player');
  }, []);

  const { status: alertStatus, target: alertTarget, dismiss, markTriggered } =
    useProximityAlert({ unplayedNearby, onPlay: handleProximityPlay });

  const [autoPlay, setAutoPlay] = useAutoPlayPreference();

  // Auto-trigger play when autoPlay is enabled
  useEffect(() => {
    if (autoPlay && alertStatus === 'alerting' && alertTarget) {
      markTriggered();
    }
  }, [autoPlay, alertStatus, alertTarget, markTriggered]);

  const { isOnline, wasOffline } = useNetworkStatus();
  const [networkToast, setNetworkToast] = useState<'offline' | 'online' | null>(null);
  const initialOfflineRef = useRef(true);

  useEffect(() => {
    if (initialOfflineRef.current) {
      initialOfflineRef.current = false;
      return;
    }
    if (!isOnline) {
      setNetworkToast('offline');
    } else if (wasOffline) {
      setNetworkToast('online');
    }
  }, [isOnline, wasOffline]);

  // Compute nearest areas for bottom cards (by area center distance)
  const nearbyAreas = useMemo(() => {
    const center = location || DEFAULT_CENTER;
    return [...areasData]
      .map((area) => ({
        area,
        distance: haversineDistance(center, area.center),
        attractionCount: allAttractions.filter(
          (a) => a.areaId === area.id && !a.id.endsWith('-overview'),
        ).length,
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [location, allAttractions]);

  const handleAreaClick = useCallback((areaId: string) => {
    setSelectedAreaId(areaId);
    setView('map');
  }, []);

  const handleAreaBack = useCallback(() => {
    setSelectedAreaId(null);
  }, []);

  const handleAttractionClick = useCallback((attraction: Attraction) => {
    setSelectedAttraction(attraction);
    setView('player');
  }, []);

  const handlePlayerBack = useCallback(() => {
    setView('map');
    setSelectedAttraction(null);
  }, []);

  const handleComplete = useCallback(() => {
    setView('map');
    setSelectedAttraction(null);
  }, []);

  const handleClearHistory = useCallback(() => {
    if (!window.confirm('确定要清除今天的已听记录吗？')) return;
    clearPlayHistory();
    clearAlertHistory();
    // Force re-render so useNearbyAttractions and useProximityAlert pick up the cleared state
    setSelectedAttraction(null);
  }, []);

  return (
    <div className="app">
      {view === 'player' && selectedAttraction ? (
        <PlayerView
          attraction={selectedAttraction}
          onBack={handlePlayerBack}
          onComplete={handleComplete}
        />
      ) : (
        <>
          <main className="app-main">
            {view === 'map' ? (
              <div className="map-wrapper">
                <MapView
                  userLocation={location}
                  areas={areasData}
                  attractions={allAttractions}
                  selectedAreaId={selectedAreaId}
                  onAreaClick={handleAreaClick}
                  onAreaBack={handleAreaBack}
                  onAttractionClick={handleAttractionClick}
                />
                <div className="bottom-overlay">
                  {networkToast && (
                    <NetworkToast
                      type={networkToast}
                      onDone={() => setNetworkToast(null)}
                    />
                  )}
                  {alertStatus === 'alerting' && alertTarget && (
                    <ProximityAlert
                      attraction={alertTarget}
                      distance={haversineDistance(
                        location || DEFAULT_CENTER,
                        alertTarget.location,
                      )}
                      autoPlay={autoPlay}
                      onPlay={markTriggered}
                      onDismiss={dismiss}
                      onAutoPlayChange={setAutoPlay}
                    />
                  )}
                  {!selectedAreaId && nearbyAreas.length > 0 && (
                    <div className="bottom-cards">
                      {nearbyAreas.slice(0, 3).map(({ area, distance, attractionCount }) => (
                        <AreaCard
                          key={area.id}
                          area={area}
                          distance={distance}
                          attractionCount={attractionCount}
                          onClick={() => handleAreaClick(area.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {error && (
                  <div className="location-error">
                    <p>{error}</p>
                    <div className="location-error-actions">
                      <button className="btn-dismiss" onClick={clearError}>跳过</button>
                      <button className="btn-retry" onClick={refresh}>重试</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <ListView
                cities={citiesData}
                attractions={allAttractions}
                onAttractionClick={handleAttractionClick}
                onClearHistory={handleClearHistory}
                triggerDistance={triggerDistance}
                onTriggerDistanceChange={setTriggerDistance}
                wakeLockEnabled={wakeLockEnabled}
                onWakeLockChange={setWakeLockEnabled}
              />
            )}
          </main>

          <nav className="tab-bar">
            <button
              className={`tab ${view === 'map' ? 'tab-active' : ''}`}
              onClick={() => setView('map')}
            >
              🗺️ 地图
            </button>
            <button
              className={`tab ${view === 'list' ? 'tab-active' : ''}`}
              onClick={() => setView('list')}
            >
              📋 列表
            </button>
          </nav>
        </>
      )}
    </div>
  );
}

export default App;
