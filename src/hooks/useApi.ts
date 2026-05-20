// /src/hooks/useApi.ts
'use client';

import useSWR from 'swr';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useCallback, useRef } from 'react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 15000,
});

export function useApi<T = unknown>(endpoint: string | null) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  // Ref keeps the latest getAccessTokenSilently without making fetcher unstable.
  // Auth0 returns a new function reference on every context update (e.g. during
  // the OAuth callback), which would cause SWR to revalidate on every render if
  // passed directly as a useCallback dependency.
  const getTokenRef = useRef(getAccessTokenSilently);
  getTokenRef.current = getAccessTokenSilently;

  const fetcher = useCallback(async (url: string) => {
    try {
      const token = await getTokenRef.current({
        authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE },
      });
      const response = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }, []); // stable — never recreated

  const { data, error, isLoading, mutate } = useSWR<T>(
    isAuthenticated ? endpoint : null,
    fetcher
  );

  return { data, error, isLoading, mutate };
}