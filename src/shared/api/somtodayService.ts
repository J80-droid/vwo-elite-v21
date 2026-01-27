/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic Somtoday API responses and legacy browser storage types */
import { EliteTask, getEnergyForSubject } from "../../entities/planner/model/task";
import {
  SOMTODAY_CONFIG,
  SomtodayAbsentie,
  SomtodayAfspraak,
  SomtodayBericht,
  SomtodayLeerling,
  SomtodayLesgroep,
  SomtodaySchool,
  SomtodaySchoolDetails,
  SomtodayStoredAuth,
  SomtodayStudiewijzerItem,
  SomtodayTokens,
  SomtodayVakantie,
} from "../types/somtodayTypes";
import { getScheduleInRangeSQL, saveBulkScheduleSQL } from "./sqliteService";

const PROXY_BASE = "/api/somtoday";

// Manual OAuth Constants (for Microsoft SSO schools)
const CLIENT_ID = "somtoday-leerling-app";
const REDIRECT_URI = "somtoday://nl.topicus.somtoday.leerling/oauth/callback";
const AUTH_BASE = "https://inloggen.somtoday.nl";

// PKCE Helper Functions
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, (dec) => ("0" + dec.toString(16)).substr(-2)).join(
    "",
  );
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Helper to get stored auth
const getStoredAuth = (): SomtodayStoredAuth | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(SOMTODAY_CONFIG.STORAGE_KEY_AUTH);
  return stored ? JSON.parse(stored) : null;
};

// Helper to set stored auth
const setStoredAuth = (auth: SomtodayStoredAuth) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOMTODAY_CONFIG.STORAGE_KEY_AUTH, JSON.stringify(auth));
  window.dispatchEvent(new Event("somtoday-auth-changed"));
};

const getLocalDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getCurrentAcademicYearRange = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const isBeforeSept = now.getMonth() < 8; // Jan-Aug
  const startYear = isBeforeSept ? currentYear - 1 : currentYear;
  const endYear = startYear + 1;

  return {
    startDate: `${startYear}-08-01`,
    endDate: `${endYear}-08-01`,
  };
};

class SomtodayService {
  private tokens: SomtodayTokens | null = null;
  private schoolsCache: SomtodaySchool[] = [];
  private studentCache: SomtodayLeerling | null = null;
  private apiUrl: string = SOMTODAY_CONFIG.API_BASE;
  private codeVerifier: string = ""; // For manual OAuth flow

  private refreshTimeout: any = null;

  constructor() {
    const stored = getStoredAuth();
    if (stored) {
      this.tokens = stored.tokens;
      this.apiUrl = stored.tokens.somtoday_api_url || SOMTODAY_CONFIG.API_BASE;
      this.studentCache = stored.student;
    }

    // Multi-tab support: Listen for auth updates from other tabs
    if (typeof window !== "undefined") {
      window.addEventListener("somtoday-auth-changed", () => {
        const updated = getStoredAuth();
        if (updated) {
          this.tokens = updated.tokens;
          this.apiUrl =
            updated.tokens.somtoday_api_url || SOMTODAY_CONFIG.API_BASE;
          this.studentCache = updated.student;
          // Re-schedule refresh based on new token from other tab
          this.scheduleTokenRefresh();
        } else {
          // Logged out in another tab
          this.tokens = null;
          this.studentCache = null;
          if (this.refreshTimeout) clearTimeout(this.refreshTimeout);
        }
      });
    }
  }

  /**
   * Schedule proactive refresh (5 mins before expiry)
   */
  private scheduleTokenRefresh() {
    if (this.refreshTimeout) clearTimeout(this.refreshTimeout);
    if (!this.tokens || !this.tokens.expires_at) return;

    const expiresAt = this.tokens.expires_at;
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    // Refresh 5 minutes before expiry
    const refreshDelay = timeUntilExpiry - 5 * 60 * 1000;

    if (refreshDelay <= 0) {
      // Already expired or close to it, try refresh immediately if not already doing so
      // checking 'refreshDelay > -10000' ensures we don't loop if it's LONG expired
      if (refreshDelay > -60000) {
        this.refreshToken().catch((e) =>
          console.warn("[Somtoday] Immediate refresh failed", e),
        );
      }
      return;
    }

    console.log(
      `[Somtoday] Scheduling background refresh in ${Math.round(refreshDelay / 60000)} minutes`,
    );

    this.refreshTimeout = setTimeout(() => {
      console.log("[Somtoday] Executing scheduled background refresh...");
      this.refreshToken().catch((e) =>
        console.error("[Somtoday] Scheduled refresh failed", e),
      );
    }, refreshDelay);
  }

