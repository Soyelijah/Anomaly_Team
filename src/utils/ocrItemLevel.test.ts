import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readItemLevelFromTitle } from './ocrItemLevel.ts';

test('a level absent from the title is +0 even if an option contains a plus number', () => {
  assert.deepEqual(
    readItemLevelFromTitle('[RARE] WINGS OF MAGIC\nAdditional Curse Spell +4\nMax AG +30 increased'),
    { itemLevel: '+0', levelDetected: false },
  );
});

test('reads the enhancement only from the item title', () => {
  assert.deepEqual(
    readItemLevelFromTitle('[RARE] WINGS OF MAGIC +7\nAdditional Curse Spell +4'),
    { itemLevel: '+7', levelDetected: true },
  );
});
