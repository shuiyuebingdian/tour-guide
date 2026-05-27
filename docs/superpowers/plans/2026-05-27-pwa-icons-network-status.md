# PWA Icons + Network Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate PWA app icons (192+512 PNG) from SVG, and add bottom Toast notifications for offline/online network status changes.

**Architecture:** A prebuild script uses `sharp` to convert an SVG icon into two PNG sizes. A `useNetworkStatus` hook listens to `online`/`offline` events with a `wasOffline` timer. A `NetworkToast` component renders at the bottom of the map view.

**Tech Stack:** Node.js, sharp (devDependency), React hooks, CSS transitions

---

### Task 1: PWA Icon Generation

**Files:**
- Create: `public/icon.svg`
- Create: `scripts/generate-icons.mjs`
- Modify: `package.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Create the SVG icon source**

Create `public/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#c62828"/>
      <stop offset="100%" stop-color="#e53935"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#bg)"/>
  <!-- Sound wave arcs -->
  <path d="M 180 320 A 100 100 0 0 1 332 320" fill="none" stroke="white" stroke-width="12" stroke-linecap="round"/>
  <path d="M 150 350 A 140 140 0 0 1 362 350" fill="none" stroke="white" stroke-width="10" stroke-linecap="round" opacity="0.6"/>
  <path d="M 120 380 A 180 180 0 0 1 392 380" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" opacity="0.35"/>
  <!-- Building / pagoda silhouette -->
  <rect x="220" y="140" width="72" height="24" rx="2" fill="white"/>
  <rect x="210" y="170" width="92" height="28" rx="2" fill="white"/>
  <rect x="200" y="204" width="112" height="32" rx="2" fill="white"/>
  <rect x="232" y="238" width="48" height="100" rx="2" fill="white"/>
  <!-- Base -->
  <rect x="180" y="342" width="152" height="18" rx="4" fill="white" opacity="0.7"/>
  <!-- Door -->
  <rect x="240" y="280" width="32" height="58" rx="16" fill="#c62828"/>
</svg>
```

- [ ] **Step 2: Install sharp as devDependency**

```bash
npm install --save-dev sharp
```

- [ ] **Step 3: Create the icon generation script**

Create `scripts/generate-icons.mjs`:

```javascript
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const SVG_PATH = 'public/icon.svg';
const OUT_DIR = 'public';

try {
  const sharp = await import('sharp');
} catch {
  console.warn('[generate-icons] sharp not installed, skipping. Run: npm install --save-dev sharp');
  process.exit(0);
}

const sharp = (await import('sharp')).default;

async function generate() {
  const sizes = [192, 512];
  for (const size of sizes) {
    const outPath = `${OUT_DIR}/icon-${size}.png`;
    await sharp(SVG_PATH)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`[generate-icons] Generated ${outPath}`);
  }
}

generate().catch((err) => {
  console.error('[generate-icons] Failed:', err.message);
  process.exit(1);
});
```

- [ ] **Step 4: Update package.json scripts**

In `package.json`, add the `generate-icons` and `prebuild` scripts:

Change the `"scripts"` block:
```json
"scripts": {
  "dev": "vite",
  "generate-icons": "node scripts/generate-icons.mjs",
  "prebuild": "npm run generate-icons",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "validate:data": "node scripts/validate-data.mjs"
}
```

Note: if `generate-icons` fails (sharp not installed), the script exits with code 0 with a warning, so `prebuild` won't block the build.

- [ ] **Step 5: Update vite.config.ts manifest icons**

In `src/vite.config.ts` → replace `icons: []` with:

```typescript
icons: [
  {
    src: './icon-192.png',
    sizes: '192x192',
    type: 'image/png',
  },
  {
    src: './icon-512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any maskable',
  },
],
```

- [ ] **Step 6: Run icon generation and build**

```bash
npm run generate-icons
npm run build
```

Expected: `public/icon-192.png` and `public/icon-512.png` are generated. Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add public/icon.svg public/icon-192.png public/icon-512.png scripts/generate-icons.mjs package.json package-lock.json vite.config.ts
git commit -m "feat: add PWA app icons (192+512) with red pagoda design"
```

---

### Task 2: useNetworkStatus Hook (TDD)

**Files:**
- Create: `src/hooks/__tests__/useNetworkStatus.test.ts`
- Create: `src/hooks/useNetworkStatus.ts`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/__tests__/useNetworkStatus.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '../useNetworkStatus';

