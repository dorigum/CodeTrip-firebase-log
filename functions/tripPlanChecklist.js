const TRANSPORTATION_CHECKLIST = {
  대중교통: '교통카드·환승 경로 및 배차 간격 확인',
  자차: '방문지 주차 가능 여부·주차 요금·도로 혼잡 구간 확인',
  도보: '도보 이동 거리·경사·편한 신발 확인',
};

const TRANSPORTATION_KEYWORD_PATTERN = /교통수단|교통카드|환승|배차|막차|주차|운전|주유|도로 혼잡|도보|보행|경사|신발/;

const normalizeChecklist = (checklist) => (
  Array.isArray(checklist)
    ? checklist
      .map((item) => String(item || '').trim())
      .filter(Boolean)
    : []
);

const applyTransportationChecklist = (checklist, transportation) => {
  const transportationGuide = TRANSPORTATION_CHECKLIST[transportation]
    || TRANSPORTATION_CHECKLIST.대중교통;
  const nonTransportationItems = normalizeChecklist(checklist)
    .filter((item) => !TRANSPORTATION_KEYWORD_PATTERN.test(item));

  return [transportationGuide, ...nonTransportationItems].slice(0, 5);
};

module.exports = {
  applyTransportationChecklist,
};
