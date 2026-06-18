import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';
import './PrivacyNotice.css';

export function PrivacyNotice() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('privacy_accepted');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('privacy_accepted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="privacy-notice-overlay no-print">
      <div className="privacy-notice-text">
        <ShieldAlert className="privacy-notice-icon" size={20} />
        {t('privacy_notice')}
      </div>
      <button className="privacy-notice-btn" onClick={handleAccept}>
        {t('privacy_accept')}
      </button>
    </div>
  );
}
