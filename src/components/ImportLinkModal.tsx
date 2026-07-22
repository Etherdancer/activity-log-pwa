import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LZString from 'lz-string';
import { ImportResolverModal } from './ImportResolverModal';

export function ImportLinkModal() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [importData, setImportData] = useState<any>(null);

  useEffect(() => {
    const href = window.location.href;
    const importIndex = href.indexOf('#import=');
    
    if (importIndex !== -1) {
      try {
        let compressed = href.substring(importIndex + 8);
        // Strip any appended tracking parameters or invalid characters (LZString encodedURIComponent uses A-Za-z0-9+-$)
        const match = compressed.match(/^[A-Za-z0-9+\-$]+/);
        if (match) {
          compressed = match[0];
        }

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
        alert(t('invalid_link') || "Invalid link.");
        window.location.hash = '';
      }
    }
  }, [t]);

  return (
    <ImportResolverModal
      isOpen={isOpen}
      importData={importData}
      onClose={() => {
        setIsOpen(false);
        setImportData(null);
        window.location.hash = ''; // Clear hash so it can be triggered again
      }}
    />
  );
}
