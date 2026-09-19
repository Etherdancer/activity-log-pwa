import { useState, useEffect } from 'react';
import { MonitorDown, X, Share } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function InstallPWA() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showGenericModal, setShowGenericModal] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      // Fallback for browsers that don't support beforeinstallprompt (Firefox, Desktop Safari, etc.)
      setShowGenericModal(true);
    }
  };

  return (
    <>
      <button 
        className="btn-primary" 
        onClick={handleInstallClick} 
        title={t('install_app') || 'Install App'} 
        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.875rem' }}
      >
        <MonitorDown size={16} />
        <span className="hide-on-mobile">{t('install_app') || 'Install'}</span>
      </button>

      {showIOSModal && (
        <div className="modal-overlay" onClick={() => setShowIOSModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-header">
              <h2>Install on iOS</h2>
              <button className="icon-btn" onClick={() => setShowIOSModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <div style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: '50%', marginBottom: '0.5rem' }}>
                <Share size={32} color="var(--primary)" />
              </div>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                To install Activity Log on your iPhone or iPad:
              </p>
              <ol style={{ textAlign: 'left', margin: '0 auto', display: 'inline-block', lineHeight: '1.6' }}>
                <li>Tap the <strong>Share</strong> button at the bottom of Safari.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              </ol>
              <button className="btn-primary" onClick={() => setShowIOSModal(false)} style={{ width: '100%', marginTop: '1rem' }}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {showGenericModal && (
        <div className="modal-overlay" onClick={() => setShowGenericModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', textAlign: 'center' }}>
            <div className="modal-header">
              <h2>Install App</h2>
              <button className="icon-btn" onClick={() => setShowGenericModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <p style={{ margin: 0 }}>
                Your browser blocked the automatic install prompt, but you can still install Activity Log manually:
              </p>
              <ul style={{ margin: '0', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                <li><strong>Chrome / Edge / Brave:</strong> Click the install icon (monitor with a downward arrow) on the far-right side of your URL address bar.</li>
                <li><strong>Firefox:</strong> Natively unsupported on desktop, but you can install the "PWAsForFirefox" extension to enable it.</li>
                <li><strong>Desktop Safari:</strong> Click "File" &gt; "Add to Dock" from the top menu bar.</li>
              </ul>
              <button className="btn-primary" onClick={() => setShowGenericModal(false)} style={{ width: '100%', marginTop: '1rem' }}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
