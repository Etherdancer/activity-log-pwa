import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { db } from '../db/database';
import { format } from 'date-fns';
import './ActivityModal.css';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  initialDate: string; // yyyy-MM-dd
  initialTime: string; // HH:mm
}

export function ActivityModal({ isOpen, onClose, userId, initialDate, initialTime }: ActivityModalProps) {
  const { t } = useTranslation();
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [description, setDescription] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDate(initialDate);
      setTime(initialTime);
      setDescription('');
    }
  }, [isOpen, initialDate, initialTime]);

  if (!isOpen) return null;

  const handleSetNow = () => {
    const now = new Date();
    setDate(format(now, 'yyyy-MM-dd'));
    setTime(format(now, 'HH:mm'));
  };

  const handleSave = async () => {
    if (!description.trim()) return;

    try {
      await db.activities.add({
        id: crypto.randomUUID(),
        userId,
        date,
        startTime: time,
        description: description.trim(),
        createdAt: Date.now()
      });
      onClose();
    } catch (e) {
      console.error("Error saving activity", e);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('add_activity')}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="datetime-row">
            <div className="form-group">
              <label>{t('date')}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t('time')}</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          
          <button type="button" className="now-btn" onClick={handleSetNow}>
            {t('now')}
          </button>

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
          <button className="btn-primary" onClick={handleSave} disabled={!description.trim()}>{t('save')}</button>
        </div>
      </div>
    </div>
  );
}
