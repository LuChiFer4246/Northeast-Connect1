import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsAppShareUrl,
  formatCoordinates,
  isValidHelpline,
  normalizeAiTriagePayload,
  runOfflineTriage,
  sanitizeHelpline,
  shouldUseOfflineTriageFallback,
  validateTriageMessage,
  VERIFIED_HELPLINE_NUMBERS,
} from './triageLogic';

test('validateTriageMessage rejects empty, whitespace-only, and too-short messages', () => {
  assert.equal(validateTriageMessage('').valid, false);
  assert.equal(validateTriageMessage('   \t\n  ').valid, false);
  assert.equal(validateTriageMessage('help').valid, false);
  assert.equal(validateTriageMessage('  sos ').valid, false);

  const exactMinLength = validateTriageMessage('flood');
  assert.equal(exactMinLength.valid, true);
  assert.equal(exactMinLength.error, undefined);
  assert.equal(validateTriageMessage('Water rising near Jorhat home').valid, true);
});

test('shouldUseOfflineTriageFallback triggers for missing, blank, or placeholder API keys', () => {
  assert.equal(shouldUseOfflineTriageFallback(undefined), true);
  assert.equal(shouldUseOfflineTriageFallback(null), true);
  assert.equal(shouldUseOfflineTriageFallback(''), true);
  assert.equal(shouldUseOfflineTriageFallback('   '), true);
  assert.equal(shouldUseOfflineTriageFallback('MY_GEMINI_API_KEY'), true);
  assert.equal(shouldUseOfflineTriageFallback('  MY_GEMINI_API_KEY  '), true);
  assert.equal(shouldUseOfflineTriageFallback('AIzaSyRealConfiguredKey123'), false);
});

test('isValidHelpline and sanitizeHelpline accept only verified NE numbers and default invalid ones to 112', () => {
  for (const num of VERIFIED_HELPLINE_NUMBERS) {
    assert.equal(isValidHelpline(num), true);
    assert.equal(sanitizeHelpline(num), num);
  }

  const invalidValues: unknown[] = [
    '',
    '   ',
    '911',
    '999',
    '100',
    '108 ',
    ' 1079',
    108,
    null,
    undefined,
    {},
  ];

  for (const bad of invalidValues) {
    assert.equal(isValidHelpline(bad), false);
    assert.equal(sanitizeHelpline(bad), '112');
  }
});

test('normalizeAiTriagePayload sanitizes invalid helplines and backfills missing AI fields', () => {
  const labelFor = (num: string) => `Verified (${num})`;

  const withInvalidHelpline = normalizeAiTriagePayload(
    {
      urgency: 'High',
      category: 'Flood',
      recommendedHelpline: '911',
      immediateSteps: ['Move upstairs safely.', '   ', 42],
      sosMessage: 'too short',
    },
    {
      message: 'Flood water rising near Silchar embankment',
      lat: 24.8333,
      lng: 92.7789,
      locationLabel: 'Silchar, Assam',
    },
    labelFor
  );

  assert.equal(withInvalidHelpline.recommendedHelpline, '112');
  assert.equal(withInvalidHelpline.recommendedHelplineLabel, 'Verified (112)');
  assert.equal(withInvalidHelpline.immediateSteps.length, 3);
  assert.equal(withInvalidHelpline.immediateSteps[0], 'Move upstairs safely.');
  assert.ok(withInvalidHelpline.immediateSteps[1].length > 0);
  assert.ok(withInvalidHelpline.immediateSteps[2].length > 0);
  assert.ok(withInvalidHelpline.sosMessage.includes('24.8333, 92.7789'));
  assert.equal(withInvalidHelpline.source, 'gemini');

  const withMalformedPayload = normalizeAiTriagePayload(
    null,
    { message: 'House fire in Guwahati kitchen' },
    labelFor
  );

  assert.equal(withMalformedPayload.recommendedHelpline, '112');
  assert.equal(withMalformedPayload.urgency, 'Critical');
  assert.equal(withMalformedPayload.category, 'Fire/Rescue');
  assert.equal(withMalformedPayload.immediateSteps.length, 3);
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
  assert.ok(result.immediateSteps[0].toLowerCase().includes('dry floor'));
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

test('runOfflineTriage escalates landslide with trapped people to Critical', () => {
  const result = runOfflineTriage({
    message: 'Landslide debris near Shillong highway, two passengers trapped inside car',
  });

  assert.equal(result.category, 'Landslide');
  assert.equal(result.urgency, 'Critical');
  assert.equal(result.recommendedHelpline, '1070');
});

test('runOfflineTriage classifies house fire as Critical Fire/Rescue with 112', () => {
  const result = runOfflineTriage({
    message: 'Gas cylinder fire in kitchen, family trapped in room',
  });

  assert.equal(result.urgency, 'Critical');
  assert.equal(result.category, 'Fire/Rescue');
  assert.equal(result.recommendedHelpline, '112');
});

test('runOfflineTriage handles empty input, moderate requests, long messages, and missing GPS gracefully', () => {
  const emptyResult = runOfflineTriage({ message: '   ' });
  assert.equal(emptyResult.source, 'offline-fallback');
  assert.equal(emptyResult.immediateSteps.length, 3);
  assert.ok(isValidHelpline(emptyResult.recommendedHelpline));
  assert.ok(emptyResult.sosMessage.includes('North East India (share landmark)'));

  const moderateResult = runOfflineTriage({
    message: 'Power cut and water supply delayed, need shelter info and ration update',
    lat: Number.NaN,
    lng: Number.POSITIVE_INFINITY,
  });
  assert.equal(moderateResult.urgency, 'Moderate');
  assert.equal(moderateResult.sosMessage.includes('GPS:'), false);

  const longMessage = 'Flood water entering homes across the entire neighborhood '.repeat(4);
  const longResult = runOfflineTriage({ message: longMessage });
  assert.ok(longResult.sosMessage.includes('...'));
});

test('formatCoordinates and buildWhatsAppShareUrl handle valid and invalid edge cases', () => {
  assert.equal(formatCoordinates(26.144512, 91.736298), '26.1445, 91.7363');
  assert.equal(formatCoordinates(null, null), null);
  assert.equal(formatCoordinates(undefined, 91.7362), null);
  assert.equal(formatCoordinates(26.1445, null), null);
  assert.equal(formatCoordinates(Number.NaN, 91.7362), null);
  assert.equal(formatCoordinates(26.1445, Number.POSITIVE_INFINITY), null);

  assert.equal(buildWhatsAppShareUrl(''), 'https://wa.me/?text=');
  const waUrl = buildWhatsAppShareUrl('SOS [CRITICAL]\nNeed help & boat');
  assert.ok(waUrl.startsWith('https://wa.me/?text='));
  assert.ok(waUrl.includes('SOS%20%5BCRITICAL%5D'));
  assert.ok(waUrl.includes('%26%20boat'));
});
