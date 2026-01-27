/* eslint-disable @typescript-eslint/no-explicit-any */

import { UserSettings } from "../types";
import {
  deleteMaterial as deleteMaterialIDB,
  getAllMaterials as getAllMaterialsIDB,
  getMaterialsBySubject as getMaterialsBySubjectIDB,
  saveGeneratedMedia,
  saveMaterial as saveMaterialIDB
} from "./indexedDBService";

// Database proxy for IPC communications
type Database = {
  run: (sql: string, params?: any[]) => Promise<void>;
  exec: (sql: string, params?: any[]) => Promise<any[]>;
};

let db: Database | null = null;

// Initialize Database Bridge
export const initDatabase = async (): Promise<Database> => {
  if (db) return db;

  // In Electron, we act as a proxy to the Main Process
  if (typeof window !== "undefined" && (window as any).vwoApi) {
    const { IpcChannels } = await import("@vwo/shared-types");
    db = {
      run: async (sql: string, params: any[] = []) => {
        await (window as any).vwoApi.invoke(IpcChannels.DB_QUERY, {
          sql,
          params,
          method: "run",
        });
      },
      exec: async (sql: string, params: any[] = []) => {
        return await (window as any).vwoApi.invoke(IpcChannels.DB_QUERY, {
          sql,
          params,
          method: "all",
        });
      },
    };
    return db;
  }

  // Fallback or Mock (Should not happen in our Electron app)
  console.warn("[SQLite] vwoApi not found. Database operations will fail.");
  throw new Error("vwoApi not available");
};


export const debouncedPersist = async () => {
  // Persistence is handled by the Main Process
};

export const persistDatabase = async (): Promise<void> => {
  // Persistence is handled by the Main Process
};

// Migrations and schema creation is now handled by DatabaseFactory in the Main process.
// Legacy stubs kept for compatibility if needed elsewhere, but marked as ignored if unused.
export const runMigrations = async (_database: Database) => { };
export const createTables = async (_database: Database) => { };
export const seedDatabase = async (_database: Database) => { };

// Persistence stubs for UI compatibility
export const checkActiveHandle = async () => false;
export const connectToHarddisk = async () => false;

// --- DB INTERFACE HELPERS ---

// Settings
export const saveSettingsSQL = async (settings: any) => {
  const {
    profile,
    theme,
    language,
    aiConfig,
    shortcuts,
    pomodoroWork,
    pomodoroBreak,
    streak,
    gamificationEnabled,
    audioFocusMode,
    audioVolume,
    graphicsQuality,
    pythonMode,
    timerStartSound,
    timerBreakSound,
    speechRecognitionEnabled,
    xp,
    level,
    unlockedAchievements,
  } = settings;
  const data = {
    id: "current_user", // Singleton
    profile: JSON.stringify(profile),
    theme,
    language: language || "nl",
    ai_config: JSON.stringify(aiConfig),
    shortcuts: JSON.stringify(shortcuts),
    pomodoro_work: pomodoroWork,
    pomodoro_break: pomodoroBreak,
    streak: streak || 0,
    gamification_enabled: gamificationEnabled ? 1 : 0,
    audio_focus_mode: audioFocusMode,
    audio_volume: audioVolume,
    graphics_quality: graphicsQuality,
    python_mode: pythonMode,
    timer_start_sound: timerStartSound,
    timer_break_sound: timerBreakSound,
    speech_recognition_enabled: speechRecognitionEnabled ? 1 : 0,
    xp: xp || 0,
    level: level || 1,
    unlocked_achievements: JSON.stringify(unlockedAchievements || []),
  };
  return sqliteInsert("user_settings", data);
};

// Activity Log
export const logActivitySQL = async (
  type: string,
  activity: string,
  xp: number = 0,
) => {
  const data = {
    type,
    activity,
    xp,
    date: new Date().toISOString(),
  };
  return sqliteInsert("activity_log", data);
};

// Removed getRecentActivitiesSQL

