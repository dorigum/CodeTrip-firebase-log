const test = require('node:test');
const assert = require('node:assert/strict');
const { applyCompanionConsistency, applyTransportationChecklist } = require('../tripPlanChecklist');

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

test('혼자 여행 코스에서는 친구 여행 표현을 혼자 여행 표현으로 보정한다', () => {
  const plan = applyCompanionConsistency({
    title: '서울 문화 친구 여행',
    summary: '친구와 함께 미술관을 둘러보는 일정',
    tags: ['친구 여행'],
    days: [{ theme: '친구와 함께하는 전시 탐방', items: [{ reason: '친구랑 함께 즐기기 좋습니다.', tip: '친구와 여행하세요.' }] }],
    saveGuide: { folderName: '친구 여행 서울', memo: '친구와 함께 방문' },
  }, '혼자');

  assert.equal(plan.title, '서울 문화 혼자 여행');
  assert.equal(plan.summary, '혼자 미술관을 둘러보는 일정');
  assert.deepEqual(plan.tags, ['혼자 여행']);
  assert.equal(plan.days[0].theme, '혼자 하는 전시 탐방');
  assert.equal(plan.days[0].items[0].reason, '혼자 즐기기 좋습니다.');
  assert.equal(plan.saveGuide.folderName, '혼자 여행 서울');
});

test('가족 세부 유형이 없거나 형제·자매이면 부모님 표현을 일반 가족 일행으로 보정한다', () => {
  const plan = applyCompanionConsistency({
    title: '부모님과 함께하는 부산 여행',
    summary: '부모님 동반으로 여유롭게 즐기는 일정',
    days: [{ theme: '부모님과의 바다 산책', items: [{ reason: '부모님과 함께 걷기 좋습니다.' }] }],
  }, '가족', '형제·자매');

  assert.equal(plan.title, '가족과 함께하는 부산 여행');
  assert.equal(plan.summary, '가족 일행으로 여유롭게 즐기는 일정');
  assert.equal(plan.days[0].theme, '가족과의 바다 산책');
  assert.equal(plan.days[0].items[0].reason, '가족과 함께 걷기 좋습니다.');
});

test('부모님·자녀 동반을 명시한 가족 코스는 부모님 표현을 유지한다', () => {
  const plan = applyCompanionConsistency({ title: '부모님과 함께하는 부산 여행' }, '가족', '부모님·자녀 동반');

  assert.equal(plan.title, '부모님과 함께하는 부산 여행');
});
