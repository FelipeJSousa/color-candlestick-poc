import { useEffect, useRef, useState } from 'react'
import { init, dispose, registerIndicator } from 'klinecharts'
import type { Chart } from 'klinecharts'
import customColoredCandles from './customColoredCandles'
import { fetchCandles } from './mockData'

type Status = 'loading' | 'ready' | 'error'

// Register once at module level — safe to call multiple times with the same name
registerIndicator(customColoredCandles)

export default function KLineChart() {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<Chart | null>(null)
    const [status, setStatus] = useState<Status>('loading')
    const [candleCount, setCandleCount] = useState(120)
    const [lastUpdated, setLastUpdated] = useState<string>('')

    const loadData = async (chart: Chart, count: number) => {
        setStatus('loading')
        try {
            const data = await fetchCandles(count)
            // v9 API: applyNewData(dataList, more?)
            chart.applyNewData(data as never[])
            setLastUpdated(new Date().toLocaleTimeString())
            setStatus('ready')
        } catch (e) {
            console.error('fetchCandles error', e)
            setStatus('error')
        }
    }

    useEffect(() => {
        if (!containerRef.current) return

        const chart = init(containerRef.current, {
            styles: {
                grid: {
                    show: true,
                    horizontal: { color: 'rgba(255,255,255,0.04)' },
                    vertical: { color: 'rgba(255,255,255,0.04)' },
                },
                candle: {
                    // Hide the built-in candle renderer — our indicator takes over
                    type: 'candle_solid',
                    bar: {
                        upColor: 'transparent',
                        downColor: 'transparent',
                        noChangeColor: 'transparent',
                        upBorderColor: 'transparent',
                        downBorderColor: 'transparent',
                        upWickColor: 'transparent',
                        downWickColor: 'transparent',
                    },
                    priceMark: {
                        last: {
                            show: true,
                            upColor: '#00E676',
                            downColor: '#FF5252',
                            noChangeColor: '#9E9E9E',
                            line: { show: true, dashedValue: [4, 4] },
                            text: { show: true, size: 11, paddingTop: 2, paddingBottom: 2, paddingLeft: 4, paddingRight: 4, borderRadius: 2 },
                        },
                    },
                },
                xAxis: {
                    axisLine: { color: 'rgba(255,255,255,0.15)' },
                    tickText: { color: '#9E9E9E', size: 11 },
                    tickLine: { color: 'rgba(255,255,255,0.1)' },
                },
                yAxis: {
                    axisLine: { color: 'rgba(255,255,255,0.15)' },
                    tickText: { color: '#9E9E9E', size: 11 },
                    tickLine: { color: 'rgba(255,255,255,0.1)' },
                },
                crosshair: {
                    show: true,
                    horizontal: {
                        show: true,
                        line: { dashedValue: [4, 4], color: 'rgba(255,255,255,0.3)' },
                        text: { show: true, size: 11, color: '#fff', backgroundColor: '#1e1e2e', borderColor: 'rgba(255,255,255,0.2)' },
                    },
                    vertical: {
                        show: true,
                        line: { dashedValue: [4, 4], color: 'rgba(255,255,255,0.3)' },
                        text: { show: true, size: 11, color: '#fff', backgroundColor: '#1e1e2e', borderColor: 'rgba(255,255,255,0.2)' },
                    },
                },
            },
        })

        chartRef.current = chart

        // Create custom indicator on the main candle pane
        chart.createIndicator('CustomColoredCandles', false, { id: 'candle_pane' })
        // Volume in a sub-pane
        chart.createIndicator('VOL')

        loadData(chart, 120)

        const handleResize = () => chart.resize()
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
            if (containerRef.current) dispose(containerRef.current)
            chartRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleRefresh = () => {
        if (chartRef.current) loadData(chartRef.current, candleCount)
    }

    const handleCountChange = (count: number) => {
        setCandleCount(count)
        if (chartRef.current) loadData(chartRef.current, count)
    }

    return (
        <div className="chart-wrapper">
            {/* Toolbar */}
            <div className="chart-toolbar">
                <div className="toolbar-left">
                    <span className="asset-label">
                        <span className={`asset-dot ${status === 'loading' ? 'loading' : ''}`} />
                        BTC/USDT
                    </span>
                    <span className="timeframe">1m</span>
                    {lastUpdated && (
                        <span className="last-updated">Updated {lastUpdated}</span>
                    )}
                </div>
                <div className="toolbar-right">
                    {[60, 120, 200].map(n => (
                        <button
                            key={n}
                            className={`count-btn ${candleCount === n ? 'active' : ''}`}
                            onClick={() => handleCountChange(n)}
                        >
                            {n}
                        </button>
                    ))}
                    <button
                        className="refresh-btn"
                        onClick={handleRefresh}
                        disabled={status === 'loading'}
                    >
                        {status === 'loading' ? (
                            <span className="spinner" />
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                            </svg>
                        )}
                        Refresh
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="chart-container" ref={containerRef} />

            {/* Color legend */}
            <div className="color-legend">
                {[
                    { color: '#00E676', label: 'Strong Bullish' },
                    { color: '#4CAF50', label: 'Bullish' },
                    { color: '#9E9E9E', label: 'Neutral' },
                    { color: '#FF5252', label: 'Bearish' },
                    { color: '#B71C1C', label: 'Strong Bearish' },
                    { color: '#FF9800', label: 'Alert' },
                    { color: '#7C4DFF', label: 'Signal' },
                ].map(item => (
                    <div key={item.label} className="legend-item">
                        <span className="legend-dot" style={{ background: item.color }} />
                        <span className="legend-text">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
