/**
 * Dutch School Holidays & Public Holidays Data
 *
 * Data source: Rijksoverheid.nl
 * Coverage: 2024-2027
 *
 * The Netherlands has 3 vacation regions:
 * - Noord: Groningen, Friesland, Drenthe, Overijssel, Flevoland, Noord-Holland
 * - Midden: Utrecht, Zuid-Holland, Zeeland
 * - Zuid: Noord-Brabant, Limburg, Gelderland
 */

import { DutchHoliday, DutchRegion } from "@shared/types/planner";

// ===== PUBLIC HOLIDAYS (Same for all regions) =====
const PUBLIC_HOLIDAYS_2025: DutchHoliday[] = [
  {
    id: "ny-2025",
    name: "New Year's Day",
    nameNl: "Nieuwjaarsdag",
    start: "2025-01-01",
    end: "2025-01-01",
    region: "all",
    type: "public_holiday",
  },
  {
    id: "gf-2025",
    name: "Good Friday",
    nameNl: "Goede Vrijdag",
    start: "2025-04-18",
    end: "2025-04-18",
    region: "all",
    type: "public_holiday",
  },
  {
    id: "em-2025",
    name: "Easter Monday",
    nameNl: "Tweede Paasdag",
    start: "2025-04-21",
    end: "2025-04-21",
    region: "all",
    type: "public_holiday",
  },
  {
    id: "kd-2025",
    name: "King's Day",
    nameNl: "Koningsdag",
    start: "2025-04-26",
    end: "2025-04-26",
    region: "all",
    type: "public_holiday",
  },
  {
    id: "bd-2025",
    name: "Liberation Day",
    nameNl: "Bevrijdingsdag",
    start: "2025-05-05",
    end: "2025-05-05",
    region: "all",
    type: "public_holiday",
  },
  {
    id: "ad-2025",
    name: "Ascension Day",
    nameNl: "Hemelvaartsdag",
    start: "2025-05-29",
    end: "2025-05-29",
    region: "all",
    type: "public_holiday",
  },
  {
    id: "wm-2025",
    name: "Whit Monday",
    nameNl: "Tweede Pinksterdag",
    start: "2025-06-09",
    end: "2025-06-09",
    region: "all",
    type: "public_holiday",
  },
  {
    id: "xm-2025",
    name: "Christmas",
    nameNl: "Kerstmis",
    start: "2025-12-25",
    end: "2025-12-26",
    region: "all",
    type: "public_holiday",
  },
];

const PUBLIC_HOLIDAYS_2026: DutchHoliday[] = [
  {
    id: "ny-2026",
    name: "New Year's Day",
    nameNl: "Nieuwjaarsdag",
    start: "2026-01-01",
    end: "2026-01-01",
    region: "all",
    type: "public_holiday",
  },
  {
    id: "gf-2026",
    name: "Good Friday",
    nameNl: "Goede Vrijdag",
    start: "2026-04-03",
    end: "2026-04-03",
    region: "all",
    type: "public_holiday",
  },
  {
    id: "em-2026",
    name: "Easter Monday",
    nameNl: "Tweede Paasdag",
    start: "2026-04-06",
    end: "2026-04-06",
    region: "all",
    type: "public_holiday",
  },
  {
    id: "kd-2026",
    name: "King's Day",
    nameNl: "Koningsdag",
    start: "2026-04-27",
    end: "2026-04-27",
    region: "all",
    type: "public_holiday",
  },
  {
    id: "bd-2026",
    name: "Liberation Day",
    nameNl: "Bevrijdingsdag",
    start: "2026-05-05",
    end: "2026-05-05",
    region: "all",
    type: "public_holiday",
  },
  {
    id: "ad-2026",
    name: "Ascension Day",
    nameNl: "Hemelvaartsdag",
    start: "2026-05-14",
    end: "2026-05-14",
    region: "all",
    type: "public_holiday",
  },
  {
    id: "wm-2026",
    name: "Whit Monday",
    nameNl: "Tweede Pinksterdag",
    start: "2026-05-25",
    end: "2026-05-25",
    region: "all",
    type: "public_holiday",
  },
  {
    id: "xm-2026",
    name: "Christmas",
    nameNl: "Kerstmis",
    start: "2026-12-25",
    end: "2026-12-26",
    region: "all",
    type: "public_holiday",
  },
];

