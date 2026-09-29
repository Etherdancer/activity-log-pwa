import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, AlertTriangle } from 'lucide-react';
import { db, type Activity } from '../db/database';
import { type ExportPayload, newId, sameActivity } from '../utils/importData';
import { activitySpan } from '../utils/time';

interface ImportResolverModalProps {
  /** Validated import data (see parseImportPayload). Remount (key) for each new import. */
  importData: ExportPayload;
  onClose: () => void;
}

type Resolution = 'keep_device' | 'keep_imported' | 'merge';
type Conflict = { incoming: Activity; existing: Activity };

export function ImportResolverModal({ importData, onClose }: ImportResolverModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'confirm' | 'conflict' | 'processing'>('confirm');
  const [pending, setPending] = useState<{ userId: number; incoming: Activity[]; conflicts: Conflict[] } | null>(null);

  const detectConflicts = async () => {
    setStep('processing');
    try {
      const allUsers = await db.users.toArray();
      const existingUser = allUsers.find(u =>
        u.firstName === importData.user.firstName && u.lastName === importData.user.lastName
      );
      const userId = existingUser?.id ?? (await db.users.add({ ...importData.user })) as number;

      // Give every incoming activity an id up front, so conflict handling can refer to it.
      const incomingAll: Activity[] = importData.activities.map(a => ({ ...a, id: a.id || newId(), userId }));
      const existing = existingUser ? await db.activities.where('userId').equals(userId).toArray() : [];

      // Exact duplicates (e.g. importing the same export twice) are skipped, not duplicated.
      const incoming = incomingAll.filter(inc => !existing.some(ex => sameActivity(ex, inc)));

      const conflicts: Conflict[] = [];
      for (const inc of incoming) {
        const i = activitySpan(inc.startTime, inc.endTime);
        const overlap = existing.find(ex => {
          if (ex.date !== inc.date || ex.id === inc.id) return false;
          const e = activitySpan(ex.startTime, ex.endTime);
          return i.start < e.end && e.start < i.end;
        });
        if (overlap) conflicts.push({ incoming: inc, existing: overlap });
      }

      if (conflicts.length > 0) {
        setPending({ userId, incoming, conflicts });
        setStep('conflict');
      } else {
        await executeImport(incoming, 'keep_imported', []);
      }
    } catch (e) {
      console.error(e);
      alert(t('import_failed'));
      onClose();
    }
  };

  const executeImport = async (incoming: Activity[], resolution: Resolution, conflicts: Conflict[]) => {
    setStep('processing');
    try {
      let toInsert = incoming;
      const conflictIncomingIds = new Set(conflicts.map(c => c.incoming.id));
      await db.transaction('rw', db.activities, async () => {
        if (resolution === 'keep_device') {
          toInsert = incoming.filter(a => !conflictIncomingIds.has(a.id));
        } else if (resolution === 'keep_imported') {
          await db.activities.bulkDelete(conflicts.map(c => c.existing.id!));
        } else {
          // Merge: keep both side by side; fresh ids so nothing is overwritten.
          toInsert = incoming.map(a => (conflictIncomingIds.has(a.id) ? { ...a, id: newId() } : a));
        }
        await db.activities.bulkPut(toInsert);
      });
      alert(t('import_success'));
      onClose();
    } catch (e) {
      console.error(e);
      alert(t('import_failed'));
      onClose();
    }
  };

  const resolve = (r: Resolution) => pending && executeImport(pending.incoming, r, pending.conflicts);

  return (
    <div className="modal-overlay" style={{ zIndex: 400 }}>
      <div className="modal-content" style={{ maxWidth: '400px' }} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>{step === 'conflict' ? t('import_conflict_title') : t('incoming_data_title')}</h3>
          <button className="close-btn" onClick={onClose} disabled={step === 'processing'} aria-label={t('cancel')}>
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
                ({t('activity_count', { count: importData.activities.length })})
              </p>
            </>
          )}

          {step === 'processing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--color-surface-200)', borderTopColor: 'var(--color-primary-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ fontWeight: 500 }}>{t('importing_data')}</p>
            </div>
          )}

          {step === 'conflict' && pending && (
            <>
              <AlertTriangle size={48} style={{ color: 'var(--color-warning)', margin: '0 auto 1rem auto' }} />
              <p style={{ margin: 0, fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                {t('import_conflict_desc', { count: pending.conflicts.length })}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button className="btn-secondary" style={{ justifyContent: 'center', whiteSpace: 'normal', height: 'auto', padding: '0.75rem' }} onClick={() => resolve('keep_device')}>
                  {t('conflict_keep_device')}
                </button>
                <button className="btn-primary" style={{ justifyContent: 'center', whiteSpace: 'normal', height: 'auto', padding: '0.75rem' }} onClick={() => resolve('keep_imported')}>
                  {t('conflict_keep_imported')}
                </button>
                <button className="btn-secondary" style={{ justifyContent: 'center', whiteSpace: 'normal', height: 'auto', padding: '0.75rem' }} onClick={() => resolve('merge')}>
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
