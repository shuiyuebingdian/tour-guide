# 随身导游 (Tour Guide) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an offline-first PWA that auto-locates the user via GPS and reads aloud scenic spot introductions using browser TTS when they walk near an attraction.

**Architecture:** React 18 + TypeScript + Vite SPA, pre-bundled with all attraction data as static JSON. No backend, no runtime API calls (except map tiles). Two main views: a map with nearby attraction cards, and a city-grouped browse list. TTS via Web Speech Synthesis API.

**Tech Stack:** React 18, TypeScript, Vite, vite-plugin-pwa, 高德地图 JS API (AMap Loader), Web Speech API

---

### Task 1: Scaffold Vite + React + TypeScript project

**Files:**
- Create: entire project scaffold via `npm create vite`

- [ ] **Step 1: Scaffold the project**

```bash
cd "D:/claude-workspace/tour-guide"
npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

- [ ] **Step 3: Install additional dependencies**

```bash
npm install @amap/amap-jsapi-loader vite-plugin-pwa
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server starts, opening http://localhost:5173 shows the default Vite + React page.

- [ ] **Step 5: Clean up scaffold**

Delete the default `src/App.css` content and `src/assets/` directory. Replace `src/App.tsx` with a minimal placeholder:

```tsx
function App() {
  return <div>随身导游</div>;
}

export default App;
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TypeScript project"
```

---

### Task 2: Configure PWA (vite-plugin-pwa)

**Files:**
- Create: `public/icon-192.png`, `public/icon-512.png` (placeholder)
- Modify: `vite.config.ts`

- [ ] **Step 1: Generate placeholder PWA icons**

For now create simple placeholder PNGs — a 192x192 and 512x512 solid color square. Later replace with real icon.

```bash
# Create a minimal valid PNG (1x1 blue pixel, scaled) using Node.js
node -e "
const fs = require('fs');
// Minimal 192x192 solid PNG — use a simple script or placeholder
// For now we skip real generation and configure PWA without icons
"
```

Actually simpler: create a minimal 1-pixel PNG and configure the PWA to reference it. But even simpler — we'll configure `vite-plugin-pwa` in dev mode without strict icon requirements first, and generate proper icons later.

- [ ] **Step 2: Configure vite-plugin-pwa in `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,webp,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.amap\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'amap-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      manifest: {
        name: '随身导游',
        short_name: '导游',
        description: '走到哪讲到哪的旅游景点语音讲解',
        theme_color: '#1a73e8',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [], // 后续补充真实图标
      },
    }),
  ],
});
```

- [ ] **Step 3: Verify build produces service worker**

```bash
npm run build
ls dist/sw.js dist/workbox-*.js
```

Expected: `dist/sw.js` and workbox files exist.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: configure vite-plugin-pwa with offline caching"
```

---

### Task 3: Define TypeScript types and sample data

**Files:**
- Create: `src/types/index.ts`
- Create: `src/data/cities.json`
- Create: `src/data/areas.json`
- Create: `src/data/attractions/beijing.json`

- [ ] **Step 1: Create type definitions `src/types/index.ts`**

```typescript
export interface City {
  id: string;
  name: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
}

export interface ScenicArea {
  id: string;
  name: string;
  cityId: string;
  center: [number, number];
  radius: number;
  overview: string;
  overviewSegments: Segment[];
}

export interface Attraction {
  id: string;
  name: string;
  areaId: string;
  location: [number, number]; // [lng, lat]
  radius: number;
  image: string;
  segments: Segment[];
}

