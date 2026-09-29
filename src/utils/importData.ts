import type { Activity, User } from '../db/database';

/** Shape of an export file / share link after validation. */
export interface ExportPayload {
  user: Pick<User, 'firstName' | 'lastName' | 'colorTheme' | 'createdAt'>;
  activities: Omit<Activity, 'userId'>[];
}

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_TEXT = 500;
const MAX_ACTIVITIES = 20_000;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const str = (v: unknown, max = MAX_TEXT) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * Validates untrusted import data (a JSON file or a share link anyone could craft).
 * Only known fields are kept; malformed activities are dropped. Returns null if the
 * payload isn't an activity-log export at all.
 */
export function parseImportPayload(raw: unknown): ExportPayload | null {
  if (!isObj(raw) || !isObj(raw.user) || !Array.isArray(raw.activities)) return null;
  const firstName = str(raw.user.firstName, 100);
  if (!firstName) return null;

  const activities: ExportPayload['activities'] = [];
  for (const a of raw.activities.slice(0, MAX_ACTIVITIES)) {
    if (!isObj(a)) continue;
    const date = str(a.date, 10);
    const startTime = str(a.startTime, 5);
    const endTime = str(a.endTime, 5);
    const description = str(a.description);
    if (!DATE_RE.test(date) || !TIME_RE.test(startTime) || !description) continue;
    activities.push({
      id: typeof a.id === 'string' && a.id.length <= 64 ? a.id : undefined,
      date,
      startTime,
      endTime: TIME_RE.test(endTime) ? endTime : undefined,
      description,
      createdAt: typeof a.createdAt === 'number' && Number.isFinite(a.createdAt) ? a.createdAt : Date.now(),
    });
  }

  return {
    user: {
      firstName,
      lastName: str(raw.user.lastName, 100),
      colorTheme: str(raw.user.colorTheme, 30) || 'ocean',
      createdAt: typeof raw.user.createdAt === 'number' ? raw.user.createdAt : Date.now(),
    },
    activities,
  };
}

export function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

/** Same activity content (ignoring id/createdAt): used to skip exact duplicates on import. */
export function sameActivity(a: Pick<Activity, 'date' | 'startTime' | 'endTime' | 'description'>,
                             b: Pick<Activity, 'date' | 'startTime' | 'endTime' | 'description'>): boolean {
  return a.date === b.date && a.startTime === b.startTime &&
    (a.endTime || '') === (b.endTime || '') && a.description === b.description;
}
