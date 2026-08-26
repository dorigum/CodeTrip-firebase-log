export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const getTodayKey = () => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(new Date())
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value])
  );
  return `${parts.year}${parts.month}${parts.day}`;
};

export const parseDateKey = (dateKey) => {
  const normalized = String(dateKey || '').replace(/\D/g, '').slice(0, 8);
  if (normalized.length !== 8) return null;

  const year = Number(normalized.slice(0, 4));
  const month = Number(normalized.slice(4, 6));
  const day = Number(normalized.slice(6, 8));
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime())
    || date.getFullYear() !== year
    || date.getMonth() + 1 !== month
    || date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const getDaysFromToday = (dateKey, todayKey) => {
  const targetDate = parseDateKey(dateKey);
  const todayDate = parseDateKey(todayKey);
  if (!targetDate || !todayDate) return Number.POSITIVE_INFINITY;
  return Math.round((targetDate - todayDate) / MS_PER_DAY);
};
