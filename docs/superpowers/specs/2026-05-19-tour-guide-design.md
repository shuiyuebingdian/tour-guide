# 随身导游 (Tour Guide) — 设计文档

## 概述

一款 PWA 旅游景点语音讲解应用。打开自动定位，走到景点附近自动播放讲解，像随身带了一个导游。所有数据预置打包，离线可用，零服务器成本。

## 核心体验

1. 打开 App → 地图自动定位 → 显示附近景区和子景点
2. 进入子景点范围（默认 30m）自动开始 TTS 语音讲解
3. 讲解同时显示文字文案和景点图片
4. 已听过的不重复触发，未听过的优先
5. 不在景点也能"云旅游"——搜索、浏览、远程听讲解

## 技术选型

| 层       | 选择                        | 理由                       |
| -------- | --------------------------- | -------------------------- |
| 前端框架 | React 18 + TypeScript       | 生态成熟，组件丰富           |
| 构建工具 | Vite + vite-plugin-pwa      | 构建快，PWA 集成简单         |
| 地图     | 高德地图 JS API (AMap)      | 国内定位和地图细节优于海外方案 |
| 语音     | Web Speech Synthesis API    | 零存储，中文语音质量可接受    |
| 存储     | IndexedDB（可选，未来扩展）   | 当前版本数据直接打包进应用    |
| 数据     | 静态 JSON 文件，构建时打包    | 无后端，零网络依赖           |
| 部署     | 静态文件托管（GitHub Pages） | 免费，HTTPS 开箱即用         |

## 数据结构

```typescript
// 城市
interface City {
  id: string;          // "beijing"
  name: string;        // "北京"
  center: [number, number]; // 地图中心
  zoom: number;        // 默认缩放级别
}

// 景区（大区域）
interface ScenicArea {
  id: string;          // "gugong"
  name: string;        // "故宫"
  cityId: string;      // "beijing"
  center: [number, number];
  radius: number;      // 景区范围半径(米)，进入即触发整体介绍
  overview: string;    // 景区整体介绍文案
  introAudioUrl?: string; // 预留：景区介绍音频（可选）
}

// 子景点（具体讲解点）
interface Attraction {
  id: string;          // "gugong-taihedian"
  name: string;        // "太和殿"
  areaId: string;      // 所属景区 "gugong"
  location: [number, number]; // [lng, lat]
  radius: number;      // 触发半径(米)，默认 30
  image: string;       // 图片路径，如 "/data/images/gugong-taihedian.webp"
  segments: Segment[]; // 讲解段落
}

// 讲解段落
interface Segment {
  text: string;        // 讲解文案
  heading?: string;    // 段落小标题
}
```

## 模块划分

```
src/
├── main.tsx                  # 入口
├── App.tsx                   # 根组件，路由/Tab切换
├── data/                     # 预置景点数据 (JSON, 构建时打包)
│   ├── cities.json
│   └── attractions/
│       ├── beijing.json
│       └── xian.json
├── components/
│   ├── MapView.tsx            # 地图主视图
│   ├── AttractionCard.tsx     # 底部景点卡片（可滑动）
│   ├── PlayerView.tsx         # 讲解播放页面
│   ├── ListView.tsx           # 景点列表（按城市分组）
│   └── SearchBar.tsx          # 搜索组件
├── hooks/
│   ├── useGeolocation.ts     # GPS 定位 hook
│   ├── useNearbyAttractions.ts # 计算附近景点、触发检测
│   ├── useSpeech.ts          # TTS 语音播报 hook
│   └── usePlayHistory.ts     # 已听记录（localStorage）
├── utils/
│   ├── geo.ts                # 距离计算、坐标工具
│   └── data-loader.ts        # 数据加载（当前直接 import，后续可切 IndexedDB）
└── pwa/
    └── sw.ts                 # Service Worker（vite-plugin-pwa 生成）
```

## 关键流程

### 1. GPS 定位 → 附近景点

```
GPS 更新坐标
  → 遍历所有 Attraction，计算距离 (Haversine 公式)
  → 过滤出距离 < radius 的子景点
  → 按距离排序
  → 排除已听过的（同一天内不重复触发）
  → 取最近的一个，触发讲解
```

### 2. 讲解播放

```
进入子景点范围
  → 弹出通知："您已到达【太和殿】，点击切换到讲解"
  → 用户点击（或设置自动播放）
  → 进入 PlayerView
  → 逐段用 SpeechSynthesis 朗读
  → 同步高亮当前朗读段落
  → 听完所有段落 → 标记为已听
  → 返回地图，继续监控位置
```

### 3. SpeechSynthesis 封装

- 语速默认 0.9，可调 0.5-2.0
- 监听 `boundary` 事件实现段落同步高亮
- 暂停/恢复/跳过/语速调节
- 锁屏/后台继续播放（Android PWA 支持）

## 离线策略

- 所有数据静态 JSON → import 进 bundle
- 图片 WebP 格式，压缩目标 < 50KB/张
- Service Worker 缓存所有静态资源（应用壳模式）
- 无运行时网络请求（地图瓦片除外，可选择性缓存）

## 数据生产流程（CLI 工具，后续迭代）

```
1. 爬虫：爬取景区官网/百科/旅游网站信息
2. 整理：筛选子景点、坐标、编写文案
3. 压缩：图片转 WebP，< 50KB
4. 输出：生成 JSON 文件，放入 src/data/
5. 构建：vite build 一键打包 → 部署
```

第一期手动整理 1-2 个城市（北京+西安），验证体验后再做自动化工具。

## 不在设计范围内（后续迭代）

- 用户登录和云同步
- 预录制高质量音频（Opus 格式）
- 后端 API / 数据库
- 后台管理端
- 社区贡献景点数据
- AI 生成讲解内容
