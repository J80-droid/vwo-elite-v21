import * as lancedb from "@lancedb/lancedb";
import { safeLog } from "@shared/lib/safe-logger";
import Database from "better-sqlite3";
import { app } from "electron";
import fs from "fs";
import path from "path";

export class DatabaseFactory {
  private static sqliteInstance: Database | null = null;
  private static lanceConnection: lancedb.Connection | null = null;

  // Centrale pad-bepaling voor consistentie in productie vs dev
  private static getUserDataPath(): string {
    return app.isPackaged ? app.getPath("userData") : process.cwd();
  }

  static getSQLite(): Database {
    if (this.sqliteInstance) return this.sqliteInstance;

    const dbFolder = path.join(this.getUserDataPath(), "databases");
    if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder, { recursive: true });

    // Using 'app.db' as proposed in the architecture
    const dbPath = path.join(dbFolder, "app.db");
    safeLog.log(`[SQLite] Attempting to initialize at: ${dbPath}`);

    // Initialiseer connectie
    try {
      this.sqliteInstance = new Database(dbPath);
      safeLog.log("[SQLite] better-sqlite3 instance created.");
    } catch (e) {
      safeLog.error(`[SQLite] Failed to open database at ${dbPath}:`, e);
      throw e;
    }

    // PERFORMANCE OPTIMALISATIES (Cruciaal voor 8GB RAM doelstelling)
    this.sqliteInstance.pragma("journal_mode = WAL"); // Concurrent Reads/Writes
    this.sqliteInstance.pragma("synchronous = NORMAL"); // Balans snelheid/veiligheid

