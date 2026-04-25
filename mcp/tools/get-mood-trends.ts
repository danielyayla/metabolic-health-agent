import { z } from 'zod'
import { type MCP } from '#mcp/index.ts'

function daysAgoDate(n: number) {
	const d = new Date()
	d.setUTCDate(d.getUTCDate() - n)
	return d.toISOString().split('T')[0]!
}

function avg(values: Array<number | null>): number | null {
	const valid = values.filter((v): v is number => v !== null)
	if (valid.length === 0) return null
	return Number((valid.reduce((s, v) => s + v, 0) / valid.length).toFixed(1))
}

export async function registerGetMoodTrendsTool(agent: MCP) {
	agent.server.registerTool(
		'get_mood_trends',
		{
			title: 'Get Mood Trends',
			description: `
Return daily mood, energy, focus, and anxiety scores for the past N days.
Also includes ketone readings for the same period to support correlation conversations.
			`.trim(),
			inputSchema: {
				days: z
					.number()
					.int()
					.min(1)
					.max(90)
					.optional()
					.default(14)
					.describe('Number of days to look back (default: 14, max: 90)'),
			},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ days }) => {
			const user = agent.getCallerContext().user
			if (!user) {
				return {
					content: [{ type: 'text', text: '❌ Not authenticated.' }],
					isError: true,
				}
			}

			const rawDb = agent.getRawDb()
			const cutoff = daysAgoDate(days)

			const [logsResult, ketoResult] = await Promise.all([
				rawDb
					.prepare(
						`SELECT date, mood_score, energy_score, focus_score, anxiety_score, mood_note
						 FROM daily_logs
						 WHERE user_id = ? AND date >= ?
						 ORDER BY date DESC`,
					)
					.bind(user.userId, cutoff)
					.all<{
						date: string
						mood_score: number | null
						energy_score: number | null
						focus_score: number | null
						anxiety_score: number | null
						mood_note: string | null
					}>(),
				rawDb
					.prepare(
						`SELECT date(measured_at) as day, avg(bhb_mmol) as avg_bhb
						 FROM ketone_readings
						 WHERE user_id = ? AND measured_at >= ?
						 GROUP BY date(measured_at)
						 ORDER BY day DESC`,
					)
					.bind(user.userId, cutoff)
					.all<{ day: string; avg_bhb: number }>(),
			])

			const logs = logsResult.results ?? []
			const ketoByDay = new Map(
				(ketoResult.results ?? []).map((r) => [
					r.day,
					Number(r.avg_bhb.toFixed(2)),
				]),
			)

			const moodValues = logs.map((r) => r.mood_score)
			const energyValues = logs.map((r) => r.energy_score)
			const focusValues = logs.map((r) => r.focus_score)
			const anxietyValues = logs.map((r) => r.anxiety_score)

			const lines: Array<string> = [
				`## Mood Trends — Last ${days} days (${logs.length} entries)`,
			]

			if (logs.length === 0) {
				lines.push('_No mood entries found for this period._')
			} else {
				lines.push(
					`**Avg Mood**: ${avg(moodValues) ?? '—'}/10`,
					`**Avg Energy**: ${avg(energyValues) ?? '—'}/10`,
					`**Avg Focus**: ${avg(focusValues) ?? '—'}/10`,
					`**Avg Anxiety**: ${avg(anxietyValues) ?? '—'}/10`,
					`\n### Daily log`,
				)
				for (const row of logs) {
					const keto = ketoByDay.get(row.date)
					const parts = [
						row.date,
						row.mood_score !== null ? `mood=${row.mood_score}` : null,
						row.energy_score !== null ? `energy=${row.energy_score}` : null,
						row.focus_score !== null ? `focus=${row.focus_score}` : null,
						row.anxiety_score !== null ? `anxiety=${row.anxiety_score}` : null,
						keto !== undefined ? `bhb=${keto}` : null,
					].filter(Boolean)
					lines.push(`- ${parts.join(' · ')}`)
					if (row.mood_note) lines.push(`  _"${row.mood_note}"_`)
				}
			}

			lines.push(
				`\n⚕️ Mood and energy changes can have many causes. Discuss persistent low scores or anxiety spikes with your care team.`,
			)

			const dailyData = logs.map((row) => ({
				date: row.date,
				mood_score: row.mood_score,
				energy_score: row.energy_score,
				focus_score: row.focus_score,
				anxiety_score: row.anxiety_score,
				mood_note: row.mood_note,
				avg_bhb_mmol: ketoByDay.get(row.date) ?? null,
			}))

			return {
				content: [{ type: 'text', text: lines.join('\n') }],
				structuredContent: {
					period_days: days,
					entry_count: logs.length,
					averages: {
						mood: avg(moodValues),
						energy: avg(energyValues),
						focus: avg(focusValues),
						anxiety: avg(anxietyValues),
					},
					daily: dailyData,
					care_note:
						'Discuss persistent low scores or anxiety spikes with your care team.',
				},
			}
		},
	)
}
