import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Plus, User as UserIcon, Trash2 } from 'lucide-react';
import { db, type User } from '../db/database';
import './UserDropdown.css';

interface UserDropdownProps {
  users: User[];
  activeUser: User;
  onSelectUser: (id: number) => void;
  onAddUser: () => void;
}

export function UserDropdown({ users, activeUser, onSelectUser, onAddUser }: UserDropdownProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeleteUser = async (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    if (window.confirm(t('delete_user_confirm'))) {
      try {
        await db.activities.where('userId').equals(user.id!).delete();
        await db.users.delete(user.id!);
        setIsOpen(false);
      } catch (err) {
        console.error("Failed to delete user", err);
      }
    }
  };

  return (
    <div className="user-dropdown-container" ref={dropdownRef}>
      <button className="user-dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        <UserIcon size={18} />
        <span>{activeUser.firstName} {activeUser.lastName}</span>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="user-dropdown-menu">
          {users.map(user => (
            <div key={user.id} className={`dropdown-item-wrapper ${activeUser.id === user.id ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                className={`dropdown-item`}
                style={{ flex: 1, border: 'none', background: 'transparent' }}
                onClick={() => {
                  onSelectUser(user.id!);
                  setIsOpen(false);
                }}
              >
                <UserIcon size={16} />
                {user.firstName} {user.lastName}
              </button>
              <button 
                className="delete-user-btn" 
                style={{ padding: '0.5rem', color: 'var(--color-danger)', border: 'none', background: 'transparent', cursor: 'pointer' }}
                onClick={(e) => handleDeleteUser(e, user)}
                title="Delete User"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <div className="dropdown-divider"></div>
          <button
            className="dropdown-item"
            onClick={() => {
              onAddUser();
              setIsOpen(false);
            }}
          >
            <Plus size={16} />
            {t('add_user')}
          </button>
        </div>
      )}
    </div>
  );
}
