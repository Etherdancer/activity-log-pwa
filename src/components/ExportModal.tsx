import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Link as LinkIcon, FileJson, Copy, Share2, Info } from 'lucide-react';
import LZString from 'lz-string';
import type { User, Activity } from '../db/database';
import './ActivityModal.css';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  activities: Activity[];
}

export function ExportModal({ isOpen, onClose, user, activities }: ExportModalProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'link' | 'file'>('link');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const exportData = {
    user,
    activities
  };

  const handleGenerateLink = () => {
    const jsonStr = JSON.stringify(exportData);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    const url = `${window.location.origin}${window.location.pathname}#import=${compressed}`;
    setGeneratedLink(url);
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      alert(t('link_copied'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleShareLink = async () => {
    if (!generatedLink) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Activity Log',
          text: `Activity Log for ${user.firstName} ${user.lastName}`,
          url: generatedLink
        });
      } else {
        handleCopyLink();
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        handleCopyLink();
      }
    }
  };

  const downloadFile = (file: File, filename: string) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileExport = async () => {
    try {
      const jsonString = JSON.stringify(exportData, null, 2);
      const filename = `activity_log_${user.firstName}_${user.lastName}.json`;
      const file = new File([jsonString], filename, { type: 'application/json' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Exported Data',
            text: `Activity Log data for ${user.firstName} ${user.lastName}`
          });
          onClose();
          return;
        } catch (e: any) {
          if (e.name !== 'AbortError') {
            downloadFile(file, filename);
            onClose();
          }
        }
      } else {
        downloadFile(file, filename);
        onClose();
      }
    } catch (e) {
      console.error(e);
      alert(t('export_failed'));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 300 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>{t('export_options_title')}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Link Option */}
          <div 
            style={{ 
              border: `2px solid ${mode === 'link' ? 'var(--color-primary-500)' : 'var(--color-surface-300)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => setMode('link')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
              <LinkIcon size={20} className="text-primary" />
              {t('export_type_link')}
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-surface-500)' }}>
              {t('export_link_desc')}
            </p>

            {mode === 'link' && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ 
                  backgroundColor: 'var(--bg-main)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                  border: '1px solid var(--color-surface-200)'
                }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: 'var(--text-main)' }}>{t('export_limit_info')}</p>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                    <li>{t('export_limit_ex_1')}</li>
                    <li>{t('export_limit_ex_2')}</li>
                    <li>{t('export_limit_ex_3')}</li>
                  </ul>
                </div>

                {!generatedLink ? (
                  <button className="btn-primary" onClick={(e) => { e.stopPropagation(); handleGenerateLink(); }} style={{ width: '100%' }}>
                    {t('generate_link')}
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#fff3cd', color: '#856404', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', gap: '0.5rem' }}>
                      <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{t('whatsapp_preview_warning')}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); handleCopyLink(); }} style={{ flex: 1 }}>
                        <Copy size={18} /> {t('copy_link')}
                      </button>
                      <button className="btn-primary" onClick={(e) => { e.stopPropagation(); handleShareLink(); }} style={{ flex: 1 }}>
                        <Share2 size={18} /> {t('share_link')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* File Option */}
          <div 
            style={{ 
              border: `2px solid ${mode === 'file' ? 'var(--color-primary-500)' : 'var(--color-surface-300)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => setMode('file')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
              <FileJson size={20} className="text-primary" />
              {t('export_type_file')}
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-surface-500)' }}>
              {t('export_file_desc')}
            </p>

            {mode === 'file' && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ 
                  backgroundColor: 'var(--color-primary-50)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  color: 'var(--color-primary-800)',
                  marginBottom: '1rem',
                  border: '1px solid var(--color-primary-200)',
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{t('export_limit_file_pref')}</span>
                </div>
                <button className="btn-primary" onClick={(e) => { e.stopPropagation(); handleFileExport(); }} style={{ width: '100%' }}>
                  <FileJson size={18} /> {t('share_file') || t('generate_file')}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
