import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Carteira fictícia: um processo com um associado que saiu da lista (perdeu o papel)
const api = vi.hoisted(() => ({
    user: null as unknown,
    associates: [] as { value: string; label: string }[],
    mutateUser: vi.fn(),
}));
const axiosMock = vi.hoisted(() => ({ patch: vi.fn(), post: vi.fn(), delete: vi.fn() }));
const toasts = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('@/hooks/useApi', () => ({
    useApi: (endpoint: string) => {
        if (endpoint === '/api/management/users/cliente-1') return { data: api.user, isLoading: false, mutate: api.mutateUser };
        if (endpoint === '/api/users/associates') return { data: api.associates, isLoading: false };
        return { data: undefined, isLoading: false };
    },
}));
vi.mock('axios', () => ({ default: axiosMock }));
vi.mock('@auth0/auth0-react', () => ({ useAuth0: () => ({ getAccessTokenSilently: async () => 'token-ficticio' }) }));
vi.mock('@/components/ui/toaster', () => ({ Toaster: () => null, toaster: toasts }));
vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'cliente-1' }) }));
vi.mock('next/link', () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));

import UserCarteiraPage from '@/app/gestao/usuarios/[id]/carteira/page';

const asset = { id: 'ativo-1', legalOneId: 101, processNumber: '0000001-00.2020.8.26.0100', nickname: 'Contrato 1' };

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    api.user = {
        id: 'cliente-1', name: 'Cliente Exemplo',
        investments: [{ asset, investorShare: 0, documents: [], associate: { id: 'associado-antigo', name: 'Associado Antigo' } }],
    };
    api.associates = [
        { value: 'associado-a', label: '001 — Associado A' },
        { value: 'cliente-1',   label: '003 — Cliente Exemplo' },
    ];
    api.mutateUser.mockReset();
    axiosMock.patch.mockReset().mockResolvedValue({});
    toasts.create.mockReset();
});

const page = () => render(<ChakraProvider value={defaultSystem}><UserCarteiraPage /></ChakraProvider>);
const associateInput = () => screen.getByPlaceholderText('Nenhum associado...') as HTMLInputElement;

describe('Carteira do cliente', () => {
    it('o associado gravado que saiu da lista aparece pelo nome, e não em branco', () => {
        page();

        expect(associateInput().value).toBe('Associado Antigo (fora da lista de associados)');
    });

    it('o próprio cliente não aparece na lista de associados', async () => {
        page();

        // Abre a lista pelo botão do próprio campo: aparece o associado, sem o cliente
        const control = associateInput().closest('[data-part="control"]') as HTMLElement;
        await act(async () => { fireEvent.click(control.querySelector('[data-part="trigger"]') as HTMLElement); });

        expect(await screen.findByRole('option', { name: '001 — Associado A' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: '003 — Cliente Exemplo' })).toBeNull();
    });

    it('salvar recarrega o cadastro e mantém o associado gravado', async () => {
        page();

        await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Salvar Carteira/ })); });

        await waitFor(() => expect(axiosMock.patch).toHaveBeenCalledTimes(1));
        expect(axiosMock.patch.mock.calls[0][1]).toEqual({
            investments: [expect.objectContaining({ assetId: 'ativo-1', associateId: 'associado-antigo' })],
        });
        await waitFor(() => expect(api.mutateUser).toHaveBeenCalled());
    });
});
