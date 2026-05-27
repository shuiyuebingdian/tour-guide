# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

随身导游 — 离线优先的 PWA 旅游景点语音讲解应用。GPS 自动定位，走到景点附近自动 TTS 语音讲解，支持离线使用。

- **Tech:** React 18 + TypeScript + Vite 5, vite-plugin-pwa, 高德地图 JS API, Web Speech Synthesis API
- **Deploy:** GitHub Pages via Actions (`.github/workflows/deploy.yml`), push to master triggers auto-deploy
- **URL:** https://shuiyuebingdian.github.io/tour-guide

## Source of Truth

When requirements conflict, follow this order:

1. `CLAUDE.md` — repository rules, architecture constraints, workflow
2. `docs/PRODUCT_REQUIREMENTS.md` — product scope, user stories, acceptance criteria
3. `docs/FEATURE_MAP.md` — current implementation status and backlog
4. Current source code and tests
5. Historical plans under `docs/superpowers/plans/` — reference only; checkboxes may be stale

Do not re-scaffold or rewrite large parts of the app unless explicitly requested. Prefer small, focused changes that preserve the existing architecture.

## Commands

```bash
npm run dev          # Dev server at localhost:5173
npm run build        # Production build (tsc + vite build)
npm run preview      # Preview production build locally
npx vitest run       # Run tests
npx tsc --noEmit     # Type check only
```

Before finishing any code change, run at least:

```bash
npm run build
npx vitest run
```

If the change is docs/data-only and cannot affect code, explain why validation was skipped.

## Development Workflow

Use [`docs/AGENT_DEVELOPMENT_GUIDE.md`](docs/AGENT_DEVELOPMENT_GUIDE.md) for the standard autonomous workflow: task intake, implementation loop, validation, and reporting format. For UI work, use [`docs/UI_STYLE_GUIDE.md`](docs/UI_STYLE_GUIDE.md). For attraction content or city expansion, use [`docs/DATA_GUIDE.md`](docs/DATA_GUIDE.md).

## Architecture

```
src/
├── types/index.ts           # City, ScenicArea, Attraction, Segment interfaces
├── data/                    # Pre-bundled static JSON (cities, areas, attractions)
│   ├── cities.json
│   ├── areas.json
│   └── attractions/beijing.json
├── utils/geo.ts             # Haversine distance, isNearby, sortByDistance
├── hooks/
│   ├── useGeolocation.ts    # GPS watchPosition
│   ├── useSpeech.ts         # Web Speech Synthesis TTS wrapper
│   ├── usePlayHistory.ts    # localStorage-backed "played today" tracking
│   └── useNearbyAttractions.ts  # Proximity detection + play history filtering
├── components/
│   ├── MapView.tsx          # 高德地图 + user/attraction markers
│   ├── AttractionCard.tsx   # Bottom card showing nearby attraction
│   ├── PlayerView.tsx       # Segment-by-segment TTS playback with controls
│   ├── ListView.tsx         # City-grouped browse list
│   └── SearchBar.tsx        # Search input
└── App.tsx                  # Shell: tab navigation (map/list), view routing
```

**Data flow:** Static JSON → App.tsx combines all attractions → `useNearbyAttractions(location, allAttractions)` → MapView markers + AttractionCard list → PlayerView on click.

**No backend, no runtime API calls** (except map tiles from amap.com). All attraction data is pre-bundled at build time.

## Autonomous Development Rules

Claude should proceed without asking follow-up questions when the decision is low-risk and reversible. Use these defaults:

- **UX default:** mobile-first, portrait PWA, Android Chrome first; desktop should not break.
- **Playback default:** do not force autoplay unless browser/user-gesture constraints allow it; prefer a clear prompt or user action.
- **Distance default:** attraction trigger radius is per data item; use 30m when missing.
- **Data default:** keep all attraction data static under `src/data/`; no backend/API unless explicitly approved.
- **Storage default:** use `localStorage` for small preferences/history; only introduce IndexedDB for larger offline assets.
- **Styling default:** plain CSS modules/files matching existing component CSS; no UI framework unless explicitly approved.
- **Testing default:** add/adjust Vitest tests for utilities, hooks, and deterministic component behavior.
- **Dependencies default:** avoid new runtime dependencies unless they remove significant complexity.

Ask before proceeding only when a change would:

- Add a backend, database, authentication, paid service, or large dependency.
- Change the product scope, data ownership/copyright strategy, or deployment target.
- Require real credentials/API keys that are not already configured.
- Remove existing features or rewrite the app structure.

## Definition of Done

For feature work:

- Implementation matches `docs/PRODUCT_REQUIREMENTS.md` and updates `docs/FEATURE_MAP.md` when feature status changes.
- `npm run build` passes.
- `npx vitest run` passes, or a clear reason is documented.
- Manual-only checks are recorded against `docs/QA_CHECKLIST.md` when GPS, TTS, PWA install, or real-device behavior is affected.
- New user-facing behavior has basic empty/loading/error states.
- PWA/offline expectations are explicit: app shell and bundled data offline; map tiles depend on AMap/browser cache.
- Mobile layout is checked for small screens.

For data work:

- JSON follows `src/types/index.ts`.
- Coordinates use the same coordinate system expected by AMap display and distance calculations.
- Text is original or legally usable; do not copy copyrighted guide text verbatim.
- Images, when added, are WebP and optimized for offline bundle size.

## Feature Map

功能实现状态记录在 [`docs/FEATURE_MAP.md`](docs/FEATURE_MAP.md)，每次代码变更涉及功能变化时同步更新。

## Product Requirements

产品需求、MVP 边界、验收标准、后续优先级见 [`docs/PRODUCT_REQUIREMENTS.md`](docs/PRODUCT_REQUIREMENTS.md)。实现功能前优先检查该文件，避免反复确认。

## Data Guide

新增城市、景区、景点、讲解文案和图片时，遵循 [`docs/DATA_GUIDE.md`](docs/DATA_GUIDE.md)。重点确认坐标系、文案版权、JSON 字段完整性和离线包体积。

## UI Style Guide

界面设计、配色、组件状态、移动端布局和可访问性遵循 [`docs/UI_STYLE_GUIDE.md`](docs/UI_STYLE_GUIDE.md)。默认风格为“现代文化旅行”：清爽地图底、温暖文化感、卡片式信息层、移动端单手可操作。

---

## Current State (v1.0 初版)

Beijing data only: 故宫 with 5 sub-attractions (午门, 太和殿, 中和殿, 保和殿, 乾清宫). TTS-based playback (no audio files). PWA with offline caching. Deployed to GitHub Pages.

## Known Limitations

- 高德 API key 通过 Vite 环境变量注入（`.env` / CI env），key 仍会出现在客户端 bundle 中
- GPS auto-trigger popup not implemented (needs real location testing)
- No attraction images yet
- Single city data
