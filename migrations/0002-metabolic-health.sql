-- User metabolic profile (keyed by OAuth userId = hex(sha256(email)))
CREATE TABLE IF NOT EXISTS user_profiles (
	user_id TEXT PRIMARY KEY NOT NULL,
	name TEXT,
	dietary_approach TEXT,
	ketone_goal_mmol REAL NOT NULL DEFAULT 1.5,
	carb_target_g INTEGER NOT NULL DEFAULT 20,
	protein_target_g INTEGER,
	fat_target_g INTEGER,
	fasting_protocol TEXT,
	supplementation_notes TEXT,
	mental_health_context TEXT,
	care_team_notes TEXT,
	protocol_start_date TEXT,
	created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- One row per user per day; UNIQUE enables safe find-or-create
CREATE TABLE IF NOT EXISTS daily_logs (
	id TEXT PRIMARY KEY NOT NULL,
	user_id TEXT NOT NULL,
	date TEXT NOT NULL,
	mood_score INTEGER,
	mood_note TEXT,
	energy_score INTEGER,
	focus_score INTEGER,
	anxiety_score INTEGER,
	sleep_hours REAL,
	sleep_quality INTEGER,
	sleep_bedtime TEXT,
	sleep_wake_time TEXT,
	created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date
	ON daily_logs(user_id, date DESC);

CREATE TABLE IF NOT EXISTS food_logs (
	id TEXT PRIMARY KEY NOT NULL,
	user_id TEXT NOT NULL,
	logged_at TEXT NOT NULL,
	description TEXT NOT NULL,
	carbs_g REAL,
	protein_g REAL,
	fat_g REAL,
	calories INTEGER,
	notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_food_logs_user_logged_at
	ON food_logs(user_id, logged_at DESC);

CREATE TABLE IF NOT EXISTS ketone_readings (
	id TEXT PRIMARY KEY NOT NULL,
	user_id TEXT NOT NULL,
	measured_at TEXT NOT NULL,
	bhb_mmol REAL NOT NULL,
	glucose_mg_dl REAL,
	notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_ketone_readings_user_measured_at
	ON ketone_readings(user_id, measured_at DESC);

CREATE TABLE IF NOT EXISTS smart_logs (
	id TEXT PRIMARY KEY NOT NULL,
	user_id TEXT NOT NULL,
	logged_at TEXT NOT NULL,
	pillar TEXT NOT NULL,
	description TEXT NOT NULL,
	duration_minutes INTEGER,
	quality_score INTEGER,
	notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_smart_logs_user_logged_at
	ON smart_logs(user_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_smart_logs_user_pillar
	ON smart_logs(user_id, pillar);

CREATE TABLE IF NOT EXISTS care_team (
	id TEXT PRIMARY KEY NOT NULL,
	user_id TEXT NOT NULL,
	provider_name TEXT NOT NULL,
	provider_type TEXT,
	notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_care_team_user_id
	ON care_team(user_id);

CREATE TABLE IF NOT EXISTS protocol_guidance (
	id TEXT PRIMARY KEY NOT NULL,
	topic TEXT NOT NULL,
	content TEXT NOT NULL,
	version TEXT NOT NULL DEFAULT '1.0',
	created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE INDEX IF NOT EXISTS idx_protocol_guidance_topic
	ON protocol_guidance(topic);
