export function formatDisplayTime(timeStr: string | undefined, language: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';

  if (isNaN(h)) return timeStr;

  if (language === 'en') {
    const ampm = h >= 12 ? 'PM' : 'AM';
    let displayH = h % 12;
    if (displayH === 0) displayH = 12;
    return `${displayH}:${m} ${ampm}`;
  }

  // default 24h format for 'hr' or others
  return `${h.toString().padStart(2, '0')}:${m}`;
}

/**
 * Formats a Date for display to the user.
 * Croatian (hr): DD/MM/YYYY
 * English (en): MM/DD/YYYY
 */
export function formatDisplayDate(date: Date, language: string): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();

  if (language === 'en') {
    return `${m}/${d}/${y}`;
  }

  // Croatian and default: DD/MM/YYYY
  return `${d}/${m}/${y}`;
}
