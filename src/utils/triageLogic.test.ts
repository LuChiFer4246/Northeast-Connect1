import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsAppShareUrl,
  formatCoordinates,
  runOfflineTriage,
  validateTriageMessage,
} from './triageLogic';

test('validateTriageMessage rejects empty and too-short messages', () => {
  assert.equal(validateTriageMessage('').valid, false);
  assert.equal(validateTriageMessage('   ').valid, false);
  assert.equal(validateTriageMessage('help').valid, false);
  assert.equal(validateTriageMessage('Water rising near Jorhat home').valid, true);
});

test('runOfflineTriage classifies Jorhat flood + elderly insulin as Critical Medical with 108 & GPS', () => {
  const result = runOfflineTriage({
    message: 'Water entered ground floor near Jorhat, elderly grandfather needs insulin',
    lat: 26.7509,
    lng: 94.2037,
    locationLabel: 'Jorhat, Assam',
  });

  assert.equal(result.urgency, 'Critical');
  assert.equal(result.category, 'Medical');
  assert.equal(result.recommendedHelpline, '108');
  assert.equal(result.immediateSteps.length, 3);
  assert.ok(result.sosMessage.includes('26.7509, 94.2037'));
  assert.ok(result.sosMessage.includes('CRITICAL'));
  assert.equal(result.source, 'offline-fallback');
});

test('runOfflineTriage classifies Haflong mudslide road blockage as Landslide with 1070', () => {
  const result = runOfflineTriage({
    message: 'Huge mudslide blocked the hill road near Haflong, vehicles stuck',
  });

  assert.equal(result.category, 'Landslide');
  assert.equal(result.recommendedHelpline, '1070');
  assert.equal(result.immediateSteps.length, 3);
});

test('runOfflineTriage classifies house fire as Critical Fire/Rescue with 112', () => {
  const result = runOfflineTriage({
    message: 'Gas cylinder fire in kitchen, family trapped in room',
  });

  assert.equal(result.urgency, 'Critical');
  assert.equal(result.category, 'Fire/Rescue');
  assert.equal(result.recommendedHelpline, '112');
});

test('formatCoordinates and buildWhatsAppShareUrl format properly', () => {
  assert.equal(formatCoordinates(26.144512, 91.736298), '26.1445, 91.7363');
  assert.equal(formatCoordinates(null, null), null);
  const waUrl = buildWhatsAppShareUrl('SOS [CRITICAL]\nNeed help');
  assert.ok(waUrl.startsWith('https://wa.me/?text='));
  assert.ok(waUrl.includes('SOS%20%5BCRITICAL%5D'));
});
