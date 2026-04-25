import { type Handle } from 'remix/component'
import {
	colors,
	radius,
	shadows,
	spacing,
	transitions,
	typography,
} from '#client/styles/tokens.ts'

type Step = 'protocol' | 'lifestyle' | 'care'
type Status = 'idle' | 'submitting' | 'error' | 'success'

type FormData = {
	name: string
	dietary_approach: string
	protocol_start_date: string
	ketone_goal_mmol: string
	carb_target_g: string
	protein_target_g: string
	fat_target_g: string
	fasting_protocol: string
	supplementation_notes: string
	care_team_notes: string
	mental_health_context: string
}

const stepTitles: Record<Step, string> = {
	protocol: 'Your THINK protocol',
	lifestyle: 'Macros & lifestyle',
	care: 'Care & context',
}

const stepDescriptions: Record<Step, string> = {
	protocol:
		'Set your dietary approach, ketone goal, and carb target. These tell the AI how to interpret your logs.',
	lifestyle:
		'Optional macro targets and lifestyle factors. Skip anything you have not yet established.',
	care: 'Care team context and optional mental health notes. All fields here are optional and you control what you share.',
}

const steps: Array<Step> = ['protocol', 'lifestyle', 'care']

function todayIso() {
	return new Date().toISOString().split('T')[0]!
}

const inputCss = {
	padding: spacing.sm,
	borderRadius: radius.md,
	border: `1px solid ${colors.border}`,
	fontSize: typography.fontSize.base,
	fontFamily: typography.fontFamily,
	width: '100%',
	boxSizing: 'border-box' as const,
}

const labelSpanCss = {
	color: colors.text,
	fontWeight: typography.fontWeight.medium,
	fontSize: typography.fontSize.sm,
}

const hintCss = {
	color: colors.textMuted,
	fontSize: typography.fontSize.sm,
}

const fieldCss = {
	display: 'grid',
	gap: spacing.xs,
}

const buttonCss = (disabled: boolean) => ({
	padding: `${spacing.sm} ${spacing.lg}`,
	borderRadius: radius.full,
	border: 'none',
	backgroundColor: colors.primary,
	color: colors.onPrimary,
	fontSize: typography.fontSize.base,
	fontWeight: typography.fontWeight.semibold,
	cursor: disabled ? 'not-allowed' : 'pointer',
	opacity: disabled ? 0.7 : 1,
	transition: `transform ${transitions.fast}, background-color ${transitions.normal}`,
	'&:hover': disabled
		? undefined
		: {
				backgroundColor: colors.primaryHover,
				transform: 'translateY(-1px)',
			},
	'&:active': disabled
		? undefined
		: {
				backgroundColor: colors.primaryActive,
				transform: 'translateY(0)',
			},
})

const secondaryButtonCss = {
	padding: `${spacing.sm} ${spacing.lg}`,
	borderRadius: radius.full,
	border: `1px solid ${colors.border}`,
	backgroundColor: 'transparent',
	color: colors.text,
	fontSize: typography.fontSize.base,
	fontWeight: typography.fontWeight.medium,
	cursor: 'pointer',
}