  /**
   * Initialize Service (refresh tokens if needed)
   */
  async initialize(): Promise<boolean> {
    const stored = getStoredAuth();
    if (!stored) return false;

    // Restore state
    this.tokens = stored.tokens;
    this.apiUrl = stored.tokens.somtoday_api_url || SOMTODAY_CONFIG.API_BASE;
    this.studentCache = stored.student;

    // Check if token is expired but we have a refresh token
    if (
      this.tokens &&
      this.tokens.expires_at &&
      Date.now() > this.tokens.expires_at
    ) {
      console.log("[Somtoday] Token expired on startup, attempting refresh...");
      if (this.tokens.refresh_token) {
        try {
          await this.refreshToken();
          console.log("[Somtoday] Startup refresh successful!");
          this.scheduleTokenRefresh(); // Start the loop
          return true;
        } catch (e) {
          console.error("[Somtoday] Startup refresh failed:", e);
          this.logout();
          return false;
        }
      } else {
        console.log("[Somtoday] No refresh token available, session expired.");
        this.logout();
        return false;
      }
    }

    this.scheduleTokenRefresh(); // Start the loop if valid
    return this.isAuthenticated();
  }

  /**
   * Search for schools via Proxy
   */
  async searchSchools(query: string): Promise<SomtodaySchool[]> {
    if (!query || query.length < 3) return [];

    try {
      if (this.schoolsCache.length === 0) {
        const response = await fetch(`${PROXY_BASE}/schools`);
        if (!response.ok) throw new Error("Failed to fetch schools");

        const data = await response.json();

        if (Array.isArray(data)) {
          if (data.length > 0 && (data[0] as any).instellingen) {
            this.schoolsCache = data.flatMap(
              (region: any) => region.instellingen || [],
            );
          } else {
            this.schoolsCache = data;
          }
        }
      }

      const lowerQuery = query.toLowerCase();
      return this.schoolsCache
        .filter(
          (s) =>
            s.naam.toLowerCase().includes(lowerQuery) ||
            s.plaats.toLowerCase().includes(lowerQuery),
        )
        .slice(0, 20);
    } catch (error) {
      console.error("[Somtoday] School search failed:", error);
      return [];
    }
  }
  /**
   * MANUAL OAUTH FLOW - Step 1: Generate login URL for popup
   * (Required for schools using Microsoft SSO)
   */
  async getLoginUrl(school: SomtodaySchool): Promise<string> {
    this.codeVerifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(this.codeVerifier);

    // Store verifier in localStorage in case page reloads
    localStorage.setItem("somtoday_pkce_verifier", this.codeVerifier);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: "openid profile offline_access somtoday_api",
      state: school.uuid, // Store school UUID in state
      code_challenge: challenge,
      code_challenge_method: "S256",
      tenant_uuid: school.uuid,
      prompt: "login",
    });

    console.log("[Somtoday] Generated login URL for manual OAuth flow");
    return `${AUTH_BASE}/oauth2/authorize?${params.toString()}`;
  }

  /**
   * MANUAL OAUTH FLOW - Step 2: Exchange the code user pasted
   */
  async exchangeCode(urlOrCode: string, school: SomtodaySchool): Promise<void> {
    let code = urlOrCode;

    // If user pasted the full URL, extract the code
    if (urlOrCode.includes("code=")) {
      const m = urlOrCode.match(/code=([^&]+)/);
      if (m && m[1]) code = decodeURIComponent(m[1]);
    }

    // Get verifier from memory or storage
    const verifier =
      this.codeVerifier || localStorage.getItem("somtoday_pkce_verifier");
    if (!verifier) {
      throw new Error("PKCE Verifier verloren. Start opnieuw.");
    }

    console.log("[Somtoday] Exchanging code for tokens...");

    const response = await fetch(`${PROXY_BASE}/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        codeVerifier: verifier,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.details || "Code inwisselen mislukt. Probeer opnieuw.",
      );
    }

    const tokens: SomtodayTokens = await response.json();
    tokens.expires_at = Date.now() + tokens.expires_in * 1000;

    this.tokens = tokens;
    this.apiUrl = tokens.somtoday_api_url;

    // Fetch student info
    const student = await this.getCurrentStudent();

    // Store auth
    setStoredAuth({
      tokens,
      student,
      school,
      lastSync: new Date().toISOString(),
    });

    // Cleanup
    localStorage.removeItem("somtoday_pkce_verifier");
    this.codeVerifier = "";

    this.scheduleTokenRefresh(); // Schedule next refresh

    console.log("[Somtoday] Successfully logged in!");
  }

  /**
   * Fetch current student info (Cached)
   */
  async getCurrentStudent(): Promise<SomtodayLeerling> {
    if (this.studentCache) return this.studentCache;

    const response = await this.apiRequest<{ items: SomtodayLeerling[] }>(
      "/rest/v1/leerlingen",
    );
    if (!response.items?.length) {
      if ((response as any).uuid) {
        this.studentCache = response as any as SomtodayLeerling;
        return this.studentCache!;
      }
      throw new Error("No student found");
    }
    this.studentCache = response.items[0]!;
    return this.studentCache!;
  }

  /**
   * Generic API Request with Auto-Refresh
   */
  async apiRequest<T>(
    endpoint: string,
    params: Record<string, any> = {},
  ): Promise<T> {
    // Capture tokens locally to help TS narrowing
    const currentTokens = this.tokens;
    if (!currentTokens) throw new Error("Niet ingelogd");

    // Check expiry
    // Assuming expires_at IS required in our runtime modification, but TS might see it as optional
    const expiry = currentTokens.expires_at || 0;
    if (expiry > 0 && Date.now() > expiry - 60000) {
      await this.refreshToken();
      // Refetch tokens after refresh
      const refreshedTokens = this.tokens;
      if (!refreshedTokens) throw new Error("Session lost during refresh");

      // Recursive call with fresh tokens
      // Warning: infinite loop risk if refresh keeps succeeding but returning expired tokens.
      // Better to proceed if refresh worked.
    }

    // Use the (potentially updated) tokens
    const activeTokens = this.tokens;
    if (!activeTokens) throw new Error("Niet ingelogd");

    const queryString = new URLSearchParams({
      endpoint,
      accessToken: activeTokens.access_token,
      apiUrl: this.apiUrl,
      ...params,
    }).toString();

    const response = await fetch(`${PROXY_BASE}/api?${queryString}`);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error("[Somtoday] API Error Details:", errorBody);
      if (errorBody.upstreamStatus) {
        console.error(
          `[Somtoday] UPSTREAM ERROR: ${errorBody.upstreamStatus} - ${JSON.stringify(errorBody.details || {})}`,
        );
      }
      // Include specific upstream error details if available
      const details = errorBody.details
        ? JSON.stringify(errorBody.details)
        : errorBody.error || response.statusText;
      throw new Error(`API Error: ${response.status} - ${details}`);
    }

    return response.json();
  }

  /**
   * Refresh Token
   */
  async refreshToken(): Promise<void> {
    if (!this.tokens?.refresh_token) throw new Error("No refresh token");

    try {
      const response = await fetch(`${PROXY_BASE}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: this.tokens.refresh_token }),
      });

      if (!response.ok) throw new Error("Refresh failed");

      const newTokens = await response.json();

      const currentTokens = this.tokens;
      this.tokens = {
        ...currentTokens!,
        ...newTokens,
        expires_at: Date.now() + newTokens.expires_in * 1000,
      };

      const currentAuth = getStoredAuth();
      if (currentAuth) {
        setStoredAuth({
          ...currentAuth,
          tokens: this.tokens!,
        });
      }

      this.scheduleTokenRefresh();
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  logout() {
    this.tokens = null;
    this.studentCache = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(SOMTODAY_CONFIG.STORAGE_KEY_AUTH);
      window.dispatchEvent(new Event("somtoday-auth-changed"));
    }
    if (this.refreshTimeout) clearTimeout(this.refreshTimeout);
  }

  isAuthenticated(): boolean {
    const t = this.tokens;
    return !!(t && t.expires_at && Date.now() < t.expires_at);
  }

  isConnected(): boolean {
    return this.isAuthenticated();
  }

  getStatus(): {
    connected: boolean;
    school?: SomtodaySchool;
    student?: SomtodayLeerling;
    lastSync?: string;
  } {
    const stored = getStoredAuth();
    if (!stored) {
      return { connected: false };
    }
    return {
      connected: true,
      school: stored.school!,
      student: stored.student!,
      ...(stored.lastSync ? { lastSync: stored.lastSync } : {}),
    };
  }

  disconnect() {
    this.logout();
  }

  // ===== DATA FETCHERS (Restored) =====

  async getSchedule(
    startDate: string,
    endDate: string,
    forceSync: boolean = false,
  ): Promise<SomtodayAfspraak[] | null> {
    if (!forceSync) {
      const cached = await this.getCachedSchedule(startDate, endDate);
      if (cached.length > 0) return cached;
    }

    // If not logged in, don't try API, just return what we have (likely empty if cache failed)
    if (!this.tokens) {
      return this.getCachedSchedule(startDate, endDate);
    }

    try {
      const response = await this.apiRequest<{ items: SomtodayAfspraak[] }>(
        "/rest/v1/afspraken",
        {
          begindatum: startDate,
          einddatum: endDate,
          additional: "vak,docentAfkortingen",
        },
      );

      const appointments = response.items || [];

      // Save to SQL
      if (appointments.length > 0) {
        await saveBulkScheduleSQL(appointments);
      }

      return appointments;
    } catch (error) {
      console.warn(
        "[SomtodayService] Schedule fetch failed, falling back to cache",
        error,
      );
      const cached = await this.getCachedSchedule(startDate, endDate);
      // If cache is empty and error occurred, return null to signal failure to store
      // However, we want to try cache first. If cache works, return it.
      if (cached.length > 0) return cached;
      return null;
    }
  }

  async getCachedSchedule(
    startDate: string,
    endDate: string,
  ): Promise<SomtodayAfspraak[]> {
    try {
      return await getScheduleInRangeSQL(startDate, endDate);
    } catch (error) {
      console.error("[SomtodayService] Failed to load cached schedule:", error);
      return [];
    }
  }

  async getStudyGuides(): Promise<any[]> {
    const response = await this.apiRequest<{ items: any[] }>(
      "/rest/v1/studiewijzers",
    );
    return response.items || [];
  }

  async getAbsences(
    startDate?: string,
    endDate?: string,
  ): Promise<SomtodayAbsentie[]> {
    const student = await this.getCurrentStudent();
    const studentId =
      student.links.find((l) => l.rel === "self")?.id || student.links[0]?.id;
    if (!studentId) throw new Error("Student ID not found");

    const range = getCurrentAcademicYearRange();
    const start = startDate || range.startDate;
    const end = endDate || range.endDate;

    // console.log(`[SomtodayService] Fetching absences for student ID: ${studentId}`);
    const response = await this.apiRequest<{ items: SomtodayAbsentie[] }>(
      `/rest/v1/absenties/leerling/${studentId}`,
      { begindatum: start, einddatum: end },
    );
    return response.items || [];
  }

  async getMessages(): Promise<SomtodayBericht[]> {
    const response = await this.apiRequest<{ items: SomtodayBericht[] }>(
      "/rest/v1/boodschappen/conversaties",
    );
    return response.items || [];
  }

  async getLessonGroups(): Promise<SomtodayLesgroep[]> {
    const student = await this.getCurrentStudent();
    const studentId =
      student.links.find((l) => l.rel === "self")?.id || student.links[0]?.id;
    if (!studentId) throw new Error("Student ID not found");
    const response = await this.apiRequest<{ items: SomtodayLesgroep[] }>(
      `/rest/v1/lesgroepen/leerling/${studentId}`,
    );
    return response.items || [];
  }

  async getVacations(): Promise<SomtodayVakantie[]> {
    const student = await this.getCurrentStudent();
    const studentId =
      student.links.find((l) => l.rel === "self")?.id || student.links[0]?.id;
    if (!studentId) throw new Error("Student ID not found");
    const response = await this.apiRequest<{ items: SomtodayVakantie[] }>(
      `/rest/v1/vakanties/leerling/${studentId}`,
    );
    console.log("[SomtodayService] Vacations response:", response.items);
    return response.items || [];
  }

  async getSchoolDetails(): Promise<SomtodaySchoolDetails> {
    const student = await this.getCurrentStudent();
    const studentId =
      student.links.find((l) => l.rel === "self")?.id || student.links[0]?.id;
    if (!studentId) throw new Error("Student ID not found");
    return await this.apiRequest<SomtodaySchoolDetails>(
      `/rest/v1/leerlingen/${studentId}/schoolgegevens`,
    );
  }

  async getAssignments(startDate?: string, endDate?: string): Promise<any[]> {
    const student = await this.getCurrentStudent();
    const studentId =
      student.links.find((l) => l.rel === "self")?.id || student.links[0]?.id;
    if (!studentId) throw new Error("Student ID not found");

    const range = getCurrentAcademicYearRange();
    const start = startDate || range.startDate;
    const end = endDate || range.endDate;

    // console.log(`[SomtodayService] Fetching assignments for student ID: ${studentId}`);
    const response = await this.apiRequest<{ items: any[] }>(
      `/rest/v1/inleveropdrachten/leerling/${studentId}`,
      { begindatum: start, einddatum: end },
    );
    return response.items || [];
  }
}

