import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Estado das chamadas simuladas (API, axios e toasts). Dados fictícios.
const api = vi.hoisted(() => ({
    user: null as unknown,
    associates: [] as { value: string; label: string }[],
    mutateUser: vi.fn(),
}));
const axiosMock = vi.hoisted(() => ({ patch: vi.fn(), post: vi.fn(), delete: vi.fn(), get: vi.fn() }));
const toasts = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('@/hooks/useApi', () => ({
    useApi: (endpoint: string) => {
        if (endpoint === '/api/users/me') return { data: { role: 'ADMIN' }, isLoading: false };
        if (endpoint === '/api/users/associates') return { data: api.associates, isLoading: false };
        if (endpoint === '/api/management/users/cliente-1') return { data: api.user, isLoading: false, mutate: api.mutateUser };
        if (endpoint === '/api/management/profile-changes') return { data: [], mutate: vi.fn() };
        return { data: undefined, isLoading: false, mutate: vi.fn() };
    },
}));
vi.mock('axios', () => ({ default: axiosMock }));
vi.mock('@auth0/auth0-react', () => ({ useAuth0: () => ({ getAccessTokenSilently: async () => 'token-ficticio' }) }));
vi.mock('@/components/ui/toaster', () => ({ Toaster: () => null, toaster: toasts }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), useParams: () => ({ id: 'cliente-1' }) }));
vi.mock('next/link', () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));
// O endereço não entra no fluxo da indicação (e buscaria o CEP)
vi.mock('@/app/components/management/AddressBlock', () => ({ AddressBlock: () => null }));

import EditUserPage from '@/app/gestao/usuarios/[id]/page';

// Cliente fictício indicado pelo associado A, com um processo do A e outro sem associado
const client = () => ({
    id: 'cliente-1', name: 'Cliente Exemplo', email: 'cliente@exemplo.com', auth0UserId: null,
    cpfOrCnpj: '00000000000', cellPhone: '11900000000', contactPreference: null,
    referredById: 'associado-a', indication: null, personalDocumentUrls: [],
    investments: [
        { id: 'inv-1', associateId: 'associado-a', associate: { id: 'associado-a', name: 'Associado A' }, asset: { processNumber: '0000001-00.2020.8.26.0100', status: 'Ativo' } },
        { id: 'inv-2', associateId: null, associate: null, asset: { processNumber: '0000002-00.2020.8.26.0100', status: 'Ativo' } },
    ],
});

const page = () => render(<ChakraProvider value={defaultSystem}><EditUserPage /></ChakraProvider>);

const btn = (name: RegExp | string) => screen.getByRole('button', { name });
// O zag avisa as mudanças depois do clique, fora do mesmo tick
const click = async (el: HTMLElement) => { await act(async () => { fireEvent.click(el); }); };
const chooseAssociate = async (label: string) => {
    await click(screen.getByRole('combobox', { name: 'Selecionar Associado' }));
    await click(screen.getByRole('option', { name: label }));
};
const save = async () => { await click(btn(/Salvar Alterações/)); };
const patchBody = () => axiosMock.patch.mock.calls[0][1];
const lastToast = () => toasts.create.mock.calls.at(-1)?.[0];

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    api.user = client();
    api.associates = [
        { value: 'associado-a', label: '001 — Associado A' },
        { value: 'associado-b', label: '002 — Associado B' },
        { value: 'cliente-1',   label: '003 — Cliente Exemplo' },
    ];
    api.mutateUser.mockReset();
    axiosMock.patch.mockReset().mockResolvedValue({ data: { id: 'cliente-1' } });
    axiosMock.post.mockReset().mockResolvedValue({ data: { investmentsUpdated: 1 } });
    toasts.create.mockReset();
});

