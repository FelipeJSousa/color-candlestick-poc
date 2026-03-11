import type { KLineData, IndicatorTemplate, IndicatorSeries } from 'klinecharts'

export interface ApiKLineData extends KLineData {
    bodyColor?: string
    wickColor?: string
    color?: string
}

const customColoredCandles: IndicatorTemplate = {
    name: 'CustomColoredCandles',
    shortName: 'CC',
    series: 'normal' as unknown as IndicatorSeries,
    calcParams: [],

    calc: (dataList: KLineData[]) => dataList.map(() => ({})),

    draw: ({
        ctx,
        kLineDataList,
        visibleRange,
        bounding,
        barSpace,
        xAxis,
        yAxis,
    }) => {
        const { from, to } = visibleRange
        const halfBody = Math.floor(barSpace.bar / 2)
        const wickW = Math.max(1, Math.floor(barSpace.bar * 0.1))

        ctx.save()
        ctx.beginPath()
        ctx.rect(bounding.left, bounding.top, bounding.width, bounding.height)
        ctx.clip()

        for (let i = from; i < to; i++) {
            const k = kLineDataList[i] as ApiKLineData
            if (!k) continue

            const x = xAxis.convertToPixel(i)
            const openY = yAxis.convertToPixel(k.open)
            const closeY = yAxis.convertToPixel(k.close)
            const highY = yAxis.convertToPixel(k.high)
            const lowY = yAxis.convertToPixel(k.low)

            const bodyColor = k.bodyColor ?? k.color ?? '#9E9E9E'
            const wickColor = k.wickColor ?? k.bodyColor ?? k.color ?? '#9E9E9E'

            const bodyTop = Math.min(openY, closeY)
            const bodyBottom = Math.max(openY, closeY)
            const bodyHeight = Math.max(bodyBottom - bodyTop, 1)

            // Upper wick
            ctx.fillStyle = wickColor
            ctx.fillRect(
                Math.round(x) - Math.floor(wickW / 2),
                Math.round(highY),
                wickW,
                Math.round(bodyTop) - Math.round(highY),
            )

            // Lower wick
            ctx.fillRect(
                Math.round(x) - Math.floor(wickW / 2),
                Math.round(bodyBottom),
                wickW,
                Math.round(lowY) - Math.round(bodyBottom),
            )

            // Body
            ctx.fillStyle = bodyColor
            ctx.fillRect(
                Math.round(x) - halfBody,
                Math.round(bodyTop),
                Math.round(barSpace.bar),
                Math.round(bodyHeight),
            )
        }

        ctx.restore()
        return true
    },
}

export default customColoredCandles
