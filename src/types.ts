export type Language = 'en' | 'as' | 'hi';

export type IncidentCategory =
  | 'flood'
  | 'landslide'
  | 'relief_camp'
  | 'hospital';

export type ReportCategory =
  | 'flood'
  | 'landslide'
  | 'blocked_road'
  | 'relief_need';

export type SeverityLevel = 'Critical' | 'High' | 'Moderate' | 'Safe';

export type ActiveTab = 'map' | 'triage' | 'report' | 'guide';

export interface LocalizedText {
  en: string;
  as: string;
  hi: string;
}

export interface HelplineItem {
  number: string;
  shortLabel: LocalizedText;
  fullName: LocalizedText;
  description: LocalizedText;
  category: 'state' | 'disaster' | 'district' | 'medical' | 'national';
}

export interface Incident {
  id: string;
  title: string;
  category: IncidentCategory;
  reportType?: ReportCategory;
  severity: SeverityLevel;
  locationName: string;
  state: string;
  lat: number;
  lng: number;
  description: string;
  timestamp: string;
  capacity?: string;
  availableBedsOrSpots?: string;
  contactNumber?: string;
  verified: boolean;
  reportedByCommunity?: boolean;
  offlinePending?: boolean;
}

export interface NECity {
  name: string;
  state: string;
  lat: number;
  lng: number;
}

export interface TriageRequest {
  message: string;
  lat?: number | null;
  lng?: number | null;
  locationLabel?: string;
}

export interface TriageResponse {
  urgency: 'Critical' | 'High' | 'Moderate';
  category: 'Flood' | 'Landslide' | 'Medical' | 'Fire/Rescue';
  recommendedHelpline: string;
  recommendedHelplineLabel: string;
  immediateSteps: [string, string, string];
  sosMessage: string;
  source: 'gemini' | 'offline-fallback';
  note?: string;
}

export interface SurvivalGuideSection {
  id: 'flood' | 'landslide' | 'earthquake';
  title: LocalizedText;
  subtitle: LocalizedText;
  dos: LocalizedText[];
  donts: LocalizedText[];
}

export interface GoBagItem {
  id: string;
  label: LocalizedText;
  category: 'documents' | 'medical' | 'water_food' | 'gear';
}