export interface Segment {
  heading?: string;
  text: string;
}
```

- [ ] **Step 2: Create `src/data/cities.json`**

```json
[
  {
    "id": "beijing",
    "name": "北京",
    "center": [116.397428, 39.908723],
    "zoom": 12
  }
]
```

- [ ] **Step 3: Create `src/data/areas.json`**

```json
[
  {
    "id": "gugong",
    "name": "故宫博物院",
    "cityId": "beijing",
    "center": [116.397026, 39.917908],
    "radius": 800,
    "overview": "故宫，旧称紫禁城，是明清两代的皇家宫殿...",
    "overviewSegments": [
      {
        "heading": "概况",
        "text": "故宫，旧称紫禁城，位于北京中轴线的中心，是明清两个朝代24位皇帝的皇宫，占地72万平方米，建筑面积约15万平方米，是世界上现存规模最大、保存最完整的木质结构古建筑群。"
      },
      {
        "heading": "历史",
        "text": "故宫始建于明成祖永乐四年，即公元1406年，历时14年建成。明清两代500余年间，这里一直是中国的政治中心。1987年被联合国教科文组织列为世界文化遗产。"
      }
    ]
  }
]
```

- [ ] **Step 4: Create `src/data/attractions/beijing.json`**

```json
[
  {
    "id": "gugong-wumen",
    "name": "午门",
    "areaId": "gugong",
    "location": [116.397, 39.915],
    "radius": 30,
    "image": "",
    "segments": [
      {
        "heading": "故宫正门",
        "text": "午门是故宫的正门，建于明永乐十八年。午门共有五个门洞，正中门洞专供皇帝出入，皇后大婚时入宫走一次，殿试前三名出宫走一次，所以民间有'午门只有三种人能走中间'的说法。"
      },
      {
        "heading": "建筑特色",
        "text": "午门平面呈凹字形，城墙高12米，上有五座崇楼，又称'五凤楼'。明清两代，朝廷重大典礼如颁布历书、献俘等仪式都在午门举行。"
      }
    ]
  },
  {
    "id": "gugong-taihedian",
    "name": "太和殿",
    "areaId": "gugong",
    "location": [116.397, 39.916],
    "radius": 40,
    "image": "",
    "segments": [
      {
        "heading": "金銮宝殿",
        "text": "太和殿，俗称金銮殿，是故宫中等级最高、规模最大的宫殿。皇帝登基、大婚、册封皇后、命将出征等重大典礼都在这里举行。殿内铺有金砖，中央设有九龙金漆宝座。"
      },
      {
        "heading": "建筑数据",
        "text": "太和殿面阔11间，进深5间，高26.92米，连同台基通高35.05米，是中国现存最大的木结构宫殿。殿顶为重檐庑殿顶，屋顶上的吻兽数量为紫禁城之最，共10只。"
      }
    ]
  },
  {
    "id": "gugong-zhonghedian",
    "name": "中和殿",
    "areaId": "gugong",
    "location": [116.3975, 39.9165],
    "radius": 25,
    "image": "",
    "segments": [
      {
        "heading": "皇帝休息处",
        "text": "中和殿位于太和殿与保和殿之间，是皇帝参加太和殿大典前休息和接受执事官朝拜的地方。殿名取自《中庸》'中也者天下之大本也，和也者天下之达道也'，寓意中正平和。"
      }
    ]
  },
  {
    "id": "gugong-baohedian",
    "name": "保和殿",
    "areaId": "gugong",
    "location": [116.398, 39.917],
    "radius": 30,
    "image": "",
    "segments": [
      {
        "heading": "殿试考场",
        "text": "保和殿在清代乾隆年间成为殿试的固定考场，全国举人在这里参加由皇帝亲自主持的最高级别考试。殿试第一名就是我们常说的状元。"
      }
    ]
  },
  {
    "id": "gugong-qianqinggong",
    "name": "乾清宫",
    "areaId": "gugong",
    "location": [116.398, 39.918],
    "radius": 30,
    "image": "",
    "segments": [
      {
        "text": "乾清宫是明朝14位皇帝及清朝顺治、康熙两位皇帝的寝宫和处理日常政务的地方。殿内正中悬挂着'正大光明'匾额，雍正帝之后，秘密立储的诏书就藏在匾额后面。"
      }
    ]
  }
]
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add type definitions and sample Beijing data"
```

---

### Task 4: Geo utility functions

**Files:**
- Create: `src/utils/geo.ts`
- Create: `src/utils/__tests__/geo.test.ts`

- [ ] **Step 1: Write the failing test `src/utils/__tests__/geo.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { haversineDistance, isNearby, sortByDistance } from '../geo';
import type { Attraction } from '../../types';

