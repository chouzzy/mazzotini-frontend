// ============================================================================
// src/components/providers/Auth0ProviderWithHistory.tsx
// ============================================================================
// Este componente configura o provedor do Auth0 para a sua aplicação.

'use client';

import { Auth0Provider } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import { AppState } from '@auth0/auth0-react';

export const Auth0ProviderWithHistory = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
  const audience = process.env.NEXT_PUBLIC_API_AUDIENCE;

  if (!domain || !clientId || !audience) {
    // Idealmente, mostrar uma mensagem de erro ou um ecrã de carregamento
    return null;
  }

  const onRedirectCallback = (appState?: AppState) => {
    // Redireciona o utilizador para a página de onde ele veio após o login
    router.push(appState?.returnTo || window.location.pathname);
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : undefined,
        audience: audience, // Pede o token para a nossa API
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};
