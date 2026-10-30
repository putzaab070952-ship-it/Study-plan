/**
 * Date and Time Utilities for Asia/Bangkok timezone
 * Format: DD/MM/YYYY and 24-hour HH:MM
 */

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
export const THAI_DAYS_FULL = [
  'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
];

/**
 * Gets current date string in Asia/Bangkok as YYYY-MM-DD
 */
export function getBangkokToday(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date()); // Outputs YYYY-MM-DD
}

/**
 * Gets current time string in Asia/Bangkok as HH:MM (24-hour)
 */
export function getBangkokNowTime(): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(new Date());
}

/**
 * Formats YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateDDMMYYYY(dateStr?: string): string {
  if (!dateStr || !dateStr.includes('-')) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Formats YYYY-MM-DD to full or friendly Thai string
 * e.g. "26 ต.ค. 2026" or "วันจันทร์ที่ 26 ตุลาคม 2026"
 */
export function formatDateThai(dateStr?: string, full: boolean = false): string {
  if (!dateStr || !dateStr.includes('-')) return '-';
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const dateObj = new Date(year, month, day);
  const dayOfWeek = dateObj.getDay();

  if (full) {
    return `${THAI_DAYS_FULL[dayOfWeek]}ที่ ${day} ${THAI_MONTHS_FULL[month]} ${year}`;
  }
  return `${day} ${THAI_MONTHS_SHORT[month]} ${year}`;
}

/**
 * Formats duration in minutes to readable Thai string (e.g. "1 ชม. 30 นาที" or "45 นาที")
 */
export function formatMinutesThai(minutes: number): string {
  if (minutes <= 0) return '0 นาที';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} นาที`;
  if (m === 0) return `${h} ชม.`;
  return `${h} ชม. ${m} นาที`;
}

/**
 * Adds N days to YYYY-MM-DD
 */
export function addDays(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Calculates day difference: date1 - date2 in days
 * Positive means date1 is in future relative to date2
 */
export function diffDays(date1: string, date2: string): number {
  if (!date1 || !date2) return 0;
  const [y1, m1, d1] = date1.split('-').map(Number);
  const [y2, m2, d2] = date2.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((t1 - t2) / msPerDay);
}

/**
 * Checks if a task due date is overdue compared to reference date (default Bangkok today)
 */
export function isOverdue(dueDate: string, referenceDate: string = getBangkokToday()): boolean {
  if (!dueDate) return false;
  return dueDate < referenceDate;
}

/**
 * Gets 7 days of the week containing centerDateStr (starting from Monday)
 */
export function getWeekDays(centerDateStr: string): string[] {
  const [year, month, day] = centerDateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const dayOfWeek = dateObj.getUTCDay();
  // distance to Monday: if Sunday (0) -> -6 days; otherwise -(dayOfWeek - 1)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(dateObj);
  monday.setUTCDate(monday.getUTCDate() + diffToMonday);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setUTCDate(cur.getUTCDate() + i);
    days.push(cur.toISOString().split('T')[0]);
  }
  return days;
}

/**
 * Generates month calendar grid matrix (6 weeks x 7 days)
 */
export function getMonthMatrix(year: number, month: number): Array<Array<{ date: string; isCurrentMonth: boolean; dayOfMonth: number }>> {
  // month is 1-indexed (1 = Jan, 12 = Dec)
  const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startDayOfWeek = firstDayOfMonth.getUTCDay(); // 0 is Sun, 1 is Mon
  const diffToMonday = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek;

  const startDate = new Date(firstDayOfMonth);
  startDate.setUTCDate(startDate.getUTCDate() + diffToMonday);

  const matrix: Array<Array<{ date: string; isCurrentMonth: boolean; dayOfMonth: number }>> = [];
  let cur = new Date(startDate);

  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = cur.toISOString().split('T')[0];
      const curMonth = cur.getUTCMonth() + 1;
      week.push({
        date: dateStr,
        isCurrentMonth: curMonth === month,
        dayOfMonth: cur.getUTCDate()
      });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    matrix.push(week);
  }
  return matrix;
}