describe('haversineDistance', () => {
  it('returns 0 for the same point', () => {
    const d = haversineDistance([116.397, 39.916], [116.397, 39.916]);
    expect(d).toBe(0);
  });

  it('calculates distance between two known points (approx)', () => {
    // 午门 (116.397, 39.915) to 太和殿 (116.397, 39.916)
    // ~111m latitude difference at 0.001 degrees
    const d = haversineDistance([116.397, 39.915], [116.397, 39.916]);
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(120);
  });
});

describe('isNearby', () => {
  it('returns true when within radius', () => {
    const attraction = { location: [116.397, 39.915] as [number, number], radius: 50 };
    expect(isNearby([116.397, 39.9151], attraction)).toBe(true);
  });

  it('returns false when outside radius', () => {
    const attraction = { location: [116.397, 39.915] as [number, number], radius: 50 };
    expect(isNearby([116.397, 39.920], attraction)).toBe(false);
  });
});

describe('sortByDistance', () => {
  it('sorts attractions by distance ascending', () => {
    const current: [number, number] = [116.397, 39.915];
    const items = [
      { id: 'far', location: [116.397, 39.920], radius: 30 } as unknown as Attraction,
      { id: 'near', location: [116.397, 39.9151], radius: 30 } as unknown as Attraction,
    ];
    const sorted = sortByDistance(current, items);
    expect(sorted[0].id).toBe('near');
    expect(sorted[1].id).toBe('far');
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npx vitest run
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/utils/geo.ts`**

```typescript
import type { Attraction } from '../types';

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine distance in meters between two [lng, lat] points */
export function haversineDistance(
  [lng1, lat1]: [number, number],
  [lng2, lat2]: [number, number],
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isNearby(
  userLocation: [number, number],
  attraction: { location: [number, number]; radius: number },
): boolean {
  return haversineDistance(userLocation, attraction.location) <= attraction.radius;
}

export function sortByDistance(
  userLocation: [number, number],
  attractions: Attraction[],
): Attraction[] {
  return [...attractions].sort(
    (a, b) =>
      haversineDistance(userLocation, a.location) -
      haversineDistance(userLocation, b.location),
  );
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add geo utility functions with tests"
```

---

### Task 5: usePlayHistory hook

**Files:**
- Create: `src/hooks/usePlayHistory.ts`
- Create: `src/hooks/__tests__/usePlayHistory.test.ts`

- [ ] **Step 1: Write the failing test `src/hooks/__tests__/usePlayHistory.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayHistory } from '../usePlayHistory';

beforeEach(() => {
  localStorage.clear();
});

describe('usePlayHistory', () => {
  it('marks an attraction as played', () => {
    const { result } = renderHook(() => usePlayHistory());
    act(() => result.current.markPlayed('gugong-taihedian'));
    expect(result.current.hasPlayedToday('gugong-taihedian')).toBe(true);
  });

  it('returns false for unplayed attraction', () => {
    const { result } = renderHook(() => usePlayHistory());
    expect(result.current.hasPlayedToday('gugong-wumen')).toBe(false);
  });

  it('filters out played attractions from a list', () => {
    const { result } = renderHook(() => usePlayHistory());
    act(() => result.current.markPlayed('a'));
    const remaining = result.current.filterUnplayed(['a', 'b', 'c']);
    expect(remaining).toEqual(['b', 'c']);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npx vitest run
```

- [ ] **Step 3: Implement `src/hooks/usePlayHistory.ts`**

```typescript
import { useCallback } from 'react';

const STORAGE_KEY = 'tour-guide-played';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10); // "2026-05-19"
}

function getPlayedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const data = JSON.parse(raw) as Record<string, string[]>;
    const todayIds = data[getTodayKey()] ?? [];
    return new Set(todayIds);
  } catch {
    return new Set();
  }
}

function savePlayedSet(set: Set<string>): void {
  const data: Record<string, string[]> = {};
  data[getTodayKey()] = Array.from(set);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function usePlayHistory() {
  const hasPlayedToday = useCallback((id: string): boolean => {
    return getPlayedSet().has(id);
  }, []);

  const markPlayed = useCallback((id: string): void => {
    const set = getPlayedSet();
    set.add(id);
    savePlayedSet(set);
  }, []);

  const filterUnplayed = useCallback((ids: string[]): string[] => {
    const set = getPlayedSet();
    return ids.filter((id) => !set.has(id));
  }, []);

  return { hasPlayedToday, markPlayed, filterUnplayed };
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add usePlayHistory hook with localStorage persistence"
```

---

### Task 6: useGeolocation hook

**Files:**
- Create: `src/hooks/useGeolocation.ts`

- [ ] **Step 1: Implement `src/hooks/useGeolocation.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
  location: [number, number] | null; // [lng, lat]
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true,
  });

  const [watchId, setWatchId] = useState<number | null>(null);

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

    setWatchId(id);
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
  }, []);

  return { ...state, refresh };
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add useGeolocation hook with GPS watch"
```

---

### Task 7: useSpeech hook

**Files:**
- Create: `src/hooks/useSpeech.ts`

- [ ] **Step 1: Implement `src/hooks/useSpeech.ts`**

```typescript
import { useState, useCallback, useRef } from 'react';

export type SpeechState = 'idle' | 'playing' | 'paused';

interface UseSpeechOptions {
  rate?: number;
  onEnd?: () => void;
  onBoundary?: (charIndex: number) => void;
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const { rate = 0.9, onEnd, onBoundary } = options;
  const [state, setState] = useState<SpeechState>('idle');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textRef = useRef<string>('');

  const speak = useCallback(
    (text: string, startFrom = 0) => {
      window.speechSynthesis.cancel();
      textRef.current = text;

      const utterance = new SpeechSynthesisUtterance(text.slice(startFrom));
      utterance.lang = 'zh-CN';
      utterance.rate = rate;

      utterance.onboundary = (e) => {
        if (e.charIndex !== undefined) {
          setCurrentCharIndex(startFrom + e.charIndex);
          onBoundary?.(startFrom + e.charIndex);
        }
      };

      utterance.onend = () => {
        setState('idle');
        setCurrentCharIndex(0);
        onEnd?.();
      };

      utterance.onerror = () => {
        setState('idle');
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setState('playing');
    },
    [rate, onEnd, onBoundary],
  );

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setState('paused');
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setState('playing');
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setState('idle');
    setCurrentCharIndex(0);
  }, []);

  const setRate = useCallback(
    (newRate: number) => {
      // rate is read on next speak() call
      options.rate = newRate;
    },
    [],
  );

  return { state, currentCharIndex, speak, pause, resume, stop, setRate };
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add useSpeech hook wrapping Web Speech Synthesis API"
```

---

### Task 8: useNearbyAttractions hook

**Files:**
- Create: `src/hooks/useNearbyAttractions.ts`

- [ ] **Step 1: Implement `src/hooks/useNearbyAttractions.ts`**

```typescript
import { useMemo } from 'react';
import type { Attraction } from '../types';
import { isNearby, sortByDistance } from '../utils/geo';
import { usePlayHistory } from './usePlayHistory';

export function useNearbyAttractions(
  userLocation: [number, number] | null,
  allAttractions: Attraction[],
) {
  const { hasPlayedToday, filterUnplayed } = usePlayHistory();

  const nearby = useMemo(() => {
    if (!userLocation) return [];
    const inRange = allAttractions.filter((a) => isNearby(userLocation, a));
    return sortByDistance(userLocation, inRange);
  }, [userLocation, allAttractions]);

  const unplayedNearby = useMemo(() => {
    return nearby.filter((a) => !hasPlayedToday(a.id));
  }, [nearby, hasPlayedToday]);

  const nearestUnplayed = unplayedNearby.length > 0 ? unplayedNearby[0] : null;

  return { nearby, unplayedNearby, nearestUnplayed };
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add useNearbyAttractions hook for proximity detection"
```

---

### Task 9: MapView component

**Files:**
- Create: `src/components/MapView.tsx`
- Create: `src/components/MapView.css`

- [ ] **Step 1: Install testing-library for React**

```bash
npm install -D @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Write the failing test `src/components/__tests__/MapView.test.tsx`**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MapView from '../MapView';

// Mock AMapLoader
vi.mock('@amap/amap-jsapi-loader', () => ({
  default: {
    load: () =>
      Promise.resolve({
        Map: vi.fn().mockImplementation(() => ({})),
        Geolocation: vi.fn().mockImplementation(() => ({
          getCurrentPosition: vi.fn(),
        })),
        Marker: vi.fn().mockImplementation(() => ({})),
      }),
  },
}));

describe('MapView', () => {
  it('renders the map container', () => {
    const { container } = render(
      <MapView
        userLocation={null}
        attractions={[]}
        onAttractionClick={vi.fn()}
      />,
    );
    expect(container.querySelector('#map-container')).toBeTruthy();
  });

  it('shows loading state', () => {
    render(
      <MapView
        userLocation={null}
        attractions={[]}
        onAttractionClick={vi.fn()}
      />,
    );
    expect(screen.getByText(/地图加载中/)).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

```bash
npx vitest run
```

- [ ] **Step 4: Implement `src/components/MapView.tsx`**

```tsx
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
  userLocation: [number, number] | null;
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

  // Initialize map
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const AMapLoader = await import('@amap/amap-jsapi-loader');
      window._AMapSecurityConfig = {
        securityJsCode: '', // 高德安全密钥，部署时配置
      };
      const AMap = await AMapLoader.default.load({
        key: '', // 高德 key，部署时配置
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

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    const AMap = window.AMap;
    if (!AMap) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = new AMap.Marker({
        position: userLocation,
        icon: new AMap.Icon({
          size: new AMap.Size(20, 20),
          image: 'data:image/svg+xml,...', // blue dot SVG
          imageSize: new AMap.Size(20, 20),
        }),
      });
      mapRef.current.add(userMarkerRef.current);
    } else {
      userMarkerRef.current.setPosition(userLocation);
    }
  }, [userLocation]);

  // Update attraction markers
  useEffect(() => {
    if (!mapRef.current) return;
    const AMap = window.AMap;
    if (!AMap) return;

    // Clear old markers
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
```

- [ ] **Step 5: Create `src/components/MapView.css`**

```css
.map-view {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-container {
  width: 100%;
  height: 100%;
}

.map-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
}
```

- [ ] **Step 6: Run tests**

```bash
npx vitest run
```

Expected: MapView tests PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add MapView component with AMap integration"
```

---

### Task 10: AttractionCard component

**Files:**
- Create: `src/components/AttractionCard.tsx`
- Create: `src/components/AttractionCard.css`

- [ ] **Step 1: Write the failing test `src/components/__tests__/AttractionCard.test.tsx`**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AttractionCard from '../AttractionCard';
import type { Attraction } from '../../types';

const mockAttraction: Attraction = {
  id: 'test-1',
  name: '太和殿',
  areaId: 'gugong',
  location: [116.397, 39.916],
  radius: 30,
  image: '',
  segments: [{ text: '这是太和殿' }],
};

describe('AttractionCard', () => {
  it('renders attraction name and distance', () => {
    render(
      <AttractionCard
        attraction={mockAttraction}
        distance={200}
        isActive={false}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText('太和殿')).toBeTruthy();
    expect(screen.getByText(/200m/)).toBeTruthy();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <AttractionCard
        attraction={mockAttraction}
        distance={50}
        isActive={false}
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByText('太和殿').closest('div')!);
    expect(onClick).toHaveBeenCalledWith(mockAttraction);
  });

  it('shows active state styling', () => {
    const { container } = render(
      <AttractionCard
        attraction={mockAttraction}
        distance={50}
        isActive={true}
        onClick={vi.fn()}
      />,
    );
    expect(container.querySelector('.card-active')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npx vitest run
```

- [ ] **Step 3: Implement `src/components/AttractionCard.tsx`**

```tsx
import type { Attraction } from '../types';
import './AttractionCard.css';

interface AttractionCardProps {
  attraction: Attraction;
  distance: number;
  isActive: boolean;
  onClick: (attraction: Attraction) => void;
}

export default function AttractionCard({
  attraction,
  distance,
  isActive,
  onClick,
}: AttractionCardProps) {
  const distText = distance < 1000
    ? `${Math.round(distance)}m`
    : `${(distance / 1000).toFixed(1)}km`;

  return (
    <div
      className={`attraction-card ${isActive ? 'card-active' : ''}`}
      onClick={() => onClick(attraction)}
    >
      <div className="card-info">
        <h3 className="card-name">{attraction.name}</h3>
        <span className="card-distance">距你 {distText}</span>
      </div>
      <button className="card-play-btn" aria-label="开始讲解">
        ▶
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/AttractionCard.css`**

```css
.attraction-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: transform 0.15s;
}

.attraction-card:active {
  transform: scale(0.98);
}

.card-active {
  border: 2px solid #1a73e8;
  box-shadow: 0 2px 12px rgba(26, 115, 232, 0.25);
}

.card-info {
  flex: 1;
}

.card-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.card-distance {
  font-size: 13px;
  color: #666;
}

.card-play-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #1a73e8;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

- [ ] **Step 5: Run tests to verify pass**

```bash
npx vitest run
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add AttractionCard component"
```

---

### Task 11: PlayerView component

**Files:**
- Create: `src/components/PlayerView.tsx`
- Create: `src/components/PlayerView.css`

- [ ] **Step 1: Implement `src/components/PlayerView.tsx`**

```tsx
import { useState, useCallback, useEffect } from 'react';
import type { Attraction } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { usePlayHistory } from '../hooks/usePlayHistory';
import './PlayerView.css';

interface PlayerViewProps {
  attraction: Attraction;
  onBack: () => void;
  onComplete: () => void;
}

export default function PlayerView({
  attraction,
  onBack,
  onComplete,
}: PlayerViewProps) {
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [rate, setRate] = useState(0.9);
  const { markPlayed } = usePlayHistory();

  const handleSegmentEnd = useCallback(() => {
    if (segmentIndex < attraction.segments.length - 1) {
      setSegmentIndex((i) => i + 1);
    } else {
      markPlayed(attraction.id);
      onComplete();
    }
  }, [segmentIndex, attraction, markPlayed, onComplete]);

  const { state, currentCharIndex, speak, pause, resume, stop } = useSpeech({
    rate,
    onEnd: handleSegmentEnd,
  });

  const segment = attraction.segments[segmentIndex];

  // Auto-start first segment
  useEffect(() => {
    if (segment) {
      speak(segment.text);
    }
    return () => { stop(); };
  }, [segmentIndex]);

  const handlePlayPause = () => {
    if (state === 'playing') pause();
    else if (state === 'paused') resume();
    else speak(segment.text);
  };

  const handleNext = () => {
    stop();
    if (segmentIndex < attraction.segments.length - 1) {
      setSegmentIndex((i) => i + 1);
    } else {
      markPlayed(attraction.id);
      onComplete();
    }
  };

  const handlePrev = () => {
    stop();
    if (segmentIndex > 0) {
      setSegmentIndex((i) => i - 1);
    }
  };

  return (
    <div className="player-view">
      <header className="player-header">
        <button className="player-back" onClick={onBack}>← 返回</button>
        <div className="player-title">
          <h2>{attraction.name}</h2>
          {segment.heading && <span className="segment-heading">{segment.heading}</span>}
        </div>
      </header>

      <div className="player-image-area">
        {attraction.image ? (
          <img src={attraction.image} alt={attraction.name} className="player-image" />
        ) : (
          <div className="player-image-placeholder">🏛️</div>
        )}
      </div>

      <div className="player-text">
        <p>{segment.text}</p>
      </div>

      <div className="player-segment-indicator">
        {attraction.segments.map((_, i) => (
          <span
            key={i}
            className={`dot ${i === segmentIndex ? 'dot-active' : ''} ${i < segmentIndex ? 'dot-done' : ''}`}
          />
        ))}
      </div>

      <div className="player-controls">
        <button onClick={handlePrev} disabled={segmentIndex === 0}>⏮</button>
        <button className="btn-play" onClick={handlePlayPause}>
          {state === 'playing' ? '⏸' : '▶'}
        </button>
        <button onClick={handleNext}>⏭</button>
      </div>

      <div className="player-rate">
        <label>语速: </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
        />
        <span>{rate}x</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/PlayerView.css`**

```css
.player-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
}

.player-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
}

.player-back {
  background: none;
  border: none;
  font-size: 16px;
  color: #1a73e8;
  cursor: pointer;
  margin-right: 12px;
}

.player-title h2 {
  margin: 0;
  font-size: 18px;
}

.segment-heading {
  font-size: 13px;
  color: #666;
}

.player-image-area {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e0e0e0;
}

.player-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-image-placeholder {
  font-size: 64px;
}

.player-text {
  flex: 1;
  padding: 20px 16px;
  overflow-y: auto;
  font-size: 16px;
  line-height: 1.8;
  color: #333;
}

.player-segment-indicator {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
}

.dot-active {
  background: #1a73e8;
  transform: scale(1.3);
}

.dot-done {
  background: #90caf9;
}

.player-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  padding: 16px;
  background: white;
  border-top: 1px solid #eee;
}

.player-controls button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
}

.player-controls button:disabled {
  opacity: 0.3;
}

.player-controls .btn-play {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #1a73e8;
  color: white;
  font-size: 24px;
}

.player-rate {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px 16px;
  background: white;
  font-size: 14px;
}

.player-rate input[type="range"] {
  flex: 1;
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add PlayerView component with segment-by-segment TTS"
```

---

### Task 12: ListView and SearchBar components

**Files:**
- Create: `src/components/SearchBar.tsx`
- Create: `src/components/SearchBar.css`
- Create: `src/components/ListView.tsx`
- Create: `src/components/ListView.css`

- [ ] **Step 1: Implement `src/components/SearchBar.tsx`**

```tsx
import './SearchBar.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        placeholder="搜索景点..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="search-input"
      />
      {value && (
        <button className="search-clear" onClick={() => onChange('')}>
          ✕
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/SearchBar.css`**

```css
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f0f0f0;
  border-radius: 20px;
  margin: 12px 16px;
}

.search-icon {
  font-size: 14px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 15px;
  outline: none;
}

.search-clear {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  color: #999;
}
```

- [ ] **Step 3: Implement `src/components/ListView.tsx`**

```tsx
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

  // Group attractions by city via area data — simplified: group by cityId on attraction
  const attractionsByCity = useMemo(() => {
    const map = new Map<string, Attraction[]>();
    attractions.forEach((a) => {
      // Find city via area lookup — simplified: use id prefix
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
          // Search results
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
          // City groups
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
```

- [ ] **Step 4: Create `src/components/ListView.css`**

```css
.list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.list-content {
  flex: 1;
  overflow-y: auto;
}

.city-group {
  border-bottom: 1px solid #f0f0f0;
}

.city-header {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  gap: 8px;
}

.city-name {
  font-size: 16px;
  font-weight: 600;
}

.city-count {
  font-size: 13px;
  color: #999;
}

.city-arrow {
  margin-left: auto;
  transition: transform 0.2s;
}

.city-arrow.expanded {
  transform: rotate(180deg);
}

.city-attractions {
  border-top: 1px solid #f0f0f0;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 14px 32px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
}

.list-item:active {
  background: #f5f5f5;
}

.list-item-name {
  font-size: 15px;
}

.list-item-arrow {
  font-size: 18px;
  color: #ccc;
}

.search-results {
  padding-bottom: 16px;
}

.result-count {
  padding: 8px 16px;
  font-size: 13px;
  color: #999;
}

.list-footer {
  padding: 12px 16px;
  font-size: 13px;
  color: #999;
  text-align: center;
  border-top: 1px solid #eee;
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add ListView and SearchBar components"
```

---

### Task 13: App shell with tab navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/main.tsx`
- Create: `src/index.css`

- [ ] **Step 1: Update `src/index.css` with global styles**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 2: Implement `src/App.tsx`**

```tsx
import { useState, useCallback } from 'react';
import type { Attraction } from './types';
import { useGeolocation } from './hooks/useGeolocation';
import { useNearbyAttractions } from './hooks/useNearbyAttractions';
import MapView from './components/MapView';
import AttractionCard from './components/AttractionCard';
import PlayerView from './components/PlayerView';
import ListView from './components/ListView';
import citiesData from './data/cities.json';
import areasData from './data/areas.json';
import beijingAttractions from './data/attractions/beijing.json';
import './App.css';

type View = 'map' | 'list' | 'player';

// Combine all attractions for now
const allAttractions: Attraction[] = [...beijingAttractions];

function App() {
  const [view, setView] = useState<View>('map');
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const { location, error, loading } = useGeolocation();
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
                        distance={0}
                        isActive={a.id === unplayedNearby[0]?.id}
                        onClick={handleAttractionClick}
                      />
                    ))}
                  </div>
                )}
                {error && (
                  <div className="location-error">
                    {error}
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
```

- [ ] **Step 3: Update `src/App.css`**

```css
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 100vw;
  overflow: hidden;
}

.app-main {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.map-wrapper {
  height: 100%;
  position: relative;
}

.bottom-cards {
  position: absolute;
  bottom: 16px;
  left: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
}

.location-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  z-index: 20;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.location-error button {
  margin-top: 8px;
  padding: 8px 20px;
  background: #1a73e8;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.tab-bar {
  display: flex;
  border-top: 1px solid #eee;
  background: white;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab {
  flex: 1;
  padding: 10px 0;
  border: none;
  background: none;
  font-size: 14px;
  cursor: pointer;
  color: #999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.tab-active {
  color: #1a73e8;
}
```

- [ ] **Step 4: Verify `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire up App shell with tab navigation and full component integration"
```

---

### Task 14: Final integration test and build verification

**Files:**
- Modify: `vite.config.ts` (if needed)

- [ ] **Step 1: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Build for production**

```bash
npm run build
```

Expected: `dist/` directory with `index.html`, JS/CSS bundles, service worker, and manifest.

- [ ] **Step 4: Preview the production build**

```bash
npm run preview
```

Open the preview URL, verify:
- App loads without errors in console
- Map renders (may fail without API key — that's expected)
- Tab switching works between map and list views

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: final integration verification"
```

---

### Post-Plan Notes

1. **高德地图 API Key**: Before production deployment, register at 高德开放平台 and add the key + security code to `MapView.tsx`.
2. **PWA Icons**: Generate proper 192x192 and 512x512 app icons and update the manifest in `vite.config.ts`.
3. **More Cities**: Add more attraction data JSON files following the `beijing.json` pattern.
4. **Image Assets**: Add WebP images to `public/data/images/` and reference them in attraction data `image` fields.
