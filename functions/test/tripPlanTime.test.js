const test = require('node:test');
const assert = require('node:assert/strict');
const { isValidTripTimeRange } = require('../tripPlanTime');

test('종료 시간은 시작 시간보다 늦어야 한다', () => {
  assert.equal(isValidTripTimeRange('10:00', '18:00'), true);
  assert.equal(isValidTripTimeRange('10:00', '10:00'), false);
  assert.equal(isValidTripTimeRange('10:00', '06:00'), false);
});

test('시간 형식이 올바르지 않으면 일정 시간 범위가 유효하지 않다', () => {
  assert.equal(isValidTripTimeRange('25:00', '18:00'), false);
  assert.equal(isValidTripTimeRange('10:00', '18:99'), false);
});
