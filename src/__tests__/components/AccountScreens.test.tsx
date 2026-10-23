import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Perfil fictício de um cliente aprovado, e as chamadas simuladas
// Objetos estáveis entre renders, como os de verdade: um `user` novo a cada render dispararia o
// efeito que preenche o formulário sem parar
const api = vi.hoisted(() => ({
    profile: null as unknown,
    profileLoading: false,
    mutate: () => Promise.resolve(),
    empty: [] as unknown[],
}));
const auth = vi.hoisted(() => ({
    isAuthenticated: true, isLoading: false, logout: () => {},
    user: { email: 'cliente@exemplo.com', name: 'Cliente Exemplo', email_verified: true },
    getAccessTokenSilently: async () => 'token-ficticio',
}));
const nav = vi.hoisted(() => ({ router: { push: vi.fn() }, swr: { mutate: () => Promise.resolve() } }));
const axiosMock = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn() }));

vi.mock('@/hooks/useApi', () => ({
    useApi: (endpoint: string | null) => {
        if (endpoint === '/api/users/me') return { data: api.profile, isLoading: api.profileLoading, mutate: api.mutate };
        return { data: api.empty, isLoading: false, mutate: api.mutate };
    },
}));
vi.mock('axios', () => ({ default: axiosMock }));
vi.mock('@auth0/auth0-react', () => ({ useAuth0: () => auth }));
vi.mock('@/components/ui/toaster', () => ({ Toaster: () => null, toaster: { create: vi.fn() } }));
vi.mock('next/navigation', () => ({ useRouter: () => nav.router, usePathname: () => '/dashboard' }));
vi.mock('swr', () => ({ useSWRConfig: () => nav.swr }));
// O layout do app e o cabeçalho não entram aqui
vi.mock('@/app/components/layout/Header', () => ({ Header: () => null }));
vi.mock('@/app/components/layout/Footer', () => ({ Footer: () => null }));
vi.mock('@/app/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>, HeaderNav: () => null }));

import EditProfilePage from '@/app/perfil/editar/page';
import { LayoutController } from '@/app/components/layout/LayoutController';

const wrap = (el: React.ReactElement) => render(<ChakraProvider value={defaultSystem}>{el}</ChakraProvider>);

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    axiosMock.post.mockReset();
    nav.router.push.mockClear();
    api.profileLoading = false;
    api.profile = {
        id: 'cliente-1', name: 'Cliente Exemplo', email: 'cliente@exemplo.com', status: 'ACTIVE', role: 'INVESTOR',
        cpfOrCnpj: '00000000191', cellPhone: '11900000000', contactPreference: null, nationality: 'Brasileira',
        residentialCep: '01000000', residentialStreet: 'Rua Exemplo', residentialNumber: '1',
        residentialNeighborhood: 'Centro', residentialCity: 'São Paulo', residentialState: 'SP',
    };
});

describe('Meu perfil (cliente aprovado)', () => {
    it('o CPF/CNPJ fica só leitura, com o caminho para trocar, e o botão salva direto', async () => {
        wrap(<EditProfilePage />);

        const cpf = await screen.findByDisplayValue('000.000.001-91');
        expect(cpf).toHaveAttribute('readonly');
        expect(screen.getByText('Para alterar, fale com o escritório.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Salvar alterações/ })).toBeInTheDocument();
        expect(screen.queryByText(/Enviar para Análise/)).toBeNull();
    });
});

describe('Tela de erro do sync', () => {
    beforeEach(() => {
        // O perfil não carrega: sem o sync, não há cadastro
        api.profile = undefined;
    });

    it('recusa do servidor (4xx): mostra o motivo que ele deu', async () => {
        axiosMock.post.mockRejectedValue({ response: { status: 400, data: { error: 'Sua conta do Auth0 está sem e-mail.' } } });

        wrap(<LayoutController><p>conteúdo</p></LayoutController>);

        expect(await screen.findByText('Não foi possível carregar sua conta')).toBeInTheDocument();
        expect(screen.getByText('Sua conta do Auth0 está sem e-mail.')).toBeInTheDocument();
    });

    it('erro do servidor (5xx): só o texto genérico, sem a mensagem técnica', async () => {
        axiosMock.post.mockRejectedValue({ response: { status: 500, data: { error: 'Erro interno: conexão recusada' } } });

        wrap(<LayoutController><p>conteúdo</p></LayoutController>);

        expect(await screen.findByText('Não foi possível carregar sua conta')).toBeInTheDocument();
        await waitFor(() => expect(axiosMock.post).toHaveBeenCalledTimes(1));
        expect(screen.queryByText(/conexão recusada/)).toBeNull();
    });
});

describe('Conta nova fora do onboarding', () => {
    it('não monta a página (que pediria dados de cliente, recusados até a aprovação) e vai para /perfil/completar', async () => {
        api.profile = { id: 'cliente-1', name: 'Cliente Exemplo', status: 'PENDING_ONBOARDING', cpfOrCnpj: null };
        axiosMock.post.mockResolvedValue({});

        wrap(<LayoutController><p>conteúdo da página</p></LayoutController>);

        await waitFor(() => expect(nav.router.push).toHaveBeenCalledWith('/perfil/completar'));
        expect(screen.queryByText('conteúdo da página')).toBeNull();
    });
});
