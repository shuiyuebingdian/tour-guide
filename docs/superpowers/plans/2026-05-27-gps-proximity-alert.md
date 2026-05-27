# GPS Proximity Alert Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a bottom slide-in card + vibration when user enters an attraction's radius, with once-per-day dedup per attraction.

**Architecture:** New `useProximityAlert` hook manages the idle/alerting/dismissed state machine and localStorage-based dedup. New `ProximityAlert` component renders the bottom card. Both integrate into App.tsx using existing `useNearbyAttractions.nearestUnplayed`.

**Tech Stack:** React 18 hooks, localStorage, Navigator.vibrate API, plain CSS

---

### Task 1: useProximityAlert hook (TDD)

**Files:**
- Create: `src/hooks/__tests__/useProximityAlert.test.ts`
- Create: `src/hooks/useProximityAlert.ts`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/__tests__/useProximityAlert.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProximityAlert } from '../useProximityAlert';
import type { Attraction } from '../../types';

const mockAttraction: Attraction = {
  id: 'gugong-taihedian',
  name: '太和殿',
  areaId: 'gugong',
  location: [116.397, 39.916],
  radius: 40,
  image: '',
  segments: [{ text: '太和殿讲解' }],
};

const otherAttraction: Attraction = {
  id: 'gugong-wumen',
  name: '午门',
  areaId: 'gugong',
  location: [116.397, 39.915],
  radius: 30,
  image: '',
  segments: [{ text: '午门讲解' }],
};

beforeEach(() => {
  localStorage.clear();
  // mock vibrate
  vi.stubGlobal('navigator', { ...navigator, vibrate: vi.fn() });
});

