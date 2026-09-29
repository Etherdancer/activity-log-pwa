export function formatDisplayTime(timeStr: string | undefined, language: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
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

/** Minutes since midnight for "HH:mm" (0 for empty/invalid). */
export function parseTimeToMinutes(t: string | undefined): number {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

/**
 * Start/end of an activity in minutes since midnight. A missing end means one hour; an end
 * before the start means the activity runs past midnight.
 */
export function activitySpan(startTime: string, endTime?: string): { start: number; end: number } {
  const start = parseTimeToMinutes(startTime);
  let end = endTime ? parseTimeToMinutes(endTime) : start + 60;
  if (end < start) end += 24 * 60;
  return { start, end };
}

/**
 * Assigns overlapping items to side-by-side lanes (like calendar apps do).
 * Returns, per item index, its lane and the number of lanes in its overlap group.
 */
export function layoutLanes(spans: { start: number; end: number }[]): { lane: number; lanes: number }[] {
  const order = spans.map((s, i) => ({ ...s, i })).sort((a, b) => a.start - b.start || b.end - a.end);
  const result: { lane: number; lanes: number }[] = new Array(spans.length);
  let group: typeof order = [];
  let laneEnds: number[] = [];
  let groupEnd = -Infinity;

  const flush = () => {
    for (const g of group) result[g.i].lanes = laneEnds.length;
    group = []; laneEnds = [];
  };

  for (const item of order) {
    if (item.start >= groupEnd) { flush(); groupEnd = -Infinity; }
    let lane = laneEnds.findIndex(end => end <= item.start);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(item.end); } else { laneEnds[lane] = item.end; }
    result[item.i] = { lane, lanes: 0 };
    group.push(item);
    groupEnd = Math.max(groupEnd, item.end);
  }
  flush();
  return result;
}
