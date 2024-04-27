// array with month names
const monthNames = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December',
};

// format a number in a string of two digits
export const formatTwoDigit = (digits) => String(digits).padStart(2, '0');

// parse dates and return information
export const parseDate = (date) => {
  const parsedDate = new Date(date);
  const monthNumber = parsedDate.getUTCMonth() + 1;
  const monthFormatted = formatTwoDigit(monthNumber);
  const year = 2021
  const daysOfMonth = new Date(year, monthFormatted, 0).getUTCDate();
  const name = monthNames[monthNumber];

  return { monthFormatted, monthNumber, daysOfMonth, year, name, parsedDate };
};

// sort events
export const sortEvents = (events) =>
  [...events].sort(
    (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end)
  );

// get differents month from events for render the calendar
export const getMonths = (events) => {
  const uniqueMonths = new Set(
    events.map((event) => new Date(event.end).getUTCMonth() + 1)
  );

  return Array.from(uniqueMonths).map((month) =>
    parseDate(Date.UTC(2021, month - 1))
  );
};

// calculate number fo days between two dates
export const getDaysBetweenTwoDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let diff = (end - start) / (1000 * 60 * 60 * 24);

  const startMonth = start.getUTCMonth();
  const endMonth = end.getUTCMonth();

  if (startMonth !== endMonth) {
    diff -= end.getUTCDate();
  }

  return Math.round(diff + 1);
};