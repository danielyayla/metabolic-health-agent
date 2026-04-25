import { z } from 'zod'
import { type MCP } from '#mcp/index.ts'
import { foodLogsTable } from '#worker/db.ts'

export async function registerLogMealTool(agent: MCP) {
	agent.server.registerTool(
		'log_meal',
		{
			title: 'Log Meal',
			description: `
Log a food or meal entry with optional macro breakdown.
Call once per item eaten — multiple entries per day are expected.
			`.trim(),
			inputSchema: {
				description: z
					.string()
					.min(1)
					.describe('What was eaten, e.g. "2 eggs with butter and bacon"'),
				carbs_g: z
					.number()
					.min(0)
					.optional()
					.describe('Total net carbohydrates in grams'),
				protein_g: z
					.number()
					.min(0)
					.optional()
					.describe('Total protein in grams'),
				fat_g: z.number().min(0).optional().describe('Total fat in grams'),
				calories: z.number().int().min(0).optional().describe('Total calories'),
				notes: z
					.string()
					.optional()
					.describe('Optional context, e.g. how it felt, hunger level'),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async ({ description, carbs_g, protein_g, fat_g, calories, notes }) => {
			const user = agent.getCallerContext().user
			if (!user) {
				return {
					content: [{ type: 'text', text: '❌ Not authenticated.' }],
					isError: true,
				}
			}

			const db = agent.getDb()
			const now = new Date().toISOString()

			await db.create(foodLogsTable, {
				id: crypto.randomUUID(),
				user_id: user.userId,
				logged_at: now,
				description,
				carbs_g: carbs_g ?? null,
				protein_g: protein_g ?? null,
				fat_g: fat_g ?? null,
				calories: calories ?? null,
				notes: notes ?? null,
			})

			const lines: Array<string> = [`✅ Meal logged`, `Food: ${description}`]
			if (carbs_g !== undefined) lines.push(`Carbs: ${carbs_g}g`)
			if (protein_g !== undefined) lines.push(`Protein: ${protein_g}g`)
			if (fat_g !== undefined) lines.push(`Fat: ${fat_g}g`)
			if (calories !== undefined) lines.push(`Calories: ${calories}`)
			if (notes) lines.push(`Notes: ${notes}`)

			return {
				content: [{ type: 'text', text: lines.join('\n') }],
				structuredContent: {
					logged_at: now,
					description,
					carbs_g: carbs_g ?? null,
					protein_g: protein_g ?? null,
					fat_g: fat_g ?? null,
					calories: calories ?? null,
				},
			}
		},
	)
}
