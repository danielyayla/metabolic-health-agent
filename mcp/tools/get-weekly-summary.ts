import { type MCP } from '#mcp/index.ts'
import { userProfilesTable } from '#worker/db.ts'

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

const smartPillars = ['sleep', 'move', 'avoid', 'rebuild', 'track'] as const

export async function registerGetWeeklySummaryTool(agent: MCP) {
	agent.server.registerTool(
		'get_weekly_summary',
		{
			title: 'Get Weekly Summary',
			description: `
Return a 7-day summary covering THINK adherence (ketone readings in goal range),
SMART pillar coverage, mood arc, and food log count.
			`.trim(),
			inputSchema: {},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async () => {
			const user = agent.getCallerContext().user
			if (!user) {
				return {
					content: [{ type: 'text', text: '❌ Not authenticated.' }],
					isError: true,
				}
			}

			const db = agent.getDb()
			const rawDb = agent.getRawDb()
			const cutoff = daysAgoDate(7)

			const [profile, logsResult, ketoResult, foodCountResult, smartResult] =
				await Promise.all([
					db.findOne(userProfilesTable, { where: { user_id: user.userId } }),
					rawDb
						.prepare(
							`SELECT date, mood_score, energy_score, sleep_hours, sleep_quality
							 FROM daily_logs
							 WHERE user_id = ? AND date >= ?
							 ORDER BY date ASC`,
						)
						.bind(user.userId, cutoff)
						.all<{
							date: string
							mood_score: number | null
							energy_score: number | null
							sleep_hours: number | null
							sleep_quality: number | null
						}>(),
					rawDb
						.prepare(
							`SELECT bhb_mmol FROM ketone_readings
							 WHERE user_id = ? AND measured_at >= ?`,
						)
						.bind(user.userId, cutoff)
						.all<{ bhb_mmol: number }>(),
					rawDb
						.prepare(
							`SELECT COUNT(*) as count FROM food_logs
							 WHERE user_id = ? AND logged_at >= ?`,
						)
						.bind(user.userId, cutoff)
						.first<{ count: number }>(),
					rawDb
						.prepare(
							`SELECT DISTINCT pillar FROM smart_logs
							 WHERE user_id = ? AND logged_at >= ?`,
						)
						.bind(user.userId, cutoff)
						.all<{ pillar: string }>(),
				])

			const logs = logsResult.results ?? []
			const ketoneRows = ketoResult.results ?? []
			const foodCount = foodCountResult?.count ?? 0
			const coveredPillars = new Set(
				(smartResult.results ?? []).map((r) => r.pillar),
			)

			const ketoneGoal = profile?.ketone_goal_mmol ?? 1.5
			const inRangeCount = ketoneRows.filter(
				(r) => r.bhb_mmol >= ketoneGoal,
			).length
			const ketoAdherencePct =
				ketoneRows.length > 0
					? Math.round((inRangeCount / ketoneRows.length) * 100)
					: null

			const moodScores = logs.map((r) => r.mood_score)
			const firstHalfMood = avg(moodScores.slice(0, Math.ceil(logs.length / 2)))
			const secondHalfMood = avg(moodScores.slice(Math.ceil(logs.length / 2)))
			const moodTrend =
				firstHalfMood !== null && secondHalfMood !== null
					? secondHalfMood > firstHalfMood + 0.5
						? 'improving'
						: secondHalfMood < firstHalfMood - 0.5
							? 'declining'
							: 'stable'
					: 'insufficient data'

			const sleepAvg = avg(logs.map((r) => r.sleep_hours))

			// SMART: sleep counts if any daily_logs entry has sleep_hours
			const hasSleepLogs = logs.some((r) => r.sleep_hours !== null)
			const allPillars = smartPillars
			const coveredAll = allPillars.filter(
				(p) => p === 'sleep' ? hasSleepLogs : coveredPillars.has(p),
			)
			const missingPillars = allPillars.filter(
				(p) => p === 'sleep' ? !hasSleepLogs : !coveredPillars.has(p),
			)

			const lines: Array<string> = ['## Weekly Summary (last 7 days)']

			lines.push('\n### THINK Adherence')
			if (ketoneRows.length > 0) {
				lines.push(
					`Ketone readings: ${ketoneRows.length}`,
					`In goal range (≥${ketoneGoal} mmol/L): ${ketoAdherencePct}% (${inRangeCount}/${ketoneRows.length})`,
					`Meals logged: ${foodCount}`,
				)
			} else {
				lines.push('No ketone readings this week.', `Meals logged: ${foodCount}`)
			}

			lines.push('\n### Mood Arc')
			if (logs.length > 0) {
				lines.push(
					`Avg mood: ${avg(moodScores) ?? '—'}/10`,
					`Trend: ${moodTrend}`,
					`Avg sleep: ${sleepAvg !== null ? `${sleepAvg}h` : '—'}`,
					`Days with mood logged: ${logs.length}/7`,
				)
			} else {
				lines.push('No mood entries this week.')
			}

			lines.push('\n### SMART Pillar Coverage')
			lines.push(
				`Covered (${coveredAll.length}/5): ${coveredAll.length > 0 ? coveredAll.join(', ') : 'none'}`,
			)
			if (missingPillars.length > 0) {
				lines.push(`Missing: ${missingPillars.join(', ')}`)
			}

			lines.push(
				`\n⚕️ Share this summary with your care team to guide protocol adjustments.`,
			)

			return {
				content: [{ type: 'text', text: lines.join('\n') }],
				structuredContent: {
					think: {
						ketone_reading_count: ketoneRows.length,
						in_range_pct: ketoAdherencePct,
						ketone_goal_mmol: ketoneGoal,
						food_log_count: foodCount,
					},
					mood: {
						avg_mood: avg(moodScores),
						trend: moodTrend,
						avg_sleep_hours: sleepAvg,
						days_logged: logs.length,
					},
					smart: {
						covered_pillars: coveredAll,
						missing_pillars: missingPillars,
						coverage_pct: Math.round((coveredAll.length / 5) * 100),
					},
					care_note:
						'Share this summary with your care team to guide protocol adjustments.',
				},
			}
		},
	)
}