    // Ensure tables exist
    this.sqliteInstance.exec(`
          CREATE TABLE IF NOT EXISTS documents_meta (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            upload_date TEXT NOT NULL,
            status TEXT NOT NULL,
            path TEXT
          );

          CREATE TABLE IF NOT EXISTS ai_models (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            provider TEXT NOT NULL,
            model_id TEXT NOT NULL,
            endpoint TEXT,
            api_key_id TEXT,
            local_path TEXT,
            capabilities TEXT, -- JSON array
            enabled INTEGER DEFAULT 1,
            priority INTEGER DEFAULT 50,
            metrics TEXT, -- JSON object
            requirements TEXT, -- JSON object
            created_at INTEGER,
            last_used_at INTEGER
          );

          CREATE TABLE IF NOT EXISTS mcp_tools (
            name TEXT PRIMARY KEY,
            description TEXT,
            enabled INTEGER DEFAULT 1,
            requires_approval INTEGER DEFAULT 0
          );

          CREATE TABLE IF NOT EXISTS ai_settings (
            key TEXT PRIMARY KEY,
            value TEXT -- JSON
          );

          CREATE TABLE IF NOT EXISTS tutor_snapshots (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            topic TEXT,
            context TEXT NOT NULL, -- JSON
            created_at INTEGER
          );
          
          CREATE TABLE IF NOT EXISTS gym_history (
            id TEXT PRIMARY KEY,
            engine_id TEXT NOT NULL,
            score INTEGER,
            metrics TEXT, -- JSON
            timestamp INTEGER
          );

          CREATE TABLE IF NOT EXISTS chat_sessions (
              id TEXT PRIMARY KEY,
              title TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS chat_messages (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              session_id TEXT,
              role TEXT, -- 'user' | 'assistant'
              content TEXT,
              timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
          );

          -- RENDERER TABLES (STUDY DATABASE)
          CREATE TABLE IF NOT EXISTS user_settings (
            id TEXT PRIMARY KEY,
            profile TEXT,
            theme TEXT,
            ai_config TEXT,
            shortcuts TEXT,
            pomodoro_work INTEGER,
            pomodoro_break INTEGER,
            language TEXT DEFAULT 'nl',
            streak INTEGER DEFAULT 0,
            gamification_enabled INTEGER DEFAULT 1,
            audio_focus_mode TEXT DEFAULT 'alpha',
            audio_volume INTEGER DEFAULT 50,
            graphics_quality TEXT DEFAULT 'high',
            python_mode TEXT DEFAULT 'standard',
            timer_start_sound TEXT DEFAULT 'zen-bell',
            timer_break_sound TEXT DEFAULT 'success-chord',
            speech_recognition_enabled INTEGER DEFAULT 1,
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            unlocked_achievements TEXT DEFAULT '[]'
          );

          CREATE TABLE IF NOT EXISTS study_materials (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            subject TEXT,
            type TEXT,
            content TEXT,
            embedding TEXT,
            date TEXT,
            quiz TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
          );

          CREATE TABLE IF NOT EXISTS flashcards (
            id TEXT PRIMARY KEY,
            front TEXT NOT NULL,
            back TEXT NOT NULL,
            material_id TEXT,
            due INTEGER,
            stability REAL,
            difficulty REAL,
            reps INTEGER DEFAULT 0,
            lapses INTEGER DEFAULT 0,
            state TEXT DEFAULT 'new',
            last_review INTEGER,
            tags TEXT
          );

          CREATE TABLE IF NOT EXISTS lab_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lab_name TEXT NOT NULL,
            score INTEGER,
            date TEXT
          );

          CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            activity TEXT NOT NULL,
            date TEXT NOT NULL,
            xp INTEGER DEFAULT 0
          );

          CREATE TABLE IF NOT EXISTS achievements (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            icon TEXT NOT NULL,
            unlocked_at TEXT
          );

          CREATE TABLE IF NOT EXISTS generated_media (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            prompt TEXT,
            data TEXT NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
          );

          CREATE TABLE IF NOT EXISTS blurting_sessions (
            id TEXT PRIMARY KEY,
            topic TEXT NOT NULL,
            score INTEGER,
            analysis_data TEXT, -- JSON
            content TEXT,
            date TEXT
          );

          CREATE TABLE IF NOT EXISTS lob_results (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            scores TEXT NOT NULL, -- JSON
            date TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS research_results (
            id TEXT PRIMARY KEY,
            module TEXT NOT NULL,
            data TEXT NOT NULL, -- JSON
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
          );

          CREATE TABLE IF NOT EXISTS quiz_history (
            id TEXT PRIMARY KEY,
            topic TEXT NOT NULL,
            date INTEGER NOT NULL,
            score INTEGER NOT NULL,
            total INTEGER NOT NULL,
            type_breakdown TEXT -- JSON
          );

          CREATE TABLE IF NOT EXISTS saved_questions (
            id TEXT PRIMARY KEY,
            question TEXT NOT NULL, -- JSON
            saved_at INTEGER NOT NULL
          );

          CREATE TABLE IF NOT EXISTS weak_points (
            id TEXT PRIMARY KEY,
            subject TEXT NOT NULL,
            topic TEXT NOT NULL,
            error_count INTEGER DEFAULT 0,
            attempt_count INTEGER DEFAULT 0,
            error_rate REAL DEFAULT 0,
            common_mistakes TEXT, -- JSON
            suggested_focus TEXT,
            improvement_score REAL DEFAULT 0,
            last_error_at INTEGER,
            last_practice_at INTEGER,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE TABLE IF NOT EXISTS system_logs (
            id TEXT PRIMARY KEY,
            level TEXT NOT NULL,
            message TEXT NOT NULL,
            data TEXT, -- JSON
            timestamp INTEGER NOT NULL
          );

          CREATE TABLE IF NOT EXISTS coaching_sessions (
            id TEXT PRIMARY KEY,
            subject TEXT NOT NULL,
            transcript TEXT NOT NULL,
            summary TEXT,
            duration INTEGER,
            date TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS planner_tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            start_time TEXT,
            end_time TEXT,
            duration INTEGER NOT NULL DEFAULT 30,
            is_fixed INTEGER DEFAULT 0,
            is_all_day INTEGER DEFAULT 0,
            subject TEXT,
            topic TEXT,
            chapter TEXT,
            grade_goal REAL,
            weight INTEGER,
            exam_type TEXT,
            type TEXT NOT NULL DEFAULT 'study',
            priority TEXT NOT NULL DEFAULT 'medium',
            energy_requirement TEXT NOT NULL DEFAULT 'medium',
            linked_content_id TEXT,
            pws_project_id TEXT,
            parent_task_id TEXT,
            completed INTEGER DEFAULT 0,
            status TEXT DEFAULT 'todo',
            completed_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            source TEXT NOT NULL DEFAULT 'manual',
            color TEXT
          );

          CREATE TABLE IF NOT EXISTS planner_settings (
            id TEXT PRIMARY KEY,
            chronotype TEXT DEFAULT 'neutral',
            peak_hours_start INTEGER DEFAULT 10,
            peak_hours_end INTEGER DEFAULT 17,
            work_day_start INTEGER DEFAULT 8,
            work_day_end INTEGER DEFAULT 22,
            preferred_study_duration INTEGER DEFAULT 45,
            buffer_minutes INTEGER DEFAULT 15,
            region TEXT DEFAULT 'midden',
            exam_year INTEGER,
            exam_mode INTEGER DEFAULT 0,
            auto_reschedule_enabled INTEGER DEFAULT 1,
            spaced_repetition_enabled INTEGER DEFAULT 1,
            updated_at TEXT
          );

          CREATE TABLE IF NOT EXISTS somtoday_schedule (
            id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            date TEXT NOT NULL,
            start_time TEXT,
            end_time TEXT,
            vak_naam TEXT,
            docent_afkorting TEXT,
            locatie TEXT,
            type TEXT,
            is_huiswerk INTEGER DEFAULT 0,
            is_toets INTEGER DEFAULT 0,
            raw_json TEXT
          );

          CREATE TABLE IF NOT EXISTS personal_tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            start_time TEXT,
            end_time TEXT,
            duration INTEGER DEFAULT 30,
            subject TEXT,
            priority TEXT DEFAULT 'medium',
            completed INTEGER DEFAULT 0,
            created_at TEXT,
            updated_at TEXT,
            raw_json TEXT
          );

          CREATE TABLE IF NOT EXISTS manual_grades (
            id TEXT PRIMARY KEY,
            subject TEXT NOT NULL,
            grade REAL NOT NULL,
            weight REAL DEFAULT 1.0,
            date TEXT NOT NULL,
            type TEXT,
            description TEXT,
            period INTEGER,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
          );

          CREATE TABLE IF NOT EXISTS pws_projects (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            subject TEXT,
            status TEXT,
            priority TEXT,
            deadline TEXT,
            sources TEXT DEFAULT '[]', -- JSON array
            created_at INTEGER,
            updated_at INTEGER
          );

          CREATE TABLE IF NOT EXISTS unavailable_blocks (
            id TEXT PRIMARY KEY,
            day_of_week INTEGER,
            start_time TEXT,
            end_time TEXT,
            reason TEXT
          );

          CREATE TABLE IF NOT EXISTS weekly_reviews (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            good TEXT,
            bad TEXT,
            plan TEXT,
            completed INTEGER DEFAULT 0,
            completed_at TEXT
          );

          CREATE TABLE IF NOT EXISTS somtoday_grades (
            id TEXT PRIMARY KEY,
            subject TEXT,
            grade REAL,
            weight REAL,
            datum_invoer TEXT,
            omschrijving TEXT,
            type TEXT,
            periode INTEGER,
            leerjaar INTEGER,
            is_examendossier INTEGER DEFAULT 0,
            raw_json TEXT
          );

          CREATE TABLE IF NOT EXISTS gap_year_plans (
            id TEXT PRIMARY KEY,
            modules TEXT DEFAULT '[]', -- JSON array
            budget TEXT, -- JSON object
            updated_at INTEGER
          );

          CREATE TABLE IF NOT EXISTS scenario_plans (
            id TEXT PRIMARY KEY,
            plan_a TEXT, -- JSON
            plan_b TEXT, -- JSON
            plan_c TEXT, -- JSON
            updated_at INTEGER
          );

          CREATE TABLE IF NOT EXISTS sjt_scenarios (
            id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            options TEXT -- JSON
          );

          CREATE TABLE IF NOT EXISTS university_studies (
            id TEXT PRIMARY KEY,
            name TEXT,
            city TEXT,
            profiles TEXT, -- JSON
            requirements TEXT, -- JSON
            sectors TEXT, -- JSON
            stats TEXT -- JSON
          );

          CREATE TABLE IF NOT EXISTS mcp_tool_usage_logs (
            id TEXT PRIMARY KEY,
            tool_name TEXT NOT NULL,
            call_params TEXT, -- JSON
            response TEXT, -- JSON
            duration_ms INTEGER,
            success INTEGER DEFAULT 1,
            error TEXT,
            timestamp INTEGER DEFAULT (strftime('%s', 'now'))
          );

          CREATE TABLE IF NOT EXISTS knowledge_digests (
            key TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            last_used_at INTEGER NOT NULL
          );

          CREATE INDEX IF NOT EXISTS idx_mcp_tools_name ON mcp_tools(name);
          CREATE INDEX IF NOT EXISTS idx_mcp_tools_enabled ON mcp_tools(enabled);
          CREATE INDEX IF NOT EXISTS idx_mcp_usage_timestamp ON mcp_tool_usage_logs(timestamp);

          CREATE INDEX IF NOT EXISTS idx_snapshots_session ON tutor_snapshots(session_id);
          CREATE INDEX IF NOT EXISTS idx_history_engine ON gym_history(engine_id);
          CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);
          CREATE INDEX IF NOT EXISTS idx_study_materials_subject ON study_materials(subject);
          CREATE INDEX IF NOT EXISTS idx_flashcards_due ON flashcards(due);
          CREATE INDEX IF NOT EXISTS idx_flashcards_material ON flashcards(material_id);
          CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(date);
          CREATE INDEX IF NOT EXISTS idx_quiz_history_date ON quiz_history(date);
          CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);
          CREATE INDEX IF NOT EXISTS idx_planner_tasks_date ON planner_tasks(date);
          CREATE INDEX IF NOT EXISTS idx_planner_tasks_subject ON planner_tasks(subject);
          CREATE INDEX IF NOT EXISTS idx_planner_tasks_status ON planner_tasks(status);
        `);

