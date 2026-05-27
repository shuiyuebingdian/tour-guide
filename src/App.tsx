import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Attraction } from './types';
import { useGeolocation } from './hooks/useGeolocation';
import { useNearbyAttractions } from './hooks/useNearbyAttractions';
import { useProximityAlert } from './hooks/useProximityAlert';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useAutoPlayPreference } from './hooks/useAutoPlayPreference';
import NetworkToast from './components/NetworkToast';
import { haversineDistance } from './utils/geo';
import MapView from './components/MapView';
import AttractionCard from './components/AttractionCard';
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
  const { location, error, refresh, clearError } = useGeolocation();
  const { nearby, unplayedNearby } = useNearbyAttractions(location, allAttractions);

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

  const displayAttractions = useMemo(() => {
    if (nearby.length > 0) return nearby;
    // Fallback: sort all attractions by distance from default city center
    return [...allAttractions].sort(
      (a, b) =>
        haversineDistance(DEFAULT_CENTER, a.location) -
        haversineDistance(DEFAULT_CENTER, b.location),
    );
  }, [nearby]);

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
                  attractions={allAttractions}
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
                  {displayAttractions.length > 0 && (
                    <div className="bottom-cards">
                      {displayAttractions.slice(0, 3).map((a) => (
                        <AttractionCard
                          key={a.id}
                          attraction={a}
                          distance={haversineDistance(
                            location || DEFAULT_CENTER,
                            a.location,
                          )}
                          isActive={
                            location
                              ? a.id === unplayedNearby[0]?.id
                              : false
                          }
                          onClick={handleAttractionClick}
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
