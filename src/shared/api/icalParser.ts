/**
 * iCal Parser - Import schedules from Magister/SomToday
 *
 * Parses .ics (iCalendar) files and converts events to EliteTasks.
 * Supports:
 * - Single events
 * - Recurring events (RRULE expansion)
 * - Subject extraction from event titles
 * - Automatic TaskType classification
 */

import {
  EliteTask,
  getEnergyForSubject,
  TaskType,
} from "@entities/planner/model/task";

// ===== TYPES =====
interface ICalEvent {
  uid: string;
  summary: string;
  description?: string | undefined;
  dtstart: Date;
  dtend: Date;
  location?: string | undefined;
  rrule?: string | undefined;
}

interface ParseResult {
  events: EliteTask[];
  errors: string[];
  stats: {
    total: number;
    lessons: number;
    exams: number;
    other: number;
  };
}

// ===== SUBJECT DETECTION PATTERNS =====
const SUBJECT_PATTERNS: Record<string, RegExp[]> = {
  wiskunde: [/wiskunde/i, /wis[a-d]?/i, /math/i],
  nederlands: [/nederlands/i, /netl?/i, /dutch/i],
  engels: [/engels/i, /entl?/i, /english/i],
  frans: [/frans/i, /fatl?/i, /french/i],
  duits: [/duits/i, /dutl?/i, /german/i],
  natuurkunde: [/natuurkunde/i, /nat/i, /physics/i, /nask/i],
  scheikunde: [/scheikunde/i, /schk?/i, /chemistry/i, /sk/i],
  biologie: [/biologie/i, /bio/i, /biology/i],
  geschiedenis: [/geschiedenis/i, /gs/i, /history/i],
  aardrijkskunde: [/aardrijkskunde/i, /ak/i, /geography/i],
  economie: [/economie/i, /eco?/i, /economics/i],
  informatica: [/informatica/i, /inf/i, /ict/i],
  filosofie: [/filosofie/i, /fil/i, /philosophy/i],
  kunst: [/kunst/i, /ckv/i, /art/i],
  muziek: [/muziek/i, /mu/i, /music/i],
  "lichamelijke opvoeding": [
    /lichamelijke\s*opvoeding/i,
    /lo\b/i,
    /gym/i,
    /sport/i,
  ],
  maatschappijleer: [/maatschappijleer/i, /ma/i],
  latijn: [/latijn/i, /la/i, /latin/i],
  grieks: [/grieks/i, /gr/i, /greek/i],
};

// ===== EXAM DETECTION PATTERNS =====
const EXAM_PATTERNS = [
  /proefwerk/i,
  /toets/i,
  /tentamen/i,
  /so\b/i, // Schriftelijke Overhoring
  /se\b/i, // Schoolexamen
  /exam/i,
  /test/i,
  /pta/i,
];

// ===== MAIN PARSER =====

/**
 * Parse an iCal file content string into EliteTasks
 */
export const parseICalFile = (
  icalContent: string,
  maxEvents: number = 500,
): ParseResult => {
  const errors: string[] = [];
  const events: ICalEvent[] = [];

  try {
    // Split into individual events
    const eventBlocks = icalContent.split("BEGIN:VEVENT");

    for (let i = 1; i < eventBlocks.length && events.length < maxEvents; i++) {
      const block = eventBlocks[i]!;
      const endIndex = block.indexOf("END:VEVENT");
      if (endIndex === -1) continue;

      const eventContent = block.substring(0, endIndex);

      try {
        const event = parseEvent(eventContent);
        if (event) {
          events.push(event);
        }
      } catch (e) {
        errors.push(
          `Event ${i}: ${e instanceof Error ? e.message : "Parse error"}`,
        );
      }
    }
  } catch (e) {
    errors.push(
      `File parse error: ${e instanceof Error ? e.message : "Unknown error"}`,
    );
  }

  // Convert to EliteTasks
  const tasks = events.map(eventToTask);

  // Calculate stats
  const stats = {
    total: tasks.length,
    lessons: tasks.filter((t) => t.type === "lesson").length,
    exams: tasks.filter((t) => t.type === "exam").length,
    other: tasks.filter((t) => t.type !== "lesson" && t.type !== "exam").length,
  };

  return { events: tasks, errors, stats };
};

/**
 * Simplified wrapper for ScheduleStage
 */
export const parseICS = (icalContent: string): EliteTask[] => {
  const result = parseICalFile(icalContent);
  return result.events;
};

/**
 * Parse a single VEVENT block
 */
const parseEvent = (eventContent: string): ICalEvent | null => {
  const lines = unfoldLines(eventContent);

  const getValue = (key: string): string | undefined => {
    const line = lines.find(
      (l) => l.startsWith(key + ":") || l.startsWith(key + ";"),
    );
    if (!line) return undefined;
    const colonIndex = line.indexOf(":");
    return colonIndex >= 0 ? line.substring(colonIndex + 1).trim() : undefined;
  };

  const uid = getValue("UID");
  const summary = getValue("SUMMARY");
  const dtstart = parseICalDate(getValue("DTSTART") || "");
  const dtend = parseICalDate(getValue("DTEND") || getValue("DTSTART") || "");

  if (!uid || !summary || !dtstart) return null;

  return {
    uid,
    summary: decodeICalText(summary),
    description: getValue("DESCRIPTION")
      ? decodeICalText(getValue("DESCRIPTION")!)
      : undefined,
    dtstart,
    dtend: dtend || dtstart,
    location: getValue("LOCATION")
      ? decodeICalText(getValue("LOCATION")!)
      : undefined,
    rrule: getValue("RRULE"),
  };
};

