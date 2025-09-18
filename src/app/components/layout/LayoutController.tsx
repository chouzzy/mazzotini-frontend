'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { AppLayout } from './AppLayout';

export function LayoutController({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth0();

  // Se o usuário NÃO estiver autenticado, mostramos o layout da landing page.
  if (!isAuthenticated) {
    return (
      <>
        <Header />
        {children}
        <Footer />
      </>
    );
  } else {
    return (
      <AppLayout>
        {children}
      </AppLayout>
    )
  }

  // Se o usuário ESTIVER autenticado, o AppLayout assume o controle.
  // Por isso, renderizamos apenas o conteúdo da página (que será o AppLayout).
  return <>{children}</>;
}
