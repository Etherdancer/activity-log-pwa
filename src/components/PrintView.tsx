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
import { formatDisplayTime, formatDisplayDate } from '../utils/time';
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

  // Total visible minutes in the selected time range
  const totalVisibleMins = hoursLength * 60;
  // Start offset in minutes from midnight
  const viewStartMins = config.startHour * 60;

  // Calculate position as percentage of the visible time range
  const calcActivityStyle = (startTime: string, endTime?: string) => {
    const parseMins = (t: string) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + (m || 0);
    };

    const startMins = parseMins(startTime);
    let endMins = endTime ? parseMins(endTime) : startMins + 60;
    if (endMins < startMins) endMins += 24 * 60;

    // Clamp to visible range
    const clampedStart = Math.max(startMins, viewStartMins);
    const clampedEnd = Math.min(endMins, viewStartMins + totalVisibleMins);
    const durationMins = endMins - startMins; // original, unclipped

    if (clampedEnd <= clampedStart) return null; // fully outside visible range

    const topPct = ((clampedStart - viewStartMins) / totalVisibleMins) * 100;
    const heightPct = ((clampedEnd - clampedStart) / totalVisibleMins) * 100;

    return {
      style: {
        top: `${topPct}%`,
        height: `${heightPct}%`,
      },
      durationMins,
    };
  };

  return (
    <div className="printable-content" style={{ background: 'white' }}>
      {weeks.map((weekStart, idx) => {
        const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
        
        return (
          <div key={idx} className="print-page" style={{ pageBreakAfter: 'always', breakAfter: 'page', marginBottom: '2rem' }}>
            <div className="calendar-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: config.isEmptyTemplate ? '1rem' : '0' }}>
                <h2>{config.isEmptyTemplate ? t('app_title') : `${user?.firstName} ${user?.lastName}`}</h2>
                <h2>{formatDisplayDate(weekStart, i18n.language)} - {formatDisplayDate(weekDays[6], i18n.language)}</h2>
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
                  {/* Events area for time labels — percentage positioned */}
                  <div style={{ flex: 1, position: 'relative' }}>
                    {hours.map((hour, i) => (
                      <div
                        key={`time-${hour}`}
                        style={{
                          position: 'absolute',
                          top: `${(i / hoursLength) * 100}%`,
                          left: 0,
                          right: 0,
                          fontSize: '7px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'center',
                          paddingTop: '1px',
                          color: 'var(--text-muted)',
                          borderTop: '1px solid var(--color-surface-100)',
                        }}
                      >
                        {formatDisplayTime(`${hour.toString().padStart(2, '0')}:00`, i18n.language)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Days Columns */}
                {weekDays.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayActivities = activities.filter(a => a.date === dateStr);

                  return (
                    <div key={dateStr} className="day-col">
                      <div className="day-header">
                        <span className="day-name">{format(day, 'EEEE', { locale })}</span>
                        <span className="date-num">{format(day, 'd')}</span>
                      </div>
                      
                      {/* Events area — percentage positioned, fills remaining height */}
                      <div style={{ flex: 1, position: 'relative', borderLeft: '1px solid var(--color-surface-100)' }}>
                        {/* Hour grid lines */}
                        {hours.map((_, i) => (
                          <div
                            key={i}
                            style={{
                              position: 'absolute',
                              top: `${(i / hoursLength) * 100}%`,
                              left: 0,
                              right: 0,
                              borderTop: '1px solid var(--color-surface-100)',
                              height: 0,
                            }}
                          />
                        ))}

                        {/* Activity blocks */}
                        {dayActivities.map(act => {
                          const result = calcActivityStyle(act.startTime, act.endTime);
                          if (!result) return null;

                          const { style, durationMins } = result;
                          const displayStart = formatDisplayTime(act.startTime, i18n.language);
                          const displayEnd = act.endTime ? formatDisplayTime(act.endTime, i18n.language) : '';

                          // Font size scales with visible height percentage
                          const heightPct = parseFloat(style.height);
                          const isVeryShort = heightPct < 3 || durationMins <= 20;
                          const isShort = heightPct < 6 || durationMins <= 40;

                          return (
                            <div
                              key={act.id}
                              className="activity-item"
                              style={{
                                ...style,
                                position: 'absolute',
                                left: '2px',
                                right: '2px',
                                display: 'flex',
                                flexDirection: isShort ? 'row' : 'column',
                                alignItems: isShort ? 'center' : 'flex-start',
                                padding: isVeryShort ? '0 1px' : '1px 3px',
                                gap: isShort ? '2px' : '1px',
                                fontSize: isVeryShort ? '0.5rem' : isShort ? '0.6rem' : '0.7rem',
                                lineHeight: 1.1,
                                overflow: 'hidden',
                                boxSizing: 'border-box',
                              }}
                            >
                              {!isVeryShort && (
                                <span style={{ fontWeight: 600, flexShrink: 0, opacity: 0.85, whiteSpace: 'nowrap', fontSize: 'inherit' }}>
                                  {displayStart}{displayEnd && !isShort ? ` - ${displayEnd}` : ''}
                                </span>
                              )}
                              <span style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: isShort ? 'nowrap' : 'normal',
                                display: isShort ? 'block' : '-webkit-box',
                                WebkitLineClamp: isShort ? undefined : Math.max(1, Math.floor(durationMins / 15)),
                                WebkitBoxOrient: isShort ? undefined : 'vertical',
                                wordBreak: 'break-word',
                                flex: 1,
                                fontSize: 'inherit',
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