describe('useNetworkStatus', () => {
  let onlineSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onlineSpy = vi.fn(() => true);
    Object.defineProperty(navigator, 'onLine', {
      get: onlineSpy,
      configurable: true,
    });
  });

  it('returns isOnline=true when navigator.onLine is true', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
  });

  it('returns isOnline=false when navigator.onLine is false', () => {
    onlineSpy.mockReturnValue(false);
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);
  });

  it('sets wasOffline=true after recovering from offline', () => {
    onlineSpy.mockReturnValue(false);
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(false);

    // Simulate going back online
    onlineSpy.mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(true);
  });

  it('waits to skip initial offline state on mount', () => {
    onlineSpy.mockReturnValue(false);
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.wasOffline).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npx vitest run src/hooks/__tests__/useNetworkStatus.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement useNetworkStatus hook**

Create `src/hooks/useNetworkStatus.ts`:

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (mountedRef.current) {
        setWasOffline(true);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Mark as mounted after first render
    mountedRef.current = true;

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Reset wasOffline after 2 seconds
  useEffect(() => {
    if (!wasOffline) return;
    const timer = setTimeout(() => setWasOffline(false), 2000);
    return () => clearTimeout(timer);
  }, [wasOffline]);

  return { isOnline, wasOffline };
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run src/hooks/__tests__/useNetworkStatus.test.ts
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useNetworkStatus.ts src/hooks/__tests__/useNetworkStatus.test.ts
git commit -m "feat: add useNetworkStatus hook for online/offline detection"
```

---

### Task 3: NetworkToast Component

**Files:**
- Create: `src/components/__tests__/NetworkToast.test.tsx`
- Create: `src/components/NetworkToast.tsx`
- Create: `src/components/NetworkToast.css`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/NetworkToast.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import NetworkToast from '../NetworkToast';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('NetworkToast', () => {
  it('renders offline message for type="offline"', () => {
    render(<NetworkToast type="offline" onDone={vi.fn()} />);
    expect(screen.getByText(/当前离线/)).toBeTruthy();
    expect(screen.getByText(/已缓存内容仍可浏览/)).toBeTruthy();
  });

  it('renders online message for type="online"', () => {
    render(<NetworkToast type="online" onDone={vi.fn()} />);
    expect(screen.getByText(/网络已恢复/)).toBeTruthy();
  });

  it('renders nothing for type=null', () => {
    const { container } = render(<NetworkToast type={null} onDone={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('calls onDone after 3 seconds', () => {
    const onDone = vi.fn();
    render(<NetworkToast type="offline" onDone={onDone} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onDone).toHaveBeenCalled();
  });

  it('clears timer and calls onDone on manual dismiss', () => {
    const onDone = vi.fn();
    render(<NetworkToast type="online" onDone={onDone} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Dismiss before 3 seconds
    const buttons = screen.getAllByRole('button');
    // The close button has aria-label
    const closeBtn = screen.getByLabelText('关闭');
    closeBtn.click();

    expect(onDone).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npx vitest run src/components/__tests__/NetworkToast.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement NetworkToast component**

Create `src/components/NetworkToast.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import './NetworkToast.css';

interface NetworkToastProps {
  type: 'offline' | 'online' | null;
  onDone: () => void;
}

export default function NetworkToast({ type, onDone }: NetworkToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!type) return;

    timerRef.current = setTimeout(() => {
      onDone();
    }, 3000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [type, onDone]);

  if (!type) return null;

  const isOnline = type === 'online';

  return (
    <div className={`network-toast ${isOnline ? 'toast-online' : 'toast-offline'}`}>
      <span className="network-toast-icon">{isOnline ? '✅' : '⚠'}</span>
      <span className="network-toast-text">
        {isOnline ? '网络已恢复' : '当前离线 — 已缓存内容仍可浏览'}
      </span>
      <button
        className="network-toast-close"
        onClick={onDone}
        aria-label="关闭"
      >
        ✕
      </button>
    </div>
  );
}
```

Create `src/components/NetworkToast.css`:

```css
.network-toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  color: white;
  font-size: 13px;
  animation: toastSlideUp 0.3s ease-out;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

@keyframes toastSlideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.toast-offline {
  background: #ff9800;
}

.toast-online {
  background: #4caf50;
}

.network-toast-icon {
  flex-shrink: 0;
  font-size: 16px;
}

.network-toast-text {
  flex: 1;
}

.network-toast-close {
  width: 22px;
  height: 22px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  background: none;
  color: white;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run src/components/__tests__/NetworkToast.test.tsx
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/NetworkToast.tsx src/components/NetworkToast.css src/components/__tests__/NetworkToast.test.tsx
git commit -m "feat: add NetworkToast component for offline/online notifications"
```

---

### Task 4: Integrate Network Status into App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update App.tsx**

Read the current `src/App.tsx` first. Then make these specific edits:

**Edit 1:** In the React import line, add `useEffect, useRef`:
Change:
```tsx
import { useState, useCallback, useMemo } from 'react';
```
To:
```tsx
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
```

**Edit 2:** Add new imports after `useProximityAlert` import:
```tsx
import { useNetworkStatus } from './hooks/useNetworkStatus';
import NetworkToast from './components/NetworkToast';
```

**Edit 3:** Add after `const { status: alertStatus, target: alertTarget, dismiss, markTriggered } = useProximityAlert(...)`:
```tsx
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
```

**Edit 4:** In JSX, inside `<div className="bottom-overlay">`, add as the first child:
```tsx
{networkToast && (
  <NetworkToast
    type={networkToast}
    onDone={() => setNetworkToast(null)}
  />
)}
```

Make these four edits to the file. Do not change any other code.

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate network status toast into App shell"
```

---

### Task 5: Update FEATURE_MAP.md

**Files:**
- Modify: `docs/FEATURE_MAP.md`

- [ ] **Step 1: Update feature statuses**

In `docs/FEATURE_MAP.md`:

Change:
```
- ⬜ 应用图标（当前为占位）
```
to:
```
- ✅ 应用图标（红色宝塔设计，192+512）
```

Change:
```
- ⬜ 离线提示（网络状态变化时提醒用户）
```
to:
```
- ✅ 离线提示（底部 Toast，3 秒自动消失）
```

- [ ] **Step 2: Commit**

```bash
git add docs/FEATURE_MAP.md
git commit -m "docs: mark PWA icons and network toast as implemented in FEATURE_MAP"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: build succeeds, `dist/` includes `icon-192.png` and `icon-512.png`.

- [ ] **Step 3: Verify generated icons exist**

```bash
ls -la public/icon-192.png public/icon-512.png
```

Expected: both files exist and are > 0 bytes.
