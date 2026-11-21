import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NE_MAP_CENTER, NE_MAP_DEFAULT_ZOOM } from '../data/neData';
import type { Incident, IncidentCategory } from '../types';
import { formatRelativeTimestamp } from '../utils/incidentLogic';

interface DisasterMapProps {
  incidents: Incident[];
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
  isOnline: boolean;
  onSwitchToList: () => void;
}

const CATEGORY_VISUALS: Record<
  IncidentCategory,
  { color: string; label: string; glyph: string }
> = {
  flood: {
    color: '#DC2626',
    label: 'Active Flood Zone',
    glyph:
      '<path d="M5 13c2-2 4-2 6 0s4 2 6 0" stroke="white" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M5 17c2-2 4-2 6 0s4 2 6 0" stroke="white" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
  },
  landslide: {
    color: '#D97706',
    label: 'Landslide / Blocked Road',
    glyph:
      '<path d="M11 6L4.5 17.5h13L11 6z" stroke="white" stroke-width="2" fill="none" stroke-linejoin="round"/><line x1="11" y1="10.5" x2="11" y2="13.5" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="11" cy="15.8" r="1" fill="white"/>',
  },
  relief_camp: {
    color: '#059669',
    label: 'Relief Camp',
    glyph:
      '<path d="M4.5 12L11 6.5L17.5 12" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 11.5V17.5H15.5V11.5" stroke="white" stroke-width="2" fill="none" stroke-linejoin="round"/>',
  },
  hospital: {
    color: '#2563EB',
    label: 'Emergency Hospital',
    glyph:
      '<path d="M11 7V17M6 12H16" stroke="white" stroke-width="2.6" stroke-linecap="round"/>',
  },
};

