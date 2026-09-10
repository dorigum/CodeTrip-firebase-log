const TRANSPORTATION_CHECKLIST = {
  대중교통: '교통카드·환승 경로 및 배차 간격 확인',
  자차: '방문지 주차 가능 여부·주차 요금·도로 혼잡 구간 확인',
  도보: '도보 이동 거리·경사·편한 신발 확인',
};

const TRANSPORTATION_KEYWORD_PATTERN = /교통수단|교통카드|환승|배차|막차|주차|운전|주유|도로 혼잡|도보|보행|경사|신발/;
const SOLO_COMPANION_REPLACEMENTS = [
  [/친구(?:들)?과 함께하는/g, '혼자 하는'],
  [/친구(?:들)?와 함께하는/g, '혼자 하는'],
  [/친구(?:들)?랑 함께하는/g, '혼자 하는'],
  [/친구(?:들)?과 함께/g, '혼자'],
  [/친구(?:들)?와 함께/g, '혼자'],
  [/친구(?:들)?랑 함께/g, '혼자'],
  [/친구(?:들)? 여행/g, '혼자 여행'],
  [/친구(?:들)?와 여행/g, '혼자 여행'],
  [/친구(?:들)?랑 여행/g, '혼자 여행'],
];

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

const replaceSoloCompanionText = (value) => SOLO_COMPANION_REPLACEMENTS.reduce(
  (text, [pattern, replacement]) => text.replace(pattern, replacement),
  String(value || '')
);

const applyCompanionConsistency = (plan, companionType) => {
  if (companionType !== '혼자' || !plan || typeof plan !== 'object') return plan;

  const normalizeText = (value) => replaceSoloCompanionText(value);
  const normalizeItem = (item) => ({
    ...item,
    reason: normalizeText(item?.reason),
    tip: normalizeText(item?.tip),
  });

  return {
    ...plan,
    title: normalizeText(plan.title),
    summary: normalizeText(plan.summary),
    tags: Array.isArray(plan.tags) ? plan.tags.map(normalizeText) : plan.tags,
    warnings: Array.isArray(plan.warnings) ? plan.warnings.map(normalizeText) : plan.warnings,
    days: Array.isArray(plan.days)
      ? plan.days.map((day) => ({
        ...day,
        theme: normalizeText(day?.theme),
        items: Array.isArray(day?.items) ? day.items.map(normalizeItem) : day?.items,
      }))
      : plan.days,
    saveGuide: plan.saveGuide
      ? {
        ...plan.saveGuide,
        folderName: normalizeText(plan.saveGuide.folderName),
        memo: normalizeText(plan.saveGuide.memo),
      }
      : plan.saveGuide,
  };
};

module.exports = {
  applyTransportationChecklist,
  applyCompanionConsistency,
};