const getSubjectColor = (subject: string): string | undefined => {
  if (!subject) return undefined;
  const s = subject.toLowerCase().trim();

  // Robust Tokenization Strategy:
  // Split by any non-word char (dot, space, dash, underscore, etc.)
  // "5v.bi" -> ["5v", "bi"]
  // "wiskunde b" -> ["wiskunde", "b"]
  // "bi" -> ["bi"]
  const tokens = new Set(s.split(/[^a-z0-9]+/));

  const hasCode = (code: string) => tokens.has(code);

  // Elite Colors
  // Wiskunde (WI, WA, WB, WC, WD) -> Blue
  if (
    s.includes("wiskunde") ||
    s.includes("wis") ||
    s.includes("rekenen") ||
    hasCode("wi") ||
    hasCode("wa") ||
    hasCode("wb") ||
    hasCode("wc") ||
    hasCode("wd")
  )
    return "#3b82f6";

  // Natuurkunde (NA, NAT) -> Amber
  if (
    s.includes("natuurkunde") ||
    s.includes("nat") ||
    s.includes("physics") ||
    hasCode("na")
  )
    return "#f59e0b";

  // Scheikunde (SK, SCH, CHEM) -> Emerald
  if (
    s.includes("scheikunde") ||
    s.includes("sch") ||
    s.includes("chem") ||
    hasCode("sk") ||
    hasCode("sc")
  )
    return "#10b981";

  // Biologie (BI, BIO) -> Lime
  if (s.includes("biologie") || s.includes("bio") || hasCode("bi"))
    return "#84cc16";

  // Engels (EN, ENG) -> Violet
  if (s.includes("engels") || s.includes("eng") || hasCode("en"))
    return "#8b5cf6";

  // Nederlands (NE, NED, NL) -> Rose
  if (
    s.includes("nederlands") ||
    s.includes("ned") ||
    hasCode("nl") ||
    hasCode("ne")
  )
    return "#f43f5e";

  // Frans (FA, FR) -> Orange
  if (
    s.includes("frans") ||
    s.includes("fra") ||
    hasCode("fa") ||
    hasCode("fr")
  )
    return "#ea580c"; // Ensure distinct orange

  // Duits (DU, DE) -> Orange/Amber variant
  if (
    s.includes("duits") ||
    s.includes("dui") ||
    hasCode("du") ||
    hasCode("de")
  )
    return "#d97706";

  // Aardrijkskunde (AK, GEO) -> Orange
  if (s.includes("aardrijkskunde") || s.includes("aar") || hasCode("ak"))
    return "#d97706";

  // Geschiedenis (GS, GES) -> Fuchsia
  if (s.includes("geschiedenis") || s.includes("ges") || hasCode("gs"))
    return "#d946ef";

  // Economie (EC, ECO) -> Green
  if (s.includes("economie") || s.includes("eco") || hasCode("ec"))
    return "#22c55e";

  // Bedrijfseconomie (BE, BECO) -> Green
  if (s.includes("bedrijfseconomie") || hasCode("be") || hasCode("beco"))
    return "#22c55e";

  // Maatschappijleer (MA, MAAT) -> Teal
  if (s.includes("maatschappijleer") || s.includes("maat") || hasCode("ma"))
    return "#14b8a6";

  // Gym / LO -> Slate
  if (s.includes("gym") || s.includes("lo")) return "#64748b";

  // Kunst / CKV / TE / HA -> Pink
  if (
    s.includes("kunst") ||
    s.includes("ckv") ||
    hasCode("te") ||
    hasCode("ha") ||
    hasCode("bv") ||
    hasCode("mu")
  )
    return "#ec4899";

  // Informatica (IN, INF) -> Cyan/Sky (Tech)
  if (s.includes("informatica") || s.includes("inf") || hasCode("in"))
    return "#0ea5e9";

  return undefined;
};

