import { type MCP } from '../index.ts'

export function registerOpenDashboardTool(agent: MCP) {
	agent.server.registerTool(
		'open_dashboard',
		{
			description:
				'Returns the URL of the metabolic health dashboard where the user can view their today summary, trends, protocol configuration, and SMART activity. Share this link with the user so they can open it in their browser.',
			inputSchema: {},
		},
		async () => {
			const { user } = agent.getCallerContext()
			if (!user) {
				return {
					content: [{ type: 'text', text: 'Unauthorized. Please connect your account first.' }],
					isError: true,
				}
			}

			const dashboardUrl = 'https://metabolic-health-agent.dkapper01.workers.dev/dashboard'

			return {
				content: [
					{
						type: 'text',
						text: `Your metabolic health dashboard is ready: ${dashboardUrl}`,
					},
				],
				structuredContent: {
					url: dashboardUrl,
					care_note:
						'The dashboard shows your logged data only. It does not replace medical advice from your care team.',
				},
			}
		},
	)
}
