import type { KLineData, IndicatorTemplate, IndicatorSeries } from 'klinecharts'

export interface LayoutItem {
    id: string
    type: 'ohlc' | 'bar' | 'line'
    pane: 'main' | string
    style?: 'solid' | 'dashed'
    valueKey?: string
    colorKey?: string
    colorKeys?: {
        body: string
        wick: string
    }
}

export interface IndicatorResponse {
    layout: LayoutItem[]
    data: unknown[]
}

// Helper typing to avoid explicit `any`
interface DynamicData extends KLineData {
    [key: string]: unknown
}

// Ensure the hex color is visually correct and dashed lines map well
export function createDynamicIndicatorTemplate(layout: LayoutItem): IndicatorTemplate {
    return {
        name: layout.id,
        shortName: layout.id,
        series: 'normal' as IndicatorSeries,
        calcParams: [],
        figures: layout.valueKey ? [
            { key: layout.valueKey, type: layout.type === 'bar' ? 'bar' : 'line', baseValue: layout.type === 'bar' ? 0 : undefined }
        ] : [],
        shouldFormatBigNumber: true,
        // Since backend already calculates, we return original data array object straight mapped
        calc: (dataList: KLineData[]) => {
            return dataList.map(kLineData => {
                const item = kLineData as DynamicData
                const result = {
                    timestamp: item.timestamp,
                    open: item.open || 0,
                    high: item.high || 0,
                    low: item.low || 0,
                    close: item.close || 0
                } as DynamicData
                if (layout.valueKey && item[layout.valueKey] !== undefined) {
                    result[layout.valueKey] = item[layout.valueKey]
                    result.value = item[layout.valueKey] // Klinecharts tooltip uses .value sometimes
                }
                return result
            })
        },
        createTooltipDataSource: () => {
            // Assume we want tooltip for hovered data. Finding mapping requires chart logic, returning empty since it's custom drawn.
            return {
                name: layout.id,
                calcParamsText: '',
                values: [],
                icons: []
            }
        },
        draw: ({
            ctx,
            kLineDataList,
            visibleRange,
            barSpace,
            xAxis,
            yAxis,
        }) => {
            if (layout.type === 'ohlc') return false // Handled by separate customColoredCandles

            const { from, to } = visibleRange
            ctx.save()

            if (layout.type === 'bar') {
                const halfBar = Math.floor(barSpace.bar / 2)
                const zeroY = yAxis.convertToPixel(0)

                for (let i = from; i < to; i++) {
                    const data = kLineDataList[i] as DynamicData
                    if (!data || !layout.valueKey || data[layout.valueKey] === undefined) continue

                    const rawVal = Number(data[layout.valueKey])
                    if (isNaN(rawVal)) continue

                    const x = xAxis.convertToPixel(i)
                    const y = yAxis.convertToPixel(rawVal)

                    const bottomY = zeroY

                    const height = Math.abs(bottomY - y)
                    const topY = Math.min(bottomY, y)

                    // Provide safety fallback for canvas rendering functions
                    if (isNaN(x) || isNaN(y) || isNaN(height) || isNaN(topY)) continue

                    const color = layout.colorKey ? (data[layout.colorKey] as string || '#9E9E9E') : '#9E9E9E'
                    ctx.fillStyle = color

                    ctx.fillRect(
                        Math.round(x) - halfBar,
                        Math.round(topY),
                        Math.max(Math.round(barSpace.bar), 1),
                        Math.max(Math.round(height), 1)
                    )
                }
            } else if (layout.type === 'line') {
                ctx.lineWidth = 2
                if (layout.style === 'dashed') {
                    ctx.setLineDash([4, 4])
                }

                ctx.beginPath()
                let isFirst = true
                let lastColor: string | null = null

                for (let i = from; i < to; i++) {
                    const data = kLineDataList[i] as DynamicData
                    if (!data || !layout.valueKey || data[layout.valueKey] === undefined) {
                        isFirst = true // break the line if data missing
                        continue
                    }

                    const rawVal = Number(data[layout.valueKey])
                    if (isNaN(rawVal)) {
                        isFirst = true
                        continue
                    }

                    const x = xAxis.convertToPixel(i)
                    const y = yAxis.convertToPixel(rawVal)
                    const color = layout.colorKey ? (data[layout.colorKey] as string || '#2196F3') : '#2196F3'

                    if (isNaN(x) || isNaN(y)) {
                        isFirst = true
                        continue
                    }

                    if (isFirst) {
                        // For the first point with a specific color
                        ctx.strokeStyle = color
                        ctx.beginPath()
                        ctx.moveTo(x, y)
                        isFirst = false
                        lastColor = color
                    } else {
                        // If color changes mid-line, stroke the old path, start new path from prev point
                        if (color !== lastColor) {
                            ctx.stroke()
                            ctx.beginPath()
                            const prevX = xAxis.convertToPixel(i - 1)
                            const prevData = kLineDataList[i - 1] as DynamicData
                            const prevY = yAxis.convertToPixel(Number(prevData[layout.valueKey]))
                            ctx.moveTo(prevX, prevY)
                            ctx.strokeStyle = color
                            lastColor = color
                        }
                        ctx.lineTo(x, y)
                    }
                }
                ctx.stroke()
            }

            ctx.restore()
            return true
        }
    }
}
