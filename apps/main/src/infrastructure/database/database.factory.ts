import * as lancedb from "@lancedb/lancedb";
import { safeLog } from "@shared/lib/safe-logger";
import Database from "better-sqlite3";
import { app } from "electron";
import fs from "fs";
import path from "path";

export class DatabaseFactory {
  private static sqliteInstance: Database | null = null;
  private static lanceConnection: lancedb.Connection | null = null;

  private static getUserDataPath(): string {
    return app.isPackaged ? app.getPath("userData") : process.cwd();
  }

  static getSQLite(): Database {
    if (this.sqliteInstance) return this.sqliteInstance;

    const dbFolder = path.join(this.getUserDataPath(), "databases");
    if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder, { recursive: true });

    const dbPath = path.join(dbFolder, "app.db");
    safeLog.log(`[SQLite] Attempting to initialize at: ${dbPath}`);

    let instance: Database;
    try {
      instance = new Database(dbPath);
      safeLog.log("[SQLite] better-sqlite3 instance created.");
    } catch (e) {
      safeLog.error(`[SQLite] Failed to open database at ${dbPath}:`, e);
      throw e;
    }

    instance.pragma("journal_mode = WAL");
    instance.pragma("synchronous = NORMAL");

    const tables = [
      // 1. PRIMARY APP TABLES
      `CREATE TABLE IF NOT EXISTS documents_meta (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        upload_date TEXT NOT NULL,
        status TEXT NOT NULL,
        path TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS ai_models (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        provider TEXT NOT NULL,
        model_id TEXT NOT NULL,
        endpoint TEXT,
        api_key_id TEXT,
        local_path TEXT,
        capabilities TEXT,
        enabled INTEGER DEFAULT 1,
        priority INTEGER DEFAULT 50,
        metrics TEXT,
        requirements TEXT,
        created_at INTEGER,
        last_used_at INTEGER
      );`,
      `CREATE TABLE IF NOT EXISTS mcp_tools (
        name TEXT PRIMARY KEY,
        description TEXT,
        enabled INTEGER DEFAULT 1,
        requires_approval INTEGER DEFAULT 0
      );`,
      `CREATE TABLE IF NOT EXISTS ai_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS tutor_snapshots (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        topic TEXT,
        context TEXT NOT NULL,
        created_at INTEGER
      );`,
      `CREATE TABLE IF NOT EXISTS gym_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        engine_id TEXT NOT NULL,
        is_correct INTEGER DEFAULT 0,
        time_taken_ms INTEGER DEFAULT 0,
        score INTEGER DEFAULT 0,
        metrics TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      );`,
      `CREATE TABLE IF NOT EXISTS gym_progress (
        engine_id TEXT NOT NULL,
        skill_key TEXT NOT NULL,
        box_level INTEGER DEFAULT 1,
        next_review INTEGER,
        difficulty_level INTEGER DEFAULT 1,
        PRIMARY KEY (engine_id, skill_key)
      );`,
      `CREATE TABLE IF NOT EXISTS module_unlocks (
        module_id TEXT PRIMARY KEY,
        is_unlocked INTEGER DEFAULT 0,
        completed_at INTEGER
      );`,

      // 2. CHAT & UI TABLES
      `CREATE TABLE IF NOT EXISTS chat_sessions (
          id TEXT PRIMARY KEY,
          title TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS chat_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT,
          role TEXT,
          content TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
      );`,
      `CREATE TABLE IF NOT EXISTS user_settings (
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
      );`,

      // 3. STUDY & RESEARCH TABLES
      `CREATE TABLE IF NOT EXISTS study_materials (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subject TEXT,
        type TEXT,
        content TEXT,
        embedding TEXT,
        date TEXT,
        quiz TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );`,
      `CREATE TABLE IF NOT EXISTS flashcards (
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
      );`,
      `CREATE TABLE IF NOT EXISTS lab_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lab_name TEXT NOT NULL,
        score INTEGER,
        date TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        activity TEXT NOT NULL,
        date TEXT NOT NULL,
        xp INTEGER DEFAULT 0
      );`,
      `CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        unlocked_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS generated_media (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        prompt TEXT,
        data TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );`,
      `CREATE TABLE IF NOT EXISTS blurting_sessions (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        score INTEGER,
        analysis_data TEXT,
        content TEXT,
        date TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS lob_results (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        scores TEXT NOT NULL,
        date TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS research_results (
        id TEXT PRIMARY KEY,
        module TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );`,
      `CREATE TABLE IF NOT EXISTS quiz_history (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        date INTEGER NOT NULL,
        score INTEGER NOT NULL,
        total INTEGER NOT NULL,
        type_breakdown TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS saved_questions (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        saved_at INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS weak_points (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        topic TEXT NOT NULL,
        error_count INTEGER DEFAULT 0,
        attempt_count INTEGER DEFAULT 0,
        error_rate REAL DEFAULT 0,
        common_mistakes TEXT,
        suggested_focus TEXT,
        improvement_score REAL DEFAULT 0,
        last_error_at INTEGER,
        last_practice_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS system_logs (
        id TEXT PRIMARY KEY,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        timestamp INTEGER NOT NULL
      );`,

      // 4. PLANNER & LOB CONTINUED
      `CREATE TABLE IF NOT EXISTS coaching_sessions (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        transcript TEXT NOT NULL,
        summary TEXT,
        duration INTEGER,
        date TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS planner_tasks (
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
        color TEXT,
        related_id TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS planner_settings (
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
      );`,
      `CREATE TABLE IF NOT EXISTS somtoday_schedule (
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
      );`,
      `CREATE TABLE IF NOT EXISTS personal_tasks (
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
      );`,
      `CREATE TABLE IF NOT EXISTS manual_grades (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        grade REAL NOT NULL,
        weight REAL DEFAULT 1.0,
        date TEXT NOT NULL,
        type TEXT,
        description TEXT,
        period INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );`,
      `CREATE TABLE IF NOT EXISTS pws_projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subject TEXT,
        status TEXT,
        priority TEXT,
        deadline TEXT,
        sources TEXT DEFAULT '[]',
        created_at INTEGER,
        updated_at INTEGER
      );`,
      `CREATE TABLE IF NOT EXISTS unavailable_blocks (
        id TEXT PRIMARY KEY,
        day_of_week INTEGER,
        start_time TEXT,
        end_time TEXT,
        reason TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS weekly_reviews (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        good TEXT,
        bad TEXT,
        plan TEXT,
        completed INTEGER DEFAULT 0,
        completed_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS somtoday_grades (
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
      );`,
      `CREATE TABLE IF NOT EXISTS gap_year_plans (
        id TEXT PRIMARY KEY,
        modules TEXT DEFAULT '[]',
        budget TEXT,
        updated_at INTEGER
      );`,
      `CREATE TABLE IF NOT EXISTS scenario_plans (
        id TEXT PRIMARY KEY,
        plan_a TEXT,
        plan_b TEXT,
        plan_c TEXT,
        updated_at INTEGER
      );`,
      `CREATE TABLE IF NOT EXISTS sjt_scenarios (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        options TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS university_studies (
        id TEXT PRIMARY KEY,
        name TEXT,
        institution TEXT,
        city TEXT,
        description TEXT,
        profiles TEXT,
        requirements TEXT,
        sectors TEXT,
        stats TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS mcp_tool_usage_logs (
        id TEXT PRIMARY KEY,
        tool_name TEXT NOT NULL,
        call_params TEXT,
        response TEXT,
        duration_ms INTEGER,
        success INTEGER DEFAULT 1,
        error TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      );`,
      `CREATE TABLE IF NOT EXISTS knowledge_digests (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_used_at INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS open_days (
        id TEXT PRIMARY KEY,
        institution TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        type TEXT,
        description TEXT,
        link TEXT
      );`,
    ];

    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_mcp_tools_name ON mcp_tools(name);`,
      `CREATE INDEX IF NOT EXISTS idx_mcp_tools_enabled ON mcp_tools(enabled);`,
      `CREATE INDEX IF NOT EXISTS idx_mcp_usage_timestamp ON mcp_tool_usage_logs(timestamp);`,
      `CREATE INDEX IF NOT EXISTS idx_snapshots_session ON tutor_snapshots(session_id);`,
      `CREATE INDEX IF NOT EXISTS idx_history_engine ON gym_history(engine_id);`,
      `CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);`,
      `CREATE INDEX IF NOT EXISTS idx_study_materials_subject ON study_materials(subject);`,
      `CREATE INDEX IF NOT EXISTS idx_flashcards_due ON flashcards(due);`,
      `CREATE INDEX IF NOT EXISTS idx_flashcards_material ON flashcards(material_id);`,
      `CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(date);`,
      `CREATE INDEX IF NOT EXISTS idx_quiz_history_date ON quiz_history(date);`,
      `CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);`,
      `CREATE INDEX IF NOT EXISTS idx_planner_tasks_date ON planner_tasks(date);`,
      `CREATE INDEX IF NOT EXISTS idx_planner_tasks_subject ON planner_tasks(subject);`,
      `CREATE INDEX IF NOT EXISTS idx_planner_tasks_status ON planner_tasks(status);`,
    ];

    try {
      // Execute table creations one by one for robustness
      for (const sql of tables) {
        try {
          instance.exec(sql);
        } catch (e) {
          safeLog.error(`[SQLite] Table creation failed for statement starting with: ${sql.substring(0, 50)}...`, e);
          // Don't rethrow, attempt to continue with other tables
        }
      }

      // Execute index creations
      for (const sql of indexes) {
        try {
          instance.exec(sql);
        } catch (e) {
          safeLog.error(`[SQLite] Index creation failed: ${sql}`, e);
        }
      }

      // Elite Evolution: Sync tools to LanceDB
      this.syncToolsToVectorStore(instance).catch((e) =>
        safeLog.error("[Elite] Tool vector sync failed:", e),
      );

      // Successful bootstrap - set the singleton
      this.sqliteInstance = instance;

      // MIGRATION BLOCK: Atomic column checks
      const tableCheck = (tableName: string) => {
        try {
          const table = instance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
          return !!table;
        } catch { return false; }
      };

      const colCheck = (tableName: string, colName: string) => {
        if (!tableCheck(tableName)) return false;
        try {
          const cols = instance.pragma(`table_info(${tableName})`) as { name: string }[];
          return cols.some(c => c.name === colName);
        } catch { return false; }
      };

      // 5. COMPATIBILITY MIGRATIONS
      try {
        if (tableCheck("documents_meta")) {
          if (!colCheck("documents_meta", "status")) {
            instance.exec("ALTER TABLE documents_meta ADD COLUMN status TEXT DEFAULT 'ready'");
          }
          if (!colCheck("documents_meta", "path")) {
            instance.exec("ALTER TABLE documents_meta ADD COLUMN path TEXT");
          }
        }

        if (tableCheck("mcp_tools") && !colCheck("mcp_tools", "requires_approval")) {
          instance.exec("ALTER TABLE mcp_tools ADD COLUMN requires_approval INTEGER DEFAULT 0");
        }

        if (tableCheck("coaching_sessions")) {
          const coachCols = [
            "language", "fragments", "terminology", "takeaways", "mastery_score",
            "learning_gaps", "correction_log", "flashcards", "test_questions",
            "study_advice", "confidence_score", "interaction_ratio", "sentiment",
            "pitfalls", "syllabus_links", "exam_vocab", "structure_score",
            "argumentation_quality", "critical_thinking", "scientific_nuance",
            "source_usage", "bloom_level", "est_study_time", "exam_priority",
            "cross_links", "anxiety_level", "cognitive_load", "growth_mindset",
            "learning_state_vector"
          ];
          for (const col of coachCols) {
            if (!colCheck("coaching_sessions", col)) {
              try {
                const type = col.includes("score") || col.includes("ratio") ? "REAL" : "TEXT";
                instance.exec(`ALTER TABLE coaching_sessions ADD COLUMN ${col} ${type}`);
              } catch (e) {
                safeLog.error(`[SQLite] Migration failed for coaching_sessions column ${col}`, e);
              }
            }
          }
        }

        if (tableCheck("gym_progress") && !colCheck("gym_progress", "difficulty_level")) {
          instance.exec("ALTER TABLE gym_progress ADD COLUMN difficulty_level INTEGER DEFAULT 1");
        }

        if (tableCheck("gym_history")) {
          if (!colCheck("gym_history", "is_correct")) {
            instance.exec("ALTER TABLE gym_history ADD COLUMN is_correct INTEGER DEFAULT 0");
          }
          if (!colCheck("gym_history", "time_taken_ms")) {
            instance.exec("ALTER TABLE gym_history ADD COLUMN time_taken_ms INTEGER DEFAULT 0");
          }
        }

        if (tableCheck("university_studies")) {
          if (!colCheck("university_studies", "institution")) {
            instance.exec("ALTER TABLE university_studies ADD COLUMN institution TEXT");
          }
          if (!colCheck("university_studies", "description")) {
            instance.exec("ALTER TABLE university_studies ADD COLUMN description TEXT");
          }
        }

        if (tableCheck("planner_tasks") && !colCheck("planner_tasks", "related_id")) {
          instance.exec("ALTER TABLE planner_tasks ADD COLUMN related_id TEXT");
        }
      } catch (migrationError) {
        safeLog.error("[SQLite] Compatibility migration failed:", migrationError);
      }

      safeLog.log(`[SQLite] Initialized at ${dbPath} in WAL mode.`);
      return this.sqliteInstance;
    } catch (error) {
      safeLog.error("[SQLite] Outer initialization failed:", error);
      throw error;
    }
  }

  static async getLanceDB(): Promise<lancedb.Connection> {
    if (this.lanceConnection) return this.lanceConnection;
    const dbFolder = path.join(this.getUserDataPath(), "databases", "knowledge_base.lance");
    this.lanceConnection = await lancedb.connect(dbFolder);
    safeLog.log(`[LanceDB] Connected at ${dbFolder}`);
    return this.lanceConnection;
  }

  private static async syncToolsToVectorStore(sqlite: Database): Promise<void> {
    try {
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
        table = await lance.createTable("tool_vectors", [{
          vector: new Array(768).fill(0),
          name: "seed",
          description: "seed",
        }]);
        await table.delete("name = 'seed'");
      }
      safeLog.log(`[Elite] Semantic registry ready for ${tools.length} tools.`);
    } catch (e) {
      safeLog.error("[Elite] syncToolsToVectorStore failed:", e);
    }
  }

  static async closeAll(): Promise<void> {
    safeLog.log("[DatabaseFactory] Closing all database connections...");
    if (this.sqliteInstance) {
      this.sqliteInstance.close();
      this.sqliteInstance = null;
      safeLog.log("[SQLite] Connection closed.");
    }
    if (this.lanceConnection) {
      this.lanceConnection = null;
      safeLog.log("[LanceDB] Connection reference cleared.");
    }
  }

  static getDatabasesPath(): string {
    return path.join(this.getUserDataPath(), "databases");
  }
}
