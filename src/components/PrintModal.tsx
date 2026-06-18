import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { db } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (userId: number, startDate: string, endDate: string, isEmptyTemplate: boolean) => void;
}

export function PrintModal({ isOpen, onClose, onPrint }: PrintModalProps) {
  const { t } = useTranslation();
  const users = useLiveQuery(() => db.users.toArray()) || [];
  
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isEmptyTemplate, setIsEmptyTemplate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setIsEmptyTemplate(false);
      if (users.length > 0 && selectedUserId === '') {
        setSelectedUserId(users[0].id!);
      }
    }
  }, [isOpen, users]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if ((selectedUserId === '' && !isEmptyTemplate) || !startDate || !endDate) return;
    onPrint(Number(selectedUserId) || 0, startDate, endDate, isEmptyTemplate);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('print')}</h3>
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
              Print empty template
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
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>{t('cancel')}</button>
          <button className="btn-primary" onClick={handlePrint} disabled={(selectedUserId === '' && !isEmptyTemplate) || !startDate || !endDate}>
            {t('print')}
          </button>
        </div>
      </div>
    </div>
  );
}
