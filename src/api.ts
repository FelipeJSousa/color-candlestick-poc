import type { IndicatorResponse } from './dynamicIndicators'

export async function fetchIndicator(
    jobName: string,
    ticker: string,
    periodDays: number,
    interval: string
): Promise<IndicatorResponse> {
    const end = new Date()
    const start = new Date(end.getTime() - periodDays * 24 * 60 * 60 * 1000)

    const formatDate = (d: Date) => d.toISOString().split('T')[0]
    const args = `${ticker},${formatDate(start)},${formatDate(end)},${interval}`

    const response = await fetch('http://127.0.0.1:9000/job/trigger', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            job_name: jobName,
            args: args,
        }),
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch ${jobName}: ${response.statusText}`)
    }

    return response.json()
}
