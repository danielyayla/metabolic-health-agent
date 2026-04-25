import { z } from 'zod'
import { type MCP } from '#mcp/index.ts'
import { dailyLogsTable } from '#worker/db.ts'

export async function registerLogMoodTool(agent: MCP) {
	agent.server.registerTool(
		'log_mood',
		{
			title: 'Log Mood',
			description: `
Record mood, energy, focus, and anxiety scores for a given day (default: today UTC).
All scores use a 1–10 scale (1 = very low, 10 = excellent).
Anxiety is inverted: 1 = calm, 10 = severe.
Calling again for the same date updates the existing entry.
			`.trim(),
			inputSchema: {
				score: z
					.number()
					.int()
					.min(1)
					.max(10)
					.describe('Overall mood score 1–10'),
				note: z
					.string()
					.optional()
					.describe('Optional free-text note about mood or mental state'),
				energy: z
					.number()
					.int()
					.min(1)
					.max(10)
					.optional()
					.describe('Energy level 1–10'),
				focus: z
					.number()
					.int()
					.min(1)
					.max(10)
					.optional()
					.describe('Mental focus and clarity 1–10'),
				anxiety: z
					.number()
					.int()
					.min(1)
					.max(10)
					.optional()
					.describe('Anxiety level 1–10 (1=calm, 10=severe)'),
				date: z
					.string()
					.regex(/^\d{4}-\d{2}-\d{2}$/)
					.optional()
					.describe('Date in YYYY-MM-DD format (defaults to today UTC)'),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ score, note, energy, focus, anxiety, date }) => {
			const user = agent.getCallerContext().user
			if (!user) {
				return {
					content: [
						{
							type: 'text',
							text: '❌ Not authenticated. Connect this MCP server via OAuth first.',
						},
					],
					isError: true,
				}
			}

			const logDate = date ?? new Date().toISOString().split('T')[0]!
			const db = agent.getDb()

			const existing = await db.findOne(dailyLogsTable, {
				where: { user_id: user.userId, date: logDate },
			})

			if (existing) {
				await db.update(
					dailyLogsTable,
					existing.id,
					{
						mood_score: score,
						mood_note: note ?? null,
						energy_score: energy ?? null,
						focus_score: focus ?? null,
						anxiety_score: anxiety ?? null,
					},
					{ touch: true },
				)
			} else {
				await db.create(dailyLogsTable, {
					id: crypto.randomUUID(),
					user_id: user.userId,
					date: logDate,
					mood_score: score,
					mood_note: note ?? null,
					energy_score: energy ?? null,
					focus_score: focus ?? null,
					anxiety_score: anxiety ?? null,
				})
			}

			const lines: Array<string> = [
				`✅ Mood logged for ${logDate}${existing ? ' (updated)' : ''}`,
				`Mood: ${score}/10`,
			]
			if (energy !== undefined) lines.push(`Energy: ${energy}/10`)
			if (focus !== undefined) lines.push(`Focus: ${focus}/10`)
			if (anxiety !== undefined) lines.push(`Anxiety: ${anxiety}/10`)
			if (note) lines.push(`Note: "${note}"`)

			return {
				content: [{ type: 'text', text: lines.join('\n') }],
				structuredContent: {
					date: logDate,
					mood_score: score,
					mood_note: note ?? null,
					energy_score: energy ?? null,
					focus_score: focus ?? null,
					anxiety_score: anxiety ?? null,
					updated: Boolean(existing),
				},
			}
		},
	)
}
