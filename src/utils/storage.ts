import {
  GO_BAG_ITEMS,
  INITIAL_INCIDENTS,
  SURVIVAL_GUIDES,
  VERIFIED_HELPLINES,
} from '../data/neData';
import type { Incident, Language } from '../types';

const KEYS = {
  INCIDENTS: 'ne_connect_incidents_v1',
  HELPLINES: 'ne_connect_helplines_v1',
  SURVIVAL_GUIDES: 'ne_connect_guides_v1',
  GO_BAG_CHECKED: 'ne_connect_gobag_checked_v1',
  ELDERLY_MODE: 'ne_connect_elderly_mode_v1',
  LANGUAGE: 'ne_connect_language_v1',
  LAST_SYNC: 'ne_connect_last_sync_v1',
} as const;

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

/**
 * Cache essential emergency directories into localStorage immediately on first load
 * so offline mode always has complete helplines, guides, and relief camps.
 */
export function primeOfflineCache(): void {
  safeSet(KEYS.HELPLINES, VERIFIED_HELPLINES);
  safeSet(KEYS.SURVIVAL_GUIDES, SURVIVAL_GUIDES);
  const existingIncidents = safeGet<Incident[] | null>(KEYS.INCIDENTS, null);
  if (!existingIncidents || existingIncidents.length === 0) {
    safeSet(KEYS.INCIDENTS, INITIAL_INCIDENTS);
  }
  safeSet(KEYS.LAST_SYNC, new Date().toISOString());
}

export function loadCachedIncidents(): Incident[] {
  const cached = safeGet<Incident[]>(KEYS.INCIDENTS, INITIAL_INCIDENTS);
  return cached.length > 0 ? cached : INITIAL_INCIDENTS;
}

export function saveCachedIncidents(incidents: Incident[]): void {
  safeSet(KEYS.INCIDENTS, incidents);
  safeSet(KEYS.LAST_SYNC, new Date().toISOString());
}

export function loadGoBagChecked(): string[] {
  const validIds = new Set(GO_BAG_ITEMS.map((item) => item.id));
  const stored = safeGet<string[]>(KEYS.GO_BAG_CHECKED, []);
  return stored.filter((id) => validIds.has(id));
}

export function saveGoBagChecked(ids: string[]): void {
  safeSet(KEYS.GO_BAG_CHECKED, ids);
}

export function loadElderlyMode(): boolean {
  return safeGet<boolean>(KEYS.ELDERLY_MODE, false);
}

export function saveElderlyMode(enabled: boolean): void {
  safeSet(KEYS.ELDERLY_MODE, enabled);
}

export function loadLanguage(): Language {
  const lang = safeGet<Language>(KEYS.LANGUAGE, 'en');
  if (lang === 'en' || lang === 'as' || lang === 'hi') return lang;
  return 'en';
}

export function saveLanguage(lang: Language): void {
  safeSet(KEYS.LANGUAGE, lang);
}

export function loadLastSync(): string | null {
  return safeGet<string | null>(KEYS.LAST_SYNC, null);
}