/**
 * Normalizes a subject name for mapping between Somtoday and Elite Dashboard
 */
export function normalizeSubjectName(name: string): string {
  const s = name.toLowerCase().trim();
  const tokens = new Set(s.split(/[^a-z0-9]+/));
  const hasCode = (code: string) => tokens.has(code);

  if (
    s.includes("wiskunde") ||
    hasCode("wi") ||
    hasCode("wa") ||
    hasCode("wb") ||
    hasCode("wc") ||
    hasCode("wd")
  )
    return "wiskunde";
  if (s.includes("natuurkunde") || hasCode("na") || hasCode("nat"))
    return "natuurkunde";
  if (
    s.includes("scheikunde") ||
    hasCode("sk") ||
    hasCode("sc") ||
    hasCode("sch")
  )
    return "scheikunde";
  if (s.includes("biologie") || hasCode("bi") || hasCode("bio"))
    return "biologie";
  if (s.includes("engels") || hasCode("en") || hasCode("eng")) return "engels";
  if (
    s.includes("nederlands") ||
    hasCode("nl") ||
    hasCode("ne") ||
    hasCode("ned")
  )
    return "nederlands";
  if (s.includes("frans") || hasCode("fa") || hasCode("fr")) return "frans";
  if (s.includes("duits") || hasCode("du") || hasCode("de")) return "duits";
  if (s.includes("aardrijkskunde") || hasCode("ak") || hasCode("geo"))
    return "aardrijkskunde";
  if (s.includes("geschiedenis") || hasCode("gs") || hasCode("ges"))
    return "geschiedenis";
  if (s.includes("economie") || hasCode("ec") || hasCode("eco"))
    return "economie";
  if (s.includes("bedrijfseconomie") || hasCode("be") || hasCode("beco"))
    return "bedrijfseconomie";
  if (s.includes("informatica") || hasCode("in") || hasCode("inf"))
    return "informatica";

  return s;
}