export function OnboardingRoute(handle: Handle) {
	let currentStep: Step = 'protocol'
	let status: Status = 'idle'
	let errorMessage: string | null = null

	const formData: FormData = {
		name: '',
		dietary_approach: 'omnivore',
		protocol_start_date: todayIso(),
		ketone_goal_mmol: '1.5',
		carb_target_g: '20',
		protein_target_g: '',
		fat_target_g: '',
		fasting_protocol: '',
		supplementation_notes: '',
		care_team_notes: '',
		mental_health_context: '',
	}

	function update() {
		handle.update()
	}

	function setField(field: keyof FormData, value: string) {
		formData[field] = value
	}

	function goNext() {
		const idx = steps.indexOf(currentStep)
		if (idx < steps.length - 1) {
			currentStep = steps[idx + 1]!
			update()
		}
	}

	function goBack() {
		const idx = steps.indexOf(currentStep)
		if (idx > 0) {
			currentStep = steps[idx - 1]!
			update()
		}
	}

	function collectFromForm(form: HTMLFormElement) {
		const fd = new FormData(form)
		for (const key of Object.keys(formData) as Array<keyof FormData>) {
			const value = fd.get(key)
			if (typeof value === 'string') {
				formData[key] = value
			}
		}
	}

	async function handleStepSubmit(event: SubmitEvent) {
		event.preventDefault()
		if (!(event.currentTarget instanceof HTMLFormElement)) return
		collectFromForm(event.currentTarget)

		if (currentStep !== 'care') {
			goNext()
			return
		}

		// Final step — submit
		status = 'submitting'
		errorMessage = null
		update()

		try {
			const payload: Record<string, unknown> = {
				name: formData.name || null,
				dietary_approach: formData.dietary_approach || null,
				protocol_start_date: formData.protocol_start_date || null,
				ketone_goal_mmol: formData.ketone_goal_mmol
					? Number(formData.ketone_goal_mmol)
					: 1.5,
				carb_target_g: formData.carb_target_g
					? Number(formData.carb_target_g)
					: 20,
				protein_target_g: formData.protein_target_g
					? Number(formData.protein_target_g)
					: null,
				fat_target_g: formData.fat_target_g
					? Number(formData.fat_target_g)
					: null,
				fasting_protocol: formData.fasting_protocol || null,
				supplementation_notes: formData.supplementation_notes || null,
				care_team_notes: formData.care_team_notes || null,
				mental_health_context: formData.mental_health_context || null,
			}

			const response = await fetch('/onboarding', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(payload),
			})

			const json = await response.json().catch(() => null)

			if (!response.ok) {
				status = 'error'
				errorMessage =
					typeof json?.error === 'string'
						? json.error
						: 'Something went wrong. Please try again.'
				update()
				return
			}

			status = 'success'
			update()

			if (typeof window !== 'undefined') {
				setTimeout(() => window.location.assign('/account'), 1200)
			}
		} catch {
			status = 'error'
			errorMessage = 'Network error. Please try again.'
			update()
		}
	}

	return () => {
		const stepIndex = steps.indexOf(currentStep)
		const isFirst = stepIndex === 0
		const isLast = currentStep === 'care'
		const isSubmitting = status === 'submitting'
		const isSuccess = status === 'success'

		return (
			<section
				css={{
					maxWidth: '32rem',
					margin: '0 auto',
					display: 'grid',
					gap: spacing.lg,
				}}
			>
				{/* Progress indicator */}
				<div
					css={{
						display: 'flex',
						gap: spacing.sm,
						alignItems: 'center',
					}}
				>
					{steps.map((s, i) => (
						<div
							key={s}
							css={{
								display: 'flex',
								alignItems: 'center',
								gap: spacing.sm,
								flex: i < steps.length - 1 ? 1 : undefined,
							}}
						>
							<div
								css={{
									width: '1.5rem',
									height: '1.5rem',
									borderRadius: radius.full,
									backgroundColor:
										i < stepIndex
											? colors.primary
											: i === stepIndex
												? colors.primary
												: colors.border,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexShrink: 0,
								}}
							>
								<span
									css={{
										fontSize: typography.fontSize.xs,
										color:
											i <= stepIndex ? colors.onPrimary : colors.textMuted,
										fontWeight: typography.fontWeight.semibold,
									}}
								>
									{i < stepIndex ? '✓' : String(i + 1)}
								</span>
							</div>
							{i < steps.length - 1 ? (
								<div
									css={{
										flex: 1,
										height: '2px',
										backgroundColor:
											i < stepIndex ? colors.primary : colors.border,
									}}
								/>
							) : null}
						</div>
					))}
				</div>

				{/* Header */}
				<header css={{ display: 'grid', gap: spacing.xs }}>
					<h2
						css={{
							fontSize: typography.fontSize.xl,
							fontWeight: typography.fontWeight.semibold,
							color: colors.text,
						}}
					>
						{isSuccess ? 'Protocol saved!' : stepTitles[currentStep]}
					</h2>
					<p css={{ color: colors.textMuted }}>
						{isSuccess
							? 'Your THINK protocol is set up. Redirecting to your account…'
							: stepDescriptions[currentStep]}
					</p>
				</header>

				{isSuccess ? null : (
					<form
						css={{
							display: 'grid',
							gap: spacing.md,
							padding: spacing.lg,
							borderRadius: radius.lg,
							border: `1px solid ${colors.border}`,
							backgroundColor: colors.surface,
							boxShadow: shadows.sm,
						}}
						on={{ submit: handleStepSubmit }}
					>
						{/* Step 1: Protocol */}
						{currentStep === 'protocol' ? (
							<>
								<label css={fieldCss}>
									<span css={labelSpanCss}>Your name (optional)</span>
									<input
										type="text"
										name="name"
										value={formData.name}
										placeholder="e.g. Alex"
										css={inputCss}
										on={{
											input(e) {
												setField(
													'name',
													(e.target as HTMLInputElement).value,
												)
											},
										}}
									/>
								</label>

								<label css={fieldCss}>
									<span css={labelSpanCss}>Dietary approach</span>
									<select
										name="dietary_approach"
										css={inputCss}
										on={{
											change(e) {
												setField(
													'dietary_approach',
													(e.target as HTMLSelectElement).value,
												)
											},
										}}
									>
										<option value="omnivore">Omnivore (standard keto)</option>
										<option value="carnivore">Carnivore</option>
										<option value="vegetarian">Vegetarian keto</option>
										<option value="vegan">Vegan keto</option>
									</select>
								</label>

								<label css={fieldCss}>
									<span css={labelSpanCss}>Protocol start date</span>
									<input
										type="date"
										name="protocol_start_date"
										value={formData.protocol_start_date}
										css={inputCss}
										on={{
											change(e) {
												setField(
													'protocol_start_date',
													(e.target as HTMLInputElement).value,
												)
											},
										}}
									/>
									<span css={hintCss}>
										The day you started (or plan to start) your ketogenic
										protocol. Used to determine your current phase.
									</span>
								</label>

								<label css={fieldCss}>
									<span css={labelSpanCss}>Ketone goal (mmol/L)</span>
									<input
										type="number"
										name="ketone_goal_mmol"
										value={formData.ketone_goal_mmol}
										min="0.5"
										max="5"
										step="0.1"
										css={inputCss}
										on={{
											input(e) {
												setField(
													'ketone_goal_mmol',
													(e.target as HTMLInputElement).value,
												)
											},
										}}
									/>
									<span css={hintCss}>
										Typical therapeutic range: 1.5–3.0 mmol/L. Use the value
										recommended by your care team.
									</span>
								</label>

								<label css={fieldCss}>
									<span css={labelSpanCss}>Daily carb target (grams)</span>
									<input
										type="number"
										name="carb_target_g"
										value={formData.carb_target_g}
										min="5"
										max="150"
										step="1"
										css={inputCss}
										on={{
											input(e) {
												setField(
													'carb_target_g',
													(e.target as HTMLInputElement).value,
												)
											},
										}}
									/>
									<span css={hintCss}>
										Most people achieve ketosis with ≤20g net carbs/day.
									</span>
								</label>
							</>
						) : null}

						{/* Step 2: Macros & Lifestyle */}
						{currentStep === 'lifestyle' ? (
							<>
								<label css={fieldCss}>
									<span css={labelSpanCss}>Protein target (g/day) — optional</span>
									<input
										type="number"
										name="protein_target_g"
										value={formData.protein_target_g}
										placeholder="e.g. 120"
										min="30"
										max="400"
										step="1"
										css={inputCss}
										on={{
											input(e) {
												setField(
													'protein_target_g',
													(e.target as HTMLInputElement).value,
												)
											},
										}}
									/>
									<span css={hintCss}>
										Typical range: 1.2–1.7g per kg of lean body mass.
									</span>
								</label>

								<label css={fieldCss}>
									<span css={labelSpanCss}>Fat target (g/day) — optional</span>
									<input
										type="number"
										name="fat_target_g"
										value={formData.fat_target_g}
										placeholder="e.g. 150"
										min="30"
										max="500"
										step="1"
										css={inputCss}
										on={{
											input(e) {
												setField(
													'fat_target_g',
													(e.target as HTMLInputElement).value,
												)
											},
										}}
									/>
								</label>

								<label css={fieldCss}>
									<span css={labelSpanCss}>Fasting protocol — optional</span>
									<input
										type="text"
										name="fasting_protocol"
										value={formData.fasting_protocol}
										placeholder="e.g. 16:8 intermittent fasting"
										css={inputCss}
										on={{
											input(e) {
												setField(
													'fasting_protocol',
													(e.target as HTMLInputElement).value,
												)
											},
										}}
									/>
								</label>

								<label css={fieldCss}>
									<span css={labelSpanCss}>Supplementation notes — optional</span>
									<textarea
										name="supplementation_notes"
										value={formData.supplementation_notes}
										placeholder="e.g. Magnesium glycinate 400mg, electrolyte powder, omega-3 2g"
										rows={3}
										css={{ ...inputCss, resize: 'vertical' }}
										on={{
											input(e) {
												setField(
													'supplementation_notes',
													(e.target as HTMLTextAreaElement).value,
												)
											},
										}}
									/>
								</label>
							</>
						) : null}

						{/* Step 3: Care & Context */}
						{currentStep === 'care' ? (
							<>
								<label css={fieldCss}>
									<span css={labelSpanCss}>Care team notes — optional</span>
									<textarea
										name="care_team_notes"
										value={formData.care_team_notes}
										placeholder="e.g. Dr. Smith is monitoring labs quarterly. On lithium — checking levels monthly."
										rows={3}
										css={{ ...inputCss, resize: 'vertical' }}
										on={{
											input(e) {
												setField(
													'care_team_notes',
													(e.target as HTMLTextAreaElement).value,
												)
											},
										}}
									/>
									<span css={hintCss}>
										Help the AI understand your clinical context. Not shared
										with anyone — stored only in your account.
									</span>
								</label>

								<div
									css={{
										display: 'grid',
										gap: spacing.sm,
										padding: spacing.md,
										borderRadius: radius.md,
										border: `1px solid ${colors.border}`,
										backgroundColor: colors.background,
									}}
								>
									<p
										css={{
											fontSize: typography.fontSize.sm,
											fontWeight: typography.fontWeight.medium,
											color: colors.text,
										}}
									>
										Mental health context — optional
									</p>
									<p css={hintCss}>
										This is entirely optional and user-controlled. If you share
										context here, the AI will use it to provide more relevant
										support. You can clear it at any time from your account.
									</p>
									<textarea
										name="mental_health_context"
										value={formData.mental_health_context}
										placeholder="e.g. Managing bipolar II. Using this protocol alongside therapy and psychiatry."
										rows={3}
										css={{ ...inputCss, resize: 'vertical' }}
										on={{
											input(e) {
												setField(
													'mental_health_context',
													(e.target as HTMLTextAreaElement).value,
												)
											},
										}}
									/>
								</div>

								<p
									css={{
										fontSize: typography.fontSize.sm,
										color: colors.textMuted,
										borderTop: `1px solid ${colors.border}`,
										paddingTop: spacing.sm,
									}}
								>
									⚕️ This app supports but does not replace care from a clinical
									team. Always consult your doctor or psychiatrist before making
									changes to medications or your protocol.
								</p>

								{errorMessage ? (
									<p
										css={{
											color: colors.error,
											fontSize: typography.fontSize.sm,
										}}
										aria-live="polite"
									>
										{errorMessage}
									</p>
								) : null}
							</>
						) : null}

						{/* Navigation */}
						<div
							css={{
								display: 'flex',
								gap: spacing.sm,
								justifyContent: 'space-between',
								alignItems: 'center',
								marginTop: spacing.xs,
							}}
						>
							{!isFirst ? (
								<button
									type="button"
									css={secondaryButtonCss}
									on={{ click: goBack }}
								>
									Back
								</button>
							) : (
								<span />
							)}
							<button
								type="submit"
								disabled={isSubmitting}
								css={buttonCss(isSubmitting)}
							>
								{isSubmitting
									? 'Saving…'
									: isLast
										? 'Save protocol'
										: 'Next'}
							</button>
						</div>
					</form>
				)}

				{!isSuccess ? (
					<a
						href="/account"
						css={{
							color: colors.textMuted,
							fontSize: typography.fontSize.sm,
							textDecoration: 'none',
							'&:hover': { textDecoration: 'underline' },
						}}
					>
						Skip for now
					</a>
				) : null}
			</section>
		)
	}
}
