import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  addDays, 
  format, 
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
  
  // Calculate 7-day chunks starting from the exact startDate
  const weeks = useMemo(() => {
    try {
      const start = parseISO(config.startDate);
      const end = parseISO(config.endDate);
      const chunks = [];
      let current = start;
      while (current <= end) {
        chunks.push(current);
        current = addDays(current, 7);
      }
      return chunks.length > 0 ? chunks : [start];
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
                <h2>{format(weekStart, 'PP', { locale })} - {format(weekDays[6], 'PP', { locale })}</h2>
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
                        style: {
                          top: `calc((${startMins} / 60) * var(--hour-height))`,
                          height: `calc((${durationMins} / 60) * var(--hour-height))`
                        },
                        durationMins
                      };
                    };

                    return (
                      <div key={dateStr} className="day-col">
                        <div className="day-header">
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
                            const { style, durationMins } = calculateActivityStyle(act.startTime, act.endTime);
                            
                            const isVeryShort = durationMins <= 20;
                            const isShort = durationMins <= 40;

                            return (
                              <div 
                                key={act.id} 
                                className="activity-item" 
                                style={{
                                  ...style,
                                  display: 'flex',
                                  flexDirection: isShort ? 'row' : 'column',
                                  alignItems: isShort ? 'center' : 'flex-start',
                                  padding: isVeryShort ? '0.1rem 0.2rem' : '0.2rem 0.4rem',
                                  gap: isShort ? '0.3rem' : '0.1rem',
                                  fontSize: isVeryShort ? '0.6rem' : isShort ? '0.65rem' : '0.75rem',
                                  lineHeight: 1.1,
                                  overflow: 'hidden'
                                }}
                              >
                                {!isVeryShort && (
                                  <span className="activity-time-range" style={{ fontWeight: 600, flexShrink: 0, opacity: 0.85, whiteSpace: 'nowrap' }}>
                                    {displayStart}{displayEnd && !isShort ? ` - ${displayEnd}` : ''}
                                  </span>
                                )}
                                <span className="activity-text" style={{ 
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: isShort ? 'nowrap' : 'normal',
                                  display: isShort ? 'block' : '-webkit-box',
                                  WebkitLineClamp: isShort ? undefined : Math.max(1, Math.floor(durationMins / 15)),
                                  WebkitBoxOrient: isShort ? undefined : 'vertical',
                                  wordBreak: 'break-word',
                                  flex: 1
                                }}>
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
