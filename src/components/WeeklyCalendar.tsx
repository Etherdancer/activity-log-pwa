import { useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  startOfWeek, 
  addDays, 
  format, 
  isSameDay, 
  subWeeks, 
  addWeeks 
} from 'date-fns';
import { hr, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Activity, User } from '../db/database';
import { db } from '../db/database';
import { ActivityModal } from './ActivityModal';
import { formatDisplayTime, formatDisplayDate, activitySpan, layoutLanes } from '../utils/time';
import './WeeklyCalendar.css';

export function WeeklyCalendar({ user }: { user: User }) {
  const { t, i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal state: null = closed. `key` remounts the form so it starts fresh each time.
  const [modal, setModal] = useState<{ key: number; date: string; time: string; editing: Activity | null } | null>(null);
  const openModal = (date: string, time: string, editing: Activity | null) =>
    setModal(prev => ({ key: (prev?.key ?? 0) + 1, date, time, editing }));

  const locale = i18n.language === 'hr' ? hr : enUS;

  // Compute the days of the current week (Monday to Sunday)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const startDateStr = format(weekStart, 'yyyy-MM-dd');
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const endDateStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');

  // Load activities for the current user in this week
  const activities = useLiveQuery(
    () => db.activities
      .where('[userId+date]')
      .between([user.id!, startDateStr], [user.id!, endDateStr], true, true)
      .toArray(),
    [user.id, startDateStr, endDateStr]
  );

  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const isCurrentWeek = isSameDay(startOfWeek(new Date(), { weekStartsOn: 1 }), weekStart);

  const hours = Array.from({ length: 24 }).map((_, i) => i);

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>{t('week_of')} {formatDisplayDate(weekStart, i18n.language)}</h2>
        <div className="calendar-nav">
          <button onClick={prevWeek} aria-label={t('previous_week')}><ChevronLeft /></button>
          {!isCurrentWeek && (
            <button onClick={() => setCurrentDate(new Date())} className="today-btn">{t('today')}</button>
          )}
          <button onClick={nextWeek} aria-label={t('next_week')}><ChevronRight /></button>
        </div>
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
            const dayActivities = activities?.filter(a => a.date === dateStr) || [];
            const isToday = isSameDay(day, new Date());

            // Clip activities that run past midnight to this day's column.
            const spans = dayActivities.map(a => {
              const s = activitySpan(a.startTime, a.endTime);
              return { start: s.start, end: Math.min(s.end, 24 * 60) };
            });
            const lanes = layoutLanes(spans);
            const activityStyle = (idx: number): CSSProperties => {
              const { start, end } = spans[idx];
              const { lane, lanes: n } = lanes[idx];
              return {
                top: `calc((${start} / 60) * var(--hour-height))`,
                height: `calc((${Math.max(end - start, 15)} / 60) * var(--hour-height))`,
                left: `calc(${(lane / n) * 100}% + 2px)`,
                width: `calc(${100 / n}% - 4px)`,
                right: 'auto',
              };
            };

            return (
              <div key={dateStr} className="day-col">
                <div className={`day-header ${isToday ? 'is-today' : ''}`}>
                  <span className="day-name">{format(day, 'EEEE', { locale })}</span>
                  <span className="date-num">{format(day, 'd')}</span>
                </div>
                
                <div className="day-events-area">
                  {/* Background grid cells */}
                  {hours.map(hour => {
                    const hourStr = hour.toString().padStart(2, '0');
                    return (
                      <div 
                        key={`${dateStr}-${hour}`} 
                        className="hour-cell"
                        onClick={() => openModal(dateStr, `${hourStr}:00`, null)}
                      />
                    );
                  })}

                  {/* Absolute positioned activities */}
                  {dayActivities.map((act, idx) => {
                    const displayStart = formatDisplayTime(act.startTime, i18n.language);
                    const displayEnd = act.endTime ? formatDisplayTime(act.endTime, i18n.language) : '';
                    return (
                      <div 
                        key={act.id} 
                        className="activity-item" 
                        style={activityStyle(idx)}
                        title={`${displayStart}${displayEnd ? ` - ${displayEnd}` : ''}: ${act.description}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(act.date, act.startTime, act);
                        }}
                      >
                        <span className="activity-time-range">
                          {displayStart}{displayEnd ? ` - ${displayEnd}` : ''}
                        </span>
                        <span className="activity-text">
                          {act.description}
                        </span>
                        <button 
                          className="delete-activity-btn"
                          title={t('delete_activity')}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(t('delete_activity_confirm'))) {
                              await db.activities.delete(act.id!);
                            }
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {modal && (
        <ActivityModal
          key={modal.key}
          onClose={() => setModal(null)}
          userId={user.id!}
          initialDate={modal.date}
          initialTime={modal.time}
          editingActivity={modal.editing}
        />
      )}
    </div>
  );
}