export const getSettingsSQL = async (): Promise<UserSettings | null> => {
  const rows = await sqliteSelect<any>("user_settings", "id = ?", [
    "current_user",
  ]);
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    profile:
      typeof row.profile === "string" ? JSON.parse(row.profile) : row.profile,
    theme: row.theme,
    aiConfig:
      typeof row.ai_config === "string"
        ? JSON.parse(row.ai_config)
        : row.ai_config,
    shortcuts:
      typeof row.shortcuts === "string"
        ? JSON.parse(row.shortcuts)
        : row.shortcuts,
    pomodoroWork: row.pomodoro_work,
    pomodoroBreak: row.pomodoro_break,
    language: row.language || "nl",
    streak: row.streak || 0,
    gamificationEnabled: row.gamification_enabled !== 0,
    audioFocusMode: row.audio_focus_mode || "alpha",
    audioVolume: row.audio_volume ?? 50,
    graphicsQuality: row.graphics_quality || "high",
    pythonMode: row.python_mode || "standard",
    timerStartSound: (row.timer_start_sound as any) || "zen-bell",
    timerBreakSound: (row.timer_break_sound as any) || "success-chord",
    speechRecognitionEnabled: row.speech_recognition_enabled !== 0,
    xp: row.xp || 0,
    level: row.level || 1,
    unlockedAchievements:
      typeof row.unlocked_achievements === "string"
        ? JSON.parse(row.unlocked_achievements)
        : row.unlocked_achievements || [],
  };
};

// --- GAP YEAR & LOB ---

// Removed getOpenDaysSQL

export const getSJTScenariosSQL = async () => {
  const rows = await sqliteSelect<any>("sjt_scenarios");
  return rows.map((r) => ({
    ...r,
    options:
      typeof r.options === "string" ? JSON.parse(r.options) : r.options || [],
  }));
};

export const getUniversityStudiesSQL = async () => {
  const rows = await sqliteSelect<any>("university_studies");
  return rows.map((r) => ({
    ...r,
    profiles:
      typeof r.profiles === "string"
        ? JSON.parse(r.profiles)
        : r.profiles || [],
    requirements:
      typeof r.requirements === "string"
        ? JSON.parse(r.requirements)
        : r.requirements || [],
    sectors:
      typeof r.sectors === "string" ? JSON.parse(r.sectors) : r.sectors || [],
    stats: typeof r.stats === "string" ? JSON.parse(r.stats) : r.stats || {},
  }));
};

export const saveGapYearPlanSQL = async (modules: string[], budget?: any) => {
  const data: any = {
    id: "current_user",
    modules: JSON.stringify(modules),
    updated_at: Date.now(),
  };
  if (budget) {
    data.budget = JSON.stringify(budget);
  }
  return sqliteInsert("gap_year_plans", data);
};

export const getGapYearPlanSQL = async (): Promise<{
  modules: string[];
  budget: any;
}> => {
  const rows = await sqliteSelect<any>("gap_year_plans", "id = ?", [
    "current_user",
  ]);
  if (rows.length === 0) return { modules: [], budget: null };
  return {
    modules:
      typeof rows[0].modules === "string"
        ? JSON.parse(rows[0].modules)
        : rows[0].modules,
    budget: rows[0].budget
      ? typeof rows[0].budget === "string"
        ? JSON.parse(rows[0].budget)
        : rows[0].budget
      : null,
  };
};

// Removed addPlannerTaskSQL

// --- SCENARIO PLANNER ---

export const saveScenarioPlanSQL = async (plan: {
  planA: any;
  planB: any;
  planC: any;
}) => {
  return sqliteInsert("scenario_plans", {
    id: "current_user",
    plan_a: plan.planA ? JSON.stringify(plan.planA) : null,
    plan_b: plan.planB ? JSON.stringify(plan.planB) : null,
    plan_c: plan.planC ? JSON.stringify(plan.planC) : null,
    updated_at: Date.now(),
  });
};

