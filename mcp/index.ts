import { invariant } from '@epic-web/invariant'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/cfworker-provider.js'
import { McpAgent } from 'agents/mcp'
import { parseMcpCallerContext, type McpServerProps } from './context.ts'
import { registerResources } from './register-resources.ts'
import { registerTools } from './register-tools.ts'
import { createDb } from '#worker/db.ts'

export type State = {}
export type Props = McpServerProps

const serverMetadata = {
	implementation: {
		name: 'metabolic-health-agent-mcp',
		version: '1.0.0',
	},
	instructions: `
You are a personal metabolic health coach helping the user follow the THINK+SMART protocol.

THINK = Therapeutic Integration of Nutritional Ketosis
SMART = Sleep · Move · Avoid · Rebuild · Track

Write tools (logging)
- log_mood: Daily mood, energy, focus, anxiety (1–10). Idempotent — updates same-day entry.
- log_meal: Food entry with optional macros. Call once per item eaten.
- log_ketone: BHB reading in mmol/L, optional glucose for GKI.
- log_sleep: Sleep hours and quality. Idempotent — updates same-day entry.
- log_smart: SMART pillar activity (move | avoid | rebuild | track).

Read / insight tools
- get_keto_status: Protocol config + 14-day ketone summary and adherence.
- get_mood_trends: Daily mood/energy/focus/anxiety with ketone correlation context.
- get_weekly_summary: 7-day THINK adherence + SMART coverage + mood arc.
- get_protocol_stage: Current phase (adaptation/early ketosis/optimization/maintenance) + guidance.
- get_thinksmart_guidance: Retrieve protocol guidance by topic (keto_adaptation, electrolytes, sleep_and_ketosis, mental_health_and_ketosis, carb_target, protein_and_fat, fasting, supplementation, smart_move, smart_avoid, smart_rebuild, smart_track).
- open_dashboard: Returns the URL of the user's metabolic health dashboard (Today / Trends / Protocol / SMART tabs). Share the link when the user wants to review their data visually.

Onboarding
- New users should visit /onboarding to configure their THINK protocol before their first session.

Safety
- Every tool response touching health data includes a care_note field.
- Always surface care_note to the user. Never omit it.
- Do not advise on medications, supplements, or crisis situations — direct to care team.
	`.trim(),
} as const

export class MCP extends McpAgent<Env, State, Props> {
	server = new McpServer(serverMetadata.implementation, {
		instructions: serverMetadata.instructions,
		jsonSchemaValidator: new CfWorkerJsonSchemaValidator(),
	})
	async init() {
		await registerResources(this)
		await registerTools(this)
	}
	getCallerContext() {
		return parseMcpCallerContext(this.props)
	}
	getDb() {
		return createDb(this.env.APP_DB)
	}
	getRawDb() {
		return this.env.APP_DB
	}
	requireDomain() {
		const { baseUrl } = this.getCallerContext()
		invariant(
			baseUrl,
			'This should never happen, but somehow we did not get the baseUrl from the request handler',
		)
		return baseUrl
	}
}
