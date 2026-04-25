import { z } from 'zod'
import { type MCP } from '#mcp/index.ts'
import { ketoneReadingsTable } from '#worker/db.ts'

export async function registerLogKettoneTool(agent: MCP) {
	agent.server.registerTool(
		'log_ketone',
		{
			title: 'Log Ketone Reading',
			description: `
Record a blood ketone (BHB) measurement. Optionally include blood glucose to compute GKI.
GKI (Glucose Ketone Index) = glucose_mg_dl / 18 / bhb_mmol. Lower GKI = deeper metabolic shift.
			`.trim(),
			inputSchema: {
				bhb_mmol: z
					.number()
					.min(0)
					.describe('Blood beta-hydroxybutyrate in mmol/L, e.g. 1.8'),
				glucose_mg_dl: z
					.number()
					.min(0)
					.optional()
					.describe('Blood glucose in mg/dL (optional, enables GKI calculation)'),
				notes: z
					.string()
					.optional()
					.describe(
						'Optional context, e.g. time since last meal, fasting state',
					),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async ({ bhb_mmol, glucose_mg_dl, notes }) => {
			const user = agent.getCallerContext().user
			if (!user) {
				return {
					content: [{ type: 'text', text: '❌ Not authenticated.' }],
					isError: true,
				}
			}

			const db = agent.getDb()
			const now = new Date().toISOString()

			await db.create(ketoneReadingsTable, {
				id: crypto.randomUUID(),
				user_id: user.userId,
				measured_at: now,
				bhb_mmol,
				glucose_mg_dl: glucose_mg_dl ?? null,
				notes: notes ?? null,
			})

			const lines: Array<string> = [
				`✅ Ketone reading logged`,
				`BHB: ${bhb_mmol} mmol/L`,
			]

			if (glucose_mg_dl !== undefined) {
				const gki = glucose_mg_dl / 18 / bhb_mmol
				lines.push(`Glucose: ${glucose_mg_dl} mg/dL`)
				lines.push(`GKI: ${gki.toFixed(1)}`)
			}

			if (notes) lines.push(`Notes: ${notes}`)

			lines.push(
				`\n⚕️ Discuss significant changes in ketone levels with your care team.`,
			)

			return {
				content: [{ type: 'text', text: lines.join('\n') }],
				structuredContent: {
					measured_at: now,
					bhb_mmol,
					glucose_mg_dl: glucose_mg_dl ?? null,
					gki:
						glucose_mg_dl !== undefined
							? Number((glucose_mg_dl / 18 / bhb_mmol).toFixed(2))
							: null,
				},
			}
		},
	)
}
