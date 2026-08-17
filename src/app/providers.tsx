'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }: { children: React.ReactNode }) {
  // The roster is megabytes, so it is never re-fetched speculatively — the
  // version poll in page.tsx says when it actually changed, and only then is
  // it pulled again. Focus and reconnect still re-check, because a tab that
  // sat in the background may have missed a change entirely.
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
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
