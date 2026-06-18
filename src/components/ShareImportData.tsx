import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type User } from '../db/database';
import { ExportModal } from './ExportModal';

export function ShareImportData({ user }: { user: User }) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const activities = useLiveQuery(() => db.activities.where('userId').equals(user.id!).toArray());

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.user || !data.activities) {
        throw new Error("Invalid format");
      }

      // Check if user exists, if not create
      const allUsers = await db.users.toArray();
      const existingUser = allUsers.find(u => 
        u.firstName === data.user.firstName && 
        u.lastName === data.user.lastName
      );

      let targetUserId;
      if (existingUser && existingUser.id) {
        targetUserId = existingUser.id;
      } else {
        targetUserId = await db.users.add({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          colorTheme: data.user.colorTheme || 'ocean',
          createdAt: data.user.createdAt || Date.now()
        });
      }

      // Import activities
      const mappedActivities = data.activities.map((a: any) => ({
        ...a,
        userId: targetUserId,
        id: a.id || crypto.randomUUID()
      }));

      // Use bulkPut to overwrite or add
      await db.activities.bulkPut(mappedActivities);
      
      alert(t('import_success') || "Import successful!");
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
          onChange={handleImport}
        />
      </div>

      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        user={user} 
        activities={activities || []} 
      />
    </>
  );
}
