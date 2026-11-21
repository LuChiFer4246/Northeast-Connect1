import 'dotenv/config';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { INITIAL_INCIDENTS, VERIFIED_HELPLINES } from './src/data/neData.ts';
import type { Incident, ReportCategory, SeverityLevel } from './src/types.ts';
import {
  isValidNorthEastCoordinates,
  mapReportTypeToMapCategory,
  validateIncidentInput,
} from './src/utils/incidentLogic.ts';
import {
  formatCoordinates,
  normalizeAiTriagePayload,
  runOfflineTriage,
  shouldUseOfflineTriageFallback,
  validateTriageMessage,
} from './src/utils/triageLogic.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// In-memory incident store pre-populated with realistic North East India data
const incidentsStore: Incident[] = [...INITIAL_INCIDENTS];

/**
 * Lazily creates a Gemini API client when a valid `GEMINI_API_KEY` is configured.
 * Returns `null` when offline or unconfigured so routes cleanly use fallback triage.
 */
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (shouldUseOfflineTriageFallback(apiKey) || !apiKey) {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('[Gemini] Failed to initialize client, using offline fallback:', err);
    return null;
  }
}

/**
 * Resolves a human-readable English display label for a verified emergency helpline number.
 */
function getHelplineLabel(number: string): string {
  const found = VERIFIED_HELPLINES.find((h) => h.number === number);
  return found ? `${found.fullName.en} (${found.number})` : `Emergency Helpline (${number})`;
}

/**
 * Handles `GET /api/health` readiness probes with service status and incident count.
 */
function handleHealthCheck(_req: Request, res: Response): void {
  res.json({
    status: 'ok',
    service: 'northeast-connect',
    incidentsCount: incidentsStore.length,
  });
}

/**
 * Handles `GET /api/incidents`, returning all active incidents sorted newest first.
 */
function handleGetIncidents(_req: Request, res: Response): void {
  const sorted = [...incidentsStore].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  res.json({ incidents: sorted });
}

/**
 * Handles `POST /api/incidents`, validating coordinates and fields before storing
 * a new community-reported incident in memory.
 */
