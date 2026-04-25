import { type MCP } from './index.ts'
import { registerLogMoodTool } from './tools/log-mood.ts'
import { registerLogMealTool } from './tools/log-meal.ts'
import { registerLogKettoneTool } from './tools/log-ketone.ts'
import { registerLogSleepTool } from './tools/log-sleep.ts'
import { registerLogSmartTool } from './tools/log-smart.ts'
import { registerGetKetoStatusTool } from './tools/get-keto-status.ts'
import { registerGetMoodTrendsTool } from './tools/get-mood-trends.ts'
import { registerGetWeeklySummaryTool } from './tools/get-weekly-summary.ts'
import { registerGetProtocolStageTool } from './tools/get-protocol-stage.ts'
import { registerGetThinksmartGuidanceTool } from './tools/get-thinksmart-guidance.ts'
import { registerOpenDashboardTool } from './tools/open-dashboard.ts'

export async function registerTools(agent: MCP) {
	// Write tools
	await registerLogMoodTool(agent)
	await registerLogMealTool(agent)
	await registerLogKettoneTool(agent)
	await registerLogSleepTool(agent)
	await registerLogSmartTool(agent)
	// Read / insight tools
	await registerGetKetoStatusTool(agent)
	await registerGetMoodTrendsTool(agent)
	await registerGetWeeklySummaryTool(agent)
	await registerGetProtocolStageTool(agent)
	// Guidance
	await registerGetThinksmartGuidanceTool(agent)
	// Dashboard
	registerOpenDashboardTool(agent)
}
