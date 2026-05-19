import { useState, useMemo } from 'react';
import type { City, Attraction } from '../types';
import SearchBar from './SearchBar';
import './ListView.css';

interface ListViewProps {
  cities: City[];
  attractions: Attraction[];
  onAttractionClick: (attraction: Attraction) => void;
}

export default function ListView({
  cities,
  attractions,
  onAttractionClick,
}: ListViewProps) {
  const [search, setSearch] = useState('');
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return attractions.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.segments.some((s) => s.text.toLowerCase().includes(q)),
    );
  }, [search, attractions]);

  const toggleCity = (cityId: string) => {
    setExpandedCities((prev) => {
      const next = new Set(prev);
      if (next.has(cityId)) next.delete(cityId);
      else next.add(cityId);
      return next;
    });
  };

  const attractionsByCity = useMemo(() => {
    const map = new Map<string, Attraction[]>();
    attractions.forEach((a) => {
      const cityId = cities[0]?.id || 'beijing';
      const list = map.get(cityId) || [];
      list.push(a);
      map.set(cityId, list);
    });
    return map;
  }, [attractions, cities]);

  return (
    <div className="list-view">
      <SearchBar value={search} onChange={setSearch} />

      <div className="list-content">
        {filtered ? (
          <div className="search-results">
            <p className="result-count">找到 {filtered.length} 个景点</p>
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
            const list = attractionsByCity.get(city.id) || [];
            const expanded = expandedCities.has(city.id);
            return (
              <div key={city.id} className="city-group">
                <div
                  className="city-header"
                  onClick={() => toggleCity(city.id)}
                >
                  <span className="city-name">🏙️ {city.name}</span>
                  <span className="city-count">{list.length} 个景点</span>
                  <span className={`city-arrow ${expanded ? 'expanded' : ''}`}>
                    ▾
                  </span>
                </div>
                {expanded && (
                  <div className="city-attractions">
                    {list.map((a) => (
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
          })
        )}
      </div>

      <div className="list-footer">
        💡 共 {attractions.length} 个景点，覆盖 {cities.length} 个城市
      </div>
    </div>
  );
}
