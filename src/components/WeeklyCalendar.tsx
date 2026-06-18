import { useTranslation } from 'react-i18next';
import { User } from '../db/database';

export function WeeklyCalendar({ user }: { user: User }) {
  const { t } = useTranslation();

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>{t('app_title')}</h1>
      <p>Welcome, {user.firstName} {user.lastName}</p>
      <p>Weekly Calendar View Coming Soon...</p>
    </div>
  );
}