describe('useProximityAlert', () => {
  it('starts in idle state with no target', () => {
    const onPlay = vi.fn();
    const { result } = renderHook(() =>
      useProximityAlert({ nearestUnplayed: null, onPlay }),
    );
    expect(result.current.status).toBe('idle');
    expect(result.current.target).toBeNull();
  });

  it('transitions to alerting when nearestUnplayed appears', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ nearestUnplayed }) => useProximityAlert({ nearestUnplayed, onPlay }),
      { initialProps: { nearestUnplayed: null as Attraction | null } },
    );

    rerender({ nearestUnplayed: mockAttraction });

    expect(result.current.status).toBe('alerting');
    expect(result.current.target).toBe(mockAttraction);
    expect(navigator.vibrate).toHaveBeenCalledWith(200);
  });

  it('stays idle when nearestUnplayed is null', () => {
    const onPlay = vi.fn();
    const { result } = renderHook(() =>
      useProximityAlert({ nearestUnplayed: null, onPlay }),
    );
    expect(result.current.status).toBe('idle');
  });

  it('dismiss sets status to dismissed and records alert', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ nearestUnplayed }) => useProximityAlert({ nearestUnplayed, onPlay }),
      { initialProps: { nearestUnplayed: null as Attraction | null } },
    );

    rerender({ nearestUnplayed: mockAttraction });
    act(() => result.current.dismiss());

    expect(result.current.status).toBe('dismissed');

    // verify localStorage record
    const raw = localStorage.getItem('tour-guide-alerts');
    const data = JSON.parse(raw!);
    const today = new Date().toISOString().slice(0, 10);
    expect(data[today]).toContain('gugong-taihedian');
  });

  it('does not re-alert for the same target after dismiss (stays dismissed)', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ nearestUnplayed }) => useProximityAlert({ nearestUnplayed, onPlay }),
      { initialProps: { nearestUnplayed: null as Attraction | null } },
    );

    rerender({ nearestUnplayed: mockAttraction });
    act(() => result.current.dismiss());

    // rerender with same nearestUnplayed should stay dismissed
    rerender({ nearestUnplayed: mockAttraction });
    expect(result.current.status).toBe('dismissed');
  });

  it('resets to idle when nearestUnplayed becomes null after alerting', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ nearestUnplayed }) => useProximityAlert({ nearestUnplayed, onPlay }),
      { initialProps: { nearestUnplayed: null as Attraction | null } },
    );

    rerender({ nearestUnplayed: mockAttraction });
    expect(result.current.status).toBe('alerting');

    rerender({ nearestUnplayed: null });
    expect(result.current.status).toBe('idle');
    expect(result.current.target).toBeNull();
  });

  it('alerts for a new attraction after dismiss of previous', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ nearestUnplayed }) => useProximityAlert({ nearestUnplayed, onPlay }),
      { initialProps: { nearestUnplayed: null as Attraction | null } },
    );

    // alert for first
    rerender({ nearestUnplayed: mockAttraction });
    act(() => result.current.dismiss());

    // switch to other
    rerender({ nearestUnplayed: otherAttraction });
    expect(result.current.status).toBe('alerting');
    expect(result.current.target).toBe(otherAttraction);
  });

  it('markTriggered records alert and calls onPlay', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ nearestUnplayed }) => useProximityAlert({ nearestUnplayed, onPlay }),
      { initialProps: { nearestUnplayed: null as Attraction | null } },
    );

    rerender({ nearestUnplayed: mockAttraction });
    act(() => result.current.markTriggered());

    expect(onPlay).toHaveBeenCalledWith(mockAttraction);
    expect(result.current.status).toBe('idle');

    // verify localStorage record
    const raw = localStorage.getItem('tour-guide-alerts');
    const data = JSON.parse(raw!);
    const today = new Date().toISOString().slice(0, 10);
    expect(data[today]).toContain('gugong-taihedian');
  });

  it('does not re-alert for an attraction already triggered today', () => {
    // pre-set localStorage
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(
      'tour-guide-alerts',
      JSON.stringify({ [today]: ['gugong-taihedian'] }),
    );

    const onPlay = vi.fn();
    const { result } = renderHook(
      ({ nearestUnplayed }) => useProximityAlert({ nearestUnplayed, onPlay }),
      { initialProps: { nearestUnplayed: mockAttraction as Attraction | null } },
    );

    expect(result.current.status).toBe('idle');
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npx vitest run src/hooks/__tests__/useProximityAlert.test.ts
```

Expected: FAIL — module not found or exports not defined.

- [ ] **Step 3: Implement useProximityAlert hook**

Create `src/hooks/useProximityAlert.ts`:

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Attraction } from '../types';

const STORAGE_KEY = 'tour-guide-alerts';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function hasAlertedToday(id: string): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as Record<string, string[]>;
    return (data[getTodayKey()] ?? []).includes(id);
  } catch {
    return false;
  }
}

function recordAlert(id: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    const today = getTodayKey();
    if (!data[today]) data[today] = [];
    if (!data[today].includes(id)) {
      data[today].push(id);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export type ProximityStatus = 'idle' | 'alerting' | 'dismissed';

interface UseProximityAlertOptions {
  nearestUnplayed: Attraction | null;
  onPlay: (attraction: Attraction) => void;
}

export function useProximityAlert({
  nearestUnplayed,
  onPlay,
}: UseProximityAlertOptions) {
  const [status, setStatus] = useState<ProximityStatus>('idle');
  const [target, setTarget] = useState<Attraction | null>(null);
  const dismissedIdRef = useRef<string | null>(null);
  const onPlayRef = useRef(onPlay);
  onPlayRef.current = onPlay;

  useEffect(() => {
    if (!nearestUnplayed) {
      setStatus('idle');
      setTarget(null);
      dismissedIdRef.current = null;
      return;
    }

    // Already alerted today — never re-alert
    if (hasAlertedToday(nearestUnplayed.id)) {
      return;
    }

    // Still dismissed for this same attraction — don't re-alert
    if (
      status === 'dismissed' &&
      dismissedIdRef.current === nearestUnplayed.id
    ) {
      return;
    }

    // Previous dismissed target no longer nearest — clear ref
    if (
      dismissedIdRef.current !== null &&
      dismissedIdRef.current !== nearestUnplayed.id
    ) {
      dismissedIdRef.current = null;
    }

    // No existing alert for this target — alert!
    if (target?.id !== nearestUnplayed.id || status !== 'alerting') {
      setTarget(nearestUnplayed);
      setStatus('alerting');

      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    }
  }, [nearestUnplayed]);

  const dismiss = useCallback(() => {
    if (target) {
      recordAlert(target.id);
      dismissedIdRef.current = target.id;
      setStatus('dismissed');
    }
  }, [target]);

  const markTriggered = useCallback(() => {
    if (target) {
      recordAlert(target.id);
      setStatus('idle');
      setTarget(null);
      dismissedIdRef.current = null;
      onPlayRef.current(target);
    }
  }, [target]);

  return { status, target, dismiss, markTriggered } as const;
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run src/hooks/__tests__/useProximityAlert.test.ts
```

Expected: all 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useProximityAlert.ts src/hooks/__tests__/useProximityAlert.test.ts
git commit -m "feat: add useProximityAlert hook with state machine and dedup"
```

---

### Task 2: ProximityAlert component

**Files:**
- Create: `src/components/__tests__/ProximityAlert.test.tsx`
- Create: `src/components/ProximityAlert.tsx`
- Create: `src/components/ProximityAlert.css`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/ProximityAlert.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProximityAlert from '../ProximityAlert';
import type { Attraction } from '../../types';

const mockAttraction: Attraction = {
  id: 'gugong-taihedian',
  name: '太和殿',
  areaId: 'gugong',
  location: [116.397, 39.916],
  radius: 40,
  image: '',
  segments: [{ text: '太和殿讲解' }],
};

describe('ProximityAlert', () => {
  it('renders attraction name and distance', () => {
    render(
      <ProximityAlert
        attraction={mockAttraction}
        distance={200}
        onPlay={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText('太和殿')).toBeTruthy();
    expect(screen.getByText(/200m/)).toBeTruthy();
  });

  it('renders distance in km when >= 1000m', () => {
    render(
      <ProximityAlert
        attraction={mockAttraction}
        distance={1500}
        onPlay={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText(/1\.5km/)).toBeTruthy();
  });

  it('calls onPlay when play button clicked', () => {
    const onPlay = vi.fn();
    render(
      <ProximityAlert
        attraction={mockAttraction}
        distance={50}
        onPlay={onPlay}
        onDismiss={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('开始讲解'));
    expect(onPlay).toHaveBeenCalledWith(mockAttraction);
  });

  it('calls onDismiss when close button clicked', () => {
    const onDismiss = vi.fn();
    render(
      <ProximityAlert
        attraction={mockAttraction}
        distance={50}
        onPlay={vi.fn()}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(screen.getByLabelText('关闭'));
    expect(onDismiss).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npx vitest run src/components/__tests__/ProximityAlert.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement ProximityAlert component**

Create `src/components/ProximityAlert.tsx`:

```tsx
import type { Attraction } from '../types';
import './ProximityAlert.css';

interface ProximityAlertProps {
  attraction: Attraction;
  distance: number;
  onPlay: (attraction: Attraction) => void;
  onDismiss: () => void;
}

export default function ProximityAlert({
  attraction,
  distance,
  onPlay,
  onDismiss,
}: ProximityAlertProps) {
  const distText =
    distance < 1000
      ? `${Math.round(distance)}m`
      : `${(distance / 1000).toFixed(1)}km`;

  return (
    <div className="proximity-alert">
      <div className="proximity-alert-content">
        <div className="proximity-alert-info">
          <span className="proximity-alert-label">你已进入</span>
          <h3 className="proximity-alert-name">{attraction.name}</h3>
          <span className="proximity-alert-distance">距你 {distText}</span>
        </div>
        <div className="proximity-alert-actions">
          <button
            className="proximity-alert-play"
            onClick={() => onPlay(attraction)}
          >
            开始讲解
          </button>
          <button
            className="proximity-alert-close"
            onClick={onDismiss}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
```

Create `src/components/ProximityAlert.css`:

```css
.proximity-alert {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.proximity-alert-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg, #1a73e8, #1557b0);
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(26, 115, 232, 0.4);
  color: white;
  gap: 12px;
}

.proximity-alert-info {
  flex: 1;
  min-width: 0;
}

.proximity-alert-label {
  font-size: 12px;
  opacity: 0.8;
}

.proximity-alert-name {
  margin: 2px 0;
  font-size: 17px;
  font-weight: 700;
}

.proximity-alert-distance {
  font-size: 13px;
  opacity: 0.85;
}

.proximity-alert-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.proximity-alert-play {
  padding: 10px 18px;
  background: white;
  color: #1a73e8;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.proximity-alert-play:active {
  background: #e8f0fe;
}

.proximity-alert-close {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  background: none;
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.proximity-alert-close:active {
  background: rgba(255, 255, 255, 0.15);
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run src/components/__tests__/ProximityAlert.test.tsx
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProximityAlert.tsx src/components/ProximityAlert.css src/components/__tests__/ProximityAlert.test.tsx
git commit -m "feat: add ProximityAlert component with slide-up animation"
```

---

### Task 3: Integrate into App.tsx

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: Update App.tsx**

Replace `src/App.tsx` with:

```tsx
import { useState, useCallback, useMemo } from 'react';
import type { Attraction } from './types';
import { useGeolocation } from './hooks/useGeolocation';
import { useNearbyAttractions } from './hooks/useNearbyAttractions';
import { useProximityAlert } from './hooks/useProximityAlert';
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
  const { location, error } = useGeolocation();
  const { nearby, unplayedNearby, nearestUnplayed } = useNearbyAttractions(location, allAttractions);

  const handleProximityPlay = useCallback((attraction: Attraction) => {
    setSelectedAttraction(attraction);
    setView('player');
  }, []);

  const { status: alertStatus, target: alertTarget, dismiss, markTriggered } =
    useProximityAlert({ nearestUnplayed, onPlay: handleProximityPlay });

  const displayAttractions = useMemo(() => {
    if (nearby.length > 0) return nearby;
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
                  {alertStatus === 'alerting' && alertTarget && (
                    <ProximityAlert
                      attraction={alertTarget}
                      distance={haversineDistance(
                        location || DEFAULT_CENTER,
                        alertTarget.location,
                      )}
                      onPlay={markTriggered}
                      onDismiss={dismiss}
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

- [ ] **Step 2: Update App.css**

Add the bottom-overlay wrapper style. Replace the `.bottom-cards` block and add `.bottom-overlay` in `src/App.css`:

```css
.bottom-overlay {
  position: absolute;
  bottom: 16px;
  left: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
}

.bottom-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all existing + new tests PASS.

- [ ] **Step 4: Run build**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/App.css
git commit -m "feat: integrate GPS proximity alert into App shell"
```

---

### Task 4: Update FEATURE_MAP.md

**Files:**
- Modify: `docs/FEATURE_MAP.md`

- [ ] **Step 1: Update feature statuses**

In `docs/FEATURE_MAP.md`, change:

```
- ⬜ 进入景点范围时自动弹窗/震动提示
```
to:
```
- ✅ 进入景点范围时自动弹窗/震动提示
```

And:

```
- ⬜ 离开当前景点后自动触发下一个最近景点
```
remains unchanged (not implemented yet).

- [ ] **Step 2: Commit**

```bash
git add docs/FEATURE_MAP.md
git commit -m "docs: mark GPS proximity alert as implemented in FEATURE_MAP"
```

---

### Task 5: Final verification

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit
```

Expected: no type errors.
