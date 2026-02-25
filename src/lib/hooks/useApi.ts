'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiResponse } from '@/lib/api';

// ---------------------------------------------------------------------------
// Generic fetch hook
// ---------------------------------------------------------------------------

interface UseApiOptions {
  /** Skip automatic fetch on mount */
  manual?: boolean;
  /** Dependency array to trigger refetch (in addition to key) */
  deps?: unknown[];
}

interface UseApiReturn<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

/**
 * React hook that wraps any api function returning ApiResponse<T>.
 *
 * @example
 * const { data, loading, error } = useApi(() => api.products.list({ limit: 12 }));
 * const { data, refetch } = useApi(() => api.orders.list(), { manual: true });
 */
export function useApi<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {},
): UseApiReturn<T> {
  const { manual = false, deps = [] } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!manual);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (!mountedRef.current) return;
      if (result.success) {
        setData(result.data ?? null);
      } else {
        setError(result.error || 'Something went wrong');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    if (!manual) execute();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, manual]);

  return { data, error, loading, refetch: execute };
}

// ---------------------------------------------------------------------------
// Mutation hook (POST, PUT, DELETE)
// ---------------------------------------------------------------------------

interface UseMutationReturn<TData, TPayload> {
  data: TData | null;
  error: string | null;
  loading: boolean;
  mutate: (payload: TPayload) => Promise<ApiResponse<TData>>;
  reset: () => void;
}

/**
 * Hook for mutations (create, update, delete).
 *
 * @example
 * const { mutate, loading } = useMutation((data: OrderPayload) => api.orders.create(data));
 * const handleSubmit = async () => { await mutate(orderData); };
 */
export function useMutation<TData, TPayload = unknown>(
  mutationFn: (payload: TPayload) => Promise<ApiResponse<TData>>,
): UseMutationReturn<TData, TPayload> {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mutate = useCallback(
    async (payload: TPayload): Promise<ApiResponse<TData>> => {
      setLoading(true);
      setError(null);
      try {
        const result = await mutationFn(payload);
        if (result.success) {
          setData(result.data ?? null);
        } else {
          setError(result.error || 'Something went wrong');
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [mutationFn],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, error, loading, mutate, reset };
}

export default useApi;
