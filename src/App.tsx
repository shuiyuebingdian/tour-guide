import { useState, useCallback } from 'react';
import type { Attraction } from './types';
import { useGeolocation } from './hooks/useGeolocation';
import { useNearbyAttractions } from './hooks/useNearbyAttractions';
import { haversineDistance } from './utils/geo';
import MapView from './components/MapView';
import AttractionCard from './components/AttractionCard';
import PlayerView from './components/PlayerView';
import ListView from './components/ListView';
import citiesData from './data/cities.json';
import beijingAttractions from './data/attractions/beijing.json';
import './App.css';

type View = 'map' | 'list' | 'player';

const allAttractions: Attraction[] = [...beijingAttractions];

function App() {
  const [view, setView] = useState<View>('map');
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const { location, error } = useGeolocation();
  const { nearby, unplayedNearby } = useNearbyAttractions(location, allAttractions);

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
                {location && nearby.length > 0 && (
                  <div className="bottom-cards">
                    {nearby.slice(0, 3).map((a) => (
                      <AttractionCard
                        key={a.id}
                        attraction={a}
                        distance={haversineDistance(location, a.location)}
                        isActive={a.id === unplayedNearby[0]?.id}
                        onClick={handleAttractionClick}
                      />
                    ))}
                  </div>
                )}
                {error && (
                  <div className="location-error">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>重试</button>
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
