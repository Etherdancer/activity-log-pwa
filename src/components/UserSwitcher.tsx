import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db, type User } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { CreateUser } from './CreateUser';
import { Users, User as UserIcon, Plus } from 'lucide-react';
import './UserSwitcher.css';

export function UserSwitcher({ onSelectUser }: { onSelectUser: (id: number) => void }) {
  const { t } = useTranslation();
  const users = useLiveQuery(() => db.users.toArray()) || [];
  const [showCreate, setShowCreate] = useState(users.length === 0);

  if (showCreate || users.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {users.length > 0 && (
          <div style={{ padding: '1rem' }}>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>
              &larr; {t('cancel')}
            </button>
          </div>
        )}
        <CreateUser onCreated={() => setShowCreate(false)} />
      </div>
    );
  }

  return (
    <div className="user-switcher-container">
      <div className="card user-switcher-card">
        <div className="card-header">
          <Users size={32} className="text-primary" />
          <h2>{t('users')}</h2>
        </div>
        <div className="user-list">
          {users.map(user => (
            <button 
              key={user.id} 
              className="user-btn"
              onClick={() => onSelectUser(user.id!)}
            >
              <UserIcon size={20} />
              <span>{user.firstName} {user.lastName}</span>
            </button>
          ))}
        </div>
        <button 
          className="btn-primary new-user-btn"
          onClick={() => setShowCreate(true)}
        >
          <Plus size={20} />
          {t('add_user')}
        </button>
      </div>
    </div>
  );
}