export const getScenarioPlanSQL = async () => {
  const rows = await sqliteSelect<any>("scenario_plans", "id = ?", [
    "current_user",
  ]);
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    planA: typeof row.plan_a === "string" ? JSON.parse(row.plan_a) : row.plan_a,
    planB: typeof row.plan_b === "string" ? JSON.parse(row.plan_b) : row.plan_b,
    planC: typeof row.plan_c === "string" ? JSON.parse(row.plan_c) : row.plan_c,
  };
};

// Export DB Blob for Backup
// Removed exportDatabaseBlob

// Import DB Blob
// Removed importDatabaseBlob

// Persistence is handled by the Main Process

// --- SYSTEM LOGS ---

export const logSystemEvent = async (
  level: "info" | "warn" | "error",
  message: string,
  data?: any,
) => {
  try {
    const timestamp = Date.now();
    const id = crypto.randomUUID();
    await sqliteRun(
      "INSERT INTO system_logs (id, level, message, data, timestamp) VALUES (?, ?, ?, ?, ?)",
      [id, level, message, data ? JSON.stringify(data) : null, timestamp],
    );
  } catch (err) {
    console.error("[SystemLog] Failed to log event:", err);
  }
};

// Generic CRUD operations
export const sqliteInsert = async (
  table: string,
  data: Record<string, any>,
  _awaitPersist: boolean = true,
): Promise<void> => {
  const database = await initDatabase();
  const keys = Object.keys(data);
  const values = Object.values(data).map((v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === "object") return JSON.stringify(v);
    return v;
  });
  const placeholders = keys.map(() => "?").join(", ");

  await database.run(
    `INSERT OR REPLACE INTO ${table} (${keys.join(", ")}) VALUES(${placeholders})`,
    values,
  );
};

export const sqliteSelect = async <T>(
  table: string,
  where?: string,
  params: any[] = [],
  suffix?: string,
): Promise<T[]> => {
  const database = await initDatabase();
  let query = `SELECT * FROM ${table} `;
  if (where) {
    query += `WHERE ${where} `;
  }
  if (suffix) {
    query += suffix;
  }

  return (await database.exec(query, params)) as T[];
};

export const sqliteDelete = async (
  table: string,
  whereClause: string,
  params: any[] = [],
): Promise<void> => {
  const database = await initDatabase();
  await database.run(`DELETE FROM ${table} WHERE ${whereClause}`, params);
};

export const sqliteUpdate = async (
  table: string,
  data: Record<string, any>,
  whereClause: string,
  params: any[] = [],
): Promise<void> => {
  const database = await initDatabase();
  const keys = Object.keys(data);
  const sets = keys.map((k) => `${k} = ?`).join(", ");
  const values = Object.values(data).map((v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === "object") return JSON.stringify(v);
    return v;
  });

  const query = `UPDATE ${table} SET ${sets} WHERE ${whereClause}`;
  await database.run(query, [...values, ...params]);
};

export const sqliteRun = async (
  query: string,
  params: any[] = [],
): Promise<void> => {
  const database = await initDatabase();
  const { IpcChannels } = await import("@vwo/shared-types");
  console.log(`[Renderer] sqliteRun calling ${IpcChannels.DB_QUERY}:`, query);
  await database.run(query, params);
};

export const saveLobResultSQL = async (type: string, scores: any) => {
  const data = {
    id: crypto.randomUUID(), // Unique ID for history
    type,
    scores: JSON.stringify(scores),
    date: new Date().toISOString(),
  };
  return sqliteInsert("lob_results", data);
};

export const getLobResultSQL = async (type: string) => {
  // Get the LATEST result
  const rows = await sqliteSelect<any>(
    "lob_results",
    "type = ? ORDER BY date DESC LIMIT 1",
    [type],
  );
  if (rows.length === 0) return null;

  try {
    const scores = rows[0].scores;
    return typeof scores === "string" ? JSON.parse(scores) : scores;
  } catch (e) {
    console.error(`Failed to parse LOB result for ${type}: `, rows[0].scores, e);
    return null;
  }
};

