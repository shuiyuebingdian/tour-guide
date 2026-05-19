# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

随身导游 — 离线优先的 PWA 旅游景点语音讲解应用。GPS 自动定位，走到景点附近自动 TTS 语音讲解，支持离线使用。

- **Tech:** React 18 + TypeScript + Vite 5, vite-plugin-pwa, 高德地图 JS API, Web Speech Synthesis API
- **Deploy:** GitHub Pages via Actions (`./github/workflows/deploy.yml`), push to master triggers auto-deploy
- **URL:** https://shuiyuebingdian.github.io/tour-guide

## Commands

```bash
npm run dev          # Dev server at localhost:5173
npm run build        # Production build (tsc + vite build)
npm run preview      # Preview production build locally
npx vitest run       # Run tests
npx tsc --noEmit     # Type check only
```

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

## Current State (v1.0 初版)

Beijing data only: 故宫 with 5 sub-attractions (午门, 太和殿, 中和殿, 保和殿, 乾清宫). TTS-based playback (no audio files). PWA with offline caching. Deployed to GitHub Pages.

## Known Limitations

- 高德 API key is hardcoded in MapView.tsx (public repo — keep private if needed)
- GPS auto-trigger popup not implemented (needs real location testing)
- No attraction images yet
- Single city data
