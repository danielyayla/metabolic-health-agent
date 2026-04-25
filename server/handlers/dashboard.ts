import { type BuildAction } from 'remix/fetch-router'
import { readAuthSessionResult, setAuthSessionSecret } from '#server/auth-session.ts'
import { getEnv } from '#server/env.ts'
import { emailToOAuthUserId } from '#server/oauth-user-id.ts'
import { redirectToLogin } from '#server/auth-redirect.ts'
import { Layout } from '#server/layout.ts'
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

async function resolveUserId(request: Request, appEnv: AppEnv) {
	const appEnvTyped = getEnv(appEnv as unknown as Env)
	setAuthSessionSecret(appEnvTyped.COOKIE_SECRET)
	const { session, setCookie } = await readAuthSessionResult(request)
	if (!session) return { userId: null, setCookie: null }
	const userId = await emailToOAuthUserId(session.email)
	return { userId, setCookie }
}

export function createDashboardPageHandler(appEnv: AppEnv) {
	return {
		middleware: [],
		async action({ request }) {
			const { userId, setCookie } = await resolveUserId(request, appEnv)
			if (!userId) return redirectToLogin(request)
			const response = render(Layout({ title: 'Dashboard' }))
			if (setCookie) response.headers.set('Set-Cookie', setCookie)
			return response
		},
	} satisfies BuildAction<
		typeof routes.dashboard.method,
		typeof routes.dashboard.pattern
	>
}

export function createDashboardSummaryHandler(appEnv: AppEnv) {
	return {
		middleware: [],
		async action({ request }) {
			const { userId } = await resolveUserId(request, appEnv)
			if (!userId) return jsonResponse({ ok: false, error: 'Unauthorized' }, { status: 401 })

			const rawDb = (appEnv as unknown as Env).APP_DB
			const db = createDb(rawDb)
			const today = new Date().toISOString().split('T')[0]!

			const [profile, todayLog, todayMeals, todayKetones, todaySmartLogs] =
				await Promise.all([
					db.findOne(userProfilesTable, { where: { user_id: userId } }),
					rawDb
						.prepare(
							`SELECT mood_score, energy_score, focus_score, anxiety_score,
							        mood_note, sleep_hours, sleep_quality, sleep_bedtime, sleep_wake_time
							 FROM daily_logs WHERE user_id = ? AND date = ?`,
						)
						.bind(userId, today)
						.first<{
							mood_score: number | null
							energy_score: number | null
							focus_score: number | null
							anxiety_score: number | null
							mood_note: string | null
							sleep_hours: number | null
							sleep_quality: number | null
							sleep_bedtime: string | null
							sleep_wake_time: string | null
						}>(),
					rawDb
						.prepare(
							`SELECT description, carbs_g, protein_g, fat_g, calories, logged_at
							 FROM food_logs WHERE user_id = ? AND date(logged_at) = ?
							 ORDER BY logged_at ASC`,
						)
						.bind(userId, today)
						.all<{
							description: string
							carbs_g: number | null
							protein_g: number | null
							fat_g: number | null
							calories: number | null
							logged_at: string
						}>(),
					rawDb
						.prepare(
							`SELECT bhb_mmol, glucose_mg_dl, measured_at, notes
							 FROM ketone_readings WHERE user_id = ? AND date(measured_at) = ?
							 ORDER BY measured_at DESC`,
						)
						.bind(userId, today)
						.all<{
							bhb_mmol: number
							glucose_mg_dl: number | null
							measured_at: string
							notes: string | null
						}>(),
					rawDb
						.prepare(
							`SELECT pillar, description, duration_minutes, quality_score, logged_at
							 FROM smart_logs WHERE user_id = ? AND date(logged_at) = ?
							 ORDER BY logged_at ASC`,
						)
						.bind(userId, today)
						.all<{
							pillar: string
							description: string
							duration_minutes: number | null
							quality_score: number | null
							logged_at: string
						}>(),
				])

			// Protocol stage
			let daysSinceStart: number | null = null
			let phase: string | null = null
			if (profile?.protocol_start_date) {
				const start = new Date(profile.protocol_start_date + 'T00:00:00Z')
				daysSinceStart = Math.floor((Date.now() - start.getTime()) / 86400000)
				if (daysSinceStart <= 14) phase = 'keto_adaptation'
				else if (daysSinceStart <= 42) phase = 'early_ketosis'
				else if (daysSinceStart <= 90) phase = 'optimization'
				else phase = 'maintenance'
			}

			return jsonResponse({
				ok: true,
				today: today,
				profile: profile ?? null,
				phase,
				days_since_start: daysSinceStart,
				daily_log: todayLog ?? null,
				meals: todayMeals.results ?? [],
				ketones: todayKetones.results ?? [],
				smart_logs: todaySmartLogs.results ?? [],
			})
		},
	} satisfies BuildAction<
		typeof routes.dashboardSummary.method,
		typeof routes.dashboardSummary.pattern
	>
}

