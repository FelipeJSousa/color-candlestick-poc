// Mock API schema — each candle has the standard KLine fields
// plus optional bodyColor and wickColor for custom rendering.

export type ApiCandle = {
    timestamp: number
    open: number
    high: number
    low: number
    close: number
    volume: number
    bodyColor?: string
    wickColor?: string
}

// Colors palette for the mock signals
const COLORS = {
    bullishStrong: { body: '#00E676', wick: '#69F0AE' },   // bright green — strong buy
    bullish: { body: '#4CAF50', wick: '#81C784' },   // green — buy
    neutral: { body: '#9E9E9E', wick: '#BDBDBD' },   // grey — indecision
    bearish: { body: '#FF5252', wick: '#FF8A80' },   // red — sell
    bearishStrong: { body: '#B71C1C', wick: '#E53935' },   // dark red — strong sell
    highlight: { body: '#FF9800', wick: '#FFC107' },   // orange — alert/divergence
    signal: { body: '#7C4DFF', wick: '#B388FF' },   // purple — custom signal
}

function generateCandles(count: number): ApiCandle[] {
    const candles: ApiCandle[] = []
    let price = 45000
    // Start 60 minutes * count seconds ago
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
        const vol = Math.random()
        const change = (Math.random() - 0.48) * price * 0.02
        const open = price
        const close = price + change
        const high = Math.max(open, close) + Math.random() * price * 0.005
        const low = Math.min(open, close) - Math.random() * price * 0.005

        // Pick color based on close vs open & predefined signal pattern
        let colors
        if (i % 10 === 7) {
            colors = signals[7]  // orange highlight candle every 10
        } else if (i % 17 === 0) {
            colors = signals[8]  // purple signal candle every 17
        } else if (close > open * 1.01) {
            colors = COLORS.bullishStrong
        } else if (close > open) {
            colors = COLORS.bullish
        } else if (close < open * 0.99) {
            colors = COLORS.bearishStrong
        } else if (close < open) {
            colors = COLORS.bearish
        } else {
            colors = COLORS.neutral
        }

        candles.push({
            timestamp: ts,
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume: Math.floor(vol * 10000 + 1000),
            bodyColor: colors.body,
            wickColor: colors.wick,
        })

        price = close
        ts += 60 * 1000
    }

    return candles
}

// Simulates a fetch('/api/candles') call with a small delay
export async function fetchCandles(count = 120): Promise<ApiCandle[]> {
    return new Promise(resolve => {
        setTimeout(() => resolve(generateCandles(count)), 300)
    })
}
