import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Dados fictícios.
const axiosMock = vi.hoisted(() => ({ post: vi.fn() }));
const toast = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('axios', () => ({ default: axiosMock }));
vi.mock('@auth0/auth0-react', () => ({ useAuth0: () => ({ getAccessTokenSilently: async () => 'token-ficticio' }) }));
vi.mock('@/components/ui/toaster', () => ({ Toaster: () => null, toaster: toast }));

import { ReferralToProcessesSection } from '@/app/components/management/ReferralToProcessesSection';

const simulation = {
    dryRun: true, clients: 1, investments: 2, freeTextReferrals: 3,
    items: [{ userId: 'u1', userName: 'Cliente Teste', associateId: 'a1', associateName: 'Associado Teste', investments: 2 }],
};

beforeEach(() => {
    vi.clearAllMocks();
    axiosMock.post.mockImplementation((_url: string, body: any) =>
        Promise.resolve({ data: body.dryRun ? simulation : { ...simulation, dryRun: false, items: [] } }));
});

describe('ReferralToProcessesSection', () => {
    it('simula primeiro e só grava ao clicar em Aplicar', async () => {
        render(<ChakraProvider value={defaultSystem}><ReferralToProcessesSection /></ChakraProvider>);

        expect(screen.queryByText(/Aplicar em/)).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Simular' }));

        await waitFor(() => expect(screen.getByText('Cliente Teste')).toBeTruthy());
        expect(axiosMock.post.mock.calls[0][0]).toContain('/api/management/referrals/apply-missing');
        expect(axiosMock.post.mock.calls[0][1]).toEqual({ dryRun: true });
        expect(screen.getByText(/2 processos de 1 cliente receberiam/)).toBeTruthy();
        expect(screen.getByText(/3 clientes têm indicação só em texto livre/)).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Aplicar em 2 processos' }));
        await waitFor(() => expect(axiosMock.post).toHaveBeenCalledTimes(2));
        expect(axiosMock.post.mock.calls[1][1]).toEqual({ dryRun: false });
        await waitFor(() => expect(toast.create).toHaveBeenCalled());
        expect(screen.queryByText(/Aplicar em/)).toBeNull();
    });
});
