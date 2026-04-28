import React, { createContext, useContext, useRef } from 'react';

import { RootStore } from '@/domain/stores';

const StoresContext = createContext<RootStore | null>(null);

type StoresProviderProps = {
  children: React.ReactNode;
};

/**
 * Creates the RootStore once and wires SessionStore.getToken into the API
 * client before children render. The token string itself stays owned by
 * SessionStore.
 */
export function StoresProvider({ children }: StoresProviderProps) {
  const ref = useRef<RootStore | null>(null);
  if (!ref.current) {
    ref.current = new RootStore();
  }
  return <StoresContext.Provider value={ref.current}>{children}</StoresContext.Provider>;
}

export function useStores(): RootStore {
  const stores = useContext(StoresContext);
  if (!stores) {
    throw new Error('useStores must be used inside <StoresProvider>');
  }
  return stores;
}
