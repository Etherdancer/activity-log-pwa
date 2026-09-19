import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, AlertTriangle } from 'lucide-react';
import { db, type Activity } from '../db/database';

interface ImportResolverModalProps {
  isOpen: boolean;
  importData: any | null; // The parsed JSON
  onClose: () => void;
}

export function ImportResolverModal({ isOpen, importData, onClose }: ImportResolverModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'confirm' | 'conflict' | 'processing'>('confirm');
  const [conflicts, setConflicts] = useState<{ incoming: Activity; existing: Activity }[]>([]);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && importData) {
      setStep('confirm');
      setConflicts([]);
      setTargetUserId(null);
    }
  }, [isOpen, importData]);

  const detectConflicts = async () => {
    if (!importData) return;
    setStep('processing');
    
    try {
      // Check if user exists
      const allUsers = await db.users.toArray();
      const existingUser = allUsers.find(u => 
        u.firstName === importData.user.firstName && 
        u.lastName === importData.user.lastName
      );

      let tUserId: number;
      if (existingUser && existingUser.id !== undefined) {
        tUserId = existingUser.id!;
      } else {
        // User doesn't exist, so no conflicts are possible
        tUserId = (await db.users.add({
          firstName: importData.user.firstName,
          lastName: importData.user.lastName,
          colorTheme: importData.user.colorTheme || 'ocean',
          createdAt: importData.user.createdAt || Date.now()
        })) as number;
        setTargetUserId(tUserId);
        await executeImport(tUserId, importData.activities, 'keep_imported', []);
        return;
      }
      
      setTargetUserId(tUserId);

      // Fetch existing activities for this user
      const existingActivities = await db.activities.where('userId').equals(tUserId).toArray();
      
      const parseTime = (t: string) => { 
        if (!t) return 0;
        const [h,m] = t.split(':').map(Number); 
        return h * 60 + (m || 0); 
      };

      const foundConflicts: { incoming: Activity; existing: Activity }[] = [];
      
      importData.activities.forEach((inc: any) => {
        const incStart = parseTime(inc.startTime);
        let incEnd = incStart + 60;
        if (inc.endTime) {
          incEnd = parseTime(inc.endTime);
          if (incEnd < incStart) incEnd += 24 * 60;
        }

        // Find an existing activity that intersects in time
        const overlap = existingActivities.find(ex => {
          if (ex.date !== inc.date) return false;
          
          const exStart = parseTime(ex.startTime);
          let exEnd = exStart + 60;
          if (ex.endTime) {
            exEnd = parseTime(ex.endTime);
            if (exEnd < exStart) exEnd += 24 * 60;
          }

          // Check intersection
          return incStart < exEnd && exStart < incEnd;
        });

        if (overlap) {
          // If they are exactly the same, it's not a conflict we care about (just ignore or overwrite it)
          if (overlap.startTime !== inc.startTime || overlap.endTime !== inc.endTime || overlap.description !== inc.description) {
            foundConflicts.push({ incoming: inc, existing: overlap });
          }
        }
      });

      if (foundConflicts.length > 0) {
        setConflicts(foundConflicts);
        setStep('conflict');
      } else {
        await executeImport(tUserId, importData.activities, 'keep_imported', []);
      }
    } catch (e) {
      console.error(e);
      alert(t('import_failed') || 'Import failed');
      onClose();
    }
  };

  const executeImport = async (userId: number, incomingData: any[], resolution: 'keep_device' | 'keep_imported' | 'merge', currentConflicts: { incoming: Activity; existing: Activity }[]) => {
    try {
      setStep('processing');
      let activitiesToInsert = incomingData.map(a => ({
        ...a,
        userId: userId,
        id: a.id || ((typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2, 10))
      }));

      if (currentConflicts.length > 0) {
        if (resolution === 'keep_device') {
          // Filter out incoming activities that are in conflicts
          const conflictIncomingIds = new Set(currentConflicts.map(c => c.incoming.id));
          activitiesToInsert = activitiesToInsert.filter(a => !conflictIncomingIds.has(a.id));
        } else if (resolution === 'keep_imported') {
          // Delete the old existing activities that are conflicting
          const existingIdsToDelete = currentConflicts.map(c => c.existing.id!);
          await db.activities.bulkDelete(existingIdsToDelete);
        } else if (resolution === 'merge') {
          // Just insert them, but give incoming ones a brand new UUID so they don't overwrite if they happen to share UUID
          activitiesToInsert = activitiesToInsert.map(a => {
            const isConflict = currentConflicts.some(c => c.incoming.id === a.id);
            if (isConflict) {
              return { ...a, id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2, 10) }; // Ensure they coexist side-by-side
            }
            return a;
          });
        }
      }

      await db.activities.bulkPut(activitiesToInsert);
      alert(t('import_success') || 'Import successful');
      onClose();
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert(t('import_failed') || 'Import failed');
      onClose();
    }
  };

  if (!isOpen || !importData) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 400 }}>
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3>{step === 'conflict' ? t('import_conflict_title') : t('incoming_data_title')}</h3>
          <button className="close-btn" onClick={onClose} disabled={step === 'processing'}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          {step === 'confirm' && (
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

          {step === 'processing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--color-surface-200)', borderTopColor: 'var(--color-primary-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ fontWeight: 500 }}>{t('importing_data') || 'Processing...'}</p>
            </div>
          )}

          {step === 'conflict' && (
            <>
              <AlertTriangle size={48} style={{ color: 'var(--color-warning)', margin: '0 auto 1rem auto' }} />
              <p style={{ margin: 0, fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                {t('import_conflict_desc', { count: conflicts.length })}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button 
                  className="btn-secondary" 
                  style={{ justifyContent: 'center', whiteSpace: 'normal', height: 'auto', padding: '0.75rem' }}
                  onClick={() => executeImport(targetUserId!, importData.activities, 'keep_device', conflicts)}
                >
                  {t('conflict_keep_device')}
                </button>
                <button 
                  className="btn-primary" 
                  style={{ justifyContent: 'center', whiteSpace: 'normal', height: 'auto', padding: '0.75rem' }}
                  onClick={() => executeImport(targetUserId!, importData.activities, 'keep_imported', conflicts)}
                >
                  {t('conflict_keep_imported')}
                </button>
                <button 
                  className="btn-secondary" 
                  style={{ justifyContent: 'center', whiteSpace: 'normal', height: 'auto', padding: '0.75rem' }}
                  onClick={() => executeImport(targetUserId!, importData.activities, 'merge', conflicts)}
                >
                  {t('conflict_merge')}
                </button>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          {step === 'confirm' && (
            <button className="btn-primary" onClick={detectConflicts} style={{ width: '100%', padding: '0.75rem' }}>
              {t('import_now')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
