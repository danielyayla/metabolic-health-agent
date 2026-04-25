import { z } from 'zod'
import { type MCP } from '#mcp/index.ts'
import { smartLogsTable } from '#worker/db.ts'

const pillars = ['move', 'avoid', 'rebuild', 'track'] as const
type Pillar = (typeof pillars)[number]

const pillarDescriptions: Record<Pillar, string> = {
	move: 'Physical activity — walks, strength training, yoga, etc.',
	avoid: 'Substances or triggers avoided — alcohol, ultra-processed food, stress triggers, etc.',
	rebuild: 'Therapies, relationships, or habits that support healing — therapy, journaling, social connection, etc.',
	track: 'Monitoring progress — lab results, symptoms, biometrics beyond ketones and mood.',
}

export async function registerLogSmartTool(agent: MCP) {
	agent.server.registerTool(
		'log_smart',
		{
			title: 'Log SMART Pillar',
			description: `
Log an activity under a SMART lifestyle pillar (Sleep is logged via log_sleep).

Pillars:
- move: Physical activity
- avoid: Substances or triggers successfully avoided
- rebuild: Therapies, relationships, or healing habits
- track: Lab results, symptoms, or other biometric monitoring
			`.trim(),
			inputSchema: {
				pillar: z
					.enum(pillars)
					.describe('SMART pillar: move | avoid | rebuild | track'),
				description: z
					.string()
					.min(1)
					.describe(
						'What you did, e.g. "30 min walk" or "skipped alcohol at dinner"',
					),
				duration_minutes: z
					.number()
					.int()
					.min(1)
					.optional()
					.describe('Duration in minutes (optional, most relevant for move)'),
				quality_score: z
					.number()
					.int()
					.min(1)
					.max(10)
					.optional()
					.describe('Subjective quality or effort 1–10'),
				notes: z.string().optional().describe('Additional context or notes'),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async ({ pillar, description, duration_minutes, quality_score, notes }) => {
			const user = agent.getCallerContext().user
			if (!user) {
				return {
					content: [{ type: 'text', text: '❌ Not authenticated.' }],
					isError: true,
				}
			}

			const db = agent.getDb()
			const now = new Date().toISOString()

			await db.create(smartLogsTable, {
				id: crypto.randomUUID(),
				user_id: user.userId,
				logged_at: now,
				pillar,
				description,
				duration_minutes: duration_minutes ?? null,
				quality_score: quality_score ?? null,
				notes: notes ?? null,
			})

			const pillarLabel = pillar.charAt(0).toUpperCase() + pillar.slice(1)
			const lines: Array<string> = [
				`✅ SMART logged — ${pillarLabel}: ${description}`,
			]
			if (duration_minutes !== undefined)
				lines.push(`Duration: ${duration_minutes} min`)
			if (quality_score !== undefined) lines.push(`Quality: ${quality_score}/10`)
			if (notes) lines.push(`Notes: ${notes}`)
			lines.push(`\nPillar context: ${pillarDescriptions[pillar]}`)

			return {
				content: [{ type: 'text', text: lines.join('\n') }],
				structuredContent: {
					logged_at: now,
					pillar,
					description,
					duration_minutes: duration_minutes ?? null,
					quality_score: quality_score ?? null,
				},
			}
		},
	)
}
