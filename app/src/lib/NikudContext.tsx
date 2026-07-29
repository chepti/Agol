import React, { createContext, useContext, useEffect, useState } from 'react';
import { isNikudEnabled, setNikudEnabled } from './nikudPref';
import { displayText as displayTextRaw } from '../data/nikud';

const NikudCtx = createContext({
  enabled: true,
  setEnabled: (_on: boolean) => {},
  text: (s: string) => s,
});

export function NikudProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(isNikudEnabled);

  useEffect(() => {
    const sync = () => setEnabledState(isNikudEnabled());
    window.addEventListener('agol-nikud', sync);
    return () => window.removeEventListener('agol-nikud', sync);
  }, []);

  const setEnabled = (on: boolean) => {
    setNikudEnabled(on);
    setEnabledState(on);
  };

  const text = (s: string) => displayTextRaw(s, enabled);

  return (
    <NikudCtx.Provider value={{ enabled, setEnabled, text }}>
      {children}
    </NikudCtx.Provider>
  );
}

export function useNikud() {
  return useContext(NikudCtx);
}
