import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Home,
  List,
  Map as MapIcon,
  MapPin,
  Mountain,
  PhoneCall,
  PlusCircle,
  Search,
  Waves,
} from 'lucide-react';
import type { Incident, IncidentCategory } from '../types';
import {
  countIncidentsByCategory,
  filterIncidents,
  formatRelativeTimestamp,
  type MapFilterCategory,
} from '../utils/incidentLogic';
import { DisasterMap } from './DisasterMap';

interface MapAndAlertsViewProps {
  incidents: Incident[];
  isLoading: boolean;
  isOnline: boolean;
  onGoToReport: () => void;
  onGoToTriage: () => void;
}

const FILTER_OPTIONS: Array<{
  id: MapFilterCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'all', label: 'All', icon: MapPin },
  { id: 'flood', label: 'Floods', icon: Waves },
  { id: 'landslide', label: 'Landslides', icon: Mountain },
  { id: 'relief_camp', label: 'Relief Camps', icon: Home },
  { id: 'hospital', label: 'Hospitals', icon: Building2 },
];

const CATEGORY_TEXT: Record<IncidentCategory, { label: string; textClass: string }> = {
  flood: {
    label: 'Active Flood Zone',
    textClass: 'text-red-700 dark:text-red-400',
  },
  landslide: {
    label: 'Landslide / Blocked Road',
    textClass: 'text-amber-800 dark:text-amber-300',
  },
  relief_camp: {
    label: 'Relief Camp',
    textClass: 'text-emerald-800 dark:text-emerald-300',
  },
  hospital: {
    label: 'Emergency Hospital',
    textClass: 'text-blue-800 dark:text-blue-300',
  },
};

/**
 * Main disaster overview combining category filters, search, Map/List toggle,
 * interactive Leaflet map, and offline-friendly Live Alerts & Shelters feed.
 */