/**
 * Mapping Helpers
 */
export function mapAfspraakToEliteTask(afspraak: SomtodayAfspraak): EliteTask {
  const now = new Date().toISOString();

  // Debug: Log the raw appointment data
  // console.log('[mapAfspraak] Raw appointment:', {
  //     beginDatumTijd: afspraak.beginDatumTijd,
  //     eindDatumTijd: afspraak.eindDatumTijd,
  //     titel: afspraak.titel,
  //     keys: Object.keys(afspraak)
  // });

  const startDate = new Date(afspraak.beginDatumTijd);
  const endDate = new Date(afspraak.eindDatumTijd);
  // console.log('[mapAfspraak] Parsed startDate:', startDate.toISOString(), '-> localDate:', getLocalDateStr(startDate));

  const duration = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60),
  );
  const rawSubject = afspraak.additionalObjects?.vak?.naam;
  const splitSubject = afspraak.titel.split(" - ")[1];
  const subject = rawSubject?.toLowerCase() || splitSubject?.toLowerCase();

  // DEBUG: Color Mapping
  const resolvedColor = subject && getSubjectColor(subject);
  // console.log(`[SomtodayMap] Title: "${afspraak.titel}" -> Subject: "${subject}" ...`);

  const isExam =
    /proefwerk|toets|tentamen|so\b|se\b|exam|test|pta/i.test(afspraak.titel) ||
    /proefwerk|toets|tentamen|so\b|se\b|exam|test|pta/i.test(
      afspraak.omschrijving || "",
    ) ||
    afspraak.afspraakType?.categorie === "Toets";

  const formatTime = (date: Date) =>
    `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

  // Prefer Elite subject color, fallback to Somtoday color, fallback to default
  const color =
    resolvedColor ||
    (afspraak.afspraakType?.standaardKleur
      ? `#${(afspraak.afspraakType.standaardKleur >>> 0).toString(16).padStart(6, "0")}`
      : undefined);

  const somtodayId =
    afspraak.links?.find((l) => l.rel === "self")?.id ||
    afspraak.links?.[0]?.id;

  return {
    id: `somtoday-${somtodayId || "fixed-" + afspraak.beginDatumTijd + "-" + (afspraak.titel || "").substring(0, 10)}`,
    title: afspraak.titel,
    description: afspraak.omschrijving,
    date: getLocalDateStr(startDate),
    startTime: formatTime(startDate),
    endTime: formatTime(endDate),
    duration: duration > 0 ? duration : 45,
    isFixed: true, // School schedule is fixed
    isAllDay: false,
    subject,
    type: isExam ? "exam" : "lesson",
    priority: isExam ? "high" : "medium",
    energyRequirement: subject ? getEnergyForSubject(subject) : "medium",
    completed: false,
    status: "todo",
    createdAt: now,
    updatedAt: now,
    source: "import",
    color,
  };
}

