import { useEffect, useState } from 'react';
import LZString from 'lz-string';
import { ImportResolverModal } from './ImportResolverModal';
import { parseImportPayload, type ExportPayload } from '../utils/importData';
import i18n from '../i18n';

type LinkState = { data: ExportPayload } | { error: true } | null;

/** Reads `#import=<lz-string>` from the URL once, on load. */
function readImportLink(): LinkState {
  const href = window.location.href;
  const idx = href.indexOf('#import=');
  if (idx === -1) return null;
  try {
    // Strip anything messaging apps append (lz-string's URI alphabet is A-Za-z0-9+-$).
    const compressed = href.substring(idx + 8).match(/^[A-Za-z0-9+\-$]+/)?.[0] ?? '';
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    const data = json ? parseImportPayload(JSON.parse(json)) : null;
    return data ? { data } : { error: true };
  } catch (e) {
    console.error(e);
    return { error: true };
  }
}

function clearHash() {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

export function ImportLinkModal() {
  const [state, setState] = useState<LinkState>(() => {
    const s = readImportLink();
    if (s && 'error' in s) {
      // Defer so the alert doesn't block the first render.
      setTimeout(() => { alert(i18n.t('invalid_link')); clearHash(); }, 0);
      return null;
    }
    return s;
  });

  // Also react to links opened while the app is already running in this tab.
  useEffect(() => {
    const onHash = () => {
      const s = readImportLink();
      if (!s) return;
      if ('error' in s) { alert(i18n.t('invalid_link')); clearHash(); return; }
      setState(s);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (!state || !('data' in state)) return null;
  return (
    <ImportResolverModal
      importData={state.data}
      onClose={() => { setState(null); clearHash(); }}
    />
  );
}
