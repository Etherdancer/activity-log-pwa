import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload } from 'lucide-react';
import { db, type User } from '../db/database';

export function ShareImportData({ user }: { user: User }) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const activities = await db.activities.where('userId').equals(user.id!).toArray();
      const exportData = {
        user,
        activities
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const filename = `activity_log_${user.firstName}_${user.lastName}.json`;
      const file = new File([blob], filename, { type: 'application/json' });

      let shared = false;
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Activity Log Export',
            text: `Activity Log for ${user.firstName} ${user.lastName}`
          });
          shared = true;
        } catch (shareError: any) {
          // If user aborted the share sheet, don't show an error and don't fallback to download.
          if (shareError.name === 'AbortError') return;
          console.warn("Share API failed, falling back to download", shareError);
        }
      } 
      
      if (!shared) {
        // Fallback to direct download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      console.error("Export failed", e);
      alert(t('export_failed') || "Export failed");
    }
  };

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
      let importedUserId = data.user.id;
      const existingUser = await db.users.get(importedUserId);
      if (!existingUser) {
        importedUserId = await db.users.add({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          colorTheme: data.user.colorTheme || 'ocean',
          createdAt: data.user.createdAt || Date.now()
        });
      }

      // Import activities
      const mappedActivities = data.activities.map((a: any) => ({
        ...a,
        userId: importedUserId,
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
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button className="btn-secondary" title={t('export_data')} onClick={handleExport}>
        <Download size={18} />
      </button>
      
      <button className="btn-secondary" title={t('import_data')} onClick={() => fileInputRef.current?.click()}>
        <Upload size={18} />
      </button>
      
      <input 
        type="file" 
        accept=".json" 
        style={{ display: 'none' }} 
        ref={fileInputRef}
        onChange={handleImport}
      />
    </div>
  );
}
