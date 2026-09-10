const test = require('node:test');
const assert = require('node:assert/strict');
const { applyTransportationChecklist } = require('../tripPlanChecklist');

test('자차 코스 체크리스트는 대중교통 배차 안내를 주차·혼잡 안내로 바꾼다', () => {
  const checklist = applyTransportationChecklist([
    '미술관 전시 예약 확인',
    '이동 교통수단 및 배차 간격 확인',
    '예산 내 지출 관리',
  ], '자차');

  assert.deepEqual(checklist, [
    '방문지 주차 가능 여부·주차 요금·도로 혼잡 구간 확인',
    '미술관 전시 예약 확인',
    '예산 내 지출 관리',
  ]);
});

test('대중교통과 도보 코스에는 각각 맞는 이동 준비 항목을 넣는다', () => {
  assert.equal(
    applyTransportationChecklist(['주차 가능 여부 확인'], '대중교통')[0],
    '교통카드·환승 경로 및 배차 간격 확인'
  );
  assert.equal(
    applyTransportationChecklist(['배차 간격 확인'], '도보')[0],
    '도보 이동 거리·경사·편한 신발 확인'
  );
});