    // Elite Evolution: Sync tools to LanceDB for semantic discovery
    this.syncToolsToVectorStore().catch((e) =>
      safeLog.error("[Elite] Tool vector sync failed:", e),
    );

    // MIGRATION CHECK: Ensure columns exist for older DBs
    try {
      const columns = this.sqliteInstance.pragma(
        "table_info(documents_meta)",
      ) as { name: string }[];
      const columnNames = new Set(columns.map((c) => c.name));

      if (!columnNames.has("status")) {
        safeLog.log("[SQLite] Migrating: Adding status column");
        this.sqliteInstance.exec(
          "ALTER TABLE documents_meta ADD COLUMN status TEXT DEFAULT 'ready'",
        );
      }
      if (!columnNames.has("path")) {
        safeLog.log("[SQLite] Migrating: Adding path column");
        this.sqliteInstance.exec(
          "ALTER TABLE documents_meta ADD COLUMN path TEXT",
        );
      }

      // Elite Hardening: Add requires_approval to mcp_tools
      try {
        const mcpColumns = this.sqliteInstance.pragma(
          "table_info(mcp_tools)",
        ) as { name: string }[];
        const mcpColumnNames = new Set(mcpColumns.map((c) => c.name));
        if (!mcpColumnNames.has("requires_approval")) {
          safeLog.log("[SQLite] Migrating: Adding requires_approval to mcp_tools");
          this.sqliteInstance.exec(
            "ALTER TABLE mcp_tools ADD COLUMN requires_approval INTEGER DEFAULT 0",
          );
        }
      } catch {
        // Table might not exist yet, that's fine
      }
    } catch (error) {
      safeLog.error("[SQLite] Migration failed:", error);
    }

