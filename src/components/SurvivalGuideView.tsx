import React, { useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Globe,
  Mountain,
  RotateCcw,
  ShieldCheck,
  Square,
  SquareCheckBig,
  Waves,
  XCircle,
} from 'lucide-react';
import {
  GO_BAG_ITEMS,
  LANGUAGE_LABELS,
  SURVIVAL_GUIDES,
  UI_STRINGS,
} from '../data/neData';
import type { Language } from '../types';
import { calculateGoBagProgress } from '../utils/incidentLogic';

interface SurvivalGuideViewProps {
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  checkedBagIds: string[];
  onToggleBagItem: (id: string) => void;
  onResetBag: () => void;
}

const LANGUAGES: Language[] = ['en', 'as', 'hi'];

const GUIDE_ICONS: Record<'flood' | 'landslide' | 'earthquake', React.ComponentType<{ className?: string }>> = {
  flood: Waves,
  landslide: Mountain,
  earthquake: Activity,
};

/**
 * Offline-ready multilingual survival guide (Floods, Landslides, Earthquakes)
 * paired with a persistent Emergency Go-Bag packing checklist.
 */
export const SurvivalGuideView: React.FC<SurvivalGuideViewProps> = ({
  language,
  onChangeLanguage,
  checkedBagIds,
  onToggleBagItem,
  onResetBag,
}) => {
  const [selectedGuideId, setSelectedGuideId] = useState<'flood' | 'landslide' | 'earthquake'>('flood');

  const activeGuide = useMemo(
    () => SURVIVAL_GUIDES.find((g) => g.id === selectedGuideId) ?? SURVIVAL_GUIDES[0],
    [selectedGuideId]
  );

  const progress = useMemo(
    () => calculateGoBagProgress(checkedBagIds, GO_BAG_ITEMS.length),
    [checkedBagIds]
  );

  return (
    <div className="space-y-8">
      {/* Header + 1-Click Language Toggle */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end dark:border-neutral-800">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {UI_STRINGS.survivalGuideHeading[language]}
          </h1>
          <p className="mt-1.5 text-base text-slate-600 dark:text-neutral-200">
            {UI_STRINGS.survivalGuideSub[language]}
          </p>
        </div>

        <div
          role="group"
          aria-label="Survival guide language toggle"
          className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-slate-300 bg-white p-1 dark:border-white dark:bg-black"
        >
          <span className="inline-flex items-center gap-1.5 px-2.5 text-sm font-bold text-slate-700 dark:text-yellow-300">
            <Globe className="h-4 w-4" aria-hidden="true" />
            <span>Language</span>
          </span>
          {LANGUAGES.map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={language === code}
              onClick={() => onChangeLanguage(code)}
              className={`min-h-[44px] whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-bold transition-colors ${
                language === code
                  ? 'bg-slate-900 text-white dark:bg-yellow-300 dark:text-black'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-white dark:hover:bg-neutral-900'
              }`}
            >
              {LANGUAGE_LABELS[code]}
            </button>
          ))}
        </div>
      </div>

      {/* Disaster Type Selector Tabs */}
      <div
        role="tablist"
        aria-label="Disaster survival categories"
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
      >
        {SURVIVAL_GUIDES.map((guide) => {
          const Icon = GUIDE_ICONS[guide.id];
          const isSelected = guide.id === activeGuide.id;
          return (
            <button
              key={guide.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedGuideId(guide.id)}
              className={`inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-base font-extrabold transition-colors ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-yellow-300 dark:bg-yellow-300 dark:text-black'
                  : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-neutral-600 dark:bg-black dark:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{guide.title[language]}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Guide Do's & Don'ts Cards */}
      <section aria-label={activeGuide.title[language]} className="space-y-3">
        <p className="text-sm font-semibold text-slate-600 dark:text-neutral-300">
          {activeGuide.subtitle[language]}
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* DO'S Card */}
          <div className="rounded-xl border border-emerald-200 bg-white p-5 sm:p-6 dark:border-emerald-400 dark:bg-black">
            <div className="flex items-center gap-2.5 border-b border-emerald-100 pb-3.5 dark:border-neutral-800">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
              <h2 className="font-display text-lg font-extrabold text-emerald-950 dark:text-emerald-300">
                {UI_STRINGS.dosHeading[language]}
              </h2>
            </div>
            <ul className="mt-4 space-y-3.5">
              {activeGuide.dos.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-base leading-relaxed text-slate-800 dark:text-white"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-mono text-xs font-bold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                    {idx + 1}
                  </span>
                  <span>{item[language]}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* DON'TS Card */}
          <div className="rounded-xl border border-red-200 bg-white p-5 sm:p-6 dark:border-red-400 dark:bg-black">
            <div className="flex items-center gap-2.5 border-b border-red-100 pb-3.5 dark:border-neutral-800">
              <XCircle className="h-6 w-6 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
              <h2 className="font-display text-lg font-extrabold text-red-950 dark:text-red-300">
                {UI_STRINGS.dontsHeading[language]}
              </h2>
            </div>
            <ul className="mt-4 space-y-3.5">
              {activeGuide.donts.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-base leading-relaxed text-slate-800 dark:text-white"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 font-mono text-xs font-bold text-red-900 dark:bg-red-950 dark:text-red-200">
                    {idx + 1}
                  </span>
                  <span>{item[language]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Interactive Emergency Go-Bag Checklist */}
      <section
        aria-labelledby="gobag-heading"
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-white dark:bg-black"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-yellow-300" aria-hidden="true" />
              <h2
                id="gobag-heading"
                className="font-display text-xl font-extrabold text-slate-900 dark:text-white"
              >
                {UI_STRINGS.goBagHeading[language]}
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">
              {UI_STRINGS.goBagSub[language]}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              data-testid="gobag-progress-text"
              className="font-mono text-base font-extrabold tabular-nums text-emerald-800 dark:text-yellow-300"
            >
              {progress.checkedCount}/{progress.totalCount} packed ({progress.percent}%)
            </span>
            <button
              type="button"
              onClick={onResetBag}
              disabled={progress.checkedCount === 0}
              className="inline-flex min-h-[48px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-40 dark:border-neutral-600 dark:bg-black dark:text-white"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Emergency Go-Bag readiness"
          className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-neutral-800"
        >
          <div
            className="h-full rounded-full bg-emerald-600 transition-all dark:bg-yellow-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        {/* Large Tap-Target Checklist Rows */}
        <div className="mt-5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {GO_BAG_ITEMS.map((item) => {
            const isChecked = checkedBagIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => onToggleBagItem(item.id)}
                className={`flex min-h-[56px] w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-colors ${
                  isChecked
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-400 dark:bg-neutral-950 dark:text-emerald-200'
                    : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-neutral-700 dark:bg-black dark:text-white dark:hover:bg-neutral-900'
                }`}
              >
                {isChecked ? (
                  <SquareCheckBig
                    className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700 dark:text-emerald-300"
                    aria-hidden="true"
                  />
                ) : (
                  <Square
                    className="mt-0.5 h-6 w-6 shrink-0 text-slate-400 dark:text-neutral-400"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`text-base font-medium leading-snug ${
                    isChecked ? 'line-through opacity-85' : ''
                  }`}
                >
                  {item.label[language]}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
