import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { CreateUser } from './CreateUser';
import './ActivityModal.css'; // Reusing modal CSS

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateUserModal({ isOpen, onClose, onCreated }: CreateUserModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 200 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('add_user')}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          {/* We wrap CreateUser. CreateUser has its own padding/styling but fits here */}
          <CreateUser 
            onCreated={() => {
              onCreated();
              onClose();
            }} 
          />
        </div>
      </div>
    </div>
  );
}
