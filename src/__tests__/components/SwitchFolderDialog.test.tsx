import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const axiosMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
const toasts = vi.hoisted(() => ({ create: vi.fn() }));
const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));

vi.mock('axios', () => ({ default: axiosMock }));
vi.mock('@auth0/auth0-react', () => ({ useAuth0: () => ({ getAccessTokenSilently: async () => 'token-ficticio' }) }));
vi.mock('@/components/ui/toaster', () => ({ Toaster: () => null, toaster: toasts }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

import { SwitchFolderDialog } from '@/app/components/assets/SwitchFolderDialog';

// Pastas fictícias com o mesmo número
const OPTIONS = [
    { legalOneId: 100, folder: 'Proc-0000100', legalOneType: 'Lawsuit', active: false, terminationDate: '2025-05-26T00:00:00Z', isCurrent: true, inPortal: true },
    { legalOneId: 200, folder: 'Proc-0000200', legalOneType: 'Lawsuit', active: true, terminationDate: null, isCurrent: false, inPortal: false },
    { legalOneId: 300, folder: 'Proc-0000300', legalOneType: 'Lawsuit', active: true, terminationDate: null, isCurrent: false, inPortal: true },
];
const PREVIEW = {
    dryRun: true,
    processNumber: '0000001-00.2020.8.26.0100',
    from: { legalOneId: 100, folder: 'Proc-0000100' },
    to: { legalOneId: 200, folder: 'Proc-0000200', active: true },
    kept: { investments: 2, updates: 5, documents: 3, calculationLogs: 4, hasCalculation: true },
    newClients: ['Cliente Novo'],
};

const open = () => {
    const onClose = vi.fn();
    render(<ChakraProvider value={defaultSystem}><SwitchFolderDialog open onClose={onClose} legalOneId={100} /></ChakraProvider>);
    return { onClose };
};

describe('SwitchFolderDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        axiosMock.get.mockResolvedValue({ data: { processNumber: PREVIEW.processNumber, options: OPTIONS } });
    });

    it('mostra a pasta atual e as outras, com a situação, e bloqueia a que já está no portal', async () => {
        open();

        expect(await screen.findByText(/Pasta atual:/)).toHaveTextContent('Proc-0000100');
        const ativa = screen.getByRole('button', { name: /Proc-0000200/ });
        expect(ativa).toHaveTextContent('Ativa');
        expect(ativa).not.toBeDisabled();
        expect(screen.getByRole('button', { name: /Proc-0000300/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Ver o que muda' })).toBeDisabled();
    });

    it('só troca depois da prévia, e vai para o endereço novo do processo', async () => {
        const { onClose } = open();
        fireEvent.click(await screen.findByRole('button', { name: /Proc-0000200/ }));
        axiosMock.post.mockResolvedValueOnce({ data: PREVIEW });
        fireEvent.click(screen.getByRole('button', { name: 'Ver o que muda' }));

        expect(await screen.findByText(/Continuam no processo: 2 cliente\(s\), 5 andamento\(s\), 3 documento\(s\), o cálculo e 4 registro/)).toBeInTheDocument();
        expect(screen.getByText(/Entram como clientes, sem associado: Cliente Novo/)).toBeInTheDocument();
        expect(axiosMock.post).toHaveBeenCalledTimes(1);
        expect(axiosMock.post.mock.calls[0][1]).toEqual({ targetLegalOneId: 200, dryRun: true });

        axiosMock.post.mockResolvedValueOnce({ data: { ...PREVIEW, dryRun: false } });
        fireEvent.click(screen.getByRole('button', { name: 'Trocar pasta' }));

        await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/processos/200'));
        expect(axiosMock.post.mock.calls[1][0]).toMatch(/\/api\/assets\/100\/switch-folder$/);
        expect(axiosMock.post.mock.calls[1][1]).toEqual({ targetLegalOneId: 200 });
        expect(onClose).toHaveBeenCalled();
        expect(toasts.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    });

    it('a recusa do servidor aparece e nada muda de endereço', async () => {
        open();
        fireEvent.click(await screen.findByRole('button', { name: /Proc-0000200/ }));
        axiosMock.post.mockResolvedValueOnce({ data: PREVIEW });
        fireEvent.click(screen.getByRole('button', { name: 'Ver o que muda' }));
        await screen.findByText(/Continuam no processo/);

        axiosMock.post.mockRejectedValueOnce({ response: { data: { error: 'Essa pasta já está no portal como outro processo.' } } });
        fireEvent.click(screen.getByRole('button', { name: 'Trocar pasta' }));

        await waitFor(() => expect(toasts.create).toHaveBeenCalledWith(expect.objectContaining({
            type: 'error', description: 'Essa pasta já está no portal como outro processo.',
        })));
        expect(router.replace).not.toHaveBeenCalled();
    });
});
