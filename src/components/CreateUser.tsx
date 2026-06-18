import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../db/database';
import { UserPlus } from 'lucide-react';
import './CreateUser.css';

export function CreateUser({ onCreated }: { onCreated: () => void }) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    try {
      await db.users.add({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        colorTheme: 'ocean',
        createdAt: Date.now()
      });
      onCreated();
    } catch (error) {
      console.error("Failed to create user", error);
    }
  };

  return (
    <div className="create-user-container">
      <div className="card create-user-card">
        <div className="card-header">
          <UserPlus size={32} className="text-primary" />
          <h2>{t('add_user')}</h2>
        </div>
        <form onSubmit={handleSubmit} className="create-user-form">
          <div className="form-group">
            <label>{t('first_name')}</label>
            <input 
              type="text" 
              value={firstName} 
              onChange={e => setFirstName(e.target.value)} 
              required 
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>{t('last_name')}</label>
            <input 
              type="text" 
              value={lastName} 
              onChange={e => setLastName(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn-primary submit-btn">
            {t('save')}
          </button>
        </form>
      </div>
    </div>
  );
}
