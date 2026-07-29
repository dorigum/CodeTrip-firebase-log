export const getPlanContentId = (item = {}) =>
  item.contentId || item.contentid || item.content_id || '';

export const getPlanSourceType = (item = {}) => {
  if (item.tourApiVerified) return 'verified';
  if (item.source === 'ai_generated' || !getPlanContentId(item)) return 'suggested';
  return 'candidate';
};

export const canOpenPlanDetail = (item = {}) =>
  getPlanSourceType(item) === 'verified' && !!getPlanContentId(item);

export const getPlanSourceBadge = (item = {}) => {
  const sourceType = getPlanSourceType(item);

  if (sourceType === 'verified') {
    return {
      label: '공식 여행지',
      className: 'bg-primary/10 text-primary ring-1 ring-primary/15',
    };
  }

  if (sourceType === 'suggested') {
    return {
      label: '코스 추천',
      className: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
    };
  }

  return {
    label: '공식 후보',
    className: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  };
};
