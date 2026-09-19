import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { db } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { DateInput } from './DateInput';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (userId: number, startDate: string, endDate: string, startHour: number, endHour: number, isEmptyTemplate: boolean) => void;
}

export function PrintModal({ isOpen, onClose, onPrint }: PrintModalProps) {
  const { t } = useTranslation();
  const users = useLiveQuery(() => db.users.toArray()) || [];
  
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startHour, setStartHour] = useState<number>(0);
  const [endHour, setEndHour] = useState<number>(23);
  const [isEmptyTemplate, setIsEmptyTemplate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setStartHour(0);
      setEndHour(23);
      setIsEmptyTemplate(false);
      if (users.length > 0) {
        setSelectedUserId(users[0].id!);
      }
    }
  }, [isOpen, users]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if ((selectedUserId === '' && !isEmptyTemplate) || !startDate || !endDate) return;
    onPrint(Number(selectedUserId) || 0, startDate, endDate, startHour, endHour, isEmptyTemplate);
    onClose();
  };

  const hourOptions = Array.from({ length: 24 }).map((_, i) => (
    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
  ));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('print_export_pdf')}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="emptyTemplate" 
              checked={isEmptyTemplate} 
              onChange={e => setIsEmptyTemplate(e.target.checked)} 
            />
            <label htmlFor="emptyTemplate" style={{ margin: 0, cursor: 'pointer' }}>
              {t('print_empty_template')}
            </label>
          </div>

          {!isEmptyTemplate && (
            <div className="form-group">
              <label>{t('users')}</label>
              <select 
                value={selectedUserId} 
                onChange={e => setSelectedUserId(Number(e.target.value))}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-surface-300)' }}
              >
                <option value="" disabled>Select User</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="datetime-row">
            <div className="form-group">
              <label>{t('start_date')}</label>
              <DateInput value={startDate} onChange={setStartDate} />
            </div>
            <div className="form-group">
              <label>{t('end_date')}</label>
              <DateInput value={endDate} onChange={setEndDate} />
            </div>
          </div>

          <div className="datetime-row" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>{t('start_hour')}</label>
              <select value={startHour} onChange={e => setStartHour(Number(e.target.value))}>
                {hourOptions}
              </select>
            </div>
            <div className="form-group">
              <label>{t('end_hour')}</label>
              <select value={endHour} onChange={e => setEndHour(Number(e.target.value))}>
                {hourOptions}
              </select>
            </div>
          </div>
          {endDate && startDate && endDate < startDate && (
            <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.5rem', width: '100%', textAlign: 'center' }}>
              {t('date_range_invalid')}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>{t('cancel')}</button>
          <button className="btn-primary" onClick={handlePrint} disabled={(selectedUserId === '' && !isEmptyTemplate) || !startDate || !endDate || startHour > endHour || endDate < startDate}>
            {t('print_export_pdf')}
          </button>
        </div>
      </div>
    </div>
  );
}
