import { useState, useCallback } from 'react';
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
import { ImportLinkModal } from './components/ImportLinkModal';
import { InstallPWA } from './components/InstallPWA';
import { Activity, Globe, Printer, Trash2, LayoutGrid } from 'lucide-react';
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const users = useLiveQuery(() => db.users.toArray());
  const [activeUserId, setActiveUserId] = useState<number | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState<{ userId: number; startDate: string; endDate: string; startHour: number; endHour: number; isEmptyTemplate?: boolean } | null>(null);

  const handleLanguageToggle = () => {
    const newLang = i18n.language === 'hr' ? 'en' : 'hr';
    i18n.changeLanguage(newLang);
  };

  const handlePrintRequest = (userId: number, startDate: string, endDate: string, startHour: number, endHour: number, isEmptyTemplate: boolean) => {
    setPrintConfig({ userId, startDate, endDate, startHour, endHour, isEmptyTemplate });
  };

  const handleResetData = async () => {
    if (window.confirm(t('reset_confirm_1'))) {
      if (window.confirm(t('reset_confirm_2'))) {
        try {
          db.close();
          await db.delete();
          window.location.href = window.location.origin + window.location.pathname; // Clean reload
        } catch (e) {
          console.error("Failed to delete database", e);
          alert("Failed to clear data.");
        }
      }
    }
  };

  const handlePrintReady = useCallback(() => {
    window.print();
    setPrintConfig(null);
  }, []);

  if (printConfig) {
    return (
      <PrintView 
        config={printConfig} 
        onReady={handlePrintReady} 
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
            <a href="https://etherdancer-homepage.pages.dev" title="Back to Etherdancer Apps" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s' }}>
              <LayoutGrid size={18} />
              <span className="hide-on-mobile">Etherdancer Homepage</span>
            </a>
            <Activity className="text-primary" style={{ marginLeft: '0.5rem' }} />
            {t('app_title')}
          </div>
          <div className="actions-section">
            <InstallPWA />
            <button className="btn-secondary" onClick={handleResetData} title={t('reset_app')} style={{ color: 'var(--color-danger)' }}>
              <Trash2 size={18} />
            </button>
            <button className="btn-secondary" onClick={handleLanguageToggle} title="Toggle Language">
              <Globe size={18} /> {i18n.language.toUpperCase()}
            </button>
          </div>
        </div>
        <div className="main-content">
          <CreateUser onCreated={() => {}} />
        </div>
        <ImportLinkModal />
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
          <a href="https://etherdancer-homepage.pages.dev" title="Back to Etherdancer Apps" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s' }}>
            <LayoutGrid size={18} />
            <span className="hide-on-mobile">Etherdancer Homepage</span>
          </a>
          <Activity className="text-primary" style={{ marginLeft: '0.5rem' }} />
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

          <InstallPWA />

          <button className="btn-secondary" onClick={() => setIsPrintModalOpen(true)} title={`${t('print')} / Export PDF`}>
            <Printer size={18} />
          </button>
          
          <button className="btn-secondary" onClick={handleLanguageToggle} title="Toggle Language">
            <Globe size={18} /> {i18n.language.toUpperCase()}
          </button>

          <button className="btn-secondary" onClick={handleResetData} title={t('reset_app')} style={{ color: 'var(--color-danger)' }}>
            <Trash2 size={18} />
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

      <ImportLinkModal />
      <PrivacyNotice />
    </div>
  );
}

export default App;
