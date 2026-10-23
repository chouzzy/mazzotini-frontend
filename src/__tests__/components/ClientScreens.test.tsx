import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Estado das chamadas simuladas. Dados fictícios.
const auth = vi.hoisted(() => ({ logout: vi.fn(), getAccessTokenSilently: vi.fn(async () => 'token-ficticio') }));
const api = vi.hoisted(() => ({ docs: [] as unknown[] }));
const axiosMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
const toasts = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('@auth0/auth0-react', () => ({
    useAuth0: () => ({ ...auth, user: { email: 'cliente@exemplo.com' }, isAuthenticated: true, isLoading: false }),
}));
vi.mock('@/hooks/useApi', () => ({ useApi: () => ({ data: api.docs, isLoading: false }) }));
vi.mock('axios', () => ({ default: axiosMock }));
vi.mock('@/components/ui/toaster', () => ({ Toaster: () => null, toaster: toasts }));

import { VerifyEmailScreen } from '@/app/components/auth/AuthenticationGuard';
import { PrivateDocumentsSection } from '@/app/components/documents/PrivateDocumentsSection';

const wrap = (node: React.ReactNode) => render(<ChakraProvider value={defaultSystem}>{node}</ChakraProvider>);
const click = async (el: HTMLElement) => { await act(async () => { fireEvent.click(el); }); };

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'open').mockImplementation(() => null);
});

describe('VerifyEmailScreen', () => {
    it('quem entrou com o e-mail errado pode sair e trocar de conta', async () => {
        wrap(<VerifyEmailScreen />);

        await click(screen.getByRole('button', { name: 'Sair e entrar com outra conta' }));

        expect(auth.logout).toHaveBeenCalledWith({ logoutParams: { returnTo: window.location.origin } });
    });
});

describe('PrivateDocumentsSection', () => {
    const fromLegalOne = { id: 'doc-1', name: 'Contrato de cessão', url: '', section: 'PRIVADO_FINANCEIRO', category: 'CESSAO', sourceType: 'LEGAL_ONE', legalOneDocumentId: 123 };
    const fromClient   = { id: 'doc-2', name: 'Comprovante', url: 'https://exemplo.com/comprovante.pdf', section: 'PRIVADO_FINANCEIRO', category: 'COMPROVANTE', sourceType: 'CLIENTE', legalOneDocumentId: null };
    const downloadButtons = () => screen.getAllByRole('button');

    it('documento do Legal One abre pelo link gerado na hora', async () => {
        api.docs = [fromLegalOne];
        axiosMock.get.mockResolvedValue({ data: { url: 'https://exemplo.com/gerado.pdf' } });
        wrap(<PrivateDocumentsSection />);

        await click(downloadButtons()[0]);

        expect(axiosMock.get.mock.calls[0][0]).toMatch(/\/api\/documents\/doc-1\/download-url$/);
        await waitFor(() => expect(window.open).toHaveBeenCalledWith('https://exemplo.com/gerado.pdf', '_blank'));
    });

    it('documento enviado pelo cliente abre pela URL dele, sem pedir link ao Legal One', async () => {
        api.docs = [fromClient];
        wrap(<PrivateDocumentsSection />);

        await click(downloadButtons()[0]);

        expect(window.open).toHaveBeenCalledWith('https://exemplo.com/comprovante.pdf', '_blank');
        expect(axiosMock.get).not.toHaveBeenCalled();
    });

    it('a falha ao gerar o link aparece para o cliente', async () => {
        api.docs = [fromLegalOne];
        axiosMock.get.mockRejectedValue({ response: { data: { error: 'Sem permissão para acessar este documento.' } } });
        wrap(<PrivateDocumentsSection />);

        await click(downloadButtons()[0]);

        await waitFor(() => expect(toasts.create).toHaveBeenCalledWith(expect.objectContaining({
            type: 'error', description: 'Sem permissão para acessar este documento.',
        })));
    });
});
