import { z } from 'zod'
import { type MCP } from '#mcp/index.ts'
import { protocolGuidanceTable } from '#worker/db.ts'

const validTopics = [
	'keto_adaptation',
	'electrolytes',
	'sleep_and_ketosis',
	'mental_health_and_ketosis',
	'carb_target',
	'protein_and_fat',
	'fasting',
	'supplementation',
	'smart_move',
	'smart_avoid',
	'smart_rebuild',
	'smart_track',
] as const

export async function registerGetThinksmartGuidanceTool(agent: MCP) {
	agent.server.registerTool(
		'get_thinksmart_guidance',
		{
			title: 'Get THINK+SMART Guidance',
			description: `
Retrieve protocol guidance for a specific THINK+SMART topic.
Always append the returned care_note to your response — never omit it.

Available topics:
- keto_adaptation: What to expect in weeks 1–2
- electrolytes: Sodium, potassium, and magnesium on keto
- sleep_and_ketosis: How sleep quality affects ketosis
- mental_health_and_ketosis: Mental health considerations and what to expect
- carb_target: How to count carbs and hit your target
- protein_and_fat: Protein and fat targets and food choices
- fasting: How intermittent fasting integrates with ketosis
- supplementation: Common supplements on a ketogenic diet
- smart_move: Exercise and movement during keto
- smart_avoid: Key substances and triggers to avoid
- smart_rebuild: Rebuilding habits, routines, and relationships
- smart_track: What metrics to monitor and how often
			`.trim(),
			inputSchema: {
				topic: z
					.enum(validTopics)
					.describe('The THINK+SMART topic to retrieve guidance for'),
			},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async ({ topic }) => {
			const db = agent.getDb()

			const row = await db.findOne(protocolGuidanceTable, {
				where: { topic },
			})

			if (!row) {
				return {
					content: [
						{
							type: 'text',
							text: `No guidance found for topic "${topic}". This topic may not be seeded yet.`,
						},
					],
					isError: true,
				}
			}

			const careNote =
				'Always consult your care team before making changes to medications, supplements, or your protocol — especially if you are managing a mental health condition, metabolic disorder, or taking prescription medications.'

			return {
				content: [
					{
						type: 'text',
						text: [
							`## ${topic.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`,
							``,
							row.content,
							``,
							`---`,
							`⚕️ ${careNote}`,
						].join('\n'),
					},
				],
				structuredContent: {
					topic: row.topic,
					content: row.content,
					version: row.version,
					care_note: careNote,
				},
			}
		},
	)
}
