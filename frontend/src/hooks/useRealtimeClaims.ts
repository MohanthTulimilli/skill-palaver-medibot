import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Polls for changes by invalidating the given query keys on an interval.
 * (Realtime subscription not available with REST backend.)
 */
export function useRealtimeClaims(queryKeys: string[][] = [['claims']]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => {
      queryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [queryClient, queryKeys]);
}
