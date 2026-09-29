import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { db, type Activity } from '../db/database';
import { activitySpan, parseTimeToMinutes as parseTime } from '../utils/time';
import { newId } from '../utils/importData';
import { format } from 'date-fns';
import { TimeInput } from './TimeInput';
import { DateInput } from './DateInput';
import './ActivityModal.css';

interface ActivityModalProps {
  onClose: () => void;
  userId: number;
  initialDate: string; // yyyy-MM-dd
  initialTime: string; // HH:mm
  editingActivity?: Activity | null;
}

const formatTime = (mins: number) => {
  let normalizedMins = mins % (24 * 60);
  if (normalizedMins < 0) {
    normalizedMins += 24 * 60;
  }
  const h = Math.floor(normalizedMins / 60);
  const m = normalizedMins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/** Add/edit form. Mount it (with a fresh `key`) each time it opens; state starts from props. */
export function ActivityModal({ onClose, userId, initialDate, initialTime, editingActivity }: ActivityModalProps) {
  const { t } = useTranslation();
  const startTime = editingActivity?.startTime ?? initialTime;
  const span = activitySpan(startTime, editingActivity?.endTime);
  const [date, setDate] = useState(editingActivity?.date ?? initialDate);
  const [time, setTime] = useState(startTime);
  const [description, setDescription] = useState(editingActivity?.description ?? '');

  const [inputMode, setInputMode] = useState<'duration' | 'end_time'>('duration');
  const [duration, setDuration] = useState<number | ''>(span.end - span.start);
  const [endTime, setEndTime] = useState(formatTime(span.end));

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

  // An end time equal to the start would make a zero-length (invisible) activity.
  const durationInvalid = duration === '' || duration < 1;

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!description.trim() || durationInvalid) return;

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
          id: newId(),
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
      alert(t('save_failed'));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-content" onClick={e => e.stopPropagation()} onSubmit={handleSave} noValidate role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>{editingActivity ? t('edit_activity') : t('add_activity')}</h3>
          <button type="button" className="close-btn" onClick={onClose} aria-label={t('cancel')}>
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
                type="button"
                className={`btn-secondary ${inputMode === 'duration' ? 'active-mode' : ''}`}
                onClick={() => setInputMode('duration')}
                style={{ flex: 1, backgroundColor: inputMode === 'duration' ? 'var(--color-primary-100)' : '', borderColor: inputMode === 'duration' ? 'var(--color-primary-500)' : '' }}
              >
                {t('duration')}
              </button>
              <button 
                type="button"
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
                    {t('duration_required')}
                  </div>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label>{t('end_time')}</label>
                <TimeInput value={endTime} onChange={handleEndTimeChangeWrapper} />
                {durationInvalid && (
                  <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {t('end_after_start')}
                  </div>
                )}
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
          <button type="button" className="btn-secondary" onClick={onClose}>{t('cancel')}</button>
          <button type="submit" className="btn-primary" disabled={!description.trim() || durationInvalid}>{t('save')}</button>
        </div>
      </form>
    </div>
  );
}