// ===== SCHOOL VACATIONS 2024-2025 =====
const SCHOOL_VACATIONS_2024_2025: DutchHoliday[] = [
  // Herfstvakantie 2024
  {
    id: "hv-n-2024",
    name: "Autumn Break",
    nameNl: "Herfstvakantie",
    start: "2024-10-19",
    end: "2024-10-27",
    region: "noord",
    type: "vacation",
  },
  {
    id: "hv-m-2024",
    name: "Autumn Break",
    nameNl: "Herfstvakantie",
    start: "2024-10-19",
    end: "2024-10-27",
    region: "midden",
    type: "vacation",
  },
  {
    id: "hv-z-2024",
    name: "Autumn Break",
    nameNl: "Herfstvakantie",
    start: "2024-10-19",
    end: "2024-10-27",
    region: "zuid",
    type: "vacation",
  },

  // Kerstvakantie 2024-2025
  {
    id: "kv-2024",
    name: "Christmas Break",
    nameNl: "Kerstvakantie",
    start: "2024-12-21",
    end: "2025-01-05",
    region: "all",
    type: "vacation",
  },

  // Voorjaarsvakantie 2025
  {
    id: "vv-n-2025",
    name: "Spring Break",
    nameNl: "Voorjaarsvakantie",
    start: "2025-02-15",
    end: "2025-02-23",
    region: "noord",
    type: "vacation",
  },
  {
    id: "vv-m-2025",
    name: "Spring Break",
    nameNl: "Voorjaarsvakantie",
    start: "2025-02-22",
    end: "2025-03-02",
    region: "midden",
    type: "vacation",
  },
  {
    id: "vv-z-2025",
    name: "Spring Break",
    nameNl: "Voorjaarsvakantie",
    start: "2025-03-01",
    end: "2025-03-09",
    region: "zuid",
    type: "vacation",
  },

  // Meivakantie 2025
  {
    id: "mv-2025",
    name: "May Break",
    nameNl: "Meivakantie",
    start: "2025-04-26",
    end: "2025-05-11",
    region: "all",
    type: "vacation",
  },

  // Zomervakantie 2025
  {
    id: "zv-n-2025",
    name: "Summer Break",
    nameNl: "Zomervakantie",
    start: "2025-07-12",
    end: "2025-08-24",
    region: "noord",
    type: "vacation",
  },
  {
    id: "zv-m-2025",
    name: "Summer Break",
    nameNl: "Zomervakantie",
    start: "2025-07-19",
    end: "2025-08-31",
    region: "midden",
    type: "vacation",
  },
  {
    id: "zv-z-2025",
    name: "Summer Break",
    nameNl: "Zomervakantie",
    start: "2025-07-05",
    end: "2025-08-17",
    region: "zuid",
    type: "vacation",
  },
];

