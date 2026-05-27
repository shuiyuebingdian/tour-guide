# GPS Proximity Alert Design

> 进入景点范围时底部浮动卡片弹出 + 震动提示 + 防重复触发

## Overview

实现 GPS 进入景点范围自动提示：用户进入景点 radius 范围内时，从屏幕底部滑入一个浮动卡片，手机短震 200ms。每个景点每天最多弹窗一次。用户可点击播放或关闭卡片。

## State Machine

```
         GPS进入范围 + 当天未触发
idle ──────────────────────────────► alerting
  ▲                                    │
  │                   用户点击播放      │ 用户点关闭
  │                   (→ idle)        │ (→ dismissed)
  │                                    ▼
  └─── dismissed ◄────────────── dismissed
```

- **`idle`** — 不在任何景点范围内，或最近景点当天已触发过
- **`alerting`** — 已进入范围 + 当天未触发，显示卡片 + 震动
- **`dismissed`** — 用户关闭但不播放。保持此状态直到离开该景点范围（防止同一景点反复弹窗）

震动仅在 `idle → alerting` 转换时触发一次。

## useProximityAlert Hook

**文件:** `src/hooks/useProximityAlert.ts`

```typescript
interface ProximityAlertState {
  status: 'idle' | 'alerting' | 'dismissed';
  target: Attraction | null;
}

interface UseProximityAlertOptions {
  nearestUnplayed: Attraction | null;
  onPlay: (attraction: Attraction) => void;
}

function useProximityAlert(options: UseProximityAlertOptions): {
  status: ProximityAlertState['status'];
  target: Attraction | null;
  dismiss: () => void;
  markTriggered: () => void;
};
```

**内部机制:**

1. 接收 `useNearbyAttractions` 产出的 `nearestUnplayed`
2. 状态转换：
   - `nearestUnplayed` in range + 当天未触发 → `alerting` + `navigator.vibrate(200)`
   - `nearestUnplayed` 变化为新景点 → 重新进入 `alerting`
   - `nearestUnplayed` 为 null → 重置 `idle`
   - 用户 dismiss 后同一 target → 保持 `dismissed`
3. `dismiss()` → state 切 `dismissed`，target 不变
4. `markTriggered()` → 记录到 localStorage → 切 `idle` → 调用 `onPlay(target)`

**localStorage: `tour-guide-alerts`**

```json
{
  "2026-05-27": ["gugong-taihedian"]
}
```

记录每天已触发过弹窗的景点 ID，用于防重复。

**测试策略:**
- 模拟 `nearestUnplayed` 变化，验证状态转换
- 验证 `dismiss` 后同一 target 不重新 alert
- 验证 `markTriggered` 写入 localStorage 后 target 视为 "已触发"
- 震动调用无需测试（依赖浏览器 API mock）

## ProximityAlert 组件

**文件:** `src/components/ProximityAlert.tsx` + `src/components/ProximityAlert.css`

- 底部浮动卡片，`translateY` 动画滑入（300ms ease-out）
- 显示：景点名 + 距离（米/公里） + "开始讲解" 按钮 + × 关闭按钮
- Props: `attraction`, `distance`, `onPlay`, `onDismiss`
- 紧跟现有 UI 风格：白底圆角卡片 + 蓝色主按钮 + 阴影
- 卡片不自动消失，由用户操作

## 集成改动

**App.tsx:**
- 引入 `useProximityAlert`
- `nearestUnplayed` 来自 `useNearbyAttractions`
- 底部区域：`ProximityAlert` 在上方（alerting 时），现有 `AttractionCard` 列表在下方
- `onPlay` 回调：切到 PlayerView（复用现有 `handleAttractionClick`）

**MapView.tsx:** 无改动

## 边界情况

| 场景 | 行为 |
|------|------|
| 无 GPS 定位 | 状态保持 `idle`，不做任何提示 |
| 景点无 radius 字段 | 默认 30m |
| TTS 不可用 | 卡片仍弹出，由 PlayerView 处理降级 |
| 用户拒绝震动权限 | `navigator.vibrate` 静默失败，卡片正常弹出 |
| 同一景点离开后再次进入 | 当天已触发过，不再弹 |
| 锁屏状态下进入范围 | 取决于浏览器 Geolocation API 是否后台运行，不做额外保证 |
