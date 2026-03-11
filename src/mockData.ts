import type { IndicatorResponse } from './dynamicIndicators'

export type ApiCandle = {
    timestamp: number
    open: number
    high: number
    low: number
    close: number
    bodyColor?: string
    wickColor?: string
}

const COLORS = {
    bullishStrong: { body: '#00E676', wick: '#69F0AE' },
    bullish: { body: '#4CAF50', wick: '#81C784' },
    neutral: { body: '#9E9E9E', wick: '#BDBDBD' },
    bearish: { body: '#FF5252', wick: '#FF8A80' },
    bearishStrong: { body: '#B71C1C', wick: '#E53935' },
    highlight: { body: '#FF9800', wick: '#FFC107' },
    signal: { body: '#7C4DFF', wick: '#B388FF' },
}

function generateBaseData(count: number) {
    const data = []
    let price = 45000
    let ts = Date.now() - count * 60 * 1000

    const signals = [
        COLORS.bullishStrong,
        COLORS.bullish,
        COLORS.bullish,
        COLORS.neutral,
        COLORS.bearish,
        COLORS.bearishStrong,
        COLORS.neutral,
        COLORS.highlight,
        COLORS.signal,
        COLORS.bullish,
    ]

    for (let i = 0; i < count; i++) {
        const change = (Math.random() - 0.48) * price * 0.02
        const open = price
        const close = price + change
        const high = Math.max(open, close) + Math.random() * price * 0.005
        const low = Math.min(open, close) - Math.random() * price * 0.005

        let colors
        if (i % 10 === 7) colors = signals[7]
        else if (i % 17 === 0) colors = signals[8]
        else if (close > open * 1.01) colors = COLORS.bullishStrong
        else if (close > open) colors = COLORS.bullish
        else if (close < open * 0.99) colors = COLORS.bearishStrong
        else if (close < open) colors = COLORS.bearish
        else colors = COLORS.neutral

        data.push({
            timestamp: ts,
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            bodyColor: colors.body,
            wickColor: colors.wick,
        })

        price = close
        ts += 60 * 1000
    }
    return data
}

const MOCK_COUNT = 120
let baseDataCache: { timestamp: number, open: number, high: number, low: number, close: number, bodyColor: string, wickColor: string }[] = []

function getBaseData(count: number) {
    if (baseDataCache.length !== count) {
        baseDataCache = generateBaseData(count)
    }
    return baseDataCache
}

export async function fetchOHLC(count = MOCK_COUNT): Promise<IndicatorResponse> {
    const data = getBaseData(count)
    return new Promise(resolve => setTimeout(() => {
        resolve({
            layout: [{
                id: 'Indicador_OHLC',
                type: 'ohlc',
                pane: 'main',
                colorKeys: { body: 'bodyColor', wick: 'wickColor' }
            }],
            data: data
        })
    }, 200))
}

export async function fetchSMVolume(count = MOCK_COUNT): Promise<IndicatorResponse> {
    const base = getBaseData(count)
    const data = base.map((b) => ({
        timestamp: b.timestamp,
        smVolumeValue: Math.floor(Math.random() * 10 + 2),
        smVolumeColor: b.close > b.open ? '#FF0000' : '#FFFFFF',
        smMediaValue: 5,
        smMediaColor: '#FFFF00',
        smSupExtValue: 6.5,
        smSupExtColor: '#FF0000',
        smSupIntValue: 5.0,
        smSupIntColor: '#FFA500',
        smInfIntValue: -4.0,
        smInfIntColor: '#FFA500',
        smInfExtValue: -5.5,
        smInfExtColor: '#FF0000',
        smZone: 'Neutro'
    }))

    return new Promise(resolve => setTimeout(() => {
        resolve({
            layout: [
                { id: "SM_Volume_Line_PETR4", type: "line", pane: "sub_pane_sm_volume", style: "solid", valueKey: "smVolumeValue", colorKey: "smVolumeColor" },
                { id: "SM_Volume_Media_PETR4", type: "line", pane: "sub_pane_sm_volume", style: "solid", valueKey: "smMediaValue", colorKey: "smMediaColor" },
                { id: "SM_Volume_SupExt_PETR4", type: "line", pane: "sub_pane_sm_volume", style: "solid", valueKey: "smSupExtValue", colorKey: "smSupExtColor" },
                { id: "SM_Volume_SupInt_PETR4", type: "line", pane: "sub_pane_sm_volume", style: "solid", valueKey: "smSupIntValue", colorKey: "smSupIntColor" },
                { id: "SM_Volume_InfInt_PETR4", type: "line", pane: "sub_pane_sm_volume", style: "solid", valueKey: "smInfIntValue", colorKey: "smInfIntColor" },
                { id: "SM_Volume_InfExt_PETR4", type: "line", pane: "sub_pane_sm_volume", style: "solid", valueKey: "smInfExtValue", colorKey: "smInfExtColor" }
            ],
            data: data
        })
    }, 250))
}