export function createDashboardHistoryHandler(appEnv: AppEnv) {
	return {
		middleware: [],
		async action({ request }) {
			const { userId } = await resolveUserId(request, appEnv)
			if (!userId) return jsonResponse({ ok: false, error: 'Unauthorized' }, { status: 401 })

			const url = new URL(request.url)
			const days = Math.min(
				90,
				Math.max(7, Number.parseInt(url.searchParams.get('days') ?? '14', 10)),
			)
			const cutoff = (() => {
				const d = new Date()
				d.setUTCDate(d.getUTCDate() - days)
				return d.toISOString().split('T')[0]!
			})()

			const rawDb = (appEnv as unknown as Env).APP_DB

			const [logsResult, ketoResult, smartResult] = await Promise.all([
				rawDb
					.prepare(
						`SELECT date, mood_score, energy_score, focus_score, anxiety_score,
						        sleep_hours, sleep_quality
						 FROM daily_logs WHERE user_id = ? AND date >= ?
						 ORDER BY date DESC`,
					)
					.bind(userId, cutoff)
					.all<{
						date: string
						mood_score: number | null
						energy_score: number | null
						focus_score: number | null
						anxiety_score: number | null
						sleep_hours: number | null
						sleep_quality: number | null
					}>(),
				rawDb
					.prepare(
						`SELECT date(measured_at) as day, avg(bhb_mmol) as avg_bhb, count(*) as count
						 FROM ketone_readings WHERE user_id = ? AND measured_at >= ?
						 GROUP BY date(measured_at) ORDER BY day DESC`,
					)
					.bind(userId, cutoff)
					.all<{ day: string; avg_bhb: number; count: number }>(),
				rawDb
					.prepare(
						`SELECT date(logged_at) as day, GROUP_CONCAT(DISTINCT pillar) as pillars
						 FROM smart_logs WHERE user_id = ? AND logged_at >= ?
						 GROUP BY date(logged_at) ORDER BY day DESC`,
					)
					.bind(userId, cutoff)
					.all<{ day: string; pillars: string }>(),
			])

			const ketoByDay = new Map(
				(ketoResult.results ?? []).map((r) => [
					r.day,
					{ avg_bhb: Number(r.avg_bhb.toFixed(2)), count: r.count },
				]),
			)
			const smartByDay = new Map(
				(smartResult.results ?? []).map((r) => [
					r.day,
					r.pillars.split(','),
				]),
			)

			const history = (logsResult.results ?? []).map((row) => ({
				...row,
				avg_bhb_mmol: ketoByDay.get(row.date)?.avg_bhb ?? null,
				ketone_count: ketoByDay.get(row.date)?.count ?? 0,
				smart_pillars: smartByDay.get(row.date) ?? [],
			}))

			return jsonResponse({ ok: true, days, history })
		},
	} satisfies BuildAction<
		typeof routes.dashboardHistory.method,
		typeof routes.dashboardHistory.pattern
	>
}
