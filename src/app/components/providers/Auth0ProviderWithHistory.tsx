// ============================================================================
// src/components/providers/Auth0ProviderWithHistory.tsx
// ============================================================================
// Este componente configura o provedor do Auth0 para a sua aplicação.

'use client';

import { Auth0Provider } from '@auth0/auth0-react';
import { AppState } from '@auth0/auth0-react';

const onRedirectCallback = (appState?: AppState) => {
  // Usa history API diretamente — evita eventos de navegação do Next.js
  // que causariam re-renders infinitos após o callback do Auth0
  window.history.replaceState({}, '', appState?.returnTo || '/');
};

export const Auth0ProviderWithHistory = ({ children }: { children: React.ReactNode }) => {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
  const audience = process.env.NEXT_PUBLIC_API_AUDIENCE;

  if (!domain || !clientId || !audience) {
    return null;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : undefined,
        audience: audience,
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};
