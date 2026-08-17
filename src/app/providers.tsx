'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }: { children: React.ReactNode }) {
  // The roster is one big fetch off a slow upstream system (see
  // /api/ext-members), but it IS edited live — a member deleted in the club
  // system has to disappear here without anyone clearing a cache by hand. So:
  // hold it for a minute (that alone kills the repeated refetching that made
  // tab switches feel slow), then re-check when the window is focused again
  // or the connection comes back.
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 30 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: 'always',
        retry: 2,
      },
    },
  }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
