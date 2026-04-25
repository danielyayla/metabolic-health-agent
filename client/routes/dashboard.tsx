import { type Handle } from 'remix/component'
import {
	colors,
	radius,
	shadows,
	spacing,
	typography,
} from '#client/styles/tokens.ts'

type Tab = 'today' | 'trends' | 'protocol' | 'smart'

type DailyLog = {
	mood_score: number | null
	energy_score: number | null
	focus_score: number | null
	anxiety_score: number | null
	mood_note: string | null
	sleep_hours: number | null
	sleep_quality: number | null
	sleep_bedtime: string | null
	sleep_wake_time: string | null
}

type Meal = {
	description: string
	carbs_g: number | null
	protein_g: number | null
	fat_g: number | null
	calories: number | null
	logged_at: string
}

type KetoneReading = {
	bhb_mmol: number
	glucose_mg_dl: number | null
	measured_at: string
	notes: string | null
}

type SmartLog = {
	pillar: string
	description: string
	duration_minutes: number | null
	quality_score: number | null
	logged_at: string
}

type UserProfile = {
	dietary_approach: string | null
	ketone_goal_mmol: number
	carb_target_g: number
	protein_target_g: number | null
	fat_target_g: number | null
	fasting_protocol: string | null
	supplementation_notes: string | null
	care_team_notes: string | null
	protocol_start_date: string | null
}

type Summary = {
	today: string
	profile: UserProfile | null
	phase: string | null
	days_since_start: number | null
	daily_log: DailyLog | null
	meals: Array<Meal>
	ketones: Array<KetoneReading>
	smart_logs: Array<SmartLog>
}

type HistoryRow = {
	date: string
	mood_score: number | null
	energy_score: number | null
	focus_score: number | null
	anxiety_score: number | null
	sleep_hours: number | null
	sleep_quality: number | null
	avg_bhb_mmol: number | null
	ketone_count: number
	smart_pillars: Array<string>
}

const phaseLabels: Record<string, string> = {
	keto_adaptation: 'Keto Adaptation (days 1–14)',
	early_ketosis: 'Early Ketosis (days 15–42)',
	optimization: 'Optimization (days 43–90)',
	maintenance: 'Maintenance (day 91+)',
}

const allSmartPillars = ['sleep', 'move', 'avoid', 'rebuild', 'track']

// ── Shared style helpers ──────────────────────────────────────────────────────

const cardCss = {
	padding: spacing.md,
	borderRadius: radius.lg,
	border: `1px solid ${colors.border}`,
	backgroundColor: colors.surface,
	boxShadow: shadows.sm,
	display: 'grid',
	gap: spacing.sm,
}

const cardTitleCss = {
	fontSize: typography.fontSize.sm,
	fontWeight: typography.fontWeight.semibold,
	color: colors.textMuted,
	textTransform: 'uppercase' as const,
	letterSpacing: '0.05em',
}

const valueCss = {
	fontSize: typography.fontSize.xl,
	fontWeight: typography.fontWeight.semibold,
	color: colors.text,
}

const labelCss = {
	fontSize: typography.fontSize.xs,
	color: colors.textMuted,
}

const tabCss = (active: boolean) => ({
	padding: `${spacing.xs} ${spacing.md}`,
	borderRadius: radius.full,
	border: 'none',
	backgroundColor: active ? colors.primary : 'transparent',
	color: active ? colors.onPrimary : colors.text,
	fontSize: typography.fontSize.sm,
	fontWeight: typography.fontWeight.medium,
	cursor: 'pointer',
	transition: 'background-color 0.15s',
})

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge(score: number | null, label: string) {
	if (score === null) return null
	const color =
		score >= 7 ? colors.primary : score >= 4 ? colors.text : colors.error
	return (
		<div css={{ display: 'grid', gap: '0.125rem', textAlign: 'center' }}>
			<span css={{ ...valueCss, color }}>{score}</span>
			<span css={labelCss}>{label}</span>
		</div>
	)
}

// ── Today tab ─────────────────────────────────────────────────────────────────

