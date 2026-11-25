import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Dados fictícios.
const api = vi.hoisted(() => ({
    candidates: {
        byDocument: [{ id: 'shadow-1', name: 'MARIA TESTE', email: 'x@mazzotini.placeholder', cpfOrCnpj: '12345678900', legalOneContactId: 900, investmentsCount: 2, createdAt: null }],
        byName: [{ id: 'shadow-2', name: 'Maria A. Teste', email: 'y@mazzotini.placeholder', cpfOrCnpj: null, legalOneContactId: 901, investmentsCount: 1, createdAt: null }],
    },
}));
const axiosMock = vi.hoisted(() => ({ patch: vi.fn() }));
const toast = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('@/hooks/useApi', () => ({
    useApi: (endpoint: string | null) =>
        endpoint === '/api/management/users/user-1/shadow-candidates'
            ? { data: api.candidates, isLoading: false, error: undefined }
            : { data: undefined, isLoading: false, error: undefined },
}));
vi.mock('axios', () => ({ default: axiosMock }));
vi.mock('@auth0/auth0-react', () => ({ useAuth0: () => ({ getAccessTokenSilently: async () => 'token-ficticio' }) }));
vi.mock('@/components/ui/toaster', () => ({ Toaster: () => null, toaster: toast }));

import { ApprovalDialog } from '@/app/components/management/ApprovalDialog';

const user = {
    id: 'user-1', name: 'Maria Teste', email: 'maria@exemplo.com', cpfOrCnpj: '12345678900',
    personalDocumentUrls: [], investments: [],
} as any;

beforeEach(() => {
    vi.clearAllMocks();
    axiosMock.patch.mockResolvedValue({ data: { legalOneContactId: 900, merged: [{}, {}] } });
});

describe('ApprovalDialog: cadastros importados do Legal One', () => {
    it('mostra os de mesmo CPF e envia só os de nome parecido que o admin marcar', async () => {
        const onUpdateSuccess = vi.fn();
        render(
            <ChakraProvider value={defaultSystem}>
                <ApprovalDialog user={user} isOpen onClose={() => {}} onUpdateSuccess={onUpdateSuccess} />
            </ChakraProvider>
        );

        expect(await screen.findByText('MARIA TESTE')).toBeTruthy();
        expect(screen.getByText(/Mesmo CPF\/CNPJ/)).toBeTruthy();

        const byName = screen.getByRole('checkbox', { name: /Maria A\. Teste/ });
        fireEvent.click(byName);
        await waitFor(() => expect(byName).toBeChecked());
        fireEvent.click(screen.getByText(/Aprovar e Ativar Acesso/));

        await waitFor(() => expect(axiosMock.patch).toHaveBeenCalled());
        expect(axiosMock.patch.mock.calls[0][0]).toContain('/api/management/users/user-1/approve');
        expect(axiosMock.patch.mock.calls[0][1]).toEqual({ shadowUserIds: ['shadow-2'] });
        await waitFor(() => expect(onUpdateSuccess).toHaveBeenCalled());
        expect(toast.create.mock.calls[0][0].description).toContain('2 cadastros importados');
    });
});