// ===== SCHOOL VACATIONS 2025-2026 =====
const SCHOOL_VACATIONS_2025_2026: DutchHoliday[] = [
  // Herfstvakantie 2025
  {
    id: "hv-n-2025",
    name: "Autumn Break",
    nameNl: "Herfstvakantie",
    start: "2025-10-18",
    end: "2025-10-26",
    region: "noord",
    type: "vacation",
  },
  {
    id: "hv-m-2025",
    name: "Autumn Break",
    nameNl: "Herfstvakantie",
    start: "2025-10-18",
    end: "2025-10-26",
    region: "midden",
    type: "vacation",
  },
  {
    id: "hv-z-2025",
    name: "Autumn Break",
    nameNl: "Herfstvakantie",
    start: "2025-10-18",
    end: "2025-10-26",
    region: "zuid",
    type: "vacation",
  },

  // Kerstvakantie 2025-2026
  {
    id: "kv-2025",
    name: "Christmas Break",
    nameNl: "Kerstvakantie",
    start: "2025-12-20",
    end: "2026-01-04",
    region: "all",
    type: "vacation",
  },

  // Voorjaarsvakantie 2026
  {
    id: "vv-n-2026",
    name: "Spring Break",
    nameNl: "Voorjaarsvakantie",
    start: "2026-02-21",
    end: "2026-03-01",
    region: "noord",
    type: "vacation",
  },
  {
    id: "vv-m-2026",
    name: "Spring Break",
    nameNl: "Voorjaarsvakantie",
    start: "2026-02-28",
    end: "2026-03-08",
    region: "midden",
    type: "vacation",
  },
  {
    id: "vv-z-2026",
    name: "Spring Break",
    nameNl: "Voorjaarsvakantie",
    start: "2026-02-14",
    end: "2026-02-22",
    region: "zuid",
    type: "vacation",
  },

  // Meivakantie 2026
  {
    id: "mv-2026",
    name: "May Break",
    nameNl: "Meivakantie",
    start: "2026-04-25",
    end: "2026-05-10",
    region: "all",
    type: "vacation",
  },

  // Zomervakantie 2026
  {
    id: "zv-n-2026",
    name: "Summer Break",
    nameNl: "Zomervakantie",
    start: "2026-07-04",
    end: "2026-08-16",
    region: "noord",
    type: "vacation",
  },
  {
    id: "zv-m-2026",
    name: "Summer Break",
    nameNl: "Zomervakantie",
    start: "2026-07-18",
    end: "2026-08-30",
    region: "midden",
    type: "vacation",
  },
  {
    id: "zv-z-2026",
    name: "Summer Break",
    nameNl: "Zomervakantie",
    start: "2026-07-11",
    end: "2026-08-23",
    region: "zuid",
    type: "vacation",
  },
];

// ===== SCHOOL VACATIONS 2026-2027 =====
const SCHOOL_VACATIONS_2026_2027: DutchHoliday[] = [
  // Herfstvakantie 2026
  {
    id: "hv-n-2026",
    name: "Autumn Break",
    nameNl: "Herfstvakantie",
    start: "2026-10-17",
    end: "2026-10-25",
    region: "noord",
    type: "vacation",
  },
  {
    id: "hv-m-2026",
    name: "Autumn Break",
    nameNl: "Herfstvakantie",
    start: "2026-10-17",
    end: "2026-10-25",
    region: "midden",
    type: "vacation",
  },
  {
    id: "hv-z-2026",
    name: "Autumn Break",
    nameNl: "Herfstvakantie",
    start: "2026-10-17",
    end: "2026-10-25",
    region: "zuid",
    type: "vacation",
  },

  // Kerstvakantie 2026-2027
  {
    id: "kv-2026",
    name: "Christmas Break",
    nameNl: "Kerstvakantie",
    start: "2026-12-19",
    end: "2027-01-03",
    region: "all",
    type: "vacation",
  },

  // Voorjaarsvakantie 2027
  {
    id: "vv-n-2027",
    name: "Spring Break",
    nameNl: "Voorjaarsvakantie",
    start: "2027-02-20",
    end: "2027-02-28",
    region: "noord",
    type: "vacation",
  },
  {
    id: "vv-m-2027",
    name: "Spring Break",
    nameNl: "Voorjaarsvakantie",
    start: "2027-02-27",
    end: "2027-03-07",
    region: "midden",
    type: "vacation",
  },
  {
    id: "vv-z-2027",
    name: "Spring Break",
    nameNl: "Voorjaarsvakantie",
    start: "2027-02-13",
    end: "2027-02-21",
    region: "zuid",
    type: "vacation",
  },

  // Meivakantie 2027
  {
    id: "mv-2027",
    name: "May Break",
    nameNl: "Meivakantie",
    start: "2027-05-01",
    end: "2027-05-09",
    region: "all",
    type: "vacation",
  },

  // Zomervakantie 2027
  {
    id: "zv-n-2027",
    name: "Summer Break",
    nameNl: "Zomervakantie",
    start: "2027-07-17",
    end: "2027-08-29",
    region: "noord",
    type: "vacation",
  },
  {
    id: "zv-m-2027",
    name: "Summer Break",
    nameNl: "Zomervakantie",
    start: "2027-07-10",
    end: "2027-08-22",
    region: "midden",
    type: "vacation",
  },
  {
    id: "zv-z-2027",
    name: "Summer Break",
    nameNl: "Zomervakantie",
    start: "2027-07-24",
    end: "2027-09-05",
    region: "zuid",
    type: "vacation",
  },
];

