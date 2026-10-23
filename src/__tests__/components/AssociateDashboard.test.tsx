import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { vi, describe, it, expect } from 'vitest';

// Processos fictícios do associado, com o status que o backend grava
const rows = vi.hoisted(() => [
    { clientId: 'cliente-1', status: 'Ativo' },
    { clientId: 'cliente-1', status: 'Ativo' },
    { clientId: 'cliente-2', status: 'Liquidado' },
]);

vi.mock('@/hooks/useApi', () => ({ useApi: () => ({ data: rows, isLoading: false }) }));
vi.mock('@auth0/auth0-react', () => ({ useAuth0: () => ({ user: { name: 'Associado Exemplo' } }) }));
vi.mock('next/link', () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));
vi.mock('@/app/components/auth/AuthenticationGuard', () => ({ AuthenticationGuard: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

import AssociateDashboardPage from '@/app/associado/dashboard/page';

describe('Painel do associado', () => {
    it('conta os processos ativos pelo status que o backend grava ("Ativo")', () => {
        render(<ChakraProvider value={defaultSystem}><AssociateDashboardPage /></ChakraProvider>);

        const card = screen.getByText('Processos ativos').closest('div')!.parentElement!;
        expect(card).toHaveTextContent('2');
        expect(screen.getByText('Clientes vinculados').closest('div')!.parentElement!).toHaveTextContent('2');
    });
});
