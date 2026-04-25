import { type BuildAction } from 'remix/fetch-router'
import { redirectToLogin } from '#server/auth-redirect.ts'
import { readAuthSessionResult, setAuthSessionSecret } from '#server/auth-session.ts'
import { getEnv } from '#server/env.ts'
import { Layout } from '#server/layout.ts'
import { emailToOAuthUserId } from '#server/oauth-user-id.ts'
import { render } from '#server/render.ts'
import { type routes } from '#server/routes.ts'
import { createDb, userProfilesTable } from '#worker/db.ts'
import { type AppEnv } from '#types/env-schema.ts'

function jsonResponse(data: unknown, init?: ResponseInit) {
	return new Response(JSON.stringify(data), {
		...init,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store',
			...init?.headers,
		},
	})
}

function toIntOrNull(value: unknown): number | null {
	if (value === null || value === undefined || value === '') return null
	const n = Number(value)
	return Number.isFinite(n) ? Math.round(n) : null
}

function toFloatOrNull(value: unknown): number | null {
	if (value === null || value === undefined || value === '') return null
	const n = Number(value)
	return Number.isFinite(n) ? n : null
}

function toStringOrNull(value: unknown): string | null {
	if (typeof value !== 'string') return null
	const trimmed = value.trim()
	return trimmed.length > 0 ? trimmed : null
}

export function createOnboardingHandlers(appEnv: AppEnv) {
	const getHandler = {
		middleware: [],
		async action({ request }) {
			const appEnvTyped = getEnv(appEnv as unknown as Env)
			setAuthSessionSecret(appEnvTyped.COOKIE_SECRET)
			const { session, setCookie } = await readAuthSessionResult(request)

			if (!session) {
				return redirectToLogin(request)
			}

			const response = render(Layout({ title: 'Set up your protocol' }))
			if (setCookie) {
				response.headers.set('Set-Cookie', setCookie)
			}
			return response
		},
	} satisfies BuildAction<
		typeof routes.onboarding.method,
		typeof routes.onboarding.pattern
	>

	const postHandler = {
		middleware: [],
		async action({ request }) {
			const appEnvTyped = getEnv(appEnv as unknown as Env)
			setAuthSessionSecret(appEnvTyped.COOKIE_SECRET)
			const { session } = await readAuthSessionResult(request)

			if (!session) {
				return jsonResponse({ ok: false, error: 'Unauthorized' }, { status: 401 })
			}

			let body: unknown
			try {
				body = await request.json()
			} catch {
				return jsonResponse(
					{ ok: false, error: 'Invalid JSON payload.' },
					{ status: 400 },
				)
			}

			if (!body || typeof body !== 'object') {
				return jsonResponse({ ok: false, error: 'Invalid payload.' }, { status: 400 })
			}

			const b = body as Record<string, unknown>

			const dietary_approach = toStringOrNull(b.dietary_approach)
			const protocol_start_date = toStringOrNull(b.protocol_start_date)
			const ketone_goal_mmol = toFloatOrNull(b.ketone_goal_mmol) ?? 1.5
			const carb_target_g = toIntOrNull(b.carb_target_g) ?? 20
			const protein_target_g = toIntOrNull(b.protein_target_g)
			const fat_target_g = toIntOrNull(b.fat_target_g)
			const fasting_protocol = toStringOrNull(b.fasting_protocol)
			const supplementation_notes = toStringOrNull(b.supplementation_notes)
			const care_team_notes = toStringOrNull(b.care_team_notes)
			const mental_health_context = toStringOrNull(b.mental_health_context)
			const name = toStringOrNull(b.name)

			const userId = await emailToOAuthUserId(session.email)
			const db = createDb((appEnv as unknown as Env).APP_DB)

			const existing = await db.findOne(userProfilesTable, {
				where: { user_id: userId },
			})

			if (existing) {
				await db.update(
					userProfilesTable,
					userId,
					{
						name,
						dietary_approach,
						ketone_goal_mmol,
						carb_target_g,
						protein_target_g,
						fat_target_g,
						fasting_protocol,
						supplementation_notes,
						care_team_notes,
						mental_health_context,
						protocol_start_date,
					},
					{ touch: true },
				)
			} else {
				await db.create(userProfilesTable, {
					user_id: userId,
					name,
					dietary_approach,
					ketone_goal_mmol,
					carb_target_g,
					protein_target_g,
					fat_target_g,
					fasting_protocol,
					supplementation_notes,
					care_team_notes,
					mental_health_context,
					protocol_start_date,
				})
			}

			return jsonResponse({ ok: true })
		},
	} satisfies BuildAction<
		typeof routes.onboardingSubmit.method,
		typeof routes.onboardingSubmit.pattern
	>

	return { getHandler, postHandler }
}
