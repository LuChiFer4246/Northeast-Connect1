import type { Incident, IncidentCategory, ReportCategory, SeverityLevel } from '../types';

/** Filter categories supported by the map and offline incident list. */
export type MapFilterCategory = 'all' | IncidentCategory;

/** Input payload for validating and submitting a community incident report. */
export interface IncidentFormInput {
  title: string;
  reportType: ReportCategory;
  severity: SeverityLevel;
  locationName: string;
  state: string;
  lat: number;
  lng: number;
  description: string;
}

/** Field-level validation errors returned by {@link validateIncidentInput}. */
export interface ValidationErrors {
  title?: string;
  locationName?: string;
  description?: string;
}

/**
 * Maps a community report category to its corresponding map pin category.
 */
export function mapReportTypeToMapCategory(reportType: ReportCategory): IncidentCategory {
  switch (reportType) {
    case 'flood':
      return 'flood';
    case 'landslide':
    case 'blocked_road':
      return 'landslide';
    case 'relief_need':
      return 'relief_camp';
  }
}

/**
 * Verifies that latitude and longitude are finite numbers within the
 * North East India geographic bounding box (`lat: 20..30`, `lng: 87..98`).
 */
export function isValidNorthEastCoordinates(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 20 &&
    lat <= 30 &&
    lng >= 87 &&
    lng <= 98
  );
}

/**
 * Validates required title, location, and description fields for a community incident report.
 */
export function validateIncidentInput(input: IncidentFormInput): {
  valid: boolean;
  errors: ValidationErrors;
} {
  const errors: ValidationErrors = {};

  if (!input.title.trim() || input.title.trim().length < 4) {
    errors.title = 'Please enter a short, clear title (at least 4 characters).';
  }

  if (!input.locationName.trim()) {
    errors.locationName = 'Please select a North East location or capture GPS.';
  }

  if (!input.description.trim() || input.description.trim().length < 10) {
    errors.description = 'Please provide brief helpful details (at least 10 characters).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Filters incidents by map category and free-text query across title, location,
 * state, and description, returning results sorted newest first.
 */
export function filterIncidents(
  incidents: Incident[],
  category: MapFilterCategory,
  searchQuery = ''
): Incident[] {
  const q = searchQuery.trim().toLowerCase();

  return incidents
    .filter((item) => {
      if (category !== 'all' && item.category !== category) {
        return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.locationName.toLowerCase().includes(q) ||
        item.state.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Tallies total and per-category incident counts for the map filter bar.
 */
export function countIncidentsByCategory(
  incidents: Incident[]
): Record<MapFilterCategory, number> {
  const counts: Record<MapFilterCategory, number> = {
    all: incidents.length,
    flood: 0,
    landslide: 0,
    relief_camp: 0,
    hospital: 0,
  };

  for (const item of incidents) {
    counts[item.category] = (counts[item.category] ?? 0) + 1;
  }

  return counts;
}

/**
 * Calculates deduplicated, clamped Emergency Go-Bag checklist completion metrics.
 */
export function calculateGoBagProgress(
  checkedIds: string[],
  totalItems: number
): { checkedCount: number; totalCount: number; percent: number } {
  const safeTotal = Math.max(0, totalItems);
  const uniqueChecked = new Set(checkedIds).size;
  const clamped = Math.min(uniqueChecked, safeTotal);
  const percent = safeTotal === 0 ? 0 : Math.round((clamped / safeTotal) * 100);
  return { checkedCount: clamped, totalCount: safeTotal, percent };
}

/**
 * Formats an ISO timestamp into a compact `en-IN` display string,
 * falling back to `'Just now'` if the timestamp cannot be parsed.
 */
export function formatRelativeTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
