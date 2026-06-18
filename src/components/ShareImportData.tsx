import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type User } from '../db/database';
import { ExportModal } from './ExportModal';
import { ImportResolverModal } from './ImportResolverModal';

export function ShareImportData({ user }: { user: User }) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const activities = useLiveQuery(() => db.activities.where('userId').equals(user.id!).toArray());

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.user || !data.activities) {
        throw new Error("Invalid format");
      }

      setImportData(data);
      setIsImportModalOpen(true);
    } catch (error) {
      console.error("Import failed", error);
      alert(t('import_failed') || "Import failed");
    }
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn-secondary" title={t('export_data')} onClick={() => setIsExportModalOpen(true)}>
          <Upload size={18} />
        </button>
        
        <button className="btn-secondary" title={t('import_data')} onClick={() => fileInputRef.current?.click()}>
          <Download size={18} />
        </button>
        
        <input 
          type="file" 
          accept=".json" 
          style={{ display: 'none' }} 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        user={user} 
        activities={activities || []} 
      />

      <ImportResolverModal
        isOpen={isImportModalOpen}
        importData={importData}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportData(null);
        }}
      />
    </>
  );
}
