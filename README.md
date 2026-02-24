# 🕯️ KLineCharts Color POC

A proof of concept demonstrating **per-candle custom colors** in [KLineCharts v9](https://klinecharts.com/) using React + TypeScript + Vite.

The core idea: the API returns standard OHLCV data **plus** `bodyColor` and `wickColor` fields for each candle. A custom KLineCharts indicator reads those fields inside its `draw()` callback and paints each candle individually on the canvas.

---

## ✨ Features

- 📡 Mock API that returns candles with `bodyColor` + `wickColor` per bar
- 🎨 7 distinct color signals (Strong Bullish, Bullish, Neutral, Bearish, Strong Bearish, Alert, Signal)
- 📊 Custom KLineCharts indicator that overrides the default renderer
- 📦 Volume sub-pane rendered by KLineCharts built-in `VOL` indicator
- 🔄 Refresh button and candle count selector (60 / 120 / 200)
- 🌙 Dark theme UI with Tailwind CSS + custom CSS variables

---

## 🗂️ Project Structure

```
src/
├── mockData.ts              — Mock API: generates ApiCandle[] with bodyColor & wickColor
├── customColoredCandles.ts  — KLineCharts custom indicator: reads color fields in draw()
├── KLineChart.tsx           — React component: wires chart init, indicator, and data
├── App.tsx                  — Page layout: header, chart card, info panels
├── App.css                  — Dark theme styles (CSS custom properties)
└── main.tsx                 — Entry point (StrictMode intentionally removed)
```

---

## 📡 API Schema

Each candle extends the standard KLineCharts `KLineData` with two optional color fields:

```ts
type ApiCandle = {
  timestamp: number   // Unix ms
  open:      number
  high:      number
  low:       number
  close:     number
  volume:    number
  bodyColor?: string  // hex color for the candle body   e.g. "#FF9800"
  wickColor?: string  // hex color for the upper/lower wicks e.g. "#FFC107"
}
```

`applyNewData()` accepts any extra fields — the built-in renderer ignores them, but a registered custom indicator can access them freely.

---

## 🎨 Color Convention (mock)

| Color     | Signal                     |
| --------- | -------------------------- |
| `#00E676` | Strong Bullish             |
| `#4CAF50` | Bullish                    |
| `#9E9E9E` | Neutral / Doji             |
| `#FF5252` | Bearish                    |
| `#B71C1C` | Strong Bearish             |
| `#FF9800` | Alert (every 10th candle)  |
| `#7C4DFF` | Signal (every 17th candle) |

---

## 🔧 How It Works

```
Mock API  →  applyNewData(candles)  →  KLineCharts stores data (ignores unknown fields)
                                              │
                              createIndicator('CustomColoredCandles')
                                              │
                                    draw() iterates visible range
                                              │
                               reads k.bodyColor / k.wickColor
                                              │
                                  canvas.fillRect() per candle
```

### Key files explained

**`mockData.ts`** — Simulates `fetch('/api/candles')` with a 300 ms delay. Assigns colors based on price action (close vs open) and special periodic signals.

**`customColoredCandles.ts`** — KLineCharts `IndicatorTemplate` with:
- `calc`: returns an empty object per bar (no numeric series needed)
- `draw`: iterates `visibleRange`, converts index → x pixel via `xAxis.convertToPixel`, price → y pixel via `yAxis.convertToPixel`, then draws body and wicks with the API-provided colors

**`KLineChart.tsx`** — React component that:
1. Calls `registerIndicator(customColoredCandles)` once at module level
2. Initialises the chart with a transparent candle style (hides the built-in renderer)
3. Calls `createIndicator('CustomColoredCandles', false, { id: 'candle_pane' })` to attach the custom renderer to the main pane
4. Loads data via `chart.applyNewData()`

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## 🛠️ Tech Stack

| Tool         | Version    |
| ------------ | ---------- |
| React        | 19         |
| TypeScript   | 5.9        |
| Vite         | 7          |
| KLineCharts  | **9.8.12** |
| Tailwind CSS | 3          |

> **Why KLineCharts 9.8.12?**  
> Version 10 (currently in beta) has a completely different data-loading API (`setDataLoader` / `getBars` / `setSymbol` / `setPeriod`) and renamed several axis conversion methods. v9.8.12 uses the simpler `applyNewData()` pattern and is the current stable release.
