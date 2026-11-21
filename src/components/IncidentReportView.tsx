import React, { useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  Send,
} from 'lucide-react';
import { NE_CITIES } from '../data/neData';
import type { Incident, ReportCategory, SeverityLevel } from '../types';
import {
  mapReportTypeToMapCategory,
  validateIncidentInput,
  type ValidationErrors,
} from '../utils/incidentLogic';

interface IncidentReportViewProps {
  isOnline: boolean;
  onIncidentCreated: (incident: Incident) => void;
  onViewOnMap: () => void;
}

const REPORT_TYPES: Array<{ id: ReportCategory; label: string }> = [
  { id: 'flood', label: 'Flood' },
  { id: 'landslide', label: 'Landslide' },
  { id: 'blocked_road', label: 'Blocked Road' },
  { id: 'relief_need', label: 'Relief Need' },
];

const SEVERITIES: Array<{ id: SeverityLevel; label: string }> = [
  { id: 'Critical', label: 'Critical' },
  { id: 'High', label: 'High' },
  { id: 'Moderate', label: 'Moderate' },
];

/**
 * Accessible form enabling residents to report floods, landslides, blocked roads,
 * or relief needs with city presets, live GPS capture, and offline cache fallback.
 */
export const IncidentReportView: React.FC<IncidentReportViewProps> = ({
  isOnline,
  onIncidentCreated,
  onViewOnMap,
}) => {
  const [reportType, setReportType] = useState<ReportCategory>('flood');
  const [title, setTitle] = useState('');
  const [selectedCity, setSelectedCity] = useState(NE_CITIES[0].name);
  const [useCustomGps, setUseCustomGps] = useState(false);
  const [lat, setLat] = useState<number>(NE_CITIES[0].lat);
  const [lng, setLng] = useState<number>(NE_CITIES[0].lng);
  const [stateName, setStateName] = useState<string>(NE_CITIES[0].state);
  const [severity, setSeverity] = useState<SeverityLevel>('High');
  const [description, setDescription] = useState('');

  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'found' | 'error'>('idle');
  const [gpsMessage, setGpsMessage] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(null);

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    setUseCustomGps(false);
    const city = NE_CITIES.find((c) => c.name === cityName);
    if (city) {
      setLat(city.lat);
      setLng(city.lng);
      setStateName(city.state);
    }
  };

  const handleCaptureGps = () => {
    setGpsMessage('');
    if (!('geolocation' in navigator)) {
      setGpsStatus('error');
      setGpsMessage('GPS unavailable on this device. Select your nearest city from the dropdown.');
      return;
    }

    setGpsStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setUseCustomGps(true);
        setGpsStatus('found');
        setGpsMessage(
          `Captured live GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}).`
        );
      },
      () => {
        setGpsStatus('error');
        setGpsMessage('Could not access GPS permission. Using selected NE city coordinates instead.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmittedIncident(null);

    const locationLabel = useCustomGps ? `GPS Near ${selectedCity}` : selectedCity;

    const validation = validateIncidentInput({
      title,
      reportType,
      severity,
      locationName: locationLabel,
      state: stateName,
      lat,
      lng,
      description,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    // Offline fallback: save immediately to local device cache & drop map pin
    if (!isOnline) {
      const localIncident: Incident = {
        id: `inc-offline-${Date.now()}`,
        title: title.trim(),
        category: mapReportTypeToMapCategory(reportType),
        reportType,
        severity,
        locationName: locationLabel,
        state: stateName,
        lat,
        lng,
        description: description.trim(),
        timestamp: new Date().toISOString(),
        contactNumber: reportType === 'flood' ? '1079' : '1070',
        verified: false,
        reportedByCommunity: true,
        offlinePending: true,
      };
      onIncidentCreated(localIncident);
      setSubmittedIncident(localIncident);
      setTitle('');
      setDescription('');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          reportType,
          severity,
          locationName: locationLabel,
          state: stateName,
          lat,
          lng,
          description: description.trim(),
        }),
      });

      const data = (await res.json()) as {
        incident?: Incident;
        error?: string;
        errors?: ValidationErrors;
      };
      if (!res.ok || !data.incident) {
        if (data.errors) setErrors(data.errors);
        setSubmitError(data.error || 'Could not submit report. Please review the form.');
        setIsSubmitting(false);
        return;
      }

      const created = data.incident;
      onIncidentCreated(created);
      setSubmittedIncident(created);
      setTitle('');
      setDescription('');
    } catch {
      const offlineIncident: Incident = {
        id: `inc-offline-${Date.now()}`,
        title: title.trim(),
        category: mapReportTypeToMapCategory(reportType),
        reportType,
        severity,
        locationName: locationLabel,
        state: stateName,
        lat,
        lng,
        description: description.trim(),
        timestamp: new Date().toISOString(),
        contactNumber: reportType === 'flood' ? '1079' : '1070',
        verified: false,
        reportedByCommunity: true,
        offlinePending: true,
      };
      onIncidentCreated(offlineIncident);
      setSubmittedIncident(offlineIncident);
      setTitle('');
      setDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="border-b border-slate-200 pb-5 dark:border-neutral-800">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Live Community Incident Reporter
        </h1>
        <p className="mt-1.5 text-base text-slate-600 dark:text-neutral-200">
          Alert neighbors and relief volunteers about local floods, landslides, blocked roads, or urgent supply needs. Submitted reports drop directly onto the live map and alerts feed.
        </p>
      </div>

      {submittedIncident && (
        <div
          role="status"
          data-testid="report-success-banner"
          className="flex flex-col justify-between gap-4 rounded-xl border border-emerald-300 bg-emerald-50 p-5 sm:flex-row sm:items-center dark:border-emerald-400 dark:bg-black"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
            <div>
              <h2 className="text-base font-bold text-emerald-950 dark:text-emerald-300">
                Incident Added to Live Map &amp; Alerts Feed
              </h2>
              <p className="mt-1 text-sm text-emerald-900 dark:text-neutral-200">
                &ldquo;{submittedIncident.title}&rdquo; ({submittedIncident.locationName}) is now live
                {submittedIncident.offlinePending ? ' in local offline cache.' : '.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onViewOnMap}
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 dark:bg-yellow-300 dark:text-black"
          >
            <MapIcon className="h-4 w-4" aria-hidden="true" />
            <span>View Pin on Map</span>
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-white dark:bg-black"
      >
        {/* Incident Type */}
        <fieldset>
          <legend className="text-base font-bold text-slate-900 dark:text-white">
            1. What are you reporting?
          </legend>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {REPORT_TYPES.map((type) => {
              const active = reportType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setReportType(type.id)}
                  className={`min-h-[48px] rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-yellow-300 dark:bg-yellow-300 dark:text-black'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-neutral-600 dark:bg-black dark:text-white'
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Title */}
        <div>
          <label
            htmlFor="report-title"
            className="block text-base font-bold text-slate-900 dark:text-white"
          >
            2. Short Incident Title
          </label>
          <input
            id="report-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'report-title-error' : undefined}
            placeholder="Example: Waterlogging on Dibrugarh Mancotta Road"
            className="mt-2 min-h-[48px] w-full rounded-lg border border-slate-300 bg-white px-3.5 text-base text-slate-900 placeholder:text-slate-500 dark:border-white dark:bg-black dark:text-white dark:placeholder:text-neutral-400"
          />
          {errors.title && (
            <p
              id="report-title-error"
              role="alert"
              className="mt-1.5 text-sm font-bold text-red-700 dark:text-red-400"
            >
              {errors.title}
            </p>
          )}
        </div>

        {/* Location + Custom GPS */}
        <div className="space-y-3">
          <label
            htmlFor="report-city"
            className="block text-base font-bold text-slate-900 dark:text-white"
          >
            3. Location (North East City or Live GPS)
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              id="report-city"
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="min-h-[48px] flex-1 rounded-lg border border-slate-300 bg-white px-3.5 text-base font-semibold text-slate-900 dark:border-white dark:bg-black dark:text-white"
            >
              {NE_CITIES.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}, {city.state} ({city.lat.toFixed(2)}, {city.lng.toFixed(2)})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleCaptureGps}
              disabled={gpsStatus === 'locating'}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100 dark:border-white dark:bg-black dark:text-white"
            >
              {gpsStatus === 'locating' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <LocateFixed className="h-4 w-4 text-emerald-700 dark:text-yellow-300" aria-hidden="true" />
              )}
              <span>Use My GPS</span>
            </button>
          </div>
          <p className="font-mono text-xs tabular-nums text-slate-600 dark:text-neutral-300">
            Pin coordinates: {lat.toFixed(4)}, {lng.toFixed(4)} · {stateName}
          </p>
          {gpsMessage && (
            <p className="text-sm font-medium text-slate-700 dark:text-neutral-200">
              {gpsMessage}
            </p>
          )}
        </div>

        {/* Severity */}
        <fieldset>
          <legend className="text-base font-bold text-slate-900 dark:text-white">
            4. Severity Level
          </legend>
          <div className="mt-2.5 grid grid-cols-3 gap-2.5">
            {SEVERITIES.map((sev) => {
              const active = severity === sev.id;
              return (
                <button
                  key={sev.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSeverity(sev.id)}
                  className={`min-h-[48px] rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                    active
                      ? sev.id === 'Critical'
                        ? 'border-red-700 bg-red-600 text-white dark:border-yellow-300 dark:bg-red-700'
                        : sev.id === 'High'
                        ? 'border-amber-700 bg-amber-600 text-white dark:border-yellow-300 dark:bg-amber-700'
                        : 'border-slate-900 bg-slate-900 text-white dark:border-yellow-300 dark:bg-yellow-300 dark:text-black'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-neutral-600 dark:bg-black dark:text-white'
                  }`}
                >
                  {sev.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Description */}
        <div>
          <label
            htmlFor="report-description"
            className="block text-base font-bold text-slate-900 dark:text-white"
          >
            5. Details for Neighbors &amp; Responders
          </label>
          <textarea
            id="report-description"
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: undefined }));
              }
            }}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? 'report-desc-error' : undefined}
            placeholder="Mention water depth, road landmark, number of families affected, or supplies needed..."
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3.5 text-base text-slate-900 placeholder:text-slate-500 dark:border-white dark:bg-black dark:text-white dark:placeholder:text-neutral-400"
          />
          {errors.description && (
            <p
              id="report-desc-error"
              role="alert"
              className="mt-1.5 text-sm font-bold text-red-700 dark:text-red-400"
            >
              {errors.description}
            </p>
          )}
        </div>

        {submitError && (
          <p role="alert" className="text-sm font-bold text-red-700 dark:text-red-400">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-base font-extrabold text-white hover:bg-slate-800 disabled:opacity-60 dark:border-2 dark:border-yellow-300 dark:bg-yellow-300 dark:text-black"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              <span>Posting Live Incident...</span>
            </>
          ) : (
            <>
              <Send className="h-5 w-5" aria-hidden="true" />
              <span>Submit Incident to Live Map</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
