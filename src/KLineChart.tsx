import { useEffect, useRef, useState } from 'react'
import { init, dispose, registerIndicator } from 'klinecharts'
import type { Chart, KLineData } from 'klinecharts'
import customColoredCandles from './customColoredCandles'
import { fetchIndicator } from './api'
import { fetchOHLC, fetchSMVolume, fetchPEI, fetchTrendControl } from './mockData'
import type { LayoutItem, IndicatorResponse } from './dynamicIndicators'
import { createDynamicIndicatorTemplate } from './dynamicIndicators'

type Status = 'loading' | 'ready' | 'error'

// Register OHLC custom indicator once
registerIndicator(customColoredCandles)

export default function KLineChart() {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<Chart | null>(null)
    const addedIndicatorsRef = useRef<{ paneId: string, name: string }[]>([])
    const [status, setStatus] = useState<Status>('loading')
    const [ticker, setTicker] = useState('VLID3')
    const [periodDays, setPeriodDays] = useState(365)
    const [interval, setInterval] = useState('1d')
    const [useMock, setUseMock] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<string>('')
    const [activeIndicators, setActiveIndicators] = useState<string[]>(['SM_Volume', 'PEI', 'Trend_Control'])

    const loadData = async (chart: Chart, active: string[], currentTicker: string, currentPeriod: number, currentInterval: string, isMock: boolean) => {
        setStatus('loading')
        try {
            // 1. Fetch decoupled APIs in parallel logically
            const promises: Promise<IndicatorResponse>[] = []

            if (isMock) {
                // mockData functions take a 'count' which we reuse as periodDays logic for the mock chart size
                promises.push(fetchOHLC(currentPeriod))
                if (active.includes('SM_Volume')) promises.push(fetchSMVolume(currentPeriod))
                if (active.includes('PEI')) promises.push(fetchPEI(currentPeriod))
                if (active.includes('Trend_Control')) promises.push(fetchTrendControl(currentPeriod))
            } else {
                promises.push(fetchIndicator('ohlc', currentTicker, currentPeriod, currentInterval))
                if (active.includes('SM_Volume')) promises.push(fetchIndicator('sm_volume', currentTicker, currentPeriod, currentInterval))
                if (active.includes('PEI')) promises.push(fetchIndicator('pei', currentTicker, currentPeriod, currentInterval))
                if (active.includes('Trend_Control')) promises.push(fetchIndicator('trend_control', currentTicker, currentPeriod, currentInterval))
            }

            const responses = await Promise.all(promises)

            // Combine layouts into a single registry definition dictionary
            const allLayouts: LayoutItem[] = responses.flatMap(r => r.layout)

            // Register dynamic templates from backend config into KLineCharts
            allLayouts.forEach(layout => {
                if (layout.type !== 'ohlc') {
                    const template = createDynamicIndicatorTemplate(layout)
                    registerIndicator(template)
                }
            })

            // Clean previously added dynamic panes
            addedIndicatorsRef.current.forEach(({ paneId, name }) => {
                chart.removeIndicator(paneId, name)
            })
            addedIndicatorsRef.current = []

            // Setup Panes properly
            // Clear existing panes if needed or ensure they map correctly
            chart.createIndicator('CustomColoredCandles', false, { id: 'candle_pane' })

            // Re-map the indicators based on backend instructions
            const createdPanes = new Set<string>(['candle_pane', 'main'])

            allLayouts.forEach(layout => {
                const paneId = layout.pane === 'main' ? 'candle_pane' : layout.pane

                // createIndicator syntax: createIndicator(indicatorName, isStack, paneOptions)
                if (layout.type !== 'ohlc') {
                    if (!createdPanes.has(paneId)) {
                        chart.createIndicator(layout.id, false, { id: paneId })
                        createdPanes.add(paneId)
                    } else {
                        // Stack indicators if pane already exists (like PEI Dashed + PEI Bar on sub_pane_2)
                        chart.createIndicator(layout.id, true, { id: paneId })
                    }
                    addedIndicatorsRef.current.push({ paneId, name: layout.id })
                }
            })

            // 2. Merge all data efficiently by timestamp
            // Maps timestamp -> unified object
            const dataMap = new Map<number, Record<string, unknown>>()

            for (const dataset of responses) {
                for (const item of dataset.data as Record<string, unknown>[]) {
                    const ts = item.timestamp as number
                    const existing = dataMap.get(ts) || {}
                    dataMap.set(ts, { ...existing, ...item })
                }
            }

            const ohlcLayouts = allLayouts.filter(l => l.type === 'ohlc')

            // Convert map back to sorted array and map dynamic colorKeys for OHLC natively
            const mergedData = Array.from(dataMap.values()).sort((a, b) => (a.timestamp as number) - (b.timestamp as number)).map(item => {
                const mappedItem = { ...item }
                ohlcLayouts.forEach(layout => {
                    if (layout.colorKeys) {
                        if (mappedItem[layout.colorKeys.body]) {
                            mappedItem.bodyColor = mappedItem[layout.colorKeys.body]
                        }
                        if (mappedItem[layout.colorKeys.wick]) {
                            mappedItem.wickColor = mappedItem[layout.colorKeys.wick]
                        }
                    }
                })
                return mappedItem
            })

            // 3. Inject fully dynamic data
            chart.applyNewData(mergedData as KLineData[])

            setLastUpdated(new Date().toLocaleTimeString())
            setStatus('ready')
        } catch (e) {
            console.error('Data fetch or merging error', e)
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    type: 'candle_solid' as any,
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

        if (!chart) return
        chartRef.current = chart

        loadData(chart, activeIndicators, ticker, periodDays, interval, useMock)

        const handleResize = () => chart.resize()
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
            // Save ref to variable as React suggests for cleanup
            const currentContainer = containerRef.current
            if (currentContainer) dispose(currentContainer)
            chartRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Remove dependency array variables to fix stale closure over local states
    // but the actual React pattern is safely mapping the inputs on event triggers
    const handleRefresh = () => {
        if (chartRef.current) loadData(chartRef.current, activeIndicators, ticker, periodDays, interval, useMock)
    }

    const toggleIndicator = (id: string, checked: boolean) => {
        const next = checked ? [...activeIndicators, id] : activeIndicators.filter(x => x !== id)
        setActiveIndicators(next)
        if (chartRef.current) loadData(chartRef.current, next, ticker, periodDays, interval, useMock)
    }

    const handleApplyFilters = () => {
        if (chartRef.current) loadData(chartRef.current, activeIndicators, ticker, periodDays, interval, useMock)
    }

    const toggleMock = (checked: boolean) => {
        setUseMock(checked)
        if (chartRef.current) loadData(chartRef.current, activeIndicators, ticker, periodDays, interval, checked)
    }

    return (
        <div className="chart-wrapper">
            {/* Toolbar */}
            <div className="chart-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`asset-dot ${status === 'loading' ? 'loading' : ''}`} />
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            style={{ background: '#1e1e2e', border: '1px solid #333', color: '#fff', padding: '4px 8px', borderRadius: '4px', width: '80px', textTransform: 'uppercase' }}
                            placeholder="Ticker"
                        />
                        {lastUpdated && (
                            <span className="last-updated" style={{ fontSize: '11px' }}>Updated {lastUpdated}</span>
                        )}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fff', fontSize: '12px', cursor: 'pointer', marginLeft: '10px' }}>
                            <input
                                type="checkbox"
                                checked={useMock}
                                onChange={(e) => toggleMock(e.target.checked)}
                            />
                            Use Mock
                        </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ fontSize: '12px', color: '#aaa' }}>Period (days): {periodDays}</label>
                        <input
                            type="range"
                            min="1"
                            max="730"
                            value={periodDays}
                            onChange={(e) => setPeriodDays(parseInt(e.target.value))}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '5px' }}>
                        {['30min', '1d', '5d', '7d', '30d', '6m', '1a', '5a'].map(inv => (
                            <button
                                key={inv}
                                onClick={() => setInterval(inv)}
                                style={{
                                    background: interval === inv ? '#2979FF' : '#2A2A35',
                                    border: 'none',
                                    color: '#fff',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                }}
                            >
                                {inv}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleApplyFilters}
                        style={{
                            background: '#00E676',
                            border: 'none',
                            color: '#000',
                            fontWeight: 'bold',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        Load
                    </button>

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

                <div className="toolbar-indicators" style={{ display: 'flex', gap: '15px', alignItems: 'center', paddingBottom: '5px' }}>
                    {[{ id: 'SM_Volume', label: 'SM Volume' }, { id: 'PEI', label: 'PEI' }, { id: 'Trend_Control', label: 'Trend Control' }].map(ind => (
                        <label key={ind.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={activeIndicators.includes(ind.id)}
                                onChange={(e) => toggleIndicator(ind.id, e.target.checked)}
                            />
                            {ind.label}
                        </label>
                    ))}
                </div>
            </div>

            {/* Canvas */}
            <div className="chart-container" ref={containerRef} />
        </div>
    )
}
