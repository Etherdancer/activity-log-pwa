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
