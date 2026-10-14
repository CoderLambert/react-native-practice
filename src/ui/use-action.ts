import { useRef, useState } from 'react';

// A synchronous ref closes the double-tap window before React's next render.
export function useAction() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  async function run(action: () => Promise<string | void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage(''); setFailed(false);
    try { const result = await action(); if (result) setMessage(result); }
    catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : '操作失败，请重试'); }
    finally { lock.current = false; setBusy(false); }
  }
  return { run, busy, message, failed };
}
