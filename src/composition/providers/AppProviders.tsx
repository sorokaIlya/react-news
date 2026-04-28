import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/read-model/query';

import { StoresProvider } from './StoresProvider';
import { useRealtime } from '../realtime/useRealtime';

type AppProvidersProps = {
  children: React.ReactNode;
};

/**
 * Provider stack:
 *   StoresProvider       ← domain stores
 *     QueryClientProvider  ← read-model cache
 *       RealtimeBridge     ← transport events -> domain actions
 *       <app tree>
 *
 * StoresProvider is mounted ABOVE QueryClientProvider on purpose: the API
 * client needs the session token before any query can run, and the realtime
 * bridge wants to report back into the MobX status store.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <StoresProvider>
      <QueryClientProvider client={queryClient}>
        <RealtimeBridge />
        {children}
      </QueryClientProvider>
    </StoresProvider>
  );
}

function RealtimeBridge() {
  useRealtime();
  return null;
}