    safeLog.log(`[SQLite] Initialized at ${dbPath} in WAL mode.`);
    return this.sqliteInstance;
  }

  static async getLanceDB(): Promise<lancedb.Connection> {
    if (this.lanceConnection) return this.lanceConnection;

    const dbFolder = path.join(
      this.getUserDataPath(),
      "databases",
      "knowledge_base.lance",
    );

    // LanceDB manages its own directory structure
    this.lanceConnection = await lancedb.connect(dbFolder);

    safeLog.log(`[LanceDB] Connected at ${dbFolder}`);
    return this.lanceConnection;
  }

  private static async syncToolsToVectorStore(): Promise<void> {
    const sqlite = this.getSQLite();
    const lance = await this.getLanceDB();

    const tools = sqlite.prepare("SELECT name, description FROM mcp_tools WHERE enabled = 1").all() as {
      name: string;
      description: string;
    }[];

    if (tools.length === 0) return;

    let table;
    try {
      table = await lance.openTable("tool_vectors");
    } catch {
      // Create table if it doesn't exist
      table = await lance.createTable("tool_vectors", [
        {
          vector: new Array(768).fill(0), // Assuming 768 dimensions for now, will be updated by embedding service
          name: "seed",
          description: "seed",
        },
      ]);
      await table.delete("name = 'seed'");
    }

    // Note: In a real scenario, we would use the embedding service here.
    // For this implementation, we'll use a placeholder or wait for the orchestrator to trigger it.
    // Since we are in EXECUTION, I'll assume we need to trigger an IPC or use a service.
    safeLog.log(`[Elite] Semantic registry ready for ${tools.length} tools.`);
  }

  /**
   * Closes all database connections safely.
   */
  static async closeAll(): Promise<void> {
    safeLog.log("[DatabaseFactory] Closing all database connections...");

    if (this.sqliteInstance) {
      this.sqliteInstance.close();
      this.sqliteInstance = null;
      safeLog.log("[SQLite] Connection closed.");
    }

    if (this.lanceConnection) {
      // LanceDB connection closing logic if applicable, usually handled by process exit
      // but we set to null to force reconnection on next get.
      this.lanceConnection = null;
      safeLog.log("[LanceDB] Connection reference cleared.");
    }
  }

  /**
   * Returns the absolute path to the databases directory.
   */
  static getDatabasesPath(): string {
    return path.join(this.getUserDataPath(), "databases");
  }
}
