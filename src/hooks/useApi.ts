// src/hooks/useApi.ts
'use client';

import useSWR from 'swr';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

/**
 * Um hook customizado que usa o SWR para fazer chamadas autenticadas à nossa API.
 * @param endpoint O endpoint da API a ser chamado (ex: '/api/investments/me').
 * @returns O estado da requisição SWR: { data, error, isLoading, mutate }.
 */
export function useApi<T = any>(endpoint: string | null) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  // O 'fetcher' é a função que o SWR usará para buscar os dados.
  // Nós a configuramos para usar o axios com o token de autenticação.
  const fetcher = async (url: string) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await api.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      // Se a API retornar um erro (ex: 403, 500), o axios vai lançar uma exceção.
      // Nós a capturamos e relançamos para que o SWR possa pegá-la no seu estado 'error'.
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  };

  // O hook SWR só será ativado se o endpoint não for nulo e o usuário estiver autenticado.
  const { data, error, isLoading, mutate } = useSWR<T>(
    isAuthenticated ? endpoint : null, 
    fetcher,
    {
      // Opções adicionais do SWR que podemos configurar no futuro
      // revalidateOnFocus: false, 
    }
  );

  return { data, error, isLoading, mutate };
}