function createCategoryMarkerIcon(category: IncidentCategory, isSelected: boolean): L.DivIcon {
  const { color } = CATEGORY_VISUALS[category];
  const size = isSelected ? 42 : 34;
  const ring = isSelected ? 'stroke="#0F172A" stroke-width="3"' : 'stroke="#FFFFFF" stroke-width="2.2"';

  const html = `
    <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 22 22" role="img" aria-label="${CATEGORY_VISUALS[category].label}">
        <circle cx="11" cy="11" r="9.5" fill="${color}" ${ring} />
        ${CATEGORY_VISUALS[category].glyph}
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'ne-marker-icon',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPopupHtml(inc: Incident): string {
  const meta = CATEGORY_VISUALS[inc.category];
  const capacityLine = inc.capacity
    ? `<div style="margin-top:8px;padding:6px 8px;border-radius:6px;background:#ECFDF5;color:#065F46;font-size:12px;font-weight:700;">
        Capacity: ${escapeHtml(inc.capacity)}${inc.availableBedsOrSpots ? ` · ${escapeHtml(inc.availableBedsOrSpots)}` : ''}
      </div>`
    : '';
  const helpline = inc.contactNumber || '112';

  return `
    <div style="padding:14px;max-width:290px;">
      <div style="font-size:11px;font-weight:700;color:${meta.color};letter-spacing:0.01em;">
        ${escapeHtml(meta.label)} · ${escapeHtml(inc.severity)}
      </div>
      <div style="margin-top:4px;font-size:15px;font-weight:800;line-height:1.3;">
        ${escapeHtml(inc.title)}
      </div>
      <div style="margin-top:4px;font-size:12px;opacity:0.8;">
        ${escapeHtml(inc.locationName)}, ${escapeHtml(inc.state)} · ${escapeHtml(formatRelativeTimestamp(inc.timestamp))}
      </div>
      <p style="margin-top:8px;font-size:13px;line-height:1.45;">
        ${escapeHtml(inc.description)}
      </p>
      ${capacityLine}
      <div style="margin-top:10px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <span style="font-family:monospace;font-size:11px;opacity:0.75;">
          ${inc.lat.toFixed(4)}, ${inc.lng.toFixed(4)}
        </span>
        <a href="tel:${escapeHtml(helpline)}" style="display:inline-flex;align-items:center;padding:6px 12px;border-radius:6px;background:#DC2626;color:#FFFFFF;font-weight:700;font-size:12px;text-decoration:none;">
          Call ${escapeHtml(helpline)}
        </a>
      </div>
    </div>
  `;
}

/**
 * Interactive Leaflet map centered on North East India rendering categorized pins,
 * popups, selection fly-to behavior, and an offline tile fallback prompt.
 */
export const DisasterMap: React.FC<DisasterMapProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  isOnline,
  onSwitchToList,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markerByIdRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelectIncident);
  onSelectRef.current = onSelectIncident;

  // Mount Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: NE_MAP_CENTER,
      zoom: NE_MAP_DEFAULT_ZOOM,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersLayerRef.current = layerGroup;

    // Ensure accurate sizing after layout paint
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      markerByIdRef.current.clear();
    };
  }, []);

  // Sync markers whenever filtered incidents or selection changes
  useEffect(() => {
    const layerGroup = markersLayerRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();
    markerByIdRef.current.clear();

    for (const inc of incidents) {
      const marker = L.marker([inc.lat, inc.lng], {
        icon: createCategoryMarkerIcon(inc.category, inc.id === selectedIncidentId),
        title: inc.title,
      });

      marker.bindPopup(buildPopupHtml(inc));
      marker.on('click', () => {
        onSelectRef.current(inc.id);
      });
      marker.addTo(layerGroup);
      markerByIdRef.current.set(inc.id, marker);
    }
  }, [incidents, selectedIncidentId]);

  // Fly to selected incident when chosen from list
  useEffect(() => {
    if (!selectedIncidentId || !mapRef.current) return;
    const marker = markerByIdRef.current.get(selectedIncidentId);
    if (!marker) return;
    const latLng = marker.getLatLng();
    mapRef.current.setView(latLng, Math.max(mapRef.current.getZoom(), 9), {
      animate: true,
    });
    marker.openPopup();
  }, [selectedIncidentId]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-white dark:bg-black">
      <div
        ref={containerRef}
        data-testid="disaster-leaflet-map"
        aria-label="Interactive North East India disaster and relief map"
        className="h-[460px] w-full sm:h-[540px]"
      />

      {/* Offline tile hint banner */}
      {!isOnline && (
        <div className="absolute left-3 right-3 top-3 z-[400] flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-400 bg-amber-50 px-3.5 py-2.5 text-sm font-semibold text-amber-950 shadow-md dark:border-yellow-300 dark:bg-black dark:text-yellow-300">
          <span>Offline Mode: Map tiles may not load without internet. All pins &amp; shelters remain cached.</span>
          <button
            type="button"
            onClick={onSwitchToList}
            className="min-h-[40px] rounded-md bg-amber-900 px-3 py-1.5 text-xs font-bold text-white dark:bg-yellow-300 dark:text-black"
          >
            Open Offline List View
          </button>
        </div>
      )}

      {/* Map Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-neutral-800 dark:bg-black dark:text-neutral-200">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="inline-flex items-center gap-2 font-medium">
            <span className="h-3.5 w-3.5 rounded-full bg-red-600" aria-hidden="true" />
            Flood Zones
          </span>
          <span className="inline-flex items-center gap-2 font-medium">
            <span className="h-3.5 w-3.5 rounded-full bg-amber-600" aria-hidden="true" />
            Landslides / Blocked Roads
          </span>
          <span className="inline-flex items-center gap-2 font-medium">
            <span className="h-3.5 w-3.5 rounded-full bg-emerald-600" aria-hidden="true" />
            Relief Camps
          </span>
          <span className="inline-flex items-center gap-2 font-medium">
            <span className="h-3.5 w-3.5 rounded-full bg-blue-600" aria-hidden="true" />
            Emergency Hospitals
          </span>
        </div>
        <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-neutral-300">
          Showing {incidents.length} locations
        </span>
      </div>
    </div>
  );
};
