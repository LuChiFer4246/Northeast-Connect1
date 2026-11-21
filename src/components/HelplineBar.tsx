import React, { useState } from 'react';
import { Globe, Info, PhoneCall, X } from 'lucide-react';
import { LANGUAGE_LABELS, UI_STRINGS, VERIFIED_HELPLINES } from '../data/neData';
import type { Language } from '../types';

interface HelplineBarProps {
  language: Language;
  onChangeLanguage: (lang: Language) => void;
}

const LANGUAGES: Language[] = ['en', 'as', 'hi'];

/**
 * Always-accessible verified North East India emergency call bar with 1-tap `tel:` links,
 * English/Assamese/Hindi toggle, and full offline helpline directory modal.
 */
export const HelplineBar: React.FC<HelplineBarProps> = ({
  language,
  onChangeLanguage,
}) => {
  const [directoryOpen, setDirectoryOpen] = useState(false);

  return (
    <>
      {/* Desktop & Tablet Top Emergency Call Bar */}
      <section
        aria-label="Verified North East India Emergency Helplines"
        className="hidden border-b border-red-200 bg-red-50/95 md:block dark:border-white dark:bg-black"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 xl:flex-nowrap">
          <div className="flex flex-wrap items-center gap-1.5 xl:flex-nowrap">
            <span className="mr-1 whitespace-nowrap text-xs font-extrabold text-red-900 dark:text-yellow-300">
              {UI_STRINGS.helplineBarTitle[language]}
            </span>

            {VERIFIED_HELPLINES.map((item) => (
              <a
                key={item.number}
                href={`tel:${item.number}`}
                className="inline-flex min-h-[48px] items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-red-700 bg-red-600 px-2.5 py-1.5 text-sm font-bold text-white shadow-xs transition-colors hover:bg-red-700 dark:border-yellow-300 dark:bg-black dark:text-white dark:hover:bg-neutral-900"
              >
                <PhoneCall className="h-3.5 w-3.5 shrink-0 text-white dark:text-yellow-300" aria-hidden="true" />
                <span className="font-mono text-sm font-extrabold tabular-nums">
                  {item.number}
                </span>
                <span className="text-xs font-semibold text-red-50 dark:text-neutral-200">
                  {item.shortLabel[language]}
                </span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 1-Click Language Toggle for Helplines & Survival Guide */}
            <div
              role="group"
              aria-label="Select helpline and guide language"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white p-0.5 dark:border-white dark:bg-black"
            >
              <Globe className="mx-1.5 h-4 w-4 shrink-0 text-slate-600 dark:text-yellow-300" aria-hidden="true" />
              {LANGUAGES.map((code) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={language === code}
                  onClick={() => onChangeLanguage(code)}
                  className={`min-h-[40px] whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${
                    language === code
                      ? 'bg-slate-900 text-white dark:bg-yellow-300 dark:text-black'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-white dark:hover:bg-neutral-900'
                  }`}
                >
                  {LANGUAGE_LABELS[code]}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setDirectoryOpen(true)}
              className="inline-flex min-h-[48px] items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 hover:bg-slate-100 dark:border-white dark:bg-black dark:text-white dark:hover:bg-neutral-900"
            >
              <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Details</span>
            </button>
          </div>
        </div>
      </section>

      {/* Mobile Compact Sticky Bottom 1-Tap Helpline Bar (<= 15% of 844px mobile viewport) */}
      <section
        aria-label="Emergency Quick Call Bar"
        className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-red-600 bg-white px-2 py-2 shadow-lg md:hidden dark:border-yellow-300 dark:bg-black"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {VERIFIED_HELPLINES.map((item) => (
            <a
              key={item.number}
              href={`tel:${item.number}`}
              className="inline-flex min-h-[48px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white active:bg-red-700 dark:border dark:border-yellow-300 dark:bg-black dark:text-white"
            >
              <PhoneCall className="h-4 w-4 shrink-0 dark:text-yellow-300" aria-hidden="true" />
              <span className="font-mono font-extrabold tabular-nums">{item.number}</span>
              <span className="text-xs font-medium">{item.shortLabel[language]}</span>
            </a>
          ))}
          <button
            type="button"
            onClick={() => setDirectoryOpen(true)}
            className="inline-flex min-h-[48px] shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-900 dark:border-white dark:bg-neutral-900 dark:text-white"
          >
            <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{LANGUAGE_LABELS[language]}</span>
          </button>
        </div>
      </section>

      {/* Accessible Full Verified Helpline Directory Dialog */}
      {directoryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="helpline-directory-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white dark:bg-black">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-neutral-700">
              <div>
                <h2
                  id="helpline-directory-title"
                  className="font-display text-xl font-bold text-slate-900 dark:text-white"
                >
                  {UI_STRINGS.helplineBarTitle[language]}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">
                  Cached offline on this device. Tap any number to call directly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDirectoryOpen(false)}
                className="inline-flex min-h-[48px] items-center gap-1.5 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-900 hover:bg-slate-100 dark:border-white dark:text-white dark:hover:bg-neutral-900"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span>Close</span>
              </button>
            </div>

            {/* Language Selector inside modal */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-neutral-200">
                Language:
              </span>
              {LANGUAGES.map((code) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={language === code}
                  onClick={() => onChangeLanguage(code)}
                  className={`min-h-[48px] rounded-lg border px-4 py-2 text-sm font-bold ${
                    language === code
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-yellow-300 dark:bg-yellow-300 dark:text-black'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-neutral-600 dark:bg-black dark:text-white'
                  }`}
                >
                  {LANGUAGE_LABELS[code]}
                </button>
              ))}
            </div>

            <div className="mt-5 divide-y divide-slate-200 dark:divide-neutral-800">
              {VERIFIED_HELPLINES.map((item) => (
                <div
                  key={item.number}
                  className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {item.fullName[language]}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-neutral-300">
                      {item.description[language]}
                    </p>
                  </div>
                  <a
                    href={`tel:${item.number}`}
                    className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-red-600 px-5 py-2.5 font-mono text-base font-extrabold text-white hover:bg-red-700 dark:border-2 dark:border-yellow-300 dark:bg-black dark:text-yellow-300"
                  >
                    <PhoneCall className="h-5 w-5" aria-hidden="true" />
                    <span>Call {item.number}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
