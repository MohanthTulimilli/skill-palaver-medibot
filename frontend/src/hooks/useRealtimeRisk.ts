import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Real-time risk updates via Server-Sent Events (SSE).
 * Fallback: Polling every N seconds.
 *
 * Backend must expose:
 * - GET /api/risk-events/stream (SSE) — OR —
 * - Poll existing /api/claims, /api/invoices, etc. with refetchInterval
 */
const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:8080');

export function useRealtimeRisk(options?: {
  queryKeys?: string[][];
  pollIntervalMs?: number;
  useSSE?: boolean;
}) {
  const { queryKeys = [['claims'], ['invoices'], ['doctor-appointments']], pollIntervalMs = 15000, useSSE = false } = options ?? {};
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const invalidate = useCallback(() => {
    queryKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
    setLastUpdate(new Date());
  }, [queryClient, queryKeys]);

  useEffect(() => {
    if (useSSE) {
      const token = localStorage.getItem('token');
      const url = `${API_BASE}/api/risk-events/stream${token ? `?token=${token}` : ''}`;
      try {
        const es = new EventSource(url);
        eventSourceRef.current = es;
        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'risk_updated') {
              invalidate();
            }
          } catch (_) {}
        };
        es.onerror = () => {
          es.close();
          eventSourceRef.current = null;
        };
        return () => {
          es.close();
          eventSourceRef.current = null;
        };
      } catch (_) {
        // SSE not available, fall through to polling
      }
    }

    const interval = setInterval(invalidate, pollIntervalMs);
    return () => clearInterval(interval);
  }, [useSSE, pollIntervalMs, invalidate]);

  return { lastUpdate, invalidate };
}