export async function fetchPEI(count = MOCK_COUNT): Promise<IndicatorResponse> {
    const base = getBaseData(count)
    const data = base.map((b, i) => {
        const isAlert = i % 15 === 0
        const barVal = Math.floor(Math.random() * 60 + 20)
        return {
            timestamp: b.timestamp,
            peiValue: barVal,
            peiColor: isAlert ? '#FF0000' : (b.close > b.open ? '#00FF00' : '#FFFF00'),
            peiCompraValue: 30.0,
            peiCompraColor: '#00FF00',
            peiMeioValue: 50.0,
            peiMeioColor: '#FFFFFF',
            peiVendaValue: 70.0,
            peiVendaColor: '#FF0000',
            trendSignal: isAlert ? 'Alta Volatilidade' : 'Neutro'
        }
    })

    return new Promise(resolve => setTimeout(() => {
        resolve({
            layout: [
                { id: "PEI_Barras_PETR4", type: "bar", pane: "sub_pane_pei", style: "solid", valueKey: "peiValue", colorKey: "peiColor" },
                { id: "PEI_Line_Compra_PETR4", type: "line", pane: "sub_pane_pei", style: "dashed", valueKey: "peiCompraValue", colorKey: "peiCompraColor" },
                { id: "PEI_Line_Meio_PETR4", type: "line", pane: "sub_pane_pei", style: "dashed", valueKey: "peiMeioValue", colorKey: "peiMeioColor" },
                { id: "PEI_Line_Venda_PETR4", type: "line", pane: "sub_pane_pei", style: "dashed", valueKey: "peiVendaValue", colorKey: "peiVendaColor" }
            ],
            data: data
        })
    }, 300))
}

export async function fetchTrendControl(count = MOCK_COUNT): Promise<IndicatorResponse> {
    const base = getBaseData(count)
    let ema34 = base[0].close
    let ema200 = base[0].close * 0.95
    let ema305 = base[0].close * 0.90
    const data = base.map((b) => {
        ema34 = ema34 * 0.9 + b.close * 0.1
        ema200 = ema200 * 0.98 + b.close * 0.02
        ema305 = ema305 * 0.99 + b.close * 0.01

        return {
            timestamp: b.timestamp,
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close,
            candleColor: b.close > ema34 ? '#00FF00' : '#FF0000',
            trendSignal: "Alta",
            ema34: parseFloat(ema34.toFixed(2)),
            ema34Color: "#0000FF",
            ema200: parseFloat(ema200.toFixed(2)),
            ema200Color: "#FFA500",
            ema305: parseFloat(ema305.toFixed(2)),
            ema305Color: "#800080"
        }
    })

    return new Promise(resolve => setTimeout(() => {
        resolve({
            layout: [
                { id: "Trend_Control_OHLC_PETR4", type: "ohlc", pane: "main", colorKeys: { body: "candleColor", wick: "candleColor" } },
                { id: "Trend_Control_EMA34_PETR4", type: "line", pane: "main", style: "solid", valueKey: "ema34", colorKey: "ema34Color" },
                { id: "Trend_Control_EMA200_PETR4", type: "line", pane: "main", style: "solid", valueKey: "ema200", colorKey: "ema200Color" },
                { id: "Trend_Control_EMA305_PETR4", type: "line", pane: "main", style: "solid", valueKey: "ema305", colorKey: "ema305Color" }
            ],
            data: data
        })
    }, 150))
}
