import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { vi, describe, it, expect } from 'vitest';

// Cliente fictício com um processo e o último andamento ainda com a tag do relatório
const api = vi.hoisted(() => ({
    data: {
        client: { id: 'cliente-1', name: 'Cliente Exemplo', email: 'cliente@exemplo.com', picture: '' },
        processes: [{
            investmentId: 'inv-1', investorShare: 0, acquisitionDate: null, legalOneId: 999,
            processNumber: '0000001-00.2020.8.26.0100', nickname: 'Contrato 1', otherParty: 'Parte Exemplo',
            originalCreditor: 'Credor Exemplo', currentValue: 1000, acquisitionValue: 500, status: 'Ativo',
            lastUpdate: { date: '2026-10-01T00:00:00.000Z', description: '#RelatórioMAA\nValor Atualizado: R$ 1.000,00\nSentença publicada.' },
        }],
    },
}));

vi.mock('@/hooks/useApi', () => ({ useApi: () => ({ data: api.data, isLoading: false }) }));
vi.mock('next/navigation', () => ({ useParams: () => ({ clientId: 'cliente-1' }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock('next/link', () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));
vi.mock('@/app/components/auth/AuthenticationGuard', () => ({ AuthenticationGuard: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

import AssociateClientPage from '@/app/associado/clientes/[clientId]/page';

describe('Portal do associado: processos de um cliente', () => {
    it('mostra o andamento sem a tag do relatório e o status pelo rótulo do cliente', () => {
        render(<ChakraProvider value={defaultSystem}><AssociateClientPage /></ChakraProvider>);

        expect(screen.getByText('Sentença publicada.')).toBeInTheDocument();
        expect(screen.queryByText(/#RelatórioMAA/)).toBeNull();
        expect(screen.queryByText(/Valor Atualizado/)).toBeNull();
        expect(screen.getByText('Ativo')).toBeInTheDocument();
    });

    it('status gravado em inglês ou de integração aparece pelo rótulo do cliente', () => {
        const base = api.data.processes[0];
        api.data = {
            ...api.data,
            processes: [
                { ...base, investmentId: 'inv-1', legalOneId: 991, status: 'CLOSED' },
                { ...base, investmentId: 'inv-2', legalOneId: 992, status: 'FAILED_ENRICHMENT' },
            ],
        };
        render(<ChakraProvider value={defaultSystem}><AssociateClientPage /></ChakraProvider>);

        expect(screen.getByText('Liquidado')).toBeInTheDocument();
        expect(screen.getByText('Em processamento')).toBeInTheDocument();
        expect(screen.queryByText('CLOSED')).toBeNull();
        expect(screen.queryByText('FAILED_ENRICHMENT')).toBeNull();
    });
});