function handleCreateIncident(req: Request, res: Response): Response {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const locationName = typeof body.locationName === 'string' ? body.locationName.trim() : '';
  const state = typeof body.state === 'string' && body.state.trim() ? body.state.trim() : 'Assam';

  const allowedReportTypes: ReportCategory[] = [
    'flood',
    'landslide',
    'blocked_road',
    'relief_need',
  ];
  const reportType: ReportCategory =
    typeof body.reportType === 'string' &&
    allowedReportTypes.includes(body.reportType as ReportCategory)
      ? (body.reportType as ReportCategory)
      : 'flood';

  const allowedSeverities: SeverityLevel[] = ['Critical', 'High', 'Moderate', 'Safe'];
  const severity: SeverityLevel =
    typeof body.severity === 'string' &&
    allowedSeverities.includes(body.severity as SeverityLevel)
      ? (body.severity as SeverityLevel)
      : 'High';

  const lat = Number(body.lat);
  const lng = Number(body.lng);

  if (!isValidNorthEastCoordinates(lat, lng)) {
    return res.status(400).json({
      error: 'Please provide valid North East India coordinates.',
    });
  }

  const validation = validateIncidentInput({
    title,
    reportType,
    severity,
    locationName,
    state,
    lat,
    lng,
    description,
  });

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: validation.errors,
    });
  }

  const newIncident: Incident = {
    id: `inc-community-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    category: mapReportTypeToMapCategory(reportType),
    reportType,
    severity,
    locationName,
    state,
    lat,
    lng,
    description,
    timestamp: new Date().toISOString(),
    contactNumber: reportType === 'flood' ? '1079' : reportType === 'relief_need' ? '1077' : '1070',
    verified: false,
    reportedByCommunity: true,
  };

  incidentsStore.unshift(newIncident);
  return res.status(201).json({ incident: newIncident });
}

/**
 * Handles `POST /api/triage`, invoking Gemini structured triage with a 15-second timeout
 * and automatic deterministic offline fallback when unconfigured or unreachable.
 */
async function handleSosTriage(req: Request, res: Response): Promise<Response> {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const lat = typeof body.lat === 'number' && Number.isFinite(body.lat) ? body.lat : null;
  const lng = typeof body.lng === 'number' && Number.isFinite(body.lng) ? body.lng : null;
  const locationLabel = typeof body.locationLabel === 'string' ? body.locationLabel.trim() : '';

  const validation = validateTriageMessage(message);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const ai = getGeminiClient();
  if (!ai) {
    const fallback = runOfflineTriage({ message, lat, lng, locationLabel });
    return res.json({
      ...fallback,
      note: 'Generated using instant Offline Smart Triage rules.',
    });
  }

  const coords = formatCoordinates(lat, lng);
  const locationContext = [locationLabel, coords ? `GPS ${coords}` : null]
    .filter(Boolean)
    .join(' | ');

  try {
    const geminiPromise = ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: `Emergency report from North East India:\nMessage: "${message}"\nLocation: ${
        locationContext || 'Not provided'
      }`,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
        systemInstruction:
          'You are Northeast Emergency Assistant SOS Triage for North East India (Assam, Meghalaya, Arunachal Pradesh, Manipur, Mizoram, Nagaland, Tripura, Sikkim). ' +
          'Analyze the stressed user message calmly and return valid JSON only. ' +
          'Choose urgency from "Critical", "High", "Moderate". ' +
          'Choose category from "Flood", "Landslide", "Medical", "Fire/Rescue". ' +
          'Choose recommendedHelpline STRICTLY from one of: "1070" (SEOC State Emergency), "1079" (ASDMA Flood/Disaster), "1077" (DEOC District), "108" (Medical/Ambulance), "112" (National Police/Fire/Rescue). ' +
          'Provide exactly 3 short, calm, plain-English immediateSteps readable by elderly users under stress. ' +
          'Write a compact SMS/WhatsApp-ready sosMessage (under 260 characters) containing urgency, need, and GPS coordinates if available.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            urgency: {
              type: Type.STRING,
              enum: ['Critical', 'High', 'Moderate'],
            },
            category: {
              type: Type.STRING,
              enum: ['Flood', 'Landslide', 'Medical', 'Fire/Rescue'],
            },
            recommendedHelpline: {
              type: Type.STRING,
              enum: ['1070', '1079', '1077', '108', '112'],
            },
            immediateSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            sosMessage: {
              type: Type.STRING,
            },
          },
          required: [
            'urgency',
            'category',
            'recommendedHelpline',
            'immediateSteps',
            'sosMessage',
          ],
        },
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini triage timeout after 15s')), 15000)
    );

    const response = await Promise.race([geminiPromise, timeoutPromise]);

    const rawText = (response.text ?? '').trim();
    const parsed: unknown = JSON.parse(rawText);
    const result = normalizeAiTriagePayload(
      parsed,
      { message, lat, lng, locationLabel },
      getHelplineLabel
    );

    return res.json(result);
  } catch (err) {
    console.error('[POST /api/triage] Gemini API unavailable, using offline fallback:', err);
    const fallback = runOfflineTriage({ message, lat, lng, locationLabel });
    return res.json({
      ...fallback,
      note: 'AI service temporarily unreachable — instant Smart Triage fallback activated.',
    });
  }
}

/**
 * Boots the Express server, mounts API routes and either Vite dev middleware
 * or static production assets, and starts listening on `0.0.0.0:${PORT}`.
 */
async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', handleHealthCheck);
  app.get('/api/incidents', handleGetIncidents);
  app.post('/api/incidents', handleCreateIncident);
  app.post('/api/triage', handleSosTriage);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Bridge Connect.Server middleware into Express with explicit types
    app.use((req: Request, res: Response, next: NextFunction) => {
      vite.middlewares(req, res, next);
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const indexHtmlPath = path.join(distPath, 'index.html');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      if (fs.existsSync(indexHtmlPath)) {
        res.sendFile(indexHtmlPath);
      } else {
        res
          .status(503)
          .send('Frontend build not found. Run npm run build before starting in production.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.info(
      `Northeast Emergency Assistant server listening on http://0.0.0.0:${PORT} (mode=${
        isProduction ? 'production' : 'development'
      }, gemini=${Boolean(getGeminiClient()) ? 'enabled' : 'offline-fallback'})`
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start Northeast Emergency Assistant server:', err);
  process.exit(1);
});