// ===== CE EXAM PERIODS (Centraal Examen) =====
const CE_EXAM_PERIODS: DutchHoliday[] = [
  // Tijdvak 1 - First exam period (usually mid-May)
  {
    id: "ce1-2025",
    name: "CE Tijdvak 1",
    nameNl: "Centraal Examen Tijdvak 1",
    start: "2025-05-07",
    end: "2025-05-23",
    region: "all",
    type: "exam_period",
  },
  {
    id: "ce1-2026",
    name: "CE Tijdvak 1",
    nameNl: "Centraal Examen Tijdvak 1",
    start: "2026-05-11",
    end: "2026-05-27",
    region: "all",
    type: "exam_period",
  },
  {
    id: "ce1-2027",
    name: "CE Tijdvak 1",
    nameNl: "Centraal Examen Tijdvak 1",
    start: "2027-05-10",
    end: "2027-05-26",
    region: "all",
    type: "exam_period",
  },

  // Tijdvak 2 - Second exam period / retakes (usually mid-June)
  {
    id: "ce2-2025",
    name: "CE Tijdvak 2",
    nameNl: "Centraal Examen Tijdvak 2",
    start: "2025-06-16",
    end: "2025-06-24",
    region: "all",
    type: "exam_period",
  },
  {
    id: "ce2-2026",
    name: "CE Tijdvak 2",
    nameNl: "Centraal Examen Tijdvak 2",
    start: "2026-06-15",
    end: "2026-06-23",
    region: "all",
    type: "exam_period",
  },
  {
    id: "ce2-2027",
    name: "CE Tijdvak 2",
    nameNl: "Centraal Examen Tijdvak 2",
    start: "2027-06-14",
    end: "2027-06-22",
    region: "all",
    type: "exam_period",
  },
];

// ===== COMBINED DATA =====
const ALL_HOLIDAYS: DutchHoliday[] = [
  ...PUBLIC_HOLIDAYS_2025,
  ...PUBLIC_HOLIDAYS_2026,
  ...SCHOOL_VACATIONS_2024_2025,
  ...SCHOOL_VACATIONS_2025_2026,
  ...SCHOOL_VACATIONS_2026_2027,
  ...CE_EXAM_PERIODS,
];

// ===== HELPER FUNCTIONS =====

/**
 * Get all holidays for a specific region and date range
 */
export const getHolidaysForRegion = (
  region: DutchRegion,
  startDate: string,
  endDate: string,
): DutchHoliday[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return ALL_HOLIDAYS.filter((holiday) => {
    // Check region match
    if (holiday.region !== "all" && holiday.region !== region) {
      return false;
    }

    // Check date overlap
    const holidayStart = new Date(holiday.start);
    const holidayEnd = new Date(holiday.end);

    return holidayStart <= end && holidayEnd >= start;
  });
};

/**
 * Check if a specific date is a vacation day
 */
export const isVacationDay = (date: string, region: DutchRegion): boolean => {
  const checkDate = new Date(date);

  return ALL_HOLIDAYS.some((holiday) => {
    if (holiday.region !== "all" && holiday.region !== region) {
      return false;
    }

    const start = new Date(holiday.start);
    const end = new Date(holiday.end);

    return (
      checkDate >= start &&
      checkDate <= end &&
      (holiday.type === "vacation" || holiday.type === "public_holiday")
    );
  });
};

/**
 * Check if a date is during exam period
 */
export const isExamPeriod = (date: string): boolean => {
  const checkDate = new Date(date);

  return CE_EXAM_PERIODS.some((period) => {
    const start = new Date(period.start);
    const end = new Date(period.end);
    return checkDate >= start && checkDate <= end;
  });
};

/**
 * Get the next upcoming vacation for a region
 */

/**
 * Get days until the next CE exam period
 */
export const getDaysUntilCE = (
  fromDate: string = new Date().toISOString(),
): number | null => {
  const from = new Date(fromDate);

  const upcoming = CE_EXAM_PERIODS.filter((p) => new Date(p.start) > from).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  const firstUpcoming = upcoming[0];
  if (!firstUpcoming) return null;

  const diff = new Date(firstUpcoming.start).getTime() - from.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
