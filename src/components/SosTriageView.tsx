import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Loader2,
  LocateFixed,
  MessageCircle,
  PhoneCall,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { NE_CITIES } from '../data/neData';
import type { TriageResponse } from '../types';
import {
  buildWhatsAppShareUrl,
  formatCoordinates,
  runOfflineTriage,
  validateTriageMessage,
} from '../utils/triageLogic';

interface SosTriageViewProps {
  isOnline: boolean;
}

const QUICK_SCENARIOS = [
  {
    label: 'Jorhat Flood + Insulin',
    text: 'Water entered ground floor near Jorhat, elderly grandfather needs insulin urgently and road is flooded.',
    city: 'Jorhat',
  },
  {
    label: 'Haflong Road Landslide',
    text: 'Heavy mudslide blocked the road near Haflong, two cars stuck with children and rain is increasing.',
    city: 'Haflong',
  },
  {
    label: 'Silchar Senior Rescue',
    text: 'Flood water rising fast in Silchar house, elderly mother cannot climb stairs, need rescue boat.',
    city: 'Silchar',
  },
];

export const SosTriageView: React.FC<SosTriageViewProps> = ({ isOnline }) => {
  const [message, setMessage] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'found' | 'denied'>('idle');
  const [gpsNote, setGpsNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGetGps = () => {
    setGpsNote('');
    if (!('geolocation' in navigator)) {
      setGpsStatus('denied');
      setGpsNote('GPS is not supported on this browser. Please select your nearest city below.');
      return;
    }

    setGpsStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setGpsStatus('found');
        setGpsNote('GPS coordinates captured and ready to attach to your SOS.');
      },
      () => {
        setGpsStatus('denied');
        setGpsNote(
          'Location permission unavailable. Choose your nearest North East city below instead.'
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleSelectCity = (cityName: string) => {
    const found = NE_CITIES.find((c) => c.name === cityName);
    if (!found) {
      setLocationLabel('');
      return;
    }
    setLocationLabel(`${found.name}, ${found.state}`);
    if (gpsStatus !== 'found') {
      setLat(found.lat);
      setLng(found.lng);
    }
  };

  const handleApplyScenario = (scenario: (typeof QUICK_SCENARIOS)[number]) => {
    setMessage(scenario.text);
    setFormError(null);
    handleSelectCity(scenario.city);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCopied(false);

    const check = validateTriageMessage(message);
    if (!check.valid) {
      setFormError(check.error ?? 'Please describe your emergency.');
      return;
    }

    setIsSubmitting(true);

    // If offline, run local deterministic Smart Triage immediately with zero crash
    if (!isOnline) {
      const offlineResult = runOfflineTriage({ message, lat, lng, locationLabel });
      setResult({
        ...offlineResult,
        note: 'Offline Mode active — generated instantly using on-device Smart Triage.',
      });
      setIsSubmitting(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 18000);

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, lat, lng, locationLabel }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Could not process triage request. Please check your message.');
        setIsSubmitting(false);
        return;
      }

      setResult(data as TriageResponse);
    } catch {
      const fallbackResult = runOfflineTriage({ message, lat, lng, locationLabel });
      setResult({
        ...fallbackResult,
        note: 'Connection interrupted — generated instantly with Offline Smart Triage.',
      });
    } finally {
      window.clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  };

  const handleCopySos = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.sosMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback textarea selection if clipboard permission is restricted
      const el = document.createElement('textarea');
      el.value = result.sosMessage;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    }
  };

  const formattedCoords = formatCoordinates(lat, lng);

  const urgencyStyles: Record<TriageResponse['urgency'], string> = {
    Critical:
      'border-red-300 bg-red-50 text-red-900 dark:border-red-400 dark:bg-black dark:text-red-300',
    High: 'border-amber-300 bg-amber-50 text-amber-950 dark:border-yellow-300 dark:bg-black dark:text-yellow-300',
    Moderate:
      'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-400 dark:bg-black dark:text-emerald-300',
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5 dark:border-neutral-800">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          AI SOS Triage &amp; Emergency Message Generator
        </h1>
        <p className="mt-1.5 max-w-3xl text-base text-slate-600 dark:text-neutral-200">
          Type what is happening in plain words—even if short or rushed. You will immediately get the right helpline, 3 calm safety steps, and a compact SMS/WhatsApp SOS message. Works online and offline.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Emergency Input Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-white dark:bg-black lg:col-span-6"
        >
          <div>
            <span className="block text-sm font-bold text-slate-700 dark:text-neutral-200">
              Quick Example Situations (1-tap fill):
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_SCENARIOS.map((sc) => (
                <button
                  key={sc.label}
                  type="button"
                  onClick={() => handleApplyScenario(sc)}
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-neutral-600 dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-900"
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="sos-message-input"
              className="block text-base font-bold text-slate-900 dark:text-white"
            >
              Describe your emergency situation
            </label>
            <textarea
              id="sos-message-input"
              rows={4}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (formError) setFormError(null);
              }}
              aria-invalid={Boolean(formError)}
              aria-describedby={formError ? 'sos-form-error' : undefined}
              placeholder="Example: Water entered ground floor near Jorhat, elderly grandfather needs insulin..."
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3.5 text-base text-slate-900 placeholder:text-slate-500 dark:border-white dark:bg-black dark:text-white dark:placeholder:text-neutral-400"
            />
            {formError && (
              <p
                id="sos-form-error"
                role="alert"
                className="mt-2 text-sm font-bold text-red-700 dark:text-red-400"
              >
                {formError}
              </p>
            )}
          </div>

          {/* Optional GPS Location + Nearest City Selector */}
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-neutral-700 dark:bg-neutral-950">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Location (Optional — helps rescuers find you faster)
              </span>
              {formattedCoords && (
                <span className="font-mono text-xs font-bold tabular-nums text-emerald-800 dark:text-emerald-300">
                  GPS: {formattedCoords}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleGetGps}
                disabled={gpsStatus === 'locating'}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100 disabled:opacity-60 dark:border-white dark:bg-black dark:text-white"
              >
                {gpsStatus === 'locating' ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <LocateFixed className="h-4 w-4 text-emerald-700 dark:text-yellow-300" aria-hidden="true" />
                )}
                <span>
                  {gpsStatus === 'locating' ? 'Getting GPS...' : 'Get My GPS Location'}
                </span>
              </button>

              <div className="flex-1">
                <label htmlFor="sos-city-select" className="sr-only">
                  Or select nearest North East city
                </label>
                <select
                  id="sos-city-select"
                  value={locationLabel.split(',')[0] || ''}
                  onChange={(e) => handleSelectCity(e.target.value)}
                  className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 dark:border-white dark:bg-black dark:text-white"
                >
                  <option value="">Or choose nearest NE city...</option>
                  {NE_CITIES.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}, {city.state}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {gpsNote && (
              <p className="text-sm font-medium text-slate-700 dark:text-neutral-300">
                {gpsNote}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-base font-extrabold text-white shadow-xs transition-colors hover:bg-red-700 disabled:opacity-70 dark:border-2 dark:border-yellow-300 dark:bg-red-700 dark:text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                <span>Analyzing Emergency &amp; Preparing SOS...</span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" aria-hidden="true" />
                <span>Analyze Situation &amp; Generate SOS</span>
              </>
            )}
          </button>
        </form>

        {/* Right: Triage Result Panel */}
        <section
          aria-label="SOS Triage Guidance Output"
          className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-white dark:bg-black lg:col-span-6"
        >
          {!result && !isSubmitting && (
            <div className="flex h-full flex-col items-start justify-center py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:border dark:border-white dark:bg-black dark:text-yellow-300">
                <ShieldAlert className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-slate-900 dark:text-white">
                Calm, Clear Guidance Appears Here
              </h2>
              <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-neutral-300">
                Enter what is happening on the left or tap a quick example. You will receive:
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm font-medium text-slate-700 dark:text-neutral-200">
                <li>Priority urgency &amp; incident classification</li>
                <li>Direct 1-tap button for the exact North East helpline to call</li>
                <li>3 calm, numbered immediate safety steps</li>
                <li>Ready-to-send SMS &amp; WhatsApp SOS text with GPS coordinates</li>
              </ul>
            </div>
          )}

          {isSubmitting && (
            <div
              role="status"
              className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 text-center"
            >
              <Loader2 className="h-8 w-8 animate-spin text-red-600 dark:text-yellow-300" aria-hidden="true" />
              <p className="text-base font-bold text-slate-900 dark:text-white">
                Preparing calm triage steps and SOS text...
              </p>
            </div>
          )}

          {result && !isSubmitting && (
            <div data-testid="triage-result-card" className="space-y-5">
              {/* Urgency & Category Summary */}
              <div className={`rounded-lg border p-4 ${urgencyStyles[result.urgency]}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-base font-extrabold">
                    <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>
                      Urgency: {result.urgency} · Category: {result.category}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-semibold">
                    {result.source === 'gemini' ? 'AI Triage' : 'Offline Smart Triage'}
                  </span>
                </div>
                {result.note && (
                  <p className="mt-1.5 text-sm font-medium opacity-90">{result.note}</p>
                )}
              </div>

              {/* Direct Recommended Helpline Call CTA */}
              <div className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center dark:border-neutral-700 dark:bg-neutral-950">
                <div>
                  <p className="text-xs font-bold text-slate-600 dark:text-neutral-300">
                    Recommended Verified Helpline
                  </p>
                  <p className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                    {result.recommendedHelplineLabel}
                  </p>
                </div>
                <a
                  href={`tel:${result.recommendedHelpline}`}
                  className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-red-600 px-5 py-2.5 font-mono text-base font-extrabold text-white hover:bg-red-700 dark:border-2 dark:border-yellow-300 dark:bg-black dark:text-yellow-300"
                >
                  <PhoneCall className="h-5 w-5" aria-hidden="true" />
                  <span>Call {result.recommendedHelpline} Now</span>
                </a>
              </div>

              {/* 3 Calm Numbered Immediate Steps */}
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Immediate Steps (Stay Calm)
                </h3>
                <ol className="mt-2.5 space-y-2.5">
                  {result.immediateSteps.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3.5 text-base leading-snug text-slate-900 dark:border-neutral-700 dark:bg-black dark:text-white"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 font-mono text-sm font-bold text-white dark:bg-yellow-300 dark:text-black">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Compact SMS / WhatsApp SOS Message */}
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Ready-to-Send SOS Message (SMS / WhatsApp)
                </h3>
                <pre
                  data-testid="sos-message-preview"
                  className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-300 bg-slate-50 p-4 font-mono text-sm leading-relaxed text-slate-900 dark:border-white dark:bg-neutral-950 dark:text-white"
                >
                  {result.sosMessage}
                </pre>

                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleCopySos}
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 dark:border-yellow-300 dark:bg-yellow-300 dark:text-black"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" aria-hidden="true" />
                        <span>SOS Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        <span>Copy SOS</span>
                      </>
                    )}
                  </button>

                  <a
                    href={buildWhatsAppShareUrl(result.sosMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 dark:border-2 dark:border-emerald-300 dark:bg-black dark:text-emerald-300"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    <span>Share via WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
