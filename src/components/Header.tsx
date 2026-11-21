import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  Contrast,
  Map as MapIcon,
  PlusCircle,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { ActiveTab } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOnline: boolean;
  elderlyMode: boolean;
  onToggleElderlyMode: () => void;
}

const NAV_ITEMS: Array<{
  id: ActiveTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'map', label: 'Map & Alerts', shortLabel: 'Map', icon: MapIcon },
  { id: 'triage', label: 'AI SOS Triage', shortLabel: 'SOS Triage', icon: AlertTriangle },
  { id: 'report', label: 'Report Incident', shortLabel: 'Report', icon: PlusCircle },
  { id: 'guide', label: 'Survival Guide', shortLabel: 'Guide', icon: BookOpen },
];

/**
 * Top application bar containing branding, primary section navigation,
 * live online/offline status, Elderly / Low-Battery Mode toggle, and PWA install trigger.
 */
export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  isOnline,
  elderlyMode,
  onToggleElderlyMode,
}) => {
  return (
    <header className="z-30 border-b border-slate-200 bg-white md:sticky md:top-0 dark:border-white dark:bg-black">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
        {/* Brand Zone */}
        <button
          type="button"
          onClick={() => onSelectTab('map')}
          className="inline-flex min-h-[48px] items-center gap-2 whitespace-nowrap shrink-0 text-left text-slate-900 dark:text-white"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white dark:bg-yellow-300 dark:text-black">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-display text-base font-extrabold tracking-tight sm:text-lg">
            Northeast Emergency Assistant
          </span>
        </button>

        {/* Primary Desktop Navigation */}
        <nav
          aria-label="Primary sections"
          className="hidden items-center gap-1 xl:flex"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelectTab(item.id)}
                className={`inline-flex min-h-[48px] items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-yellow-300 dark:text-black'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-white dark:hover:bg-neutral-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Accessibility & Connectivity Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Live Online / Offline Status Indicator */}
          <div
            role="status"
            aria-live="polite"
            data-testid="connectivity-status"
            className={`inline-flex min-h-[48px] items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border px-2.5 py-2 text-sm font-semibold ${
              isOnline
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-black dark:text-emerald-300'
                : 'border-amber-300 bg-amber-50 text-amber-950 dark:border-yellow-300 dark:bg-black dark:text-yellow-300'
            }`}
          >
            {isOnline ? (
              <Wifi className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
            ) : (
              <WifiOff className="h-4 w-4 shrink-0 text-amber-700 dark:text-yellow-300" aria-hidden="true" />
            )}
            <span>{isOnline ? 'Online' : 'Offline Mode – Cached Data Active'}</span>
          </div>

          {/* 1-Click Elderly / Low-Battery Mode Toggle */}
          <button
            type="button"
            aria-pressed={elderlyMode}
            onClick={onToggleElderlyMode}
            className={`inline-flex min-h-[48px] items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
              elderlyMode
                ? 'border-yellow-300 bg-yellow-300 text-black hover:bg-yellow-200'
                : 'border-slate-300 bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Contrast className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{elderlyMode ? 'Standard Mode' : 'Elderly / Low-Battery Mode'}</span>
          </button>

          <PWAInstallButton />
        </div>
      </div>

      {/* Tablet / Mobile Section Navigation Bar (non-sticky inside flow on small screens via scrollable row) */}
      <nav
        aria-label="Mobile sections"
        className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-200 px-3 py-2 xl:hidden dark:border-neutral-800"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelectTab(item.id)}
              className={`inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-yellow-300 dark:text-black'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border dark:border-neutral-700 dark:bg-black dark:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
