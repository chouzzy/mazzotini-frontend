import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { vi, describe, it, expect } from 'vitest';

// Associado fictício com dois clientes, cada um com um processo. Objetos estáveis entre renders
const api = vi.hoisted(() => {
    const row = (clientId: string, clientName: string, status: string) => ({
        clientId, clientName, clientEmail: `${clientId}@exemplo.com`, clientPicture: '',
        legalOneId: 1, processNumber: '0000001-00.2020.8.26.0100', nickname: null, otherParty: null,
        currentValue: 1000, status,
    });
    return {
        profile: { role: 'ASSOCIATE', name: 'Associado Exemplo' },
        rows: [row('cliente-1', 'Cliente Um', 'Ativo'), row('cliente-2', 'Cliente Dois', 'CLOSED')],
        empty: [] as unknown[],
        folders: { items: [], meta: { total: 0, page: 1, limit: 999, totalPages: 0 } },
    };
});

vi.mock('@/hooks/useApi', () => ({
    useApi: (endpoint: string | null) => {
        if (endpoint === '/api/users/me') return { data: api.profile, isLoading: false };
        if (endpoint === '/api/associate/processes') return { data: api.rows, isLoading: false };
        if (endpoint?.startsWith('/api/assets/folders')) return { data: api.folders, isLoading: false };
        return { data: api.empty, isLoading: false };
    },
}));
vi.mock('next/link', () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));

import { DashboardOverview } from '@/app/components/layout/Home/DashboardOverview';

describe('Home do associado', () => {
    it('o status de cada cliente aparece pelo rótulo do cliente ("CLOSED" vira "Liquidado")', () => {
        render(<ChakraProvider value={defaultSystem}><DashboardOverview /></ChakraProvider>);

        expect(screen.getByText('Cliente Um')).toBeInTheDocument();
        expect(screen.getByText('Ativo')).toBeInTheDocument();
        expect(screen.getByText('Liquidado')).toBeInTheDocument();
        expect(screen.queryByText('CLOSED')).toBeNull();
        expect(screen.queryByText('Encerrado')).toBeNull();
    });
});
