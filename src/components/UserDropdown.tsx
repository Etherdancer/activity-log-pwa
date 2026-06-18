import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Plus, User as UserIcon } from 'lucide-react';
import type { User } from '../db/database';
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
            <button
              key={user.id}
              className={`dropdown-item ${activeUser.id === user.id ? 'active' : ''}`}
              onClick={() => {
                onSelectUser(user.id!);
                setIsOpen(false);
              }}
            >
              <UserIcon size={16} />
              {user.firstName} {user.lastName}
            </button>
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
