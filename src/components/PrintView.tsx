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
import { formatDisplayTime } from '../utils/time';
import './WeeklyCalendar.css'; // Reuse calendar styles

interface PrintViewProps {
  config: { userId: number; startDate: string; endDate: string; startHour: number; endHour: number; isEmptyTemplate?: boolean };
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
  const fetchedActivities = useLiveQuery(
    () => db.activities
      .where('[userId+date]')
      .between([config.userId, config.startDate], [config.userId, config.endDate], true, true)
      .toArray(),
    [config.userId, config.startDate, config.endDate]
  );

  const activities = config.isEmptyTemplate ? [] : (fetchedActivities || []);

  useEffect(() => {
    // When user (if needed) and activities are fully loaded, trigger onReady
    if ((config.isEmptyTemplate || user !== undefined) && (config.isEmptyTemplate || fetchedActivities !== undefined)) {
      // Small timeout to ensure DOM is updated before print
      const timer = setTimeout(() => {
        onReady();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, fetchedActivities, config.isEmptyTemplate, onReady]);

  if ((!user && !config.isEmptyTemplate) || (!fetchedActivities && !config.isEmptyTemplate)) {
    return <div className="printable-content">Loading print view...</div>;
  }

  const hoursLength = Math.max(1, config.endHour - config.startHour + 1);
  const hours = Array.from({ length: hoursLength }).map((_, i) => config.startHour + i);

  return (
    <div className="printable-content" style={{ background: 'white' }}>
      {weeks.map((weekStart, idx) => {
        const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
        
        return (
          <div key={idx} className="print-page" style={{ pageBreakAfter: 'always', breakAfter: 'page', marginBottom: '2rem' }}>
            <div className="calendar-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: config.isEmptyTemplate ? '1rem' : '0' }}>
                <h2>{config.isEmptyTemplate ? t('app_title') : `${user?.firstName} ${user?.lastName}`}</h2>
                <h2>{t('week_of')} {format(weekStart, 'PP', { locale })}</h2>
              </div>
              
              {config.isEmptyTemplate && (
                <div style={{ display: 'flex', gap: '2rem', width: '100%', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
                    <span style={{ fontWeight: 600, marginRight: '0.5rem', color: 'var(--text-main)' }}>{t('first_name')}:</span>
                    <div style={{ borderBottom: '1px solid var(--text-main)', flex: 1, height: '1.5rem' }}></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
                    <span style={{ fontWeight: 600, marginRight: '0.5rem', color: 'var(--text-main)' }}>{t('last_name')}:</span>
                    <div style={{ borderBottom: '1px solid var(--text-main)', flex: 1, height: '1.5rem' }}></div>
                  </div>
                </div>
              )}
            </div>
            
              <div className="calendar-grid-wrapper">
                <div className="calendar-grid">
                  {/* Time Column */}
                  <div className="time-col">
                    <div className="time-header"></div>
                    {hours.map(hour => (
                      <div key={`time-${hour}`} className="time-slot">
                        {formatDisplayTime(`${hour.toString().padStart(2, '0')}:00`, i18n.language)}
                      </div>
                    ))}
                  </div>

                  {/* Days Columns */}
                  {weekDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayActivities = activities.filter(a => a.date === dateStr);
                    const isToday = isSameDay(day, new Date());

                    const calculateActivityStyle = (startTime: string, endTime?: string) => {
                      const parseMins = (t: string) => { 
                        if (!t) return 0;
                        const [h,m] = t.split(':').map(Number); 
                        return h * 60 + (m || 0); 
                      };
                      const startMins = parseMins(startTime);
                      let endMins = endTime ? parseMins(endTime) : startMins + 60; // default 1h
                      if (endMins < startMins) endMins += 24 * 60;
                      
                      const durationMins = endMins - startMins;
                      return {
                        top: `calc((${startMins} / 60) * var(--hour-height))`,
                        height: `calc((${durationMins} / 60) * var(--hour-height))`
                      };
                    };

                    return (
                      <div key={dateStr} className="day-col">
                        <div className={`day-header ${isToday ? 'is-today' : ''}`}>
                          <span className="day-name">{format(day, 'EEEE', { locale })}</span>
                          <span className="date-num">{format(day, 'd')}</span>
                        </div>
                        
                        <div className="day-events-area">
                          {hours.map(hour => (
                            <div key={`${dateStr}-${hour}`} className="hour-cell" />
                          ))}

                          {dayActivities.map(act => {
                            const displayStart = formatDisplayTime(act.startTime, i18n.language);
                            const displayEnd = act.endTime ? formatDisplayTime(act.endTime, i18n.language) : '';
                            return (
                              <div 
                                key={act.id} 
                                className="activity-item" 
                                style={calculateActivityStyle(act.startTime, act.endTime)}
                              >
                                <span className="activity-time-range">
                                  {displayStart}{displayEnd ? ` - ${displayEnd}` : ''}
                                </span>
                                <span className="activity-text">
                                  {act.description}
                                </span>
                              </div>
                            );
                          })}
                        </div>
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
