import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Plus, User as UserIcon, Trash2, Pencil, Check, X as XIcon } from 'lucide-react';
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
  const [renamingUserId, setRenamingUserId] = useState<number | null>(null);
  const [renameFirst, setRenameFirst] = useState('');
  const [renameLast, setRenameLast] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setRenamingUserId(null);
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

  const startRename = (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    setRenamingUserId(user.id!);
    setRenameFirst(user.firstName);
    setRenameLast(user.lastName);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingUserId(null);
  };

  const confirmRename = async (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    const first = renameFirst.trim();
    const last = renameLast.trim();
    if (!first) return;
    try {
      await db.users.update(user.id!, { firstName: first, lastName: last });
      setRenamingUserId(null);
    } catch (err) {
      console.error("Failed to rename user", err);
    }
  };

  return (
    <div className="user-dropdown-container" ref={dropdownRef}>
      <button className="user-dropdown-trigger" onClick={() => { setIsOpen(!isOpen); setRenamingUserId(null); }}>
        <UserIcon size={18} />
        <span>{activeUser.firstName} {activeUser.lastName}</span>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="user-dropdown-menu">
          {users.map(user => (
            <div key={user.id} className={`dropdown-item-wrapper ${activeUser.id === user.id ? 'active' : ''}`}>
              {renamingUserId === user.id ? (
                /* ── Inline rename row ── */
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', width: '100%' }}
                  onClick={e => e.stopPropagation()}
                >
                  <input
                    autoFocus
                    value={renameFirst}
                    onChange={e => setRenameFirst(e.target.value)}
                    placeholder={t('first_name')}
                    style={{
                      flex: 1, minWidth: 0, padding: '3px 6px', fontSize: '0.8rem',
                      border: '1px solid var(--color-surface-300)', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)', color: 'var(--text-main)'
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') confirmRename(e as any, user); if (e.key === 'Escape') { setRenamingUserId(null); } }}
                  />
                  <input
                    value={renameLast}
                    onChange={e => setRenameLast(e.target.value)}
                    placeholder={t('last_name')}
                    style={{
                      flex: 1, minWidth: 0, padding: '3px 6px', fontSize: '0.8rem',
                      border: '1px solid var(--color-surface-300)', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)', color: 'var(--text-main)'
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') confirmRename(e as any, user); if (e.key === 'Escape') { setRenamingUserId(null); } }}
                  />
                  <button
                    style={{ padding: '4px', color: 'var(--color-primary-600)', cursor: 'pointer', flexShrink: 0 }}
                    onClick={e => confirmRename(e, user)}
                    title={t('save')}
                  >
                    <Check size={15} />
                  </button>
                  <button
                    style={{ padding: '4px', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}
                    onClick={cancelRename}
                    title={t('cancel')}
                  >
                    <XIcon size={15} />
                  </button>
                </div>
              ) : (
                /* ── Normal user row ── */
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <button
                    className="dropdown-item"
                    style={{ flex: 1, border: 'none', background: 'transparent' }}
                    onClick={() => { onSelectUser(user.id!); setIsOpen(false); }}
                  >
                    <UserIcon size={16} />
                    {user.firstName} {user.lastName}
                  </button>
                  <button
                    style={{ padding: '0.4rem', color: 'var(--color-primary-500)', border: 'none', background: 'transparent', cursor: 'pointer' }}
                    onClick={e => startRename(e, user)}
                    title={t('rename_user')}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    style={{ padding: '0.4rem', color: 'var(--color-danger)', border: 'none', background: 'transparent', cursor: 'pointer' }}
                    onClick={e => handleDeleteUser(e, user)}
                    title={t('delete_user_confirm')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          ))}
          <div className="dropdown-divider"></div>
          <button
            className="dropdown-item"
            onClick={() => { onAddUser(); setIsOpen(false); }}
          >
            <Plus size={16} />
            {t('add_user')}
          </button>
        </div>
      )}
    </div>
  );
}
