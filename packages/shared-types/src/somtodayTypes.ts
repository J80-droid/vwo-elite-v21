/**
 * Somtoday API Types
 *
 * TypeScript definitions for Somtoday REST API responses.
 * Based on: https://github.com/elisaado/somtoday-api-docs
 */

// ===== AUTHENTICATION =====

export interface SomtodayTokens {
  access_token: string;
  refresh_token: string;
  somtoday_api_url: string;
  scope: string;
  somtoday_tenant: string;
  id_token: string;
  token_type: "Bearer";
  expires_in: number;
  // Computed field
  expires_at?: number;
}

export interface SomtodayOAuthState {
  codeVerifier: string;
  state: string;
  schoolUuid: string;
}

// ===== SCHOOL / ORGANIZATION =====

export interface SomtodaySchool {
  uuid: string;
  naam: string;
  plaats: string;
  oidcurls?: SomtodayOidcUrl[];
}

export interface SomtodayOidcUrl {
  omschrijving: string;
  url: string;
  domain_hint: string;
}

export interface SomtodayOrganisatiesResponse {
  instellingen: SomtodaySchool[];
}

// ===== STUDENT =====

export interface SomtodayLeerling {
  links: SomtodayLink[];
  permissions: SomtodayPermission[];
  additionalObjects: Record<string, unknown>;
  UUID: string;
  leerlingnummer: number;
  roepnaam: string;
  achternaam: string;
  email?: string;
  mobielNummer?: string;
  geboortedatum?: string;
}

export interface SomtodayLink {
  id: number;
  rel: string;
  type: string;
  href: string;
}

export interface SomtodayPermission {
  full: string;
  type: string;
  operations: string[];
  instances: string[];
}

// ===== SCHEDULE / APPOINTMENTS =====

export interface SomtodayAfspraak {
  $type: "participatie.RAfspraak";
  links: SomtodayLink[];
  permissions: SomtodayPermission[];
  additionalObjects: {
    vak?: SomtodayVak;
    docentAfkortingen?: string;
    leerlingen?: {
      $type: "LinkableWrapper";
      items: SomtodayLeerling[];
    };
  };
  afspraakType: SomtodayAfspraakType;
  locatie?: string;
  beginDatumTijd: string; // ISO datetime e.g. "2020-05-04T11:15:00.000+02:00"
  eindDatumTijd: string;
  beginLesuur?: number;
  eindLesuur?: number;
  titel: string;
  omschrijving?: string;
  presentieRegistratieVerplicht: boolean;
  presentieRegistratieVerwerkt: boolean;
  afspraakStatus: "ACTIEF" | "GEANNULEERD" | "VERPLAATST";
  vestiging: SomtodayVestiging;
}

export interface SomtodayAfspraakType {
  links: SomtodayLink[];
  permissions: SomtodayPermission[];
  additionalObjects: Record<string, unknown>;
  naam: string;
  omschrijving: string;
  standaardKleur: number;
  categorie: "Rooster" | "Toets" | "Activiteit" | string;
  activiteit: string;
  percentageIIVO: number;
  presentieRegistratieDefault: boolean;
  actief: boolean;
  vestiging: SomtodayVestiging;
}

export interface SomtodayVestiging {
  $type: "instelling.RVestiging";
  links: SomtodayLink[];
  permissions: SomtodayPermission[];
  additionalObjects: Record<string, unknown>;
  naam: string;
}

export interface SomtodayVak {
  $type: "onderwijsinrichting.RVak";
  links: SomtodayLink[];
  permissions: SomtodayPermission[];
  additionalObjects: Record<string, unknown>;
  afkorting: string;
  naam: string;
}

export interface SomtodayAfsprakenResponse {
  items: SomtodayAfspraak[];
}

export interface SomtodayResultatenResponse {
  items: SomtodayResultaat[];
}

// ===== GRADES =====

export interface SomtodayResultaat {
  $type: "resultaten.RResultaat";
  links: SomtodayLink[];
  permissions: SomtodayPermission[];
  additionalObjects: Record<string, unknown>;
  hpiType: string;
  vak: SomtodayVak;
  leerjaar: number;
  periode: number;
  examenWeging?: number;
  isExamendossierResultaat: boolean;
  isVopiDossier: boolean;
  datumInvoer: string;
  resultaat?: string; // Could be number as string or "V"/"O"
  resultaatLabel?: string;
  resultaatLabelAfkorting?: string;
  geldendResultaat?: string;
  weging: number;
  omschrijving?: string;
  type: "Toetskolom" | "RapportCijfer" | string;
  toetssoort?: string;
}

export interface SomtodayResultatenResponse {
  items: SomtodayResultaat[];
}

