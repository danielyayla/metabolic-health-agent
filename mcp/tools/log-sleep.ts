import { z } from 'zod'
import { type MCP } from '#mcp/index.ts'
import { dailyLogsTable } from '#worker/db.ts'

export async function registerLogSleepTool(agent: MCP) {
	agent.server.registerTool(
		'log_sleep',
		{
			title: 'Log Sleep',
			description: `
Record sleep duration and quality for a given night. Defaults to last night (today's date UTC).
Calling again for the same date updates the existing entry.
			`.trim(),
			inputSchema: {
				hours: z
					.number()
					.min(0)
					.max(24)
					.describe('Total sleep duration in hours, e.g. 7.5'),
				quality: z
					.number()
					.int()
					.min(1)
					.max(10)
					.describe('Subjective sleep quality 1–10 (1=terrible, 10=excellent)'),
				bedtime: z
					.string()
					.optional()
					.describe('Bedtime as HH:MM (24h), e.g. "22:30"'),
				wake_time: z
					.string()
					.optional()
					.describe('Wake time as HH:MM (24h), e.g. "06:30"'),
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
		async ({ hours, quality, bedtime, wake_time, date }) => {
			const user = agent.getCallerContext().user
			if (!user) {
				return {
					content: [{ type: 'text', text: '❌ Not authenticated.' }],
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
						sleep_hours: hours,
						sleep_quality: quality,
						sleep_bedtime: bedtime ?? null,
						sleep_wake_time: wake_time ?? null,
					},
					{ touch: true },
				)
			} else {
				await db.create(dailyLogsTable, {
					id: crypto.randomUUID(),
					user_id: user.userId,
					date: logDate,
					sleep_hours: hours,
					sleep_quality: quality,
					sleep_bedtime: bedtime ?? null,
					sleep_wake_time: wake_time ?? null,
				})
			}

			const lines: Array<string> = [
				`✅ Sleep logged for ${logDate}${existing ? ' (updated)' : ''}`,
				`Duration: ${hours}h`,
				`Quality: ${quality}/10`,
			]
			if (bedtime) lines.push(`Bedtime: ${bedtime}`)
			if (wake_time) lines.push(`Wake: ${wake_time}`)

			return {
				content: [{ type: 'text', text: lines.join('\n') }],
				structuredContent: {
					date: logDate,
					sleep_hours: hours,
					sleep_quality: quality,
					sleep_bedtime: bedtime ?? null,
					sleep_wake_time: wake_time ?? null,
					updated: Boolean(existing),
				},
			}
		},
	)
}