export const saveResearchResultSQL = async (module: string, data: any) => {
  const record = {
    id: crypto.randomUUID(),
    module,
    data: JSON.stringify(data),
    created_at: Math.floor(Date.now() / 1000),
  };
  return sqliteInsert("research_results", record);
};

// Removed saveBlurtingSessionSQL

// Removed getBlurtingSessionsSQL

// Removed getResearchResultsSQL

// Compatibility layer for repositories
export const executeQuery = async (
  sql: string,
  params: any[] = [],
): Promise<any[]> => {
  const database = await initDatabase();

  if (sql.trim().toLowerCase().startsWith("select")) {
    return await database.exec(sql, params);
  } else {
    await database.run(sql, params);
    return [];
  }
};

// Typed helpers for app entities
// Typed helpers for app entities with CamelCase <-> SnakeCase mapping

// Study Materials with hybrid storage
export const saveStudyMaterialSQL = async (material: any) => {
  const { createdAt, blob, ...rest } = material;

  // 1. If it's a binary file, offload to IndexedDB
  if (blob) {
    await saveMaterialIDB(material);
  }

  // 2. Save metadata to SQLite (preventing blob/object stringification issues)
  const data = {
    ...rest,
    content: blob ? "[BLOB_REF_IDB]" : rest.content,
    created_at: createdAt || Date.now(),
  };

  // Remove blob from SQLite data to prevent empty object stringification
  delete (data as any).blob;

  return sqliteInsert("study_materials", data);
};

export const getAllStudyMaterialsSQL = async () => {
  const rows = await sqliteSelect<any>("study_materials");
  const idbMaterials = await getAllMaterialsIDB();

  return rows.map((row) => {
    const idbMatch = idbMaterials.find((m: any) => m.id === row.id);
    return {
      ...row,
      createdAt: row.created_at || row.date,
      blob: idbMatch?.blob,
    };
  });
};

export const deleteStudyMaterialSQL = async (id: string) => {
  await deleteMaterialIDB(id);
  return sqliteDelete("study_materials", "id = ?", [id]);
};

export const getMaterialsBySubjectSQL = async (subject: string) => {
  const rows = await sqliteSelect<any>("study_materials", "subject = ?", [subject]);
  const idbMaterials = await getMaterialsBySubjectIDB(subject);

  return rows.map((row) => {
    const idbMatch = idbMaterials.find((m: any) => m.id === row.id);
    return {
      ...row,
      createdAt: row.created_at,
      blob: idbMatch?.blob,
    };
  });
};

// Flashcards
export const saveFlashcardSQL = async (card: any) => {
  const { lastReview, sourceMaterialId, ...rest } = card;
  const data = {
    ...rest,
    last_review: lastReview,
    material_id: sourceMaterialId,
  };
  return sqliteInsert("flashcards", data);
};

export const getAllFlashcardsSQL = async () => {
  const rows = await sqliteSelect<any>("flashcards");
  return rows.map((row) => ({
    ...row,
    lastReview: row.last_review,
    sourceMaterialId: row.material_id,
  }));
};

export const getDueFlashcardsSQL = async () => {
  const now = Date.now();
  const rows = await sqliteSelect<any>("flashcards", "due <= ? OR state = ?", [
    now,
    "new",
  ]);
  return rows.map((row) => ({
    ...row,
    lastReview: row.last_review,
    sourceMaterialId: row.material_id,
  }));
};

// PWS Projects
export const savePWSProjectSQL = async (project: any) => {
  const { createdAt, updatedAt, sources, ...rest } = project;
  const data = {
    ...rest,
    created_at: createdAt,
    updated_at: updatedAt,
    sources: JSON.stringify(sources || []),
  };
  return sqliteInsert("pws_projects", data);
};

