import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_INCIDENTS } from '../data/neData';
import type { Incident } from '../types';
import {
  calculateGoBagProgress,
  countIncidentsByCategory,
  filterIncidents,
  formatRelativeTimestamp,
  isValidNorthEastCoordinates,
  mapReportTypeToMapCategory,
  validateIncidentInput,
} from './incidentLogic';

test('INITIAL_INCIDENTS has at least 10 pins covering all 4 map categories', () => {
  assert.ok(INITIAL_INCIDENTS.length >= 10);
  const counts = countIncidentsByCategory(INITIAL_INCIDENTS);
  assert.ok(counts.flood >= 2);
  assert.ok(counts.landslide >= 2);
  assert.ok(counts.relief_camp >= 2);
  assert.ok(counts.hospital >= 2);
  assert.equal(counts.all, INITIAL_INCIDENTS.length);
});

test('countIncidentsByCategory handles empty lists cleanly', () => {
  assert.deepEqual(countIncidentsByCategory([]), {
    all: 0,
    flood: 0,
    landslide: 0,
    relief_camp: 0,
    hospital: 0,
  });
});

test('filterIncidents filters by category, handles empty/whitespace queries, and sorts newest first', () => {
  assert.deepEqual(filterIncidents([], 'all', 'Guwahati'), []);

  const reliefOnly = filterIncidents(INITIAL_INCIDENTS, 'relief_camp', '   ');
  assert.ok(reliefOnly.length > 0);
  assert.ok(reliefOnly.every((i) => i.category === 'relief_camp'));

  for (let i = 1; i < reliefOnly.length; i++) {
    assert.ok(
      new Date(reliefOnly[i - 1].timestamp).getTime() >=
        new Date(reliefOnly[i].timestamp).getTime()
    );
  }

  const silcharMatches = filterIncidents(INITIAL_INCIDENTS, 'all', 'Silchar');
  assert.ok(silcharMatches.length >= 2);
  assert.ok(
    silcharMatches.every(
      (i) =>
        i.locationName.toLowerCase().includes('silchar') ||
        i.title.toLowerCase().includes('silchar')
    )
  );

  const stateMatches = filterIncidents(INITIAL_INCIDENTS, 'all', 'meghalaya');
  assert.ok(stateMatches.length > 0);
  assert.ok(stateMatches.every((i) => i.state.toLowerCase().includes('meghalaya')));

  const noMatches = filterIncidents(INITIAL_INCIDENTS, 'hospital', 'nonexistent-city-xyz');
  assert.equal(noMatches.length, 0);
});

test('validateIncidentInput enforces required title, location, and description including whitespace and boundaries', () => {
  const emptyAndShort = validateIncidentInput({
    title: '   ',
    reportType: 'flood',
    severity: 'High',
    locationName: '   ',
    state: 'Assam',
    lat: 26.1445,
    lng: 91.7362,
    description: '  short  ',
  });
  assert.equal(emptyAndShort.valid, false);
  assert.ok(emptyAndShort.errors.title);
  assert.ok(emptyAndShort.errors.locationName);
  assert.ok(emptyAndShort.errors.description);

  const belowBoundary = validateIncidentInput({
    title: 'abc',
    reportType: 'landslide',
    severity: 'Moderate',
    locationName: 'Shillong',
    state: 'Meghalaya',
    lat: 25.5788,
    lng: 91.8933,
    description: '123456789',
  });
  assert.equal(belowBoundary.valid, false);
  assert.ok(belowBoundary.errors.title);
  assert.equal(belowBoundary.errors.locationName, undefined);
  assert.ok(belowBoundary.errors.description);

  const exactBoundary = validateIncidentInput({
    title: 'Road',
    reportType: 'blocked_road',
    severity: 'High',
    locationName: 'Dibrugarh',
    state: 'Assam',
    lat: 27.4728,
    lng: 94.912,
    description: '1234567890',
  });
  assert.equal(exactBoundary.valid, true);
  assert.deepEqual(exactBoundary.errors, {});
});

test('mapReportTypeToMapCategory maps all report types accurately', () => {
  assert.equal(mapReportTypeToMapCategory('flood'), 'flood');
  assert.equal(mapReportTypeToMapCategory('landslide'), 'landslide');
  assert.equal(mapReportTypeToMapCategory('blocked_road'), 'landslide');
  assert.equal(mapReportTypeToMapCategory('relief_need'), 'relief_camp');
});

test('isValidNorthEastCoordinates validates geographic bounds and rejects non-finite coordinates', () => {
  assert.equal(isValidNorthEastCoordinates(26.1445, 91.7362), true);
  assert.equal(isValidNorthEastCoordinates(20, 87), true);
  assert.equal(isValidNorthEastCoordinates(30, 98), true);

  assert.equal(isValidNorthEastCoordinates(19.99, 91.7362), false);
  assert.equal(isValidNorthEastCoordinates(30.01, 91.7362), false);
  assert.equal(isValidNorthEastCoordinates(26.1445, 86.99), false);
  assert.equal(isValidNorthEastCoordinates(26.1445, 98.01), false);
  assert.equal(isValidNorthEastCoordinates(Number.NaN, 91.7362), false);
  assert.equal(isValidNorthEastCoordinates(26.1445, Number.POSITIVE_INFINITY), false);
});

test('calculateGoBagProgress handles empty, duplicate, overflowing, and zero/negative totals', () => {
  assert.deepEqual(calculateGoBagProgress([], 8), {
    checkedCount: 0,
    totalCount: 8,
    percent: 0,
  });
  assert.deepEqual(calculateGoBagProgress(['water', 'water', 'torch', 'food'], 8), {
    checkedCount: 3,
    totalCount: 8,
    percent: 38,
  });
  assert.deepEqual(calculateGoBagProgress(['a', 'b', 'c'], 2), {
    checkedCount: 2,
    totalCount: 2,
    percent: 100,
  });
  assert.deepEqual(calculateGoBagProgress(['water'], 0), {
    checkedCount: 0,
    totalCount: 0,
    percent: 0,
  });
  assert.deepEqual(calculateGoBagProgress(['water'], -5), {
    checkedCount: 0,
    totalCount: 0,
    percent: 0,
  });
});

test('formatRelativeTimestamp formats valid ISO strings and falls back for invalid/empty inputs', () => {
  assert.equal(formatRelativeTimestamp(''), 'Just now');
  assert.equal(formatRelativeTimestamp('not-a-valid-date'), 'Just now');

  const sample: Incident = INITIAL_INCIDENTS[0];
  const formatted = formatRelativeTimestamp(sample.timestamp);
  assert.notEqual(formatted, 'Just now');
  assert.ok(formatted.length > 0);
});
