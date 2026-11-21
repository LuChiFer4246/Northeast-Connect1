import type { TriageRequest, TriageResponse } from '../types';

/** Verified North East India emergency helpline numbers accepted by SOS triage. */
export const VERIFIED_HELPLINE_NUMBERS = ['1070', '1079', '1077', '108', '112'] as const;

/** Union of verified emergency helpline numbers. */
export type VerifiedHelplineNumber = (typeof VERIFIED_HELPLINE_NUMBERS)[number];

const VERIFIED_HELPLINE_SET: ReadonlySet<string> = new Set(VERIFIED_HELPLINE_NUMBERS);

/** Result returned by {@link validateTriageMessage}. */
export interface TriageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that an incoming SOS description has enough detail for triage.
 * Rejects empty, whitespace-only, or overly short (< 5 characters) messages.
 */
export function validateTriageMessage(message: string): TriageValidationResult {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Please describe your emergency situation before generating an SOS.',
    };
  }
  if (trimmed.length < 5) {
    return {
      valid: false,
      error: 'Please add a few more words (what happened and who needs help).',
    };
  }
  return { valid: true };
}

/**
 * Formats latitude and longitude into a fixed 4-decimal coordinate string,
 * or returns `null` when either value is missing or non-finite.
 */
export function formatCoordinates(lat?: number | null, lng?: number | null): string | null {
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
  return null;
}

/**
 * Builds a WhatsApp deep-link URL with the SOS message safely URI-encoded.
 */
export function buildWhatsAppShareUrl(sosMessage: string): string {
  return `https://wa.me/?text=${encodeURIComponent(sosMessage)}`;
}

/**
 * Checks whether a value matches one of the verified North East emergency helplines.
 */
export function isValidHelpline(helpline: unknown): helpline is VerifiedHelplineNumber {
  return typeof helpline === 'string' && VERIFIED_HELPLINE_SET.has(helpline);
}

/**
 * Returns the helpline number if verified, otherwise falls back to the
 * national integrated emergency helpline (`112`).
 */
export function sanitizeHelpline(helpline: unknown): VerifiedHelplineNumber {
  return isValidHelpline(helpline) ? helpline : '112';
}

/**
 * Determines whether the server should bypass Gemini and use offline triage rules
 * because the API key is missing, blank, or still set to the example placeholder.
 */
export function shouldUseOfflineTriageFallback(apiKey?: string | null): boolean {
  const trimmed = typeof apiKey === 'string' ? apiKey.trim() : '';
  return !trimmed || trimmed === 'MY_GEMINI_API_KEY';
}

/**
 * Normalizes and validates an untrusted JSON payload returned by Gemini triage,
 * safely sanitizing invalid helplines and backfilling missing fields from offline triage.
 */
export function normalizeAiTriagePayload(
  rawPayload: unknown,
  req: TriageRequest,
  getHelplineLabel: (number: string) => string
): TriageResponse {
  const fallback = runOfflineTriage(req);
  const parsed =
    rawPayload !== null && typeof rawPayload === 'object'
      ? (rawPayload as Record<string, unknown>)
      : {};

  const helpline = sanitizeHelpline(parsed.recommendedHelpline);

  const stepsArray: string[] = Array.isArray(parsed.immediateSteps)
    ? parsed.immediateSteps
        .filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
        .map((s) => s.trim())
        .slice(0, 3)
    : [];

  while (stepsArray.length < 3) {
    stepsArray.push(fallback.immediateSteps[stepsArray.length]);
  }

  const urgency: TriageResponse['urgency'] =
    parsed.urgency === 'Critical' ||
    parsed.urgency === 'High' ||
    parsed.urgency === 'Moderate'
      ? parsed.urgency
      : fallback.urgency;

  const category: TriageResponse['category'] =
    parsed.category === 'Flood' ||
    parsed.category === 'Landslide' ||
    parsed.category === 'Medical' ||
    parsed.category === 'Fire/Rescue'
      ? parsed.category
      : fallback.category;

  const sosMessage =
    typeof parsed.sosMessage === 'string' && parsed.sosMessage.trim().length > 10
      ? parsed.sosMessage.trim()
      : fallback.sosMessage;

  return {
    urgency,
    category,
    recommendedHelpline: helpline,
    recommendedHelplineLabel: getHelplineLabel(helpline),
    immediateSteps: [stepsArray[0], stepsArray[1], stepsArray[2]],
    sosMessage,
    source: 'gemini',
  };
}

/**
 * Smart deterministic keyword-based SOS Triage fallback.
 * Runs both server-side (if Gemini API is unavailable) and client-side (if user is offline).
 */
