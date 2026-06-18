import Dexie, { type EntityTable } from 'dexie';

export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  colorTheme: string;
  createdAt: number;
}

export interface Activity {
  id?: string; // UUID for easier import/export merging
  userId: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime?: string; // HH:mm (24h) optional if just a point in time
  description: string;
  createdAt: number;
}

const db = new Dexie('ActivityLogDatabase') as Dexie & {
  users: EntityTable<User, 'id'>;
  activities: EntityTable<Activity, 'id'>;
};

// Schema declaration
db.version(1).stores({
  users: '++id, firstName, lastName, createdAt',
  activities: 'id, userId, date, startTime, createdAt, [userId+date]' // Compound index for fast querying by day
});

export type { EntityTable };
export { db };
