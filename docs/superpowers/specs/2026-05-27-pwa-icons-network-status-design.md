# PWA Icons + Network Status Design

> 生成 PWA 应用图标（192+512），新增离线/在线状态 Toast 提示

## Overview

两件事情：(1) 将 manifest 中空的 `icons: []` 替换为两个 PNG 图标；(2) 监听网络状态变化，底部 Toast 提示。

## PWA 图标

**方案：** `npm install --save-dev sharp`，写 `scripts/generate-icons.js`，输入 SVG → 输出 192 和 512 PNG。prebuild 时自动运行。

**视觉规格:**
- 尺寸：192×192 + 512×512
- 背景：红色对角渐变 #c62828 → #e53935，圆角矩形
- 中央：白色几何建筑轮廓（简化宝塔：三层屋顶 + 底座）+ 外圈声波弧线
- 输出：`public/icon-192.png` 和 `public/icon-512.png`

**manfiest 配置更新：**
```json
"icons": [
  { "src": "./icon-192.png", "sizes": "192x192", "type": "image/png" },
  { "src": "./icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
]
```

**theme_color 保持 #1a73e8**（不改动）。

## 网络状态 Toast

**useNetworkStatus Hook:**
- 文件：`src/hooks/useNetworkStatus.ts`
- 监听 `window` 的 `online` / `offline` 事件
- 初始值：`navigator.onLine`
- 返回：`{ isOnline: boolean, wasOffline: boolean }`
- `wasOffline` 在恢复在线后一小段时间内为 true（用于显示"已恢复"Toast），2 秒后重置

**NetworkToast 组件:**
- 文件：`src/components/NetworkToast.tsx` + `NetworkToast.css`
- Props：`{ type: 'offline' | 'online' | null, onDone: () => void }`
- type='offline' 时从底部滑入橙色 Toast "⚠ 当前离线 — 已缓存内容仍可浏览"
- type='online' 时底部滑入绿色 Toast "✅ 网络已恢复"
- 3 秒后自动调用 `onDone()` 消失
- 使用 CSS transition（`translateY` + `opacity`），与 ProximityAlert 风格一致

**集成到 App.tsx:**
- 使用 `useNetworkStatus()` hook
- 在 `.bottom-overlay` 最上方或独立位置渲染 `NetworkToast`
- 离线 Toast 优先于在线 Toast（如果快速切换，显示离线）

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `scripts/generate-icons.js` | 新建 | 用 sharp 生成 PNG 图标 |
| `public/icon.svg` | 新建 | SVG 源图标 |
| `public/icon-192.png` | 新建 | 生成后提交 |
| `public/icon-512.png` | 新建 | 生成后提交 |
| `vite.config.ts` | 修改 | manifest.icons 配置 |
| `package.json` | 修改 | 新增 generate-icons 脚本 + devDependency |
| `src/hooks/useNetworkStatus.ts` | 新建 | online/offline 事件监听 |
| `src/hooks/__tests__/useNetworkStatus.test.ts` | 新建 | 测试 |
| `src/components/NetworkToast.tsx` | 新建 | Toast 组件 |
| `src/components/NetworkToast.css` | 新建 | Toast 样式 |
| `src/App.tsx` | 修改 | 集成 hook + 组件 |
| `docs/FEATURE_MAP.md` | 修改 | 更新功能状态 |

## 边界情况

| 场景 | 行为 |
|------|------|
| 快速切换离线→在线→离线 | 只显示当前状态（后面的覆盖前面的） |
| 页面首次加载时离线 | 不弹 Toast（避免打扰），但后续变化正常提示 |
| 浏览器不支持 online/offline 事件 | `isOnline` 始终为 `true`，不弹 Toast |
| SVG/PNG 图标不透明 | PWA 安装时系统会自动加圆角/背景，无需额外处理 |
| sharp 未安装 | prebuild 脚本检测并跳过，给出警告 |
