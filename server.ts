import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { INITIAL_INCIDENTS, VERIFIED_HELPLINES } from './src/data/neData.ts';
import type { Incident, ReportCategory, SeverityLevel, TriageResponse } from './src/types.ts';
import {
  mapReportTypeToMapCategory,
  validateIncidentInput,
} from './src/utils/incidentLogic.ts';
import {
  formatCoordinates,
  runOfflineTriage,
  validateTriageMessage,
} from './src/utils/triageLogic.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// In-memory incident store pre-populated with realistic North East India data
const incidentsStore: Incident[] = [...INITIAL_INCIDENTS];

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
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

function getHelplineLabel(number: string): string {
  const found = VERIFIED_HELPLINES.find((h) => h.number === number);
  return found ? `${found.fullName.en} (${found.number})` : `Emergency Helpline (${number})`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'northeast-connect',
      incidentsCount: incidentsStore.length,
    });
  });

  app.get('/api/incidents', (_req, res) => {
    const sorted = [...incidentsStore].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    res.json({ incidents: sorted });
  });

  app.post('/api/incidents', (req, res) => {
    const body = req.body ?? {};
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
    const reportType: ReportCategory = allowedReportTypes.includes(body.reportType)
      ? body.reportType
      : 'flood';

    const allowedSeverities: SeverityLevel[] = ['Critical', 'High', 'Moderate', 'Safe'];
    const severity: SeverityLevel = allowedSeverities.includes(body.severity)
      ? body.severity
      : 'High';

    const lat = Number(body.lat);
    const lng = Number(body.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 20 || lat > 30 || lng < 87 || lng > 98) {
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
  });

  app.post('/api/triage', async (req, res) => {
    const body = req.body ?? {};
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
            'You are Northeast Connect Emergency SOS Triage Assistant for North East India (Assam, Meghalaya, Arunachal Pradesh, Manipur, Mizoram, Nagaland, Tripura, Sikkim). ' +
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
      const parsed = JSON.parse(rawText);

      const validHelplines = new Set(['1070', '1079', '1077', '108', '112']);
      const helpline = validHelplines.has(parsed.recommendedHelpline)
        ? parsed.recommendedHelpline
        : '112';

      const stepsArray: string[] = Array.isArray(parsed.immediateSteps)
        ? parsed.immediateSteps.filter((s: unknown) => typeof s === 'string' && s.trim()).slice(0, 3)
        : [];

      const fallbackForFill = runOfflineTriage({ message, lat, lng, locationLabel });
      while (stepsArray.length < 3) {
        stepsArray.push(fallbackForFill.immediateSteps[stepsArray.length]);
      }

      const result: TriageResponse = {
        urgency:
          parsed.urgency === 'Critical' || parsed.urgency === 'High' || parsed.urgency === 'Moderate'
            ? parsed.urgency
            : fallbackForFill.urgency,
        category:
          parsed.category === 'Flood' ||
          parsed.category === 'Landslide' ||
          parsed.category === 'Medical' ||
          parsed.category === 'Fire/Rescue'
            ? parsed.category
            : fallbackForFill.category,
        recommendedHelpline: helpline,
        recommendedHelplineLabel: getHelplineLabel(helpline),
        immediateSteps: [stepsArray[0], stepsArray[1], stepsArray[2]],
        sosMessage:
          typeof parsed.sosMessage === 'string' && parsed.sosMessage.trim().length > 10
            ? parsed.sosMessage.trim()
            : fallbackForFill.sosMessage,
        source: 'gemini',
      };

      return res.json(result);
    } catch (err) {
      console.error('[POST /api/triage] Gemini API unavailable, using offline fallback:', err);
      const fallback = runOfflineTriage({ message, lat, lng, locationLabel });
      return res.json({
        ...fallback,
        note: 'AI service temporarily unreachable — instant Smart Triage fallback activated.',
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const indexHtmlPath = path.join(distPath, 'index.html');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      if (fs.existsSync(indexHtmlPath)) {
        res.sendFile(indexHtmlPath);
      } else {
        res.status(503).send('Frontend build not found. Run npm run build before starting in production.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Northeast Connect server listening on http://0.0.0.0:${PORT} (mode=${
        isProduction ? 'production' : 'development'
      }, gemini=${Boolean(getGeminiClient()) ? 'enabled' : 'offline-fallback'})`
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start Northeast Connect server:', err);
  process.exit(1);
});
