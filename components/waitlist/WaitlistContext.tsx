'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { track } from '@/lib/analytics';
import { WaitlistModal } from '@/components/waitlist/WaitlistModal';

interface WaitlistContextValue {
  /** Ouvre la modal bêta en précisant sa provenance (source analytics). */
  open: (source?: string) => void;
}

const WaitlistContext = createContext<WaitlistContextValue | null>(null);

export function useWaitlist(): WaitlistContextValue {
  const ctx = useContext(WaitlistContext);
  if (!ctx) throw new Error('useWaitlist doit être utilisé dans <WaitlistProvider>.');
  return ctx;
}

export function WaitlistProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState('website');

  const open = useCallback((nextSource = 'website') => {
    setSource(nextSource);
    setIsOpen(true);
    track('waitlist_modal_opened', { source: nextSource });
  }, []);

  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <WaitlistContext.Provider value={value}>
      {children}
      <WaitlistModal isOpen={isOpen} onClose={close} source={source} />
    </WaitlistContext.Provider>
  );
}
