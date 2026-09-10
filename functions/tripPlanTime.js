const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const isValidTripTime = (value) => TIME_PATTERN.test(String(value || ''));

const toMinutes = (value) => {
  if (!isValidTripTime(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
};

const isValidTripTimeRange = (startTime, endTime) => {
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  return startMinutes != null && endMinutes != null && endMinutes > startMinutes;
};

module.exports = {
  isValidTripTime,
  isValidTripTimeRange,
};
