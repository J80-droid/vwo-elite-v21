-- 1. GEBRUIKERSPROFIEL & GAMIFICATION
CREATE TABLE IF NOT EXISTS user_profile (
    id TEXT PRIMARY KEY,
    name TEXT,
    xp_total INTEGER DEFAULT 0,
    streak_current INTEGER DEFAULT 0,
    streak_record INTEGER DEFAULT 0,
    last_active TIMESTAMP
);

-- 2. THE GYM (Spaced Repetition Data)
CREATE TABLE IF NOT EXISTS gym_progress (
    engine_id TEXT NOT NULL,       -- bijv. 'fractions'
    skill_key TEXT NOT NULL,       -- bijv. 'add_basic'
    box_level INTEGER DEFAULT 1,   -- Leitner Box (1-5)
    next_review TIMESTAMP,         -- Wanneer moet dit weer geoefend worden?
    difficulty_level INTEGER,      -- Huidige moeilijkheidsgraad (1-4)
    PRIMARY KEY (engine_id, skill_key)
);

-- Logboek van elke beantwoorde vraag (voor foutenanalyse)
CREATE TABLE IF NOT EXISTS gym_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    engine_id TEXT,
    question_snapshot TEXT,        -- Wat was de vraag?
    user_answer TEXT,              -- Wat typte de leerling?
    is_correct BOOLEAN,
    time_taken_ms INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CONCEPT LAB (Unlocks & Progressie)
CREATE TABLE IF NOT EXISTS module_unlocks (
    module_id TEXT PRIMARY KEY,    -- bijv. 'concept_chain_rule'
    is_unlocked BOOLEAN DEFAULT 0,
    prerequisites_met BOOLEAN DEFAULT 0, -- Checkt of Gym-eisen gehaald zijn
    completed_at TIMESTAMP
);

-- 4. TUTOR & SNAPSHOTS
CREATE TABLE IF NOT EXISTS snapshots (
    id TEXT PRIMARY KEY,
    title TEXT,
    image_blob BLOB,               -- De screenshot zelf (efficiënt in SQL/OPFS)
    metadata_json TEXT,            -- Opgeslagen functies/parameters status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