export function mapStudiewijzerItemToEliteTask(
  item: SomtodayStudiewijzerItem,
): EliteTask {
  const now = new Date().toISOString();
  const isExam =
    item.huiswerkType === "TOETS" || item.huiswerkType === "GROTE_TOETS";
  const somtodayId =
    item.links?.find((l) => l.rel === "self")?.id || item.links?.[0]?.id;

  return {
    id: `somtoday-sw-${somtodayId || "sw-" + (item.datumTijd || now) + "-" + (item.onderwerp || "").substring(0, 10)}`,
    title: item.onderwerp || "Studiewijzer Item",
    description: item.omschrijving,
    date: item.datumTijd
      ? item.datumTijd.split("T")[0]!
      : new Date().toISOString().split("T")[0]!,
    duration: 45,
    isFixed: false,
    isAllDay: true,
    subject: item.studiewijzer.lesgroep?.vak.naam.toLowerCase() || undefined,
    type: isExam ? "exam" : "homework",
    priority: isExam ? "high" : "medium",
    energyRequirement: item.studiewijzer.lesgroep?.vak.naam
      ? getEnergyForSubject(item.studiewijzer.lesgroep.vak.naam)
      : "medium",
    completed: false,
    status: "todo",
    createdAt: now,
    updatedAt: now,
    source: "import",
  };
}

export const somtodayService = new SomtodayService();
export const getSomtodayService = () => somtodayService;