describe('Editar Usuário: indicação × associado dos processos', () => {
    it('trocar a indicação e levar: manda só os processos mostrados no diálogo', async () => {
        axiosMock.patch.mockResolvedValue({ data: { id: 'cliente-1', investmentsUpdated: 2 } });
        page();

        await chooseAssociate('002 — Associado B');
        await save();

        expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
        expect(screen.getByText('0000001-00.2020.8.26.0100: hoje com Associado A')).toBeInTheDocument();
        expect(screen.getByText('0000002-00.2020.8.26.0100: hoje sem associado')).toBeInTheDocument();
        await click(btn('Levar para os processos'));

        await waitFor(() => expect(axiosMock.patch).toHaveBeenCalledTimes(1));
        expect(axiosMock.patch.mock.calls[0][0]).toMatch(/\/api\/management\/users\/cliente-1$/);
        expect(patchBody()).toMatchObject({
            referredById: 'associado-b', indication: null,
            applyReferralToInvestments: true, referralInvestmentIds: ['inv-1', 'inv-2'],
        });
        await waitFor(() => expect(lastToast()).toEqual({
            type: 'success', title: 'Cadastro atualizado!', description: '002 — Associado B agora acompanha 2 processos do cliente.',
        }));
    });

    it('"Só a indicação" salva o cadastro sem mexer nos processos', async () => {
        page();

        await chooseAssociate('002 — Associado B');
        await save();
        await click(await screen.findByRole('button', { name: 'Só a indicação' }));

        await waitFor(() => expect(axiosMock.patch).toHaveBeenCalledTimes(1));
        expect(patchBody()).toMatchObject({ referredById: 'associado-b' });
        expect(patchBody()).not.toHaveProperty('applyReferralToInvestments');
        expect(patchBody()).not.toHaveProperty('referralInvestmentIds');
        await waitFor(() => expect(lastToast()).toMatchObject({ type: 'success', title: 'Cadastro atualizado!' }));
    });

    it('"Voltar sem salvar" não envia nada', async () => {
        page();

        await chooseAssociate('002 — Associado B');
        await save();
        await click(await screen.findByRole('button', { name: 'Voltar sem salvar' }));

        expect(axiosMock.patch).not.toHaveBeenCalled();
        expect(toasts.create).not.toHaveBeenCalled();
    });

    it('servidor sem a opção: avisa que os processos ficaram com o associado anterior', async () => {
        page();

        await chooseAssociate('002 — Associado B');
        await save();
        await click(await screen.findByRole('button', { name: 'Levar para os processos' }));

        await waitFor(() => expect(lastToast()).toMatchObject({
            type: 'warning', title: 'Cadastro atualizado, mas os processos continuam com o associado anterior',
        }));
    });

    it('salvar sem trocar a indicação não pergunta nada', async () => {
        page();

        await save();

        await waitFor(() => expect(axiosMock.patch).toHaveBeenCalledTimes(1));
        expect(screen.queryByRole('alertdialog')).toBeNull();
        expect(patchBody()).toMatchObject({ referredById: 'associado-a' });
        expect(patchBody()).not.toHaveProperty('applyReferralToInvestments');
    });

    it('o próprio cliente não aparece na lista de associados', async () => {
        page();

        await click(screen.getByRole('combobox', { name: 'Selecionar Associado' }));

        expect(screen.getByRole('option', { name: '002 — Associado B' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: '003 — Cliente Exemplo' })).toBeNull();
    });

    describe('aviso da indicação gravada', () => {
        const notice = () => screen.queryByText(/do cliente não está com 001 — Associado A, o associado da indicação/);

        it('leva o associado da indicação só para os processos que estão com outro (ou sem)', async () => {
            page();

            expect(notice()).toHaveTextContent('1 processo do cliente não está com 001 — Associado A, o associado da indicação.');
            await click(btn('Levar a indicação para os processos'));
            expect(screen.getByText('0000002-00.2020.8.26.0100: hoje sem associado')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Só a indicação' })).toBeNull();
            await click(btn('Levar para o processo'));

            await waitFor(() => expect(axiosMock.post).toHaveBeenCalledTimes(1));
            expect(axiosMock.post.mock.calls[0][0]).toMatch(/\/api\/management\/users\/cliente-1\/apply-referral$/);
            expect(axiosMock.post.mock.calls[0][1]).toEqual({ investmentIds: ['inv-2'] });
            expect(axiosMock.patch).not.toHaveBeenCalled();
            await waitFor(() => expect(lastToast()).toEqual({
                type: 'success', title: 'Associado levado para os processos', description: '001 — Associado A agora acompanha 1 processo do cliente.',
            }));
            expect(api.mutateUser).toHaveBeenCalled();
        });

        it('mostra o motivo quando o servidor recusa', async () => {
            axiosMock.post.mockRejectedValue({ response: { status: 400, data: { error: 'O usuário indicado não é um associado.' } } });
            page();

            await click(btn('Levar a indicação para os processos'));
            await click(btn('Levar para o processo'));

            await waitFor(() => expect(lastToast()).toMatchObject({
                type: 'error', title: 'Os processos continuam com o associado anterior', description: 'O usuário indicado não é um associado.',
            }));
        });

        it('some quando o formulário troca a indicação', async () => {
            page();

            await chooseAssociate('002 — Associado B');

            expect(notice()).toBeNull();
        });

        it.each([
            ['todos os processos já estão com o associado', () => ({ ...client(), investments: [client().investments[0]] })],
            ['a indicação é um nome manual', () => ({ ...client(), referredById: null, indication: 'Indicação Manual' })],
            ['a indicação gravada não está na lista de associados', () => ({ ...client(), referredById: 'ex-associado' })],
        ])('não aparece quando %s', (_, user) => {
            api.user = user();
            page();

            expect(screen.queryByRole('button', { name: 'Levar a indicação para os processos' })).toBeNull();
        });
    });
});