export function runOfflineTriage(req: TriageRequest): TriageResponse {
  const raw = req.message.trim();
  const lower = raw.toLowerCase();

  const medicalKeywords = [
    'insulin',
    'ambulance',
    'hospital',
    'bleeding',
    'injured',
    'injury',
    'unconscious',
    'heart',
    'breathing',
    'asthma',
    'pregnant',
    'delivery',
    'snake',
    'bite',
    'medicine',
    'diabetic',
    'diabetes',
    'elderly',
    'oxygen',
    'chest pain',
    'fever',
    'doctor',
  ];

  const floodKeywords = [
    'flood',
    'water',
    'river',
    'drown',
    'submerged',
    'boat',
    'embankment',
    'brahmaputra',
    'barak',
    'ground floor',
    'rising',
    'inundated',
    'rain',
  ];

  const landslideKeywords = [
    'landslide',
    'mudslide',
    'rockfall',
    'boulder',
    'hill',
    'slope',
    'blocked road',
    'road blocked',
    'buried',
    'debris',
    'nh-27',
    'nh-6',
    'haflong',
    'collapse',
  ];

  const fireRescueKeywords = [
    'fire',
    'burn',
    'smoke',
    'gas leak',
    'cylinder',
    'trapped',
    'earthquake',
    'building collapse',
    'electric',
    'short circuit',
    'stuck',
    'rescue',
  ];

  const criticalKeywords = [
    'insulin',
    'unconscious',
    'bleeding',
    'drown',
    'trapped',
    'buried',
    'fire',
    'snake',
    'heart',
    'breathing',
    'pregnant',
    'elderly',
    'infant',
    'baby',
    'ground floor',
    'roof',
    'chest pain',
    'urgent',
    'immediately',
    'dying',
    'collapsed',
  ];

  const moderateKeywords = [
    'ration',
    'food',
    'water supply',
    'power cut',
    'network',
    'shelter info',
    'check',
    'minor',
    'delayed',
  ];

  const hasAny = (list: string[]) => list.some((kw) => lower.includes(kw));

  const isMedical = hasAny(medicalKeywords);
  const isFlood = hasAny(floodKeywords);
  const isLandslide = hasAny(landslideKeywords);
  const isFireRescue = hasAny(fireRescueKeywords);

  const explicitFireKeywords = ['fire', 'burn', 'smoke', 'gas leak', 'cylinder', 'short circuit'];
  const isExplicitFire = hasAny(explicitFireKeywords);

  let category: TriageResponse['category'] = 'Flood';
  if (isExplicitFire) {
    category = 'Fire/Rescue';
  } else if (
    isMedical &&
    (!isFlood ||
      lower.includes('insulin') ||
      lower.includes('bleeding') ||
      lower.includes('ambulance') ||
      lower.includes('unconscious') ||
      lower.includes('snake'))
  ) {
    category = 'Medical';
  } else if (isLandslide) {
    category = 'Landslide';
  } else if (isFlood) {
    category = 'Flood';
  } else if (isFireRescue) {
    category = 'Fire/Rescue';
  } else if (isMedical) {
    category = 'Medical';
  }

  let urgency: TriageResponse['urgency'] = 'High';
  if (hasAny(criticalKeywords) || (isFlood && isMedical) || (isLandslide && lower.includes('trapped'))) {
    urgency = 'Critical';
  } else if (hasAny(moderateKeywords) && !isMedical && !isFireRescue) {
    urgency = 'Moderate';
  }

  let recommendedHelpline: VerifiedHelplineNumber = '112';
  let recommendedHelplineLabel = 'National Integrated Emergency (Police, Fire, Rescue)';
  let immediateSteps: [string, string, string];

  if (category === 'Medical') {
    recommendedHelpline = '108';
    recommendedHelplineLabel = 'Medical Emergency / Ambulance (108)';
    immediateSteps = isFlood
      ? [
          'Move the patient and essential medicines to the highest dry floor immediately.',
          'Call 108 for emergency medical help and 1079 if boat evacuation is required.',
          'Keep patient warm, hydrated with clean water, and ready with ID & prescriptions.',
        ]
      : [
          'Call 108 immediately and share your exact landmark or GPS coordinates.',
          'Keep the patient calm, seated or lying safely, and do not give food/water if unconscious.',
          'Keep existing prescriptions, medicines, and a flashlight ready for responders.',
        ];
  } else if (category === 'Flood') {
    recommendedHelpline = '1079';
    recommendedHelplineLabel = 'ASDMA Disaster Management Helpline (1079)';
    immediateSteps = [
      'Switch off the main electrical MCB and move everyone to upper floors or higher ground.',
      'Do not wade through moving floodwater; stay visible with a torch or bright cloth.',
      'Call 1079 (ASDMA) or 1070 (SEOC) and send the SOS message below to family and rescuers.',
    ];
  } else if (category === 'Landslide') {
    recommendedHelpline = '1070';
    recommendedHelplineLabel = 'State Emergency Operation Centre (1070)';
    immediateSteps = [
      'Move sideways and away from steep slopes, wet embankments, and falling debris immediately.',
      'Do not attempt to cross the slide zone—secondary rockfalls often follow.',
      'Call 1070 or 1077 (DEOC) to report the blockage and request safe evacuation guidance.',
    ];
  } else {
    recommendedHelpline = '112';
    recommendedHelplineLabel = 'National Integrated Emergency (112)';
    immediateSteps = [
      'Move to an open, safe area away from smoke, fire, damaged walls, or live wires.',
      'Stay low if there is smoke and cover nose/mouth with a wet cloth.',
      'Call 112 immediately and share your exact location with rescuers.',
    ];
  }

  const coords = formatCoordinates(req.lat, req.lng);
  const locationPart = [req.locationLabel?.trim(), coords ? `GPS: ${coords}` : null]
    .filter(Boolean)
    .join(' | ');
  const summarySnippet = raw.length > 120 ? `${raw.slice(0, 117).trim()}...` : raw;

  const sosMessage = [
    `SOS [${urgency.toUpperCase()} - ${category}]`,
    `Need: ${summarySnippet}`,
    locationPart ? `Location: ${locationPart}` : 'Location: North East India (share landmark)',
    `Helpline: ${recommendedHelpline} | Sent via Northeast Emergency Assistant`,
  ].join('\n');

  return {
    urgency,
    category,
    recommendedHelpline,
    recommendedHelplineLabel,
    immediateSteps,
    sosMessage,
    source: 'offline-fallback',
  };
}