function TodayTab(summary: Summary) {
	const { daily_log: log, meals, ketones, smart_logs } = summary
	const hasMood =
		log &&
		(log.mood_score !== null ||
			log.energy_score !== null ||
			log.focus_score !== null ||
			log.anxiety_score !== null)
	const hasSleep = log && log.sleep_hours !== null
	const latestKetone = ketones[0] ?? null
	const totalCarbs = meals.reduce((s, m) => s + (m.carbs_g ?? 0), 0)
	const totalProtein = meals.reduce((s, m) => s + (m.protein_g ?? 0), 0)
	const totalFat = meals.reduce((s, m) => s + (m.fat_g ?? 0), 0)
	const hasMacros = totalCarbs > 0 || totalProtein > 0 || totalFat > 0

	return (
		<div css={{ display: 'grid', gap: spacing.md }}>
			{/* Mood row */}
			<div css={cardCss}>
				<span css={cardTitleCss}>Mood & cognition</span>
				{hasMood ? (
					<div
						css={{
							display: 'flex',
							gap: spacing.lg,
							flexWrap: 'wrap',
						}}
					>
						{ScoreBadge(log!.mood_score, 'Mood')}
						{ScoreBadge(log!.energy_score, 'Energy')}
						{ScoreBadge(log!.focus_score, 'Focus')}
						{ScoreBadge(log!.anxiety_score, 'Anxiety')}
					</div>
				) : (
					<p css={{ color: colors.textMuted, fontSize: typography.fontSize.sm }}>
						No mood logged today.{' '}
						<a href="/chat" css={{ color: colors.primaryText }}>
							Ask your AI to log it.
						</a>
					</p>
				)}
				{log?.mood_note ? (
					<p
						css={{
							fontSize: typography.fontSize.sm,
							color: colors.textMuted,
							fontStyle: 'italic',
						}}
					>
						"{log.mood_note}"
					</p>
				) : null}
			</div>

			{/* Ketone + Sleep row */}
			<div
				css={{
					display: 'grid',
					gridTemplateColumns: '1fr 1fr',
					gap: spacing.md,
				}}
			>
				<div css={cardCss}>
					<span css={cardTitleCss}>Ketones</span>
					{latestKetone ? (
						<>
							<div>
								<span css={valueCss}>{latestKetone.bhb_mmol}</span>
								<span
									css={{
										fontSize: typography.fontSize.sm,
										color: colors.textMuted,
										marginLeft: '0.25rem',
									}}
								>
									mmol/L
								</span>
							</div>
							{latestKetone.glucose_mg_dl !== null ? (
								<span css={labelCss}>
									GKI:{' '}
									{(
										latestKetone.glucose_mg_dl /
										18 /
										latestKetone.bhb_mmol
									).toFixed(1)}
								</span>
							) : null}
							{summary.profile?.ketone_goal_mmol ? (
								<span
									css={{
										fontSize: typography.fontSize.xs,
										color:
											latestKetone.bhb_mmol >=
											summary.profile.ketone_goal_mmol
												? colors.primary
												: colors.error,
									}}
								>
									{latestKetone.bhb_mmol >= summary.profile.ketone_goal_mmol
										? '✓ In goal range'
										: `Goal: ≥${summary.profile.ketone_goal_mmol}`}
								</span>
							) : null}
						</>
					) : (
						<p
							css={{ color: colors.textMuted, fontSize: typography.fontSize.sm }}
						>
							No reading today.
						</p>
					)}
				</div>

				<div css={cardCss}>
					<span css={cardTitleCss}>Sleep</span>
					{hasSleep ? (
						<>
							<div>
								<span css={valueCss}>{log!.sleep_hours}h</span>
								{log!.sleep_quality !== null ? (
									<span
										css={{
											fontSize: typography.fontSize.sm,
											color: colors.textMuted,
											marginLeft: '0.25rem',
										}}
									>
										quality {log!.sleep_quality}/10
									</span>
								) : null}
							</div>
							{log!.sleep_bedtime && log!.sleep_wake_time ? (
								<span css={labelCss}>
									{log!.sleep_bedtime} → {log!.sleep_wake_time}
								</span>
							) : null}
						</>
					) : (
						<p
							css={{ color: colors.textMuted, fontSize: typography.fontSize.sm }}
						>
							No sleep logged.
						</p>
					)}
				</div>
			</div>

			{/* Meals */}
			<div css={cardCss}>
				<span css={cardTitleCss}>
					Food today ({meals.length} entr{meals.length === 1 ? 'y' : 'ies'})
				</span>
				{hasMacros ? (
					<div css={{ display: 'flex', gap: spacing.lg, flexWrap: 'wrap' }}>
						{totalCarbs > 0 ? (
							<div css={{ textAlign: 'center' }}>
								<span css={valueCss}>{totalCarbs.toFixed(0)}g</span>
								<div css={labelCss}>Carbs</div>
							</div>
						) : null}
						{totalProtein > 0 ? (
							<div css={{ textAlign: 'center' }}>
								<span css={valueCss}>{totalProtein.toFixed(0)}g</span>
								<div css={labelCss}>Protein</div>
							</div>
						) : null}
						{totalFat > 0 ? (
							<div css={{ textAlign: 'center' }}>
								<span css={valueCss}>{totalFat.toFixed(0)}g</span>
								<div css={labelCss}>Fat</div>
							</div>
						) : null}
						{summary.profile?.carb_target_g && totalCarbs > 0 ? (
							<div css={{ textAlign: 'center' }}>
								<span
									css={{
										...valueCss,
										color:
											totalCarbs <= summary.profile.carb_target_g
												? colors.primary
												: colors.error,
									}}
								>
									{summary.profile.carb_target_g}g
								</span>
								<div css={labelCss}>Carb target</div>
							</div>
						) : null}
					</div>
				) : null}
				{meals.length > 0 ? (
					<ul
						css={{
							listStyle: 'none',
							padding: 0,
							margin: 0,
							display: 'grid',
							gap: spacing.xs,
						}}
					>
						{meals.map((meal, i) => (
							<li
								key={i}
								css={{
									fontSize: typography.fontSize.sm,
									color: colors.text,
									borderBottom:
										i < meals.length - 1
											? `1px solid ${colors.border}`
											: 'none',
									paddingBottom: i < meals.length - 1 ? spacing.xs : 0,
								}}
							>
								{meal.description}
								{meal.carbs_g !== null ? (
									<span css={{ color: colors.textMuted }}>
										{' '}
										· {meal.carbs_g}g carbs
									</span>
								) : null}
							</li>
						))}
					</ul>
				) : (
					<p
						css={{ color: colors.textMuted, fontSize: typography.fontSize.sm }}
					>
						No meals logged today.
					</p>
				)}
			</div>

			{/* SMART today */}
			<div css={cardCss}>
				<span css={cardTitleCss}>SMART today</span>
				<div css={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
					{allSmartPillars.map((pillar) => {
						const logged =
							pillar === 'sleep'
								? hasSleep
								: smart_logs.some((s) => s.pillar === pillar)
						return (
							<span
								key={pillar}
								css={{
									padding: `${spacing.xs} ${spacing.sm}`,
									borderRadius: radius.full,
									fontSize: typography.fontSize.xs,
									fontWeight: typography.fontWeight.medium,
									backgroundColor: logged ? colors.primary : colors.border,
									color: logged ? colors.onPrimary : colors.textMuted,
								}}
							>
								{logged ? '✓ ' : ''}{pillar}
							</span>
						)
					})}
				</div>
				{smart_logs.length > 0 ? (
					<ul
						css={{
							listStyle: 'none',
							padding: 0,
							margin: 0,
							display: 'grid',
							gap: spacing.xs,
							marginTop: spacing.xs,
						}}
					>
						{smart_logs.map((s, i) => (
							<li
								key={i}
								css={{ fontSize: typography.fontSize.sm, color: colors.text }}
							>
								<span
									css={{
										fontWeight: typography.fontWeight.medium,
										color: colors.primaryText,
									}}
								>
									{s.pillar}:
								</span>{' '}
								{s.description}
								{s.duration_minutes ? ` (${s.duration_minutes} min)` : ''}
							</li>
						))}
					</ul>
				) : null}
			</div>
		</div>
	)
}

// ── Trends tab ────────────────────────────────────────────────────────────────

function TrendsTab(
	history: Array<HistoryRow>,
	days: number,
	ketoneGoal: number,
) {
	return (
		<div css={{ display: 'grid', gap: spacing.md }}>
			{history.length === 0 ? (
				<p css={{ color: colors.textMuted }}>
					No data for the past {days} days yet.
				</p>
			) : (
				<div css={{ overflowX: 'auto' }}>
					<table
						css={{
							width: '100%',
							borderCollapse: 'collapse',
							fontSize: typography.fontSize.sm,
						}}
					>
						<thead>
							<tr>
								{[
									'Date',
									'Mood',
									'Energy',
									'Focus',
									'Anxiety',
									'Sleep',
									'BHB',
									'SMART',
								].map((h) => (
									<th
										key={h}
										css={{
											textAlign: 'left',
											padding: `${spacing.xs} ${spacing.sm}`,
											borderBottom: `2px solid ${colors.border}`,
											color: colors.textMuted,
											fontWeight: typography.fontWeight.medium,
											whiteSpace: 'nowrap',
										}}
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{history.map((row, i) => (
								<tr
									key={row.date}
									css={{
										backgroundColor:
											i % 2 === 0 ? 'transparent' : colors.surface,
										'&:hover': { backgroundColor: colors.surface },
									}}
								>
									<td
										css={{
											padding: `${spacing.xs} ${spacing.sm}`,
											color: colors.textMuted,
											whiteSpace: 'nowrap',
										}}
									>
										{row.date}
									</td>
									{[
										row.mood_score,
										row.energy_score,
										row.focus_score,
										row.anxiety_score,
									].map((score, si) => (
										<td
											key={si}
											css={{
												padding: `${spacing.xs} ${spacing.sm}`,
												color:
													score === null
														? colors.textMuted
														: score >= 7
															? colors.primary
															: score >= 4
																? colors.text
																: colors.error,
												fontWeight:
													score !== null
														? typography.fontWeight.medium
														: undefined,
											}}
										>
											{score ?? '—'}
										</td>
									))}
									<td
										css={{ padding: `${spacing.xs} ${spacing.sm}` }}
									>
										{row.sleep_hours !== null ? `${row.sleep_hours}h` : '—'}
									</td>
									<td
										css={{
											padding: `${spacing.xs} ${spacing.sm}`,
											color:
												row.avg_bhb_mmol !== null
													? row.avg_bhb_mmol >= ketoneGoal
														? colors.primary
														: colors.error
													: colors.textMuted,
											fontWeight:
												row.avg_bhb_mmol !== null
													? typography.fontWeight.medium
													: undefined,
										}}
									>
										{row.avg_bhb_mmol !== null
											? `${row.avg_bhb_mmol}`
											: '—'}
									</td>
									<td
										css={{
											padding: `${spacing.xs} ${spacing.sm}`,
											color: colors.textMuted,
											fontSize: typography.fontSize.xs,
										}}
									>
										{row.smart_pillars.length > 0
											? row.smart_pillars.join(', ')
											: '—'}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}

// ── Protocol tab ──────────────────────────────────────────────────────────────

function ProtocolTab(summary: Summary) {
	const { profile, phase, days_since_start } = summary

	if (!profile) {
		return (
			<div css={{ display: 'grid', gap: spacing.md }}>
				<p css={{ color: colors.textMuted }}>
					No protocol configured yet.{' '}
					<a href="/onboarding" css={{ color: colors.primaryText }}>
						Set up your THINK protocol →
					</a>
				</p>
			</div>
		)
	}

	return (
		<div css={{ display: 'grid', gap: spacing.md }}>
			{phase ? (
				<div css={cardCss}>
					<span css={cardTitleCss}>Current phase</span>
					<p css={{ ...valueCss, fontSize: typography.fontSize.lg }}>
						{phaseLabels[phase] ?? phase}
					</p>
					{days_since_start !== null ? (
						<p css={{ color: colors.textMuted, fontSize: typography.fontSize.sm }}>
							Day {days_since_start} since {profile.protocol_start_date}
						</p>
					) : null}
				</div>
			) : null}

			<div css={cardCss}>
				<span css={cardTitleCss}>THINK protocol</span>
				<dl
					css={{
						display: 'grid',
						gridTemplateColumns: 'auto 1fr',
						gap: `${spacing.xs} ${spacing.md}`,
						margin: 0,
					}}
				>
					{[
						['Dietary approach', profile.dietary_approach ?? '—'],
						['Ketone goal', `≥ ${profile.ketone_goal_mmol} mmol/L`],
						['Carb target', `${profile.carb_target_g}g / day`],
						['Protein target', profile.protein_target_g ? `${profile.protein_target_g}g / day` : '—'],
						['Fat target', profile.fat_target_g ? `${profile.fat_target_g}g / day` : '—'],
						['Fasting', profile.fasting_protocol ?? '—'],
					].map(([label, value]) => (
						<>
							<dt
								css={{
									fontSize: typography.fontSize.sm,
									color: colors.textMuted,
									fontWeight: typography.fontWeight.medium,
								}}
							>
								{label}
							</dt>
							<dd
								css={{
									fontSize: typography.fontSize.sm,
									color: colors.text,
									margin: 0,
								}}
							>
								{value}
							</dd>
						</>
					))}
				</dl>
				{profile.supplementation_notes ? (
					<div css={{ borderTop: `1px solid ${colors.border}`, paddingTop: spacing.sm }}>
						<p css={{ fontSize: typography.fontSize.xs, color: colors.textMuted, margin: 0 }}>
							Supplements: {profile.supplementation_notes}
						</p>
					</div>
				) : null}
			</div>

			<a
				href="/onboarding"
				css={{
					fontSize: typography.fontSize.sm,
					color: colors.primaryText,
					textDecoration: 'none',
					'&:hover': { textDecoration: 'underline' },
				}}
			>
				Edit protocol →
			</a>
		</div>
	)
}

// ── SMART tab ─────────────────────────────────────────────────────────────────

function SmartTab(history: Array<HistoryRow>, summary: Summary) {
	// Aggregate last 7 days
	const last7 = history.slice(0, 7)
	const coveredThisWeek = new Set<string>()
	for (const row of last7) {
		for (const p of row.smart_pillars) coveredThisWeek.add(p)
		if (row.sleep_hours !== null) coveredThisWeek.add('sleep')
	}
	const missing = allSmartPillars.filter((p) => !coveredThisWeek.has(p))

	return (
		<div css={{ display: 'grid', gap: spacing.md }}>
			<div css={cardCss}>
				<span css={cardTitleCss}>This week's coverage</span>
				<div css={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
					{allSmartPillars.map((pillar) => {
						const covered = coveredThisWeek.has(pillar)
						return (
							<span
								key={pillar}
								css={{
									padding: `${spacing.xs} ${spacing.md}`,
									borderRadius: radius.full,
									fontSize: typography.fontSize.sm,
									fontWeight: typography.fontWeight.medium,
									backgroundColor: covered ? colors.primary : colors.surface,
									color: covered ? colors.onPrimary : colors.textMuted,
									border: `1px solid ${covered ? colors.primary : colors.border}`,
								}}
							>
								{covered ? '✓ ' : ''}{pillar.charAt(0).toUpperCase() + pillar.slice(1)}
							</span>
						)
					})}
				</div>
				{missing.length > 0 ? (
					<p css={{ fontSize: typography.fontSize.sm, color: colors.textMuted }}>
						Missing this week: {missing.join(', ')}. Log via your AI assistant.
					</p>
				) : (
					<p css={{ fontSize: typography.fontSize.sm, color: colors.primary }}>
						All pillars covered this week.
					</p>
				)}
			</div>

			{/* Today's smart logs */}
			{summary.smart_logs.length > 0 ? (
				<div css={cardCss}>
					<span css={cardTitleCss}>Today's entries</span>
					<ul css={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: spacing.xs }}>
						{summary.smart_logs.map((s, i) => (
							<li key={i} css={{ fontSize: typography.fontSize.sm }}>
								<span css={{ fontWeight: typography.fontWeight.medium, color: colors.primaryText }}>
									{s.pillar.charAt(0).toUpperCase() + s.pillar.slice(1)}:
								</span>{' '}
								{s.description}
								{s.duration_minutes ? ` · ${s.duration_minutes} min` : ''}
								{s.quality_score ? ` · ${s.quality_score}/10` : ''}
							</li>
						))}
					</ul>
				</div>
			) : null}

			{/* 7-day pillar table */}
			{last7.length > 0 ? (
				<div css={cardCss}>
					<span css={cardTitleCss}>7-day pillar log</span>
					<div css={{ overflowX: 'auto' }}>
						<table css={{ width: '100%', borderCollapse: 'collapse', fontSize: typography.fontSize.xs }}>
							<thead>
								<tr>
									<th css={{ textAlign: 'left', padding: `${spacing.xs} ${spacing.sm}`, color: colors.textMuted }}>Date</th>
									{allSmartPillars.map((p) => (
										<th key={p} css={{ textAlign: 'center', padding: `${spacing.xs} ${spacing.sm}`, color: colors.textMuted }}>
											{p.charAt(0).toUpperCase()}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{last7.map((row) => (
									<tr key={row.date}>
										<td css={{ padding: `${spacing.xs} ${spacing.sm}`, color: colors.textMuted }}>{row.date}</td>
										{allSmartPillars.map((pillar) => {
											const done =
												pillar === 'sleep'
													? row.sleep_hours !== null
													: row.smart_pillars.includes(pillar)
											return (
												<td key={pillar} css={{ textAlign: 'center', padding: `${spacing.xs} ${spacing.sm}`, color: done ? colors.primary : colors.border }}>
													{done ? '✓' : '·'}
												</td>
											)
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			) : null}
		</div>
	)
}

// ── Main route component ──────────────────────────────────────────────────────

export function DashboardRoute(handle: Handle) {
	let activeTab: Tab = 'today'
	let trendDays = 14
	let summary: Summary | null = null
	let history: Array<HistoryRow> = []
	let loadError: string | null = null
	let loading = true

	function setTab(tab: Tab) {
		activeTab = tab
		handle.update()
	}

	function setTrendDays(d: number) {
		trendDays = d
		loading = true
		handle.update()
		void loadHistory(d)
	}

	async function loadSummary(signal: AbortSignal) {
		try {
			const res = await fetch('/api/dashboard/summary', {
				credentials: 'include',
				signal,
			})
			if (!res.ok) {
				if (res.status === 401 && typeof window !== 'undefined') {
					window.location.assign('/login')
					return
				}
				loadError = `Failed to load dashboard (${res.status})`
				loading = false
				handle.update()
				return
			}
			summary = (await res.json()) as Summary
		} catch {
			if (!signal.aborted) {
				loadError = 'Network error — could not load dashboard data.'
			}
		}
	}

	async function loadHistory(days: number) {
		try {
			const res = await fetch(`/api/dashboard/history?days=${days}`, {
				credentials: 'include',
				signal: handle.signal,
			})
			if (res.ok) {
				const data = (await res.json()) as { history: Array<HistoryRow> }
				history = data.history
			}
		} catch {
			// non-fatal — trends tab will just be empty
		}
		loading = false
		handle.update()
	}

	handle.queueTask(async (signal) => {
		await Promise.all([loadSummary(signal), loadHistory(trendDays)])
		if (!signal.aborted) {
			loading = false
			handle.update()
		}
	})

	return () => {
		if (loadError) {
			return (
				<section css={{ maxWidth: '48rem', margin: '0 auto' }}>
					<p css={{ color: colors.error }}>{loadError}</p>
				</section>
			)
		}

		const ketoneGoal = summary?.profile?.ketone_goal_mmol ?? 1.5

		return (
			<section css={{ maxWidth: '52rem', margin: '0 auto', display: 'grid', gap: spacing.lg }}>
				<header css={{ display: 'grid', gap: spacing.xs }}>
					<h2 css={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.semibold, color: colors.text }}>
						Dashboard
					</h2>
					{summary?.today ? (
						<p css={{ color: colors.textMuted }}>{summary.today}</p>
					) : null}
				</header>

				{/* Tab bar */}
				<nav css={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
					{(['today', 'trends', 'protocol', 'smart'] as Array<Tab>).map((tab) => (
						<button
							key={tab}
							css={tabCss(activeTab === tab)}
							on={{ click() { setTab(tab) } }}
						>
							{tab.charAt(0).toUpperCase() + tab.slice(1)}
						</button>
					))}
				</nav>

				{loading ? (
					<p css={{ color: colors.textMuted }}>Loading…</p>
				) : summary === null ? (
					<p css={{ color: colors.textMuted }}>No data available.</p>
				) : (
					<>
						{activeTab === 'today' ? TodayTab(summary) : null}
						{activeTab === 'trends' ? (
							<div css={{ display: 'grid', gap: spacing.md }}>
								<div css={{ display: 'flex', gap: spacing.sm }}>
									{[7, 14, 30, 90].map((d) => (
										<button
											key={d}
											css={tabCss(trendDays === d)}
											on={{ click() { setTrendDays(d) } }}
										>
											{d}d
										</button>
									))}
								</div>
								{TrendsTab(history, trendDays, ketoneGoal)}
							</div>
						) : null}
						{activeTab === 'protocol' ? ProtocolTab(summary) : null}
						{activeTab === 'smart' ? SmartTab(history, summary) : null}
					</>
				)}
			</section>
		)
	}
}
