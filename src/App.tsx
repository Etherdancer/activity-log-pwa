import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db } from './db/database';
import { UserSwitcher } from './components/UserSwitcher';
import { ShareImportData } from './components/ShareImportData';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { Activity, Globe, LogOut, Printer } from 'lucide-react';
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const users = useLiveQuery(() => db.users.toArray());
  const [activeUserId, setActiveUserId] = useState<number | null>(null);

  const activeUser = users?.find(u => u.id === activeUserId) || users?.[0];

  const handleLanguageToggle = () => {
    const newLang = i18n.language === 'hr' ? 'en' : 'hr';
    i18n.changeLanguage(newLang);
  };

  const handlePrint = () => {
    window.print();
  };

  if (users === undefined) {
    return <div className="app-wrapper"><div className="empty-state">Loading...</div></div>;
  }

  if (users.length === 0 || !activeUser || activeUserId === null) {
    // Show UserSwitcher if no user selected or no users exist
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
          <UserSwitcher 
            onSelectUser={(id) => setActiveUserId(id)} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <div className="top-nav no-print">
        <div className="title-section">
          <Activity className="text-primary" />
          {t('app_title')}
        </div>
        
        <div className="actions-section">
          <span style={{ fontWeight: 500 }}>{activeUser.firstName} {activeUser.lastName}</span>
          
          <ShareImportData user={activeUser} />

          <button className="btn-secondary" onClick={handlePrint} title={t('print')}>
            <Printer size={18} />
          </button>
          
          <button className="btn-secondary" onClick={handleLanguageToggle} title="Toggle Language">
            <Globe size={18} /> {i18n.language.toUpperCase()}
          </button>

          <button className="btn-secondary" onClick={() => setActiveUserId(null)} title={t('users')}>
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="main-content printable-content">
        <WeeklyCalendar user={activeUser} />
      </div>
    </div>
  );
}

export default App;
