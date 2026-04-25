import { type MCP } from '#mcp/index.ts'
import { userProfilesTable } from '#worker/db.ts'

type Phase = 'keto_adaptation' | 'early_ketosis' | 'optimization' | 'maintenance'

type PhaseInfo = {
	label: string
	days_range: string
	description: string
	typical_experiences: Array<string>
	focus_areas: Array<string>
}

const phaseInfo: Record<Phase, PhaseInfo> = {
	keto_adaptation: {
		label: 'Keto Adaptation',
		days_range: 'Days 1–14',
		description:
			'Your body is switching from glucose to fat as its primary fuel. This is the hardest phase — expect some fatigue, brain fog, and cravings as your cells adapt.',
		typical_experiences: [
			'Fatigue and low energy (temporary)',
			'Brain fog or headaches',
			'Electrolyte losses — increase sodium, magnesium, potassium',
			'Strong carb cravings',
			'Ketones may fluctuate before stabilising',
		],
		focus_areas: [
			'Hit carb target consistently — every gram matters now',
			'Hydrate and replenish electrolytes daily',
			'Prioritise sleep — adaptation happens during rest',
			'Be patient: symptoms typically resolve by day 10–14',
		],
	},
	early_ketosis: {
		label: 'Early Ketosis',
		days_range: 'Days 15–42',
		description:
			'Adaptation is largely complete. Ketones should be more stable and energy more consistent. This is when many people start noticing mental clarity and mood improvements.',
		typical_experiences: [
			'Steadier energy throughout the day',
			'Improved mental clarity and focus',
			'Reduced hunger and cravings',
			'More stable ketone readings',
		],
		focus_areas: [
			'Track ketones regularly to confirm you are in range',
			'Log mood and energy to spot trends',
			'Begin expanding SMART habits — sleep, movement, avoid',
			'Check in with your care team on how you are responding',
		],
	},
	optimization: {
		label: 'Optimization',
		days_range: 'Days 43–90',
		description:
			'You have a baseline of ketosis established. Now the work is refining your protocol — adjusting macros, fasting window, and SMART habits based on real data.',
		typical_experiences: [
			'Baseline metabolic benefits becoming clearer',
			'Individual variation in optimal ketone range emerges',
			'May be ready to adjust protein or fat targets',
		],
		focus_areas: [
			'Review weekly summaries and mood trends with your care team',
			'Fine-tune macro targets based on ketone readings and energy',
			'Ensure all five SMART pillars have consistent attention',
			'Consider lab work to assess metabolic markers',
		],
	},
	maintenance: {
		label: 'Maintenance',
		days_range: 'Day 91+',
		description:
			'You are in a long-term therapeutic ketosis practice. The protocol is part of your life — the focus shifts to sustainability, monitoring, and adapting as your goals evolve.',
		typical_experiences: [
			'Protocol feels routine and sustainable',
			'Well-established relationship with your ketone range',
			'Clearer picture of individual responses to foods and lifestyle factors',
		],
		focus_areas: [
			'Maintain regular check-ins with your care team',
			'Continue tracking to detect early deviations',
			'Revisit protocol goals periodically',
			'Support others new to the protocol if that feels meaningful',
		],
	},
}

function getPhase(daysSinceStart: number): Phase {
	if (daysSinceStart <= 14) return 'keto_adaptation'
	if (daysSinceStart <= 42) return 'early_ketosis'
	if (daysSinceStart <= 90) return 'optimization'
	return 'maintenance'
}

export async function registerGetProtocolStageTool(agent: MCP) {
	agent.server.registerTool(
		'get_protocol_stage',
		{
			title: 'Get Protocol Stage',
			description: `
Return the user's current THINK protocol phase based on days since start date.
Phases: keto_adaptation (days 1–14) → early_ketosis (15–42) → optimization (43–90) → maintenance (91+).
Includes phase-appropriate context, typical experiences, and focus areas.
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
			const profile = await db.findOne(userProfilesTable, {
				where: { user_id: user.userId },
			})

			if (!profile?.protocol_start_date) {
				return {
					content: [
						{
							type: 'text',
							text: [
								'## Protocol Stage',
								'_Protocol start date is not set._',
								'Set your start date in the dashboard or ask to update your profile to unlock phase tracking.',
							].join('\n'),
						},
					],
					structuredContent: {
						phase: null,
						days_since_start: null,
						care_note:
							'Consult your care team before starting or adjusting your protocol.',
					},
				}
			}

			const startDate = new Date(profile.protocol_start_date + 'T00:00:00Z')
			const today = new Date()
			const daysSinceStart = Math.floor(
				(today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
			)

			const phase = getPhase(daysSinceStart)
			const info = phaseInfo[phase]

			const lines: Array<string> = [
				`## Protocol Stage — ${info.label}`,
				`**Day ${daysSinceStart}** since ${profile.protocol_start_date} · ${info.days_range}`,
				``,
				info.description,
				``,
				`### Typical experiences in this phase`,
				...info.typical_experiences.map((e) => `- ${e}`),
				``,
				`### Focus areas right now`,
				...info.focus_areas.map((f) => `- ${f}`),
				``,
				`⚕️ Consult your care team before making significant protocol changes, especially around medications or supplements.`,
			]

			return {
				content: [{ type: 'text', text: lines.join('\n') }],
				structuredContent: {
					phase,
					phase_label: info.label,
					days_since_start: daysSinceStart,
					protocol_start_date: profile.protocol_start_date,
					description: info.description,
					typical_experiences: info.typical_experiences,
					focus_areas: info.focus_areas,
					care_note:
						'Consult your care team before making significant protocol changes.',
				},
			}
		},
	)
}
