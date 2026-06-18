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
        <h2>{t('week_of')} {format(weekStart, 'PP', { locale })}</h2>
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
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {weekDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayActivities = activities?.filter(a => a.date === dateStr) || [];
            const isToday = isSameDay(day, new Date());

            return (
              <div key={dateStr} className="day-col">
                <div className={`day-header ${isToday ? 'is-today' : ''}`}>
                  <span className="day-name">{format(day, 'EEEE', { locale })}</span>
                  <span className="date-num">{format(day, 'd')}</span>
                </div>
                
                {hours.map(hour => {
                  // Find activities starting in this hour
                  const hourStr = hour.toString().padStart(2, '0');
                  const actsInHour = dayActivities.filter(a => a.startTime.startsWith(hourStr + ':'));

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
                    >
                      {actsInHour.map(act => (
                        <div 
                          key={act.id} 
                          className="activity-item" 
                          title={act.description}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingActivity(act);
                            setModalInitialDate(act.date);
                            setModalInitialTime(act.startTime);
                            setIsModalOpen(true);
                          }}
                        >
                          <span className="activity-text">
                            {act.startTime} {act.description}
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
                      ))}
                    </div>
                  );
                })}
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
