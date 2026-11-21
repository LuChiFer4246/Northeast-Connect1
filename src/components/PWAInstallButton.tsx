import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex min-h-[48px] items-center gap-2 whitespace-nowrap shrink-0 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-white dark:bg-black dark:text-white dark:hover:bg-neutral-900"
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex min-h-[48px] items-center gap-2 whitespace-nowrap shrink-0 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-white dark:bg-black dark:text-white dark:hover:bg-neutral-900"
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white dark:bg-black">
              <div className="flex items-center justify-between gap-4">
                <h2
                  id="ios-install-title"
                  className="font-display text-lg font-bold text-slate-900 dark:text-white"
                >
                  Install Northeast Connect on iOS
                </h2>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="inline-flex min-h-[48px] items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-white dark:text-white dark:hover:bg-neutral-900"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span>Close</span>
                </button>
              </div>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-base text-slate-700 dark:text-neutral-200">
                <li>Tap the <strong>Share</strong> icon in your Safari toolbar.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                <li>Open Northeast Connect offline anytime during emergencies.</li>
              </ol>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
