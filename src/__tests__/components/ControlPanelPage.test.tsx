import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ControlPanel } from '@/app/gestao/controladoria/page';

// Painel com dados fictícios
const api = vi.hoisted(() => ({ data: null as unknown, isLoading: false, error: null as unknown, mutate: vi.fn() }));

vi.mock('@/hooks/useApi', () => ({
    useApi: (endpoint: string | null) => (endpoint === '/api/management/control-panel'
        ? { data: api.data, isLoading: api.isLoading, error: api.error, mutate: api.mutate }
        : { data: undefined, isLoading: false, mutate: vi.fn() }),
}));
vi.mock('@/app/components/auth/AuthenticationGuard', () => ({ AuthenticationGuard: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/app/components/auth/RoleGuard', () => ({ RoleGuard: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }));

import ControlPanelPage from '@/app/gestao/controladoria/page';

const wrap = (el: React.ReactElement) => render(<ChakraProvider value={defaultSystem}>{el}</ChakraProvider>);

const panel = (over: Partial<ControlPanel> = {}): ControlPanel => ({
    generatedAt: '2026-11-24T12:00:00.000Z',
    legalOneStatus: { closedByJob: 7, lastRun: { finishedAt: '2026-11-22T05:30:00.000Z', checked: 100, notFound: 5, closed: 7, reopened: 1 } },
    withoutAssociate: { investments: 12, fixableByReferral: 4, freeTextReferralClients: 2 },
    shadowDuplicates: { accounts: 3, shadows: 3, shadowInvestments: 9, ambiguous: 1 },
    recalculation: {
        period: '2026-11', status: 'DONE', finishedAt: '2026-11-05T08:00:00.000Z', recalculated: 40, failures: 1,
        failureList: [{ legalOneId: 111, processNumber: '0000001-00.2020.8.26.0100', error: 'Falta IPCA de 10/2026 no banco de índices.' }],
    },
    backfill: {
        status: 'completed', startedAt: null, finishedAt: '2026-11-20T11:00:00.000Z', total: 10, errors: 1,
        errorList: [{ processNumber: '0000002-00.2020.8.26.0100', legalOneId: 222, contactId: null, reason: 'Contato não encontrado no Legal One' }],
    },
    staleIndexes: [{ indexName: 'IPCA', label: 'IPCA', lastMonth: '08/2026' }],
    ...over,
});

beforeEach(() => {
    api.data = panel();
    api.isLoading = false;
    api.error = null;
});

describe('Painel da Controladoria', () => {
    it('mostra os contadores e as listas', () => {
        wrap(<ControlPanelPage />);

        expect(screen.getByText('Processos sem associado')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText(/4 têm associado indicado/)).toBeInTheDocument();
        expect(screen.getByText(/1 documentos têm mais de uma conta aprovada/)).toBeInTheDocument();
        expect(screen.getByText('IPCA: último mês 08/2026')).toBeInTheDocument();
        expect(screen.getByText('Recusados no recálculo de 11/2026')).toBeInTheDocument();
        expect(screen.getByText('Falta IPCA de 10/2026 no banco de índices.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '0000001-00.2020.8.26.0100' })).toHaveAttribute('href', '/processos/111');
        expect(screen.getByText('Contato não encontrado no Legal One')).toBeInTheDocument();
    });

    it('recálculo anterior ao painel: explica que a lista não foi registrada', () => {
        api.data = panel({ recalculation: { period: '2026-10', status: 'DONE', finishedAt: null, recalculated: 30, failures: 2, failureList: null } });
        wrap(<ControlPanelPage />);

        expect(screen.getByText(/A lista deste mês não foi registrada/)).toBeInTheDocument();
    });

    it('sem pendências e sem execuções, mostra os estados vazios', () => {
        api.data = panel({
            legalOneStatus: { closedByJob: 0, lastRun: null },
            recalculation: null,
            backfill: { status: 'idle', startedAt: null, finishedAt: null, total: 0, errors: 0, errorList: [] },
            staleIndexes: [],
        });
        wrap(<ControlPanelPage />);

        expect(screen.getByText('O job ainda não rodou.')).toBeInTheDocument();
        expect(screen.getByText('O recálculo mensal ainda não foi registrado.')).toBeInTheDocument();
        expect(screen.getByText('Todos os índices estão em dia.')).toBeInTheDocument();
        expect(screen.getByText(/Não rodou desde o último reinício/)).toBeInTheDocument();
    });

    it('erro ao carregar', () => {
        api.data = undefined;
        api.error = new Error('500');
        wrap(<ControlPanelPage />);

        expect(screen.getByText('Não foi possível carregar o painel da Controladoria.')).toBeInTheDocument();
    });
});