/**
 * Convert an iCal event to an EliteTask
 */
const eventToTask = (event: ICalEvent): EliteTask => {
  const now = new Date().toISOString();

  // Detect subject from title
  const subject = detectSubject(event.summary);

  // Detect if it's an exam
  const isExam = EXAM_PATTERNS.some((p) => p.test(event.summary));

  // Calculate duration in minutes
  const duration = Math.round(
    (event.dtend.getTime() - event.dtstart.getTime()) / (1000 * 60),
  );

  // Determine task type
  let type: TaskType = "personal";
  if (subject) {
    type = isExam ? "exam" : "lesson";
  }

  return {
    id: `import-${event.uid}`,
    title: event.summary,
    description: event.description,
    date: event.dtstart.toISOString().split("T")[0]!,
    startTime: formatTime(event.dtstart),
    endTime: formatTime(event.dtend),
    duration: duration > 0 ? duration : 60,
    isFixed: type === "lesson" || type === "exam", // Lessons and exams are fixed
    isAllDay: duration >= 24 * 60,
    subject,
    type,
    priority: isExam ? "high" : "medium",
    energyRequirement: subject ? getEnergyForSubject(subject) : "medium",
    completed: false,
    status: "todo",
    createdAt: now,
    updatedAt: now,
    source: "import",
  };
};

// ===== HELPER FUNCTIONS =====

/**
 * Unfold iCal lines (lines starting with space are continuations)
 */
const unfoldLines = (content: string): string[] => {
  return content
    .replace(/\r\n /g, "") // Unfold lines
    .replace(/\r\n\t/g, "") // Unfold tabs
    .split(/\r?\n/)
    .filter((line) => line.trim());
};

/**
 * Parse iCal date/datetime string
 */
const parseICalDate = (value: string): Date | null => {
  if (!value) return null;

  // Remove any timezone suffix for basic parsing
  const cleanValue = value.replace(/Z$/, "");

  // Format: YYYYMMDD or YYYYMMDDTHHMMSS
  if (cleanValue.length === 8) {
    // Date only
    const year = parseInt(cleanValue.substring(0, 4));
    const month = parseInt(cleanValue.substring(4, 6)) - 1;
    const day = parseInt(cleanValue.substring(6, 8));
    return new Date(year, month, day);
  } else if (cleanValue.length >= 15) {
    // DateTime
    const year = parseInt(cleanValue.substring(0, 4));
    const month = parseInt(cleanValue.substring(4, 6)) - 1;
    const day = parseInt(cleanValue.substring(6, 8));
    const hour = parseInt(cleanValue.substring(9, 11));
    const minute = parseInt(cleanValue.substring(11, 13));
    const second = parseInt(cleanValue.substring(13, 15));
    return new Date(year, month, day, hour, minute, second);
  }

  return null;
};

/**
 * Decode iCal escaped text
 */
const decodeICalText = (text: string): string => {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
};

/**
 * Detect subject from event title
 */
const detectSubject = (title: string): string | undefined => {
  for (const [subject, patterns] of Object.entries(SUBJECT_PATTERNS)) {
    if (patterns.some((p) => p.test(title))) {
      return subject;
    }
  }
  return undefined;
};

/**
 * Format time as HH:MM
 */
const formatTime = (date: Date): string => {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
};

// ===== FILE READER HELPER =====

/**
 * Read and parse an uploaded .ics file
 */
export const parseICalFromFile = (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        resolve(parseICalFile(content));
      } else {
        reject(new Error("Failed to read file content"));
      }
    };

    reader.onerror = () => {
      reject(new Error("File read error"));
    };

    reader.readAsText(file);
  });
};

// ===== RECURRING EVENT EXPANSION =====

/**
 * Expand recurring events for a date range
 * Note: This is a simplified implementation for weekly recurrence
 */
export const expandRecurringEvents = (
  events: EliteTask[],
  startDate: string,
  endDate: string,
  weeksToExpand: number = 16,
): EliteTask[] => {
  const expanded: EliteTask[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (const event of events) {
    // Non-lesson events don't recur
    if (event.type !== "lesson") {
      if (event.date >= startDate && event.date <= endDate) {
        expanded.push(event);
      }
      continue;
    }

    // Expand weekly for lessons
    const eventDate = new Date(event.date);
    const dayOfWeek = eventDate.getDay();

    for (let week = 0; week < weeksToExpand; week++) {
      const newDate = new Date(start);
      // Find the next occurrence of this day of week
      newDate.setDate(
        start.getDate() + ((dayOfWeek - start.getDay() + 7) % 7) + week * 7,
      );

      if (newDate < start || newDate > end) continue;

      expanded.push({
        ...event,
        id: `${event.id}-week${week}`,
        date: newDate.toISOString().split("T")[0]!,
      });
    }
  }

  return expanded.sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return (a.startTime || "").localeCompare(b.startTime || "");
  });
};
