# 随身导游 Tour Guide

离线优先的 PWA 旅游景点语音讲解应用。应用通过 GPS 定位用户，展示附近景点，并使用浏览器 TTS 播放讲解内容。景点数据预置在前端包中，无后端服务。

## 核心能力

- 地图定位：高德地图展示用户位置和景点标记。
- 附近景点：按距离计算附近未听景点。
- 语音讲解：使用 Web Speech Synthesis API 分段朗读。
- 云旅游：不在景点现场也可从列表搜索并播放讲解。
- 离线优先：应用壳、静态数据和资源由 Service Worker 缓存；地图瓦片依赖高德和浏览器缓存。

## 技术栈

- React 18 + TypeScript + Vite 5
- vite-plugin-pwa
- 高德地图 JS API
- Web Speech Synthesis API
- Vitest + Testing Library

## 开发命令

```bash
npm install
npm run dev
npm run build
npx vitest run
```

## 项目文档

- Claude/Agent 规则：[CLAUDE.md](CLAUDE.md)
- Agent 开发流程：[docs/AGENT_DEVELOPMENT_GUIDE.md](docs/AGENT_DEVELOPMENT_GUIDE.md)
- 产品需求：[docs/PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md)
- UI 风格指南：[docs/UI_STYLE_GUIDE.md](docs/UI_STYLE_GUIDE.md)
- 数据规范：[docs/DATA_GUIDE.md](docs/DATA_GUIDE.md)
- 手工验收清单：[docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md)
- 功能状态：[docs/FEATURE_MAP.md](docs/FEATURE_MAP.md)
- 初始设计：[docs/superpowers/specs/2026-05-19-tour-guide-design.md](docs/superpowers/specs/2026-05-19-tour-guide-design.md)

## 部署

推送到 `master` 后通过 GitHub Actions 部署到 GitHub Pages：

https://shuiyuebingdian.github.io/tour-guide

