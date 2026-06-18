import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  startOfWeek, 
  addDays, 
  format, 
  isSameDay, 
  eachWeekOfInterval,
  parseISO
} from 'date-fns';
import { hr, enUS } from 'date-fns/locale';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import './WeeklyCalendar.css'; // Reuse calendar styles

interface PrintViewProps {
  config: { userId: number; startDate: string; endDate: string };
  onReady: () => void;
}

export function PrintView({ config, onReady }: PrintViewProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'hr' ? hr : enUS;

  const user = useLiveQuery(() => db.users.get(config.userId), [config.userId]);
  
  // Calculate all weeks involved in the range
  const weeks = useMemo(() => {
    try {
      const start = parseISO(config.startDate);
      const end = parseISO(config.endDate);
      const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
      return weekStarts.length > 0 ? weekStarts : [startOfWeek(start, { weekStartsOn: 1 })];
    } catch {
      return [];
    }
  }, [config.startDate, config.endDate]);

  // Fetch all activities in range
  const activities = useLiveQuery(
    () => db.activities
      .where('[userId+date]')
      .between([config.userId, config.startDate], [config.userId, config.endDate], true, true)
      .toArray(),
    [config.userId, config.startDate, config.endDate]
  );

  useEffect(() => {
    // When user and activities are fully loaded, trigger onReady
    if (user !== undefined && activities !== undefined) {
      // Small timeout to ensure DOM is updated before print
      const timer = setTimeout(() => {
        onReady();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, activities, onReady]);

  if (!user || !activities) {
    return <div className="printable-content">Loading print view...</div>;
  }

  const hours = Array.from({ length: 24 }).map((_, i) => i);

  return (
    <div className="printable-content" style={{ background: 'white' }}>
      {weeks.map((weekStart, idx) => {
        const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
        
        return (
          <div key={idx} className="print-page" style={{ pageBreakAfter: 'always', marginBottom: '2rem' }}>
            <div className="calendar-header">
              <h2>{user.firstName} {user.lastName} - {t('week_of')} {format(weekStart, 'PP', { locale })}</h2>
            </div>
            
            <div className="calendar-grid-wrapper">
              <div className="calendar-grid">
                {/* Time Column */}
                <div className="time-col">
                  <div className="time-header"></div>
                  {hours.map(hour => (
                    <div key={`time-${hour}`} className="time-slot">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Days Columns */}
                {weekDays.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayActivities = activities.filter(a => a.date === dateStr);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div key={dateStr} className="day-col">
                      <div className={`day-header ${isToday ? 'is-today' : ''}`}>
                        <span className="day-name">{format(day, 'EEEE', { locale })}</span>
                        <span className="date-num">{format(day, 'd')}</span>
                      </div>
                      
                      {hours.map(hour => {
                        const hourStr = hour.toString().padStart(2, '0');
                        const actsInHour = dayActivities.filter(a => a.startTime.startsWith(hourStr + ':'));

                        return (
                          <div key={`${dateStr}-${hour}`} className="hour-cell">
                            {actsInHour.map(act => (
                              <div key={act.id} className="activity-item" title={act.description}>
                                {act.startTime} {act.description}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