export const getAllPWSProjectsSQL = async () => {
  const rows = await sqliteSelect<any>("pws_projects");
  return rows.map((row) => ({
    ...row,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

export const deletePWSProjectSQL = async (id: string) =>
  sqliteDelete("pws_projects", "id = ?", [id]);

export const getStudyMaterialsByIdsSQL = async (ids: string[]) => {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(", ");
  const rows = await sqliteSelect<any>(
    "study_materials",
    `id IN(${placeholders})`,
    ids,
  );
  return rows.map((row) => ({
    ...row,
    createdAt: row.created_at,
  }));
};

// Generated Media (Hybrid Persistence: Metadata in SQL, Blob in IDB)

export const saveGeneratedMediaSQL = async (media: any) => {
  const { createdAt, ...rest } = media;

  // 1. Save full object (with heavy data) to IndexedDB
  await saveGeneratedMedia({
    ...rest,
    createdAt: createdAt || Date.now(),
  });

  // 2. Save metadata only to SQLite (set data to reference marker)
  const data = {
    ...rest,
    data: "[BLOB_REF_IDB]",
    created_at: createdAt || Date.now(),
  };
  return sqliteInsert("generated_media", data);
};

export const getAllGeneratedMediaSQL = async () => {
  const rows = await sqliteSelect<any>("generated_media");
  return rows.map((row) => ({
    ...row,
    createdAt: row.created_at,
    // UI must hydrate this if needed using getGeneratedMediaContentSQL
  }));
};

// New helper to hydrate content
// Media helpers kept

export const deleteGeneratedMediaSQL = async (id: string) =>
  sqliteRun("DELETE FROM generated_media WHERE id = ?", [id]);

// Quiz History

export const saveQuizHistorySQL = async (entry: any) => {
  const { typeBreakdown, ...rest } = entry;
  const data = {
    ...rest,
    type_breakdown: JSON.stringify(typeBreakdown),
  };

  return sqliteInsert("quiz_history", data);
};

export const getAllQuizHistorySQL = async () => {
  const rows = await sqliteSelect<any>("quiz_history");
  return rows.map((row) => ({
    ...row,
    typeBreakdown:
      typeof row.type_breakdown === "string"
        ? JSON.parse(row.type_breakdown)
        : row.type_breakdown,
  }));
};

// Saved Questions
export const saveQuestionSQL = async (
  id: string,
  question: unknown,
  savedAt: number,
) => {
  const data = {
    id,
    question: JSON.stringify(question),
    saved_at: savedAt,
  };
  return sqliteInsert("saved_questions", data);
};

export const getAllSavedQuestionsSQL = async () => {
  const rows = await sqliteSelect<any>("saved_questions");
  return rows.map((row) => ({
    id: row.id,
    question:
      typeof row.question === "string"
        ? JSON.parse(row.question)
        : row.question,
    savedAt: row.saved_at,
  }));
};

export const deleteSavedQuestionSQL = async (id: string) =>
  sqliteDelete("saved_questions", "id = ?", [id]);

// System Logs
// Removed logToDBSQL

export const getSystemLogsSQL = async (limit = 100): Promise<any[]> => {
  return await sqliteSelect<any>(
    "system_logs",
    undefined,
    [],
    `ORDER BY timestamp DESC LIMIT ${limit}`,
  );
};

// =============================================
// PLANNER ELITE CRUD FUNCTIONS
// =============================================

// --- Planner Tasks ---
// Removed savePlannerTaskSQL

// Removed getAllPlannerTasksSQL

// Removed getPlannerTasksByDateSQL

// Removed deletePlannerTaskSQL

// --- Planner Settings ---
export const savePlannerSettingsSQL = async (settings: any) => {
  const data = {
    id: "current_user", // Singleton
    chronotype: settings.chronotype,
    peak_hours_start: settings.peakHoursStart,
    peak_hours_end: settings.peakHoursEnd,
    work_day_start: settings.workDayStart,
    work_day_end: settings.workDayEnd,
    preferred_study_duration: settings.preferredStudyDuration,
    buffer_minutes: settings.bufferMinutes,
    region: settings.region,
    exam_year: settings.examYear,
    exam_mode: settings.examMode ? 1 : 0,
    auto_reschedule_enabled: settings.autoRescheduleEnabled ? 1 : 0,
    spaced_repetition_enabled: settings.spacedRepetitionEnabled ? 1 : 0,
    updated_at: new Date().toISOString(),
  };
  return sqliteInsert("planner_settings", data);
};

export const getPlannerSettingsSQL = async () => {
  const rows = await sqliteSelect<any>("planner_settings", "id = ?", [
    "current_user",
  ]);
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    chronotype: row.chronotype || "neutral",
    peakHoursStart: row.peak_hours_start ?? 10,
    peakHoursEnd: row.peak_hours_end ?? 17,
    workDayStart: row.work_day_start ?? 8,
    workDayEnd: row.work_day_end ?? 22,
    preferredStudyDuration: row.preferred_study_duration ?? 45,
    bufferMinutes: row.buffer_minutes ?? 15,
    region: row.region || "midden",
    examYear: row.exam_year || new Date().getFullYear(),
    examMode: row.exam_mode === 1,
    autoRescheduleEnabled: row.auto_reschedule_enabled !== 0,
    spacedRepetitionEnabled: row.spaced_repetition_enabled !== 0,
  };
};

// --- Unavailable Blocks ---
export const saveUnavailableBlockSQL = async (block: any) => {
  const data = {
    id: block.id,
    day_of_week: block.dayOfWeek,
    start_time: block.startTime,
    end_time: block.endTime,
    reason: block.reason,
  };
  return sqliteInsert("unavailable_blocks", data);
};

export const getAllUnavailableBlocksSQL = async () => {
  const rows = await sqliteSelect<any>("unavailable_blocks");
  return rows.map((row) => ({
    id: row.id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    reason: row.reason,
  }));
};

export const deleteUnavailableBlockSQL = async (id: string) =>
  sqliteDelete("unavailable_blocks", id);

// --- Bulk Operations for Planner ---
// Removed saveBulkPlannerTasksSQL

// Removed getPlannerTasksInRangeSQL

// Weekly Review
export const saveWeeklyReviewSQL = async (review: any) => {
  const dbData = {
    id: review.id,
    date: review.date,
    good: review.good,
    bad: review.bad,
    plan: review.plan,
    completed: review.completed ? 1 : 0,
    completed_at: review.completedAt,
  };
  return sqliteInsert("weekly_reviews", dbData);
};

export const getAllWeeklyReviewsSQL = async () => {
  const raw = await sqliteSelect<any>("weekly_reviews");
  return raw.map((r) => ({
    id: r.id,
    date: r.date,
    good: r.good,
    bad: r.bad,
    plan: r.plan,
    completed: r.completed === 1,
    completedAt: r.completed_at,
  }));
};
// --- SOMTODAY GRADES PERSISTENCE ---

// Removed saveBulkGradesSQL

// Removed getAllGradesSQL

// --- SOMTODAY SCHEDULE PERSISTENCE ---

export const saveBulkScheduleSQL = async (appointments: any[]) => {
  for (const app of appointments) {
    // Robust ISO Extraction
    let date = app.datum || app.date;
    let startTime = app.beginTijd || app.startTime;
    let endTime = app.eindTijd || app.endTime;

    if (!date && app.beginDatumTijd) {
      date = app.beginDatumTijd.split("T")[0];
    }
    if (!startTime && app.beginDatumTijd) {
      startTime = app.beginDatumTijd.split("T")[1]?.substring(0, 5);
    }
    if (!endTime && app.eindDatumTijd) {
      endTime = app.eindDatumTijd.split("T")[1]?.substring(0, 5);
    }

    const somtodayId =
      app.links?.find((l: any) => l.rel === "self")?.id || app.links?.[0]?.id;

    await sqliteInsert("somtoday_schedule", {
      id: somtodayId ? somtodayId.toString() : crypto.randomUUID(),
      title: app.titel || null,
      description: app.omschrijving || null,
      date: date || "1970-01-01", // Ensure NOT NULL
      start_time: startTime || null,
      end_time: endTime || null,
      vak_naam: app.vak?.naam || null,
      docent_afkorting: app.docenten?.[0]?.docentAfkorting || null,
      locatie: app.locatie || null,
      type: app.afspraakType?.omschrijving || "les",
      is_huiswerk: app.huiswerk ? 1 : 0,
      is_toets: app.toets ? 1 : 0,
      raw_json: JSON.stringify(app),
    });
  }
};

export const getScheduleInRangeSQL = async (
  startDate: string,
  endDate: string,
): Promise<any[]> => {
  const rows = await sqliteSelect<any>(
    "somtoday_schedule",
    "date >= ? AND date <= ?",
    [startDate, endDate],
  );
  return rows.map((row) =>
    typeof row.raw_json === "string" ? JSON.parse(row.raw_json) : row.raw_json,
  );
};

// --- PERSONAL TASKS PERSISTENCE ---

export const saveBulkPersonalTasksSQL = async (tasks: any[]) => {
  for (const t of tasks) {
    await sqliteInsert("personal_tasks", {
      id: t.id || crypto.randomUUID(),
      title: t.title || "Naamloze Taak",
      description: t.description || null,
      date: t.date || "1970-01-01",
      start_time: t.startTime || null,
      end_time: t.endTime || null,
      duration: t.duration || 0,
      subject: t.subject || null,
      priority: t.priority || "medium",
      completed: t.completed ? 1 : 0,
      created_at: t.createdAt || new Date().toISOString(),
      updated_at: t.updatedAt || new Date().toISOString(),
      raw_json: JSON.stringify(t),
    });
  }
};

export const getAllPersonalTasksSQL = async (): Promise<any[]> => {
  const rows = await sqliteSelect<any>("personal_tasks");
  return rows.map((row) =>
    typeof row.raw_json === "string" ? JSON.parse(row.raw_json) : row.raw_json,
  );
};

export const deletePersonalTaskSQL = async (id: string) => {
  return sqliteDelete("personal_tasks", id);
};

// --- MANUAL GRADES (Cijferoverzicht) ---

export interface ManualGrade {
  id: string;
  subject: string;
  grade: number;
  weight: number;
  date: string;
  type?: string;
  description?: string;
  period?: number;
  created_at?: number;
}

export const addManualGradeSQL = async (
  grade: Omit<ManualGrade, "id" | "created_at">,
) => {
  return sqliteInsert("manual_grades", {
    id: crypto.randomUUID(),
    ...grade,
    created_at: Math.floor(Date.now() / 1000),
  });
};

export const getManualGradesSQL = async (): Promise<ManualGrade[]> => {
  return await sqliteSelect<ManualGrade>(
    "manual_grades",
    undefined,
    [],
    "ORDER BY date DESC",
  );
};

export const deleteManualGradeSQL = async (id: string) => {
  return sqliteRun("DELETE FROM manual_grades WHERE id = ?", [id]);
};

// Removed updateManualGradeSQL
// --- Coaching Sessions ---
export const saveCoachingSession = async (
  subject: string,
  transcript: string,
  duration: number,
  summary?: string,
): Promise<void> => {
  const id = crypto.randomUUID();
  await sqliteRun(
    `INSERT INTO coaching_sessions(id, subject, transcript, summary, duration, date) VALUES(?, ?, ?, ?, ?, datetime('now'))`,
    [id, subject, transcript, summary || null, duration],
  );
};

export const getCoachingSessions = async (): Promise<any[]> => {
  return await sqliteSelect("coaching_sessions", undefined, [], "ORDER BY date DESC");
};
