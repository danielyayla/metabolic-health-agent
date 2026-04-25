import { type MCP } from '#mcp/index.ts'
import { userProfilesTable } from '#worker/db.ts'

function daysAgoDate(n: number) {
	const d = new Date()
	d.setUTCDate(d.getUTCDate() - n)
	return d.toISOString().split('T')[0]!
}

export async function registerGetKetoStatusTool(agent: MCP) {
	agent.server.registerTool(
		'get_keto_status',
		{
			title: 'Get Keto Status',
			description: `
Return the user's current THINK protocol config and recent ketone readings.
Includes average BHB, percentage of readings in goal range, and latest GKI if available.
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
			const cutoff = daysAgoDate(14)

			const [profile, readings] = await Promise.all([
				db.findOne(userProfilesTable, { where: { user_id: user.userId } }),
				rawDb
					.prepare(
						`SELECT bhb_mmol, glucose_mg_dl, measured_at, notes
						 FROM ketone_readings
						 WHERE user_id = ? AND measured_at >= ?
						 ORDER BY measured_at DESC
						 LIMIT 20`,
					)
					.bind(user.userId, cutoff)
					.all<{
						bhb_mmol: number
						glucose_mg_dl: number | null
						measured_at: string
						notes: string | null
					}>(),
			])

			const ketoneGoal = profile?.ketone_goal_mmol ?? 1.5
			const readingRows = readings.results ?? []

			const avgBhb =
				readingRows.length > 0
					? readingRows.reduce((sum, r) => sum + r.bhb_mmol, 0) /
						readingRows.length
					: null
			const inRangeCount = readingRows.filter(
				(r) => r.bhb_mmol >= ketoneGoal,
			).length
			const inRangePct =
				readingRows.length > 0
					? Math.round((inRangeCount / readingRows.length) * 100)
					: null

			const latest = readingRows[0] ?? null
			const latestGki =
				latest?.glucose_mg_dl != null && latest.bhb_mmol > 0
					? Number((latest.glucose_mg_dl / 18 / latest.bhb_mmol).toFixed(2))
					: null

			const lines: Array<string> = ['## Keto Status']

			if (profile) {
				lines.push(
					`**Protocol started**: ${profile.protocol_start_date ?? 'not set'}`,
					`**Dietary approach**: ${profile.dietary_approach ?? 'not set'}`,
					`**Ketone goal**: ≥ ${ketoneGoal} mmol/L`,
					`**Carb target**: ${profile.carb_target_g}g/day`,
				)
				if (profile.fasting_protocol)
					lines.push(`**Fasting**: ${profile.fasting_protocol}`)
			} else {
				lines.push(
					'_No profile set. Use the dashboard to configure your THINK protocol._',
				)
			}

			lines.push(`\n### Last 14 days (${readingRows.length} readings)`)
			if (readingRows.length > 0) {
				lines.push(
					`**Avg BHB**: ${avgBhb!.toFixed(2)} mmol/L`,
					`**In goal range**: ${inRangePct}% (${inRangeCount}/${readingRows.length})`,
				)
				if (latestGki !== null)
					lines.push(
						`**Latest GKI**: ${latestGki} (${latestGki < 3 ? 'therapeutic' : latestGki < 6 ? 'moderate' : 'low'} metabolic shift)`,
					)
			} else {
				lines.push('_No ketone readings in the past 14 days._')
			}

			lines.push(
				`\n⚕️ Discuss significant ketone or glucose changes with your care team.`,
			)

			return {
				content: [{ type: 'text', text: lines.join('\n') }],
				structuredContent: {
					profile: profile
						? {
								dietary_approach: profile.dietary_approach,
								ketone_goal_mmol: ketoneGoal,
								carb_target_g: profile.carb_target_g,
								protein_target_g: profile.protein_target_g,
								fat_target_g: profile.fat_target_g,
								fasting_protocol: profile.fasting_protocol,
								protocol_start_date: profile.protocol_start_date,
							}
						: null,
					last_14_days: {
						reading_count: readingRows.length,
						avg_bhb_mmol: avgBhb !== null ? Number(avgBhb.toFixed(3)) : null,
						in_range_pct: inRangePct,
						latest_bhb_mmol: latest?.bhb_mmol ?? null,
						latest_gki: latestGki,
					},
					care_note:
						'Discuss significant ketone or glucose changes with your care team.',
				},
			}
		},
	)
}
