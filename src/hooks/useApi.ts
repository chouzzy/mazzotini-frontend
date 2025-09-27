// /src/hooks/useApi.ts
'use client';

import useSWR from 'swr';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

export function useApi<T = any>(endpoint: string | null) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const fetcher = async (url: string) => {
    try {
      // A CORREÇÃO ESTÁ AQUI:
      // Passamos a 'audience' para garantir que recebemos o token correto
      // com as nossas permissões (roles) personalizadas.
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_API_AUDIENCE,
        },
      });

      const response = await api.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  };

  const { data, error, isLoading, mutate } = useSWR<T>(
    isAuthenticated ? endpoint : null, 
    fetcher
  );

  return { data, error, isLoading, mutate };
}