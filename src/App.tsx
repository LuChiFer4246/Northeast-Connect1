import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { HelplineBar } from './components/HelplineBar';
import { IncidentReportView } from './components/IncidentReportView';
import { MapAndAlertsView } from './components/MapAndAlertsView';
import { SosTriageView } from './components/SosTriageView';
import { SurvivalGuideView } from './components/SurvivalGuideView';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import type { ActiveTab, Incident, Language } from './types';
import {
  loadCachedIncidents,
  loadElderlyMode,
  loadGoBagChecked,
  loadLanguage,
  primeOfflineCache,
  saveCachedIncidents,
  saveElderlyMode,
  saveGoBagChecked,
  saveLanguage,
} from './utils/storage';

export default function App() {
  const isOnline = useOnlineStatus();
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [elderlyMode, setElderlyMode] = useState<boolean>(() => loadElderlyMode());
  const [language, setLanguage] = useState<Language>(() => loadLanguage());
  const [incidents, setIncidents] = useState<Incident[]>(() => loadCachedIncidents());
  const [isLoadingIncidents, setIsLoadingIncidents] = useState<boolean>(false);
  const [checkedBagIds, setCheckedBagIds] = useState<string[]>(() => loadGoBagChecked());

  // Prime offline cache on first mount & sync live incidents from Express API when online
  useEffect(() => {
    primeOfflineCache();

    if (!isOnline) return;

    let cancelled = false;
    setIsLoadingIncidents(true);

    fetch('/api/incidents')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to fetch'))))
      .then((data: { incidents?: Incident[] }) => {
        if (cancelled || !Array.isArray(data.incidents) || data.incidents.length === 0) return;

        // Preserve any locally created offline-pending incidents alongside server incidents
        setIncidents((prev) => {
          const serverIds = new Set(data.incidents!.map((i) => i.id));
          const offlineOnly = prev.filter((i) => i.offlinePending && !serverIds.has(i.id));
          const merged = [...offlineOnly, ...data.incidents!];
          saveCachedIncidents(merged);
          return merged;
        });
      })
      .catch(() => {
        // Silently stay on localStorage cached incidents when unreachable
      })
      .finally(() => {
        if (!cancelled) setIsLoadingIncidents(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  // Apply Elderly / Low-Battery Mode to <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (elderlyMode) {
      root.classList.add('elderly-mode', 'dark');
    } else {
      root.classList.remove('elderly-mode', 'dark');
    }
    saveElderlyMode(elderlyMode);
  }, [elderlyMode]);

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
    saveLanguage(lang);
  }, []);

  const handleIncidentCreated = useCallback((newIncident: Incident) => {
    setIncidents((prev) => {
      const updated = [newIncident, ...prev];
      saveCachedIncidents(updated);
      return updated;
    });
  }, []);

  const handleToggleBagItem = useCallback((id: string) => {
    setCheckedBagIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      saveGoBagChecked(next);
      return next;
    });
  }, []);

  const handleResetBag = useCallback(() => {
    setCheckedBagIds([]);
    saveGoBagChecked([]);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-black dark:text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to main content
      </a>

      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOnline={isOnline}
        elderlyMode={elderlyMode}
        onToggleElderlyMode={() => setElderlyMode((prev) => !prev)}
      />

      <HelplineBar language={language} onChangeLanguage={handleLanguageChange} />

      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-28 sm:px-6 md:pb-10"
      >
        {activeTab === 'map' && (
          <MapAndAlertsView
            incidents={incidents}
            isLoading={isLoadingIncidents}
            isOnline={isOnline}
            onGoToReport={() => setActiveTab('report')}
            onGoToTriage={() => setActiveTab('triage')}
          />
        )}

        {activeTab === 'triage' && <SosTriageView isOnline={isOnline} />}

        {activeTab === 'report' && (
          <IncidentReportView
            isOnline={isOnline}
            onIncidentCreated={handleIncidentCreated}
            onViewOnMap={() => setActiveTab('map')}
          />
        )}

        {activeTab === 'guide' && (
          <SurvivalGuideView
            language={language}
            onChangeLanguage={handleLanguageChange}
            checkedBagIds={checkedBagIds}
            onToggleBagItem={handleToggleBagItem}
            onResetBag={handleResetBag}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 pb-24 text-sm text-slate-600 md:pb-6 dark:border-neutral-800 dark:bg-black dark:text-neutral-300">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 sm:flex-row sm:items-center sm:px-6">
          <p className="font-semibold text-slate-800 dark:text-white">
            Northeast Emergency Assistant · Assam, Meghalaya, Arunachal Pradesh, Manipur, Mizoram, Nagaland, Tripura &amp; Sikkim
          </p>
          <p>
            Offline cache active · In life-threatening emergencies always dial{' '}
            <a
              href="tel:112"
              className="font-mono font-bold text-red-700 underline dark:text-yellow-300"
            >
              112
            </a>{' '}
            or{' '}
            <a
              href="tel:108"
              className="font-mono font-bold text-red-700 underline dark:text-yellow-300"
            >
              108
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
