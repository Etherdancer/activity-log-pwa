import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download } from 'lucide-react';
import LZString from 'lz-string';
import { db } from '../db/database';
import './ActivityModal.css';

export function ImportLinkModal() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#import=')) {
      try {
        const compressed = hash.replace('#import=', '');
        const jsonStr = LZString.decompressFromEncodedURIComponent(compressed);
        if (!jsonStr) throw new Error("Decompression failed");
        
        const data = JSON.parse(jsonStr);
        if (!data.user || !data.activities) {
          throw new Error("Invalid format");
        }
        
        setImportData(data);
        setIsOpen(true);
      } catch (e) {
        console.error(e);
        setError(t('invalid_link'));
        setIsOpen(true);
      }
    }
  }, [t]);

  const handleClose = () => {
    setIsOpen(false);
    window.location.hash = ''; // Clear the hash
  };

  const handleImport = async () => {
    if (!importData) return;
    try {
      // Check if user exists, if not create
      let importedUserId = importData.user.id;
      const existingUser = await db.users.get(importedUserId);
      if (!existingUser) {
        importedUserId = await db.users.add({
          firstName: importData.user.firstName,
          lastName: importData.user.lastName,
          colorTheme: importData.user.colorTheme || 'ocean',
          createdAt: importData.user.createdAt || Date.now()
        });
      }

      // Import activities
      const mappedActivities = importData.activities.map((a: any) => ({
        ...a,
        userId: importedUserId,
        id: a.id || crypto.randomUUID()
      }));

      await db.activities.bulkPut(mappedActivities);
      
      alert(t('import_success'));
      handleClose();
      // Reload to ensure state updates everywhere
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(t('import_failed'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 400 }}>
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3>{t('incoming_data_title')}</h3>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          {error ? (
            <div style={{ color: 'var(--color-danger)' }}>{error}</div>
          ) : (
            <>
              <Download size={48} className="text-primary" style={{ margin: '0 auto 1rem auto' }} />
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                {t('incoming_data_desc')} <strong>{importData.user.firstName} {importData.user.lastName}</strong>?
              </p>
              <p style={{ marginTop: '0.5rem', color: 'var(--color-surface-500)', fontSize: '0.9rem' }}>
                ({importData.activities.length} activities)
              </p>
            </>
          )}
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          {!error && (
            <button className="btn-primary" onClick={handleImport} style={{ width: '100%', padding: '0.75rem' }}>
              {t('import_now')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
