import assert from 'node:assert/strict';
import { toTourApiAreaCodeSet } from './tourApiAreaCode.js';

assert.deepEqual(
  [...toTourApiAreaCodeSet(['11', '26', '41'])].sort(),
  ['1', '6', '31'].sort(),
);
assert.deepEqual(
  [...toTourApiAreaCodeSet({ seoul: '11', jeju: '50' })].sort(),
  ['1', '39'].sort(),
);
assert.deepEqual([...toTourApiAreaCodeSet(['31'])], ['7']);
assert.deepEqual([...toTourApiAreaCodeSet(['999'])], ['999']);
assert.deepEqual([...toTourApiAreaCodeSet([])], []);

console.log('TourAPI area code mapping tests passed.');
