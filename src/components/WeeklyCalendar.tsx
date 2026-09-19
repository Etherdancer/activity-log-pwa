import { useState, useMemo } from 'react';
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
import type { User } from '../db/database';
import { db } from '../db/database';
import { ActivityModal } from './ActivityModal';
import { formatDisplayTime, formatDisplayDate } from '../utils/time';
import './WeeklyCalendar.css';

export function WeeklyCalendar({ user }: { user: User }) {
  const { t, i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState('');
  const [modalInitialTime, setModalInitialTime] = useState('');
  const [editingActivity, setEditingActivity] = useState<any>(null);

  const locale = i18n.language === 'hr' ? hr : enUS;

  // Compute the days of the current week (Monday to Sunday)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const startDateStr = format(weekStart, 'yyyy-MM-dd');
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

  const hours = Array.from({ length: 24 }).map((_, i) => i);

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>{t('week_of')} {formatDisplayDate(weekStart, i18n.language)}</h2>
        <div className="calendar-nav">
          <button onClick={prevWeek}><ChevronLeft /></button>
          <button onClick={nextWeek}><ChevronRight /></button>
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
                  {/* Background grid cells */}
                  {hours.map(hour => {
                    const hourStr = hour.toString().padStart(2, '0');
                    return (
                      <div 
                        key={`${dateStr}-${hour}`} 
                        className="hour-cell"
                        onClick={() => {
                          setEditingActivity(null);
                          setModalInitialDate(dateStr);
                          setModalInitialTime(`${hourStr}:00`);
                          setIsModalOpen(true);
                        }}
                      />
                    );
                  })}

                  {/* Absolute positioned activities */}
                  {dayActivities.map(act => {
                    const displayStart = formatDisplayTime(act.startTime, i18n.language);
                    const displayEnd = act.endTime ? formatDisplayTime(act.endTime, i18n.language) : '';
                    return (
                      <div 
                        key={act.id} 
                        className="activity-item" 
                        style={calculateActivityStyle(act.startTime, act.endTime)}
                        title={`${displayStart}${displayEnd ? ` - ${displayEnd}` : ''}: ${act.description}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingActivity(act);
                          setModalInitialDate(act.date);
                          setModalInitialTime(act.startTime);
                          setIsModalOpen(true);
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
                            if (window.confirm(t('delete_activity') + '?')) {
                              await db.activities.delete(act.id);
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
      
      <ActivityModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={user.id!}
        initialDate={modalInitialDate}
        initialTime={modalInitialTime}
        editingActivity={editingActivity}
      />
    </div>
  );
}
