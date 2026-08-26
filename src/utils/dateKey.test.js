import assert from 'node:assert/strict';
import { getDaysFromToday, parseDateKey } from './dateKey.js';

assert.equal(parseDateKey('20260231'), null);
assert.equal(parseDateKey('20261301'), null);
assert.equal(parseDateKey('20260001'), null);
assert.equal(parseDateKey('20260228')?.getFullYear(), 2026);
assert.equal(parseDateKey('2026.02.28')?.getMonth(), 1);
assert.equal(getDaysFromToday('20260231', '20260228'), Number.POSITIVE_INFINITY);
assert.equal(getDaysFromToday('20260301', '20260228'), 1);

console.log('dateKey validation passed');
