import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { db, type Activity } from '../db/database';
import { format } from 'date-fns';
import { TimeInput } from './TimeInput';
import { DateInput } from './DateInput';
import './ActivityModal.css';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  initialDate: string; // yyyy-MM-dd
  initialTime: string; // HH:mm
  editingActivity?: Activity | null;
}

const parseTime = (t: string) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};

const formatTime = (mins: number) => {
  let normalizedMins = mins % (24 * 60);
  if (normalizedMins < 0) {
    normalizedMins += 24 * 60;
  }
  const h = Math.floor(normalizedMins / 60);
  const m = normalizedMins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export function ActivityModal({ isOpen, onClose, userId, initialDate, initialTime, editingActivity }: ActivityModalProps) {
  const { t } = useTranslation();
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [description, setDescription] = useState('');
  
  const [inputMode, setInputMode] = useState<'duration' | 'end_time'>('duration');
  const [duration, setDuration] = useState<number | ''>(60);
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingActivity) {
        setDate(editingActivity.date);
        setTime(editingActivity.startTime);
        setDescription(editingActivity.description);
        if (editingActivity.endTime) {
          setEndTime(editingActivity.endTime);
          const startMins = parseTime(editingActivity.startTime);
          let endMins = parseTime(editingActivity.endTime);
          if (endMins < startMins) endMins += 24 * 60;
          setDuration(endMins - startMins);
        } else {
          setDuration(60);
          setEndTime(formatTime(parseTime(editingActivity.startTime) + 60));
        }
      } else {
        setDate(initialDate);
        setTime(initialTime);
        setDescription('');
        setDuration(60);
        setEndTime(formatTime(parseTime(initialTime) + 60));
      }
    }
  }, [isOpen, initialDate, initialTime, editingActivity]);

  if (!isOpen) return null;

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (inputMode === 'duration') {
      const activeDuration = typeof duration === 'number' ? duration : 1;
      setEndTime(formatTime(parseTime(newTime) + activeDuration));
    } else {
      let newDur = parseTime(endTime) - parseTime(newTime);
      if (newDur < 0) newDur += 24 * 60;
      setDuration(newDur);
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (rawVal === '') {
      setDuration('');
      return;
    }
    let val = parseInt(rawVal, 10);
    if (isNaN(val)) return;
    if (val < 1) val = 1; // Enforce minimum duration of 1 minute
    setDuration(val);
    setEndTime(formatTime(parseTime(time) + val));
  };



  const handleEndTimeChangeWrapper = (newEnd: string) => {
    setEndTime(newEnd);
    let newDur = parseTime(newEnd) - parseTime(time);
    if (newDur < 0) newDur += 24 * 60;
    setDuration(newDur);
  };

  const handleSetNow = () => {
    const now = new Date();
    const nowTimeStr = format(now, 'HH:mm');
    setDate(format(now, 'yyyy-MM-dd'));
    handleTimeChange(nowTimeStr);
  };

  const handleSave = async () => {
    if (!description.trim()) return;

    // Overlap check
    const activeDuration = typeof duration === 'number' ? duration : 1;
    const newStartMins = parseTime(time);
    const newEndMins = newStartMins + activeDuration;

    const dayActs = await db.activities.where('[userId+date]').equals([userId, date]).toArray();
    let hasOverlap = false;

    for (const act of dayActs) {
      if (editingActivity && act.id === editingActivity.id) continue;
      
      const actStart = parseTime(act.startTime);
      let actEnd = actStart + 60; // default assumption for old items
      if (act.endTime) {
        actEnd = parseTime(act.endTime);
        if (actEnd < actStart) actEnd += 24 * 60;
      }
      
      // Check intersection
      if (newStartMins < actEnd && actStart < newEndMins) {
        hasOverlap = true;
        break;
      }
    }

    if (hasOverlap) {
      if (!window.confirm(t('overlap_warning'))) {
        return;
      }
    }

    try {
      if (editingActivity) {
        await db.activities.put({
          ...editingActivity,
          date,
          startTime: time,
          endTime: endTime,
          description: description.trim()
        });
      } else {
        await db.activities.add({
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2, 10),
          userId,
          date,
          startTime: time,
          endTime: endTime,
          description: description.trim(),
          createdAt: Date.now()
        });
      }
      onClose();
    } catch (e) {
      console.error("Error saving activity", e);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingActivity ? t('edit_activity') : t('add_activity')}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="datetime-row">
            <div className="form-group">
              <label>{t('date')}</label>
              <DateInput value={date} onChange={setDate} />
            </div>
            <div className="form-group">
              <label>{t('time')}</label>
              <TimeInput value={time} onChange={handleTimeChange} />
            </div>
          </div>
          
          <button type="button" className="now-btn" onClick={handleSetNow}>
            {t('now')}
          </button>

          <div className="mode-toggle-group">
            <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>{t('input_mode')}</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button 
                className={`btn-secondary ${inputMode === 'duration' ? 'active-mode' : ''}`}
                onClick={() => setInputMode('duration')}
                style={{ flex: 1, backgroundColor: inputMode === 'duration' ? 'var(--color-primary-100)' : '', borderColor: inputMode === 'duration' ? 'var(--color-primary-500)' : '' }}
              >
                {t('duration')}
              </button>
              <button 
                className={`btn-secondary ${inputMode === 'end_time' ? 'active-mode' : ''}`}
                onClick={() => setInputMode('end_time')}
                style={{ flex: 1, backgroundColor: inputMode === 'end_time' ? 'var(--color-primary-100)' : '', borderColor: inputMode === 'end_time' ? 'var(--color-primary-500)' : '' }}
              >
                {t('end_time')}
              </button>
            </div>
          </div>

          <div className="datetime-row">
            {inputMode === 'duration' ? (
              <div className="form-group">
                <label>{t('duration')} ({t('minutes')})</label>
                <input 
                  type="number" 
                  value={duration === '' ? '' : duration} 
                  onChange={handleDurationChange} 
                  min="1"
                  step="5"
                />
                {duration === '' && (
                  <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {t('duration_required', 'Enter a duration to save')}
                  </div>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label>{t('end_time')}</label>
                <TimeInput value={endTime} onChange={handleEndTimeChangeWrapper} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>{t('description')}</label>
            <input 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder={t('description')}
              autoFocus
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>{t('cancel')}</button>
          <button className="btn-primary" onClick={handleSave} disabled={!description.trim() || (inputMode === 'duration' && duration === '')}>{t('save')}</button>
        </div>
      </div>
    </div>
  );
}
