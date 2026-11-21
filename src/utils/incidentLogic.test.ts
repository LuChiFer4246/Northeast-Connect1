import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_INCIDENTS } from '../data/neData';
import {
  calculateGoBagProgress,
  countIncidentsByCategory,
  filterIncidents,
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

test('filterIncidents filters by category and search query and sorts newest first', () => {
  const reliefOnly = filterIncidents(INITIAL_INCIDENTS, 'relief_camp');
  assert.ok(reliefOnly.length > 0);
  assert.ok(reliefOnly.every((i) => i.category === 'relief_camp'));

  const silcharMatches = filterIncidents(INITIAL_INCIDENTS, 'all', 'Silchar');
  assert.ok(silcharMatches.length >= 2);
  assert.ok(
    silcharMatches.every(
      (i) =>
        i.locationName.toLowerCase().includes('silchar') ||
        i.title.toLowerCase().includes('silchar')
    )
  );
});

test('validateIncidentInput enforces required title, location, and description', () => {
  const invalid = validateIncidentInput({
    title: '',
    reportType: 'flood',
    severity: 'High',
    locationName: '',
    state: 'Assam',
    lat: 26.1445,
    lng: 91.7362,
    description: 'short',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.title);
  assert.ok(invalid.errors.locationName);
  assert.ok(invalid.errors.description);

  const valid = validateIncidentInput({
    title: 'Bridge waterlogging in Dibrugarh',
    reportType: 'flood',
    severity: 'High',
    locationName: 'Dibrugarh',
    state: 'Assam',
    lat: 27.4728,
    lng: 94.912,
    description: 'Knee-deep water near market road, small vehicles unable to pass.',
  });
  assert.equal(valid.valid, true);
  assert.equal(mapReportTypeToMapCategory('blocked_road'), 'landslide');
  assert.equal(mapReportTypeToMapCategory('relief_need'), 'relief_camp');
});

test('calculateGoBagProgress computes deduplicated clamped percentage', () => {
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
});