// ===== HOMEWORK / STUDY GUIDES =====

export interface SomtodayStudiewijzer {
  $type: "studiewijzer.RStudiewijzer";
  links: SomtodayLink[];
  permissions: SomtodayPermission[];
  additionalObjects: Record<string, unknown>;
  uuid: string;
  naam: string;
  vestiging: SomtodayVestiging;
  lesgroep?: {
    naam: string;
    vak: SomtodayVak;
  };
}

export interface SomtodayStudiewijzerItem {
  $type: string;
  links: SomtodayLink[];
  permissions: SomtodayPermission[];
  additionalObjects: Record<string, unknown>;
  studiewijzer: SomtodayStudiewijzer;
  onderwerp?: string;
  huiswerkType?: "HUISWERK" | "TOETS" | "GROTE_TOETS" | "INFORMATIE";
  omschrijving?: string;
  inleverperiodes?: unknown;
  lesmateriaal?: unknown;
  projectgroepen?: unknown;
  bijpielen?: unknown;
  externeMaterialen?: unknown;
  ingeleverdeLeerlingBijlagen?: unknown;
  tpieBijlagen?: unknown;
  tpieBijlagenZichtbaar?: boolean;
  datumTijd?: string;
}

// ===== ABSENCE / ATTENDANCE =====

export interface SomtodayAbsentie {
  $type: "participatie.RAbsentie";
  links: SomtodayLink[];
  permissions: SomtodayPermission[];
  additionalObjects: Record<string, unknown>;
  afspraak?: SomtodayAfspraak;
  datum: string;
  beginLesuur?: number;
  eindLesuur?: number;
  geoorloofd: boolean;
  absentieType: {
    naam: string;
    omschrijving: string;
    afkorting: string;
  };
  opmerking?: string;
}

export interface SomtodayAbsentieResponse {
  items: SomtodayAbsentie[];
}

// ===== MESSAGES =====

export interface SomtodayBericht {
  $type: "berichten.RBericht";
  links: SomtodayLink[];
  permissions: SomtodayPermission[];
  additionalObjects: Record<string, unknown>;
  onderwerp: string;
  tekst: string;
  verzondenOp: string;
  verzender: {
    naam: string;
    id: number;
  };
  ontvangers: {
    naam: string;
    id: number;
  }[];
  gelezen: boolean;
}

export interface SomtodayBerichtenResponse {
  items: SomtodayBericht[];
}

// ===== LESSON GROUPS =====

export interface SomtodayLesgroep {
  $type: "onderwijsinrichting.RLesgroep";
  links: SomtodayLink[];
  permissions: SomtodayPermission[];
  additionalObjects: Record<string, unknown>;
  naam: string;
  vak: SomtodayVak;
}

export interface SomtodayLesgroepResponse {
  items: SomtodayLesgroep[];
}

// ===== HOLIDAYS =====

export interface SomtodayVakantie {
  $type: "participatie.RVakantie";
  links: SomtodayLink[];
  permissions: SomtodayPermission[];
  naam: string;
  beginDatum: string;
  eindDatum: string;
}

export interface SomtodayVakantieResponse {
  items: SomtodayVakantie[];
}

// ===== SCHOOL DETAILS / MENTOR =====

export interface SomtodaySchoolDetails {
  $type: "leerling.RLeerlingSchoolgegevens";
  instellingsnaam: string;
  vestigingsnaam: string;
  leerjaar: number;
  mentoren: string[];
}

// ===== STORED STATE =====

export interface SomtodayStoredAuth {
  tokens: SomtodayTokens;
  student: SomtodayLeerling;
  school: SomtodaySchool;
  lastSync?: string;
}

// ===== SERVICE CONFIG =====

// ===== CONFIGURATION =====

export const SOMTODAY_CONFIG = {
  // We gebruiken de officiële native app ID
  CLIENT_ID: "somtoday-leerling-native",

  // We proberen localhost.
  // Als dit een "Callback URL mismatch" geeft, is er een strengere blokkade.
  REDIRECT_URI: "http://localhost:3000/callback",

  OAUTH_AUTHORIZE: "https://somtoday.nl/oauth2/authorize",
  OAUTH_TOKEN: "https://somtoday.nl/oauth2/token",

  API_BASE: "https://api.somtoday.nl",

  // LocalStorage Keys
  STORAGE_KEY_AUTH: "somtoday_auth_v2",
  STORAGE_KEY_OAUTH_STATE: "somtoday_oauth_state",
  STORAGE_KEY_GRADES: "somtoday_grades_cache",
  STORAGE_KEY_SCHEDULE: "somtoday_schedule_cache",
  STORAGE_KEY_USER_DATA: "somtoday_user_data_cache",
} as const;
