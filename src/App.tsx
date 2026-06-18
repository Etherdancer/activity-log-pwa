import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db } from './db/database';
import { ShareImportData } from './components/ShareImportData';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { PrintModal } from './components/PrintModal';
import { PrintView } from './components/PrintView';
import { UserDropdown } from './components/UserDropdown';
import { CreateUserModal } from './components/CreateUserModal';
import { CreateUser } from './components/CreateUser';
import { PrivacyNotice } from './components/PrivacyNotice';
import { Activity, Globe, Printer } from 'lucide-react';
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const users = useLiveQuery(() => db.users.toArray());
  const [activeUserId, setActiveUserId] = useState<number | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState<{ userId: number; startDate: string; endDate: string; isEmptyTemplate?: boolean } | null>(null);

  const handleLanguageToggle = () => {
    const newLang = i18n.language === 'hr' ? 'en' : 'hr';
    i18n.changeLanguage(newLang);
  };

  const handlePrintRequest = (userId: number, startDate: string, endDate: string, isEmptyTemplate: boolean) => {
    setPrintConfig({ userId, startDate, endDate, isEmptyTemplate });
  };

  if (printConfig) {
    return (
      <PrintView 
        config={printConfig} 
        onReady={() => {
          window.print();
          setPrintConfig(null);
        }} 
      />
    );
  }

  if (users === undefined) {
    return <div className="app-wrapper"><div className="empty-state">Loading...</div></div>;
  }

  if (users.length === 0) {
    // Show CreateUser fullscreen if no users exist
    return (
      <div className="app-wrapper">
        <div className="top-nav no-print">
          <div className="title-section">
            <Activity className="text-primary" />
            {t('app_title')}
          </div>
          <div className="actions-section">
            <button className="btn-secondary" onClick={handleLanguageToggle} title="Toggle Language">
              <Globe size={18} /> {i18n.language.toUpperCase()}
            </button>
          </div>
        </div>
        <div className="main-content">
          <CreateUser onCreated={() => {}} />
        </div>
        <PrivacyNotice />
      </div>
    );
  }

  // Ensure an active user is selected
  const activeUser = users.find(u => u.id === activeUserId) || users[0];

  if (!activeUser) {
    return null; // Fallback should never happen if users.length > 0
  }

  return (
    <div className="app-wrapper">
      <div className="top-nav no-print">
        <div className="title-section">
          <Activity className="text-primary" />
          {t('app_title')}
        </div>
        
        <div className="actions-section">
          <UserDropdown 
            users={users} 
            activeUser={activeUser} 
            onSelectUser={setActiveUserId} 
            onAddUser={() => setIsCreateUserModalOpen(true)} 
          />
          
          <ShareImportData user={activeUser} />

          <button className="btn-secondary" onClick={() => setIsPrintModalOpen(true)} title={t('print')}>
            <Printer size={18} />
          </button>
          
          <button className="btn-secondary" onClick={handleLanguageToggle} title="Toggle Language">
            <Globe size={18} /> {i18n.language.toUpperCase()}
          </button>
        </div>
      </div>

      <div className="main-content printable-content">
        <WeeklyCalendar user={activeUser} />
      </div>

      <PrintModal 
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onPrint={handlePrintRequest}
      />

      <CreateUserModal 
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onCreated={() => {}}
      />

      <PrivacyNotice />
    </div>
  );
}

export default App;
