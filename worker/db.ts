import { createDatabase, createTable, sql } from 'remix/data-table'
import { nullable, number, optional, string } from 'remix/data-schema'
import { createD1DataTableAdapter } from './d1-data-table-adapter.ts'

export const userProfilesTable = createTable({
	name: 'user_profiles',
	columns: {
		user_id: string(),
		name: optional(nullable(string())),
		dietary_approach: optional(nullable(string())),
		ketone_goal_mmol: number(),
		carb_target_g: number(),
		protein_target_g: optional(nullable(number())),
		fat_target_g: optional(nullable(number())),
		fasting_protocol: optional(nullable(string())),
		supplementation_notes: optional(nullable(string())),
		mental_health_context: optional(nullable(string())),
		care_team_notes: optional(nullable(string())),
		protocol_start_date: optional(nullable(string())),
		created_at: string(),
		updated_at: string(),
	},
	primaryKey: 'user_id',
	timestamps: {
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	},
})

export const dailyLogsTable = createTable({
	name: 'daily_logs',
	columns: {
		id: string(),
		user_id: string(),
		date: string(),
		mood_score: optional(nullable(number())),
		mood_note: optional(nullable(string())),
		energy_score: optional(nullable(number())),
		focus_score: optional(nullable(number())),
		anxiety_score: optional(nullable(number())),
		sleep_hours: optional(nullable(number())),
		sleep_quality: optional(nullable(number())),
		sleep_bedtime: optional(nullable(string())),
		sleep_wake_time: optional(nullable(string())),
		created_at: string(),
		updated_at: string(),
	},
	primaryKey: 'id',
	timestamps: {
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	},
})

export const foodLogsTable = createTable({
	name: 'food_logs',
	columns: {
		id: string(),
		user_id: string(),
		logged_at: string(),
		description: string(),
		carbs_g: optional(nullable(number())),
		protein_g: optional(nullable(number())),
		fat_g: optional(nullable(number())),
		calories: optional(nullable(number())),
		notes: optional(nullable(string())),
	},
	primaryKey: 'id',
})

export const ketoneReadingsTable = createTable({
	name: 'ketone_readings',
	columns: {
		id: string(),
		user_id: string(),
		measured_at: string(),
		bhb_mmol: number(),
		glucose_mg_dl: optional(nullable(number())),
		notes: optional(nullable(string())),
	},
	primaryKey: 'id',
})

export const smartLogsTable = createTable({
	name: 'smart_logs',
	columns: {
		id: string(),
		user_id: string(),
		logged_at: string(),
		pillar: string(),
		description: string(),
		duration_minutes: optional(nullable(number())),
		quality_score: optional(nullable(number())),
		notes: optional(nullable(string())),
	},
	primaryKey: 'id',
})

export const careTeamTable = createTable({
	name: 'care_team',
	columns: {
		id: string(),
		user_id: string(),
		provider_name: string(),
		provider_type: optional(nullable(string())),
		notes: optional(nullable(string())),
	},
	primaryKey: 'id',
})

export const protocolGuidanceTable = createTable({
	name: 'protocol_guidance',
	columns: {
		id: string(),
		topic: string(),
		content: string(),
		version: string(),
		created_at: string(),
	},
	primaryKey: 'id',
})

export const usersTable = createTable({
	name: 'users',
	columns: {
		id: number(),
		username: string(),
		email: string(),
		password_hash: string(),
		created_at: string(),
		updated_at: string(),
	},
	primaryKey: 'id',
})

export const passwordResetsTable = createTable({
	name: 'password_resets',
	columns: {
		id: number(),
		user_id: number(),
		token_hash: string(),
		expires_at: number(),
		created_at: string(),
	},
	primaryKey: 'id',
})

export const chatThreadsTable = createTable({
	name: 'chat_threads',
	columns: {
		id: string(),
		user_id: number(),
		title: string(),
		last_message_preview: string(),
		message_count: number(),
		created_at: string(),
		updated_at: string(),
		deleted_at: optional(nullable(string())),
	},
	primaryKey: 'id',
	timestamps: {
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	},
})

export function createDb(db: D1Database) {
	return createDatabase(createD1DataTableAdapter(db), {
		now: () => new Date().toISOString(),
	})
}

export type AppDatabase = ReturnType<typeof createDb>
export { sql }
