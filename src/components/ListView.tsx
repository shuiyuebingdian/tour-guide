import { useState, useMemo } from 'react';
import type { City, ScenicArea, Attraction } from '../types';
import SearchBar from './SearchBar';
import areasData from '../data/areas.json';
import './ListView.css';

interface ListViewProps {
  cities: City[];
  attractions: Attraction[];
  onAttractionClick: (attraction: Attraction) => void;
  onClearHistory: () => void;
  triggerDistance: number;
  onTriggerDistanceChange: (d: number) => void;
  wakeLockEnabled: boolean;
  onWakeLockChange: (v: boolean) => void;
}

export default function ListView({
  cities,
  attractions,
  onAttractionClick,
  onClearHistory,
  triggerDistance,
  onTriggerDistanceChange,
  wakeLockEnabled,
  onWakeLockChange,
}: ListViewProps) {
  const [search, setSearch] = useState('');
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return attractions.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.segments.some((s) => s.text.toLowerCase().includes(q)),
    );
  }, [search, attractions]);

  const { areasByCity, attractionsByArea } = useMemo(() => {
    const areaMap = new Map<string, ScenicArea[]>();
    const attrMap = new Map<string, Attraction[]>();

    areasData.forEach((area) => {
      const list = areaMap.get(area.cityId) || [];
      list.push(area);
      areaMap.set(area.cityId, list);
    });

    attractions.forEach((a) => {
      const list = attrMap.get(a.areaId) || [];
      list.push(a);
      attrMap.set(a.areaId, list);
    });

    return { areasByCity: areaMap, attractionsByArea: attrMap };
  }, [attractions]);

  const toggleCity = (cityId: string) => {
    setExpandedCities((prev) => {
      const next = new Set(prev);
      if (next.has(cityId)) next.delete(cityId);
      else next.add(cityId);
      return next;
    });
  };

  const toggleArea = (areaId: string) => {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  };

  const totalAreas = areasData.length;

  return (
    <div className="list-view">
      <SearchBar value={search} onChange={setSearch} />

      <div className="list-content">
        {filtered ? (
          <div className="search-results">
            <p className="result-count">找到 {filtered.length} 个结果</p>
            {filtered.map((a) => (
              <div
                key={a.id}
                className="list-item"
                onClick={() => onAttractionClick(a)}
              >
                <span className="list-item-name">{a.name}</span>
                <span className="list-item-arrow">›</span>
              </div>
            ))}
          </div>
        ) : (
          cities.map((city) => {
            const cityAreas = areasByCity.get(city.id) || [];
            const cityAttractionCount = cityAreas.reduce(
              (sum, area) => sum + (attractionsByArea.get(area.id) || []).length,
              0,
            );
            const cityExpanded = expandedCities.has(city.id);

            return (
              <div key={city.id} className="city-group">
                <div
                  className="city-header"
                  onClick={() => toggleCity(city.id)}
                >
                  <span className="city-name">🏙️ {city.name}</span>
                  <span className="city-count">
                    {cityAreas.length} 个景区 · {cityAttractionCount} 个景点
                  </span>
                  <span className={`city-arrow ${cityExpanded ? 'expanded' : ''}`}>
                    ▾
                  </span>
                </div>

                {cityExpanded && (
                  <div className="city-content">
                    {cityAreas.map((area) => {
                      const areaAttractions = attractionsByArea.get(area.id) || [];
                      const areaExpanded = expandedAreas.has(area.id);

                      return (
                        <div key={area.id} className="area-group">
                          <div
                            className="area-header"
                            onClick={() => toggleArea(area.id)}
                          >
                            <span className="area-name">🏛️ {area.name}</span>
                            <span className="area-count">
                              {areaAttractions.length} 个景点
                            </span>
                            <span className={`area-arrow ${areaExpanded ? 'expanded' : ''}`}>
                              ▾
                            </span>
                          </div>

                          {areaExpanded && (
                            <div className="area-attractions">
                              {areaAttractions.map((a) => (
                                <div
                                  key={a.id}
                                  className="list-item"
                                  onClick={() => onAttractionClick(a)}
                                >
                                  <span className="list-item-name">{a.name}</span>
                                  <span className="list-item-arrow">›</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="list-footer">
        <div className="list-settings">
          <label className="setting-label">
            <span>触发距离</span>
            <select
              className="setting-select"
              value={triggerDistance}
              onChange={(e) => onTriggerDistanceChange(Number(e.target.value))}
            >
              <option value={10}>10m</option>
              <option value={20}>20m</option>
              <option value={30}>30m</option>
              <option value={50}>50m</option>
              <option value={100}>100m</option>
              <option value={200}>200m</option>
            </select>
          </label>
          <label className="setting-label">
            <input
              type="checkbox"
              checked={wakeLockEnabled}
              onChange={(e) => onWakeLockChange(e.target.checked)}
            />
            <span>保持屏幕常亮</span>
          </label>
        </div>
        <p>💡 共 {attractions.length} 个讲解，覆盖 {cities.length} 个城市 · {totalAreas} 个景区</p>
        <button className="btn-clear-history" onClick={onClearHistory}>
          清除已听记录
        </button>
      </div>
    </div>
  );
}