export const MapAndAlertsView: React.FC<MapAndAlertsViewProps> = ({
  incidents,
  isLoading,
  isOnline,
  onGoToReport,
  onGoToTriage,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<MapFilterCategory>('all');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const counts = useMemo(() => countIncidentsByCategory(incidents), [incidents]);
  const filteredIncidents = useMemo(
    () => filterIncidents(incidents, categoryFilter, searchQuery),
    [incidents, categoryFilter, searchQuery]
  );

  return (
    <div className="space-y-6">
      {/* Top Action Banner & View Switcher */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end dark:border-neutral-800">
        <div className="max-w-2xl">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            North East Disaster &amp; Relief Live Map
          </h1>
          <p className="mt-1.5 text-base text-slate-600 dark:text-neutral-200">
            Active flood alerts, landslide road closures, verified relief camps, and 24x7 emergency hospitals across all 8 North East states.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onGoToTriage}
            className="inline-flex min-h-[48px] items-center gap-2 whitespace-nowrap rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-red-700 dark:border-2 dark:border-yellow-300 dark:bg-red-700 dark:text-white"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Need Urgent SOS Help</span>
          </button>

          <button
            type="button"
            onClick={onGoToReport}
            className="inline-flex min-h-[48px] items-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-100 dark:border-white dark:bg-black dark:text-white dark:hover:bg-neutral-900"
          >
            <PlusCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* Filter Bar + Prominent Map View / List View Toggle */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {/* Category Filters */}
        <div
          role="group"
          aria-label="Filter incidents by category"
          className="flex flex-wrap items-center gap-1.5"
        >
          {FILTER_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = categoryFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCategoryFilter(opt.id)}
                className={`inline-flex min-h-[48px] items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-yellow-300 dark:bg-yellow-300 dark:text-black'
                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-neutral-600 dark:bg-black dark:text-white dark:hover:bg-neutral-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{opt.label}</span>
                <span className="font-mono text-xs tabular-nums opacity-85">
                  ({counts[opt.id]})
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + Map / List Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap shrink-0">
          <div className="relative min-w-[200px] flex-1 sm:w-56 sm:flex-initial">
            <label htmlFor="incident-search" className="sr-only">
              Search city, road, or shelter
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-neutral-300"
              aria-hidden="true"
            />
            <input
              id="incident-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city or shelter..."
              className="min-h-[48px] w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm font-medium text-slate-900 placeholder:text-slate-500 dark:border-white dark:bg-black dark:text-white dark:placeholder:text-neutral-400"
            />
          </div>

          {/* Map View / List View Toggle (Offline & 2G Friendly) */}
          <div
            role="group"
            aria-label="Switch between Map View and List View"
            className="inline-flex shrink-0 rounded-lg border border-slate-300 bg-slate-100 p-0.5 dark:border-white dark:bg-neutral-950"
          >
            <button
              type="button"
              aria-pressed={viewMode === 'map'}
              onClick={() => setViewMode('map')}
              className={`inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-bold transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-slate-950 shadow-xs dark:bg-yellow-300 dark:text-black'
                  : 'text-slate-700 hover:text-slate-950 dark:text-white'
              }`}
            >
              <MapIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Map View</span>
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={`inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-bold transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-slate-950 shadow-xs dark:bg-yellow-300 dark:text-black'
                  : 'text-slate-700 hover:text-slate-950 dark:text-white'
              }`}
            >
              <List className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>List View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div
          role="status"
          className="rounded-xl border border-slate-200 bg-white p-6 text-center text-base font-medium text-slate-700 dark:border-white dark:bg-black dark:text-white"
        >
          Syncing live North East alerts...
        </div>
      )}

      {/* Map + Live Alerts Split OR Full Offline List View */}
      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Interactive Map Canvas */}
          <div className="lg:col-span-7 xl:col-span-8">
            <DisasterMap
              incidents={filteredIncidents}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={setSelectedIncidentId}
              isOnline={isOnline}
              onSwitchToList={() => setViewMode('list')}
            />
          </div>

          {/* Live Alerts & Relief Camps Side Feed */}
          <aside
            aria-label="Live Alerts and Relief Feed"
            className="flex flex-col rounded-xl border border-slate-200 bg-white dark:border-white dark:bg-black lg:col-span-5 xl:col-span-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5 dark:border-neutral-800">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Live Alerts &amp; Shelters
              </h2>
              <span className="font-mono text-xs font-semibold tabular-nums text-slate-600 dark:text-neutral-300">
                {filteredIncidents.length} listed
              </span>
            </div>

            {filteredIncidents.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-base font-semibold text-slate-800 dark:text-white">
                  No matching alerts or shelters found.
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">
                  Clear your filter or search to see all active locations.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white dark:bg-yellow-300 dark:text-black"
                >
                  Show All Locations
                </button>
              </div>
            ) : (
              <ul
                data-testid="live-alerts-feed"
                className="max-h-[520px] divide-y divide-slate-200 overflow-y-auto dark:divide-neutral-800"
              >
                {filteredIncidents.map((inc) => {
                  const catInfo = CATEGORY_TEXT[inc.category];
                  const isSelected = selectedIncidentId === inc.id;
                  return (
                    <li key={inc.id} className="p-4">
                      <div className="flex items-center justify-between gap-2 text-xs font-bold">
                        <span className={catInfo.textClass}>
                          {catInfo.label} · {inc.severity}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500 dark:text-neutral-300">
                          {formatRelativeTimestamp(inc.timestamp)}
                        </span>
                      </div>

                      <h3 className="mt-1.5 text-base font-bold text-slate-900 dark:text-white">
                        {inc.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">
                        {inc.locationName}, {inc.state}
                        {inc.reportedByCommunity ? ' · Community Report' : ' · Verified'}
                      </p>

                      {inc.capacity && (
                        <p className="mt-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                          Capacity: {inc.capacity}
                          {inc.availableBedsOrSpots ? ` · ${inc.availableBedsOrSpots}` : ''}
                        </p>
                      )}

                      <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-neutral-200">
                        {inc.description}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedIncidentId(inc.id)}
                          className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold ${
                            isSelected
                              ? 'border-slate-900 bg-slate-900 text-white dark:border-yellow-300 dark:bg-yellow-300 dark:text-black'
                              : 'border-slate-300 bg-slate-50 text-slate-900 hover:bg-slate-100 dark:border-neutral-600 dark:bg-black dark:text-white'
                          }`}
                        >
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Focus on Map</span>
                        </button>

                        {inc.contactNumber && (
                          <a
                            href={`tel:${inc.contactNumber}`}
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 font-mono text-xs font-bold text-white hover:bg-red-700 dark:border dark:border-yellow-300 dark:bg-black dark:text-yellow-300"
                          >
                            <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Call {inc.contactNumber}</span>
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>
      ) : (
        /* Offline / 2G-Friendly Clean List View */
        <section aria-label="Offline-Ready Alerts and Relief Directory" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 dark:text-neutral-300">
            <span>
              Low-bandwidth List View — works 100% offline with cached shelter and alert details.
            </span>
            <span className="font-mono font-semibold tabular-nums">
              {filteredIncidents.length} locations
            </span>
          </div>

          {filteredIncidents.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-white dark:bg-black">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                No matching records found.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="mt-4 inline-flex min-h-[48px] items-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white dark:bg-yellow-300 dark:text-black"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div
              data-testid="offline-list-view"
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              {filteredIncidents.map((inc) => {
                const catInfo = CATEGORY_TEXT[inc.category];
                return (
                  <article
                    key={inc.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-white dark:bg-black"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
                        <span className={catInfo.textClass}>
                          {catInfo.label} · {inc.severity}
                        </span>
                        <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-neutral-300">
                          {formatRelativeTimestamp(inc.timestamp)}
                        </span>
                      </div>

                      <h3 className="mt-2 font-display text-lg font-bold text-slate-900 dark:text-white">
                        {inc.title}
                      </h3>

                      <p className="mt-1 text-sm font-medium text-slate-600 dark:text-neutral-300">
                        {inc.locationName}, {inc.state} ·{' '}
                        <span className="font-mono text-xs tabular-nums">
                          {inc.lat.toFixed(4)}, {inc.lng.toFixed(4)}
                        </span>
                      </p>

                      {inc.capacity && (
                        <p className="mt-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                          Shelter Capacity: {inc.capacity}
                          {inc.availableBedsOrSpots ? ` · ${inc.availableBedsOrSpots}` : ''}
                        </p>
                      )}

                      <p className="mt-2.5 text-base leading-relaxed text-slate-700 dark:text-neutral-200">
                        {inc.description}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-3.5 dark:border-neutral-800">
                      {inc.contactNumber && (
                        <a
                          href={`tel:${inc.contactNumber}`}
                          className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-mono text-sm font-bold text-white hover:bg-red-700 dark:border-2 dark:border-yellow-300 dark:bg-black dark:text-yellow-300"
                        >
                          <PhoneCall className="h-4 w-4" aria-hidden="true" />
                          <span>Call {inc.contactNumber}</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIncidentId(inc.id);
                          setViewMode('map');
                        }}
                        className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100 dark:border-white dark:bg-black dark:text-white dark:hover:bg-neutral-900"
                      >
                        <MapIcon className="h-4 w-4" aria-hidden="true" />
                        <span>View on Map</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
