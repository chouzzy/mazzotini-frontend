import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { vi, describe, it, expect } from 'vitest';

// Processo fictício
const asset = vi.hoisted(() => ({
    processNumber: '0000001-00.2020.8.26.0100', nickname: 'Exemplo', originalCreditor: 'Credor Exemplo', origemProcesso: 'Comarca Exemplo',
    acquisitionValue: 1500, originalValue: 2500, acquisitionDate: '2025-01-15T00:00:00.000Z', investors: [],
    updateIndexType: 'TJSP_LEI14905', contractualIndexRate: 0.5, legalOneId: 999, legalOneType: 'Lawsuit',
}));

vi.mock('@/hooks/useApi', () => ({
    useApi: (endpoint: string | null) => {
        if (endpoint === '/api/users/me') return { data: { role: 'ADMIN' }, isLoading: false };
        if (endpoint?.startsWith('/api/assets/')) return { data: asset, isLoading: false };
        return { data: [], isLoading: false, mutate: vi.fn() };
    },
}));
vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
vi.mock('@auth0/auth0-react', () => ({
    useAuth0: () => ({ isAuthenticated: true, isLoading: false, getAccessTokenSilently: async () => 'token-ficticio' }),
}));
vi.mock('@/components/ui/toaster', () => ({ Toaster: () => null, toaster: { create: vi.fn() } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), useParams: () => ({ legalOneId: '999' }) }));

import CreateAssetPage from '@/app/processos/novo/page';
import EditAssetPage from '@/app/processos/[legalOneId]/editar/page';

const inChakra = (node: React.ReactNode) => render(<ChakraProvider value={defaultSystem}>{node}</ChakraProvider>);
const input = (name: string) => document.querySelector(`input[name="${name}"]`) as HTMLInputElement;

/** A seta é cancelada, e a rolagem tira o foco: o navegador não muda o valor. */
const expectOnlyTyped = (field: HTMLInputElement) => {
    expect(field.type).toBe('number');
    expect(fireEvent.keyDown(field, { key: 'ArrowDown' })).toBe(false);
    expect(fireEvent.keyDown(field, { key: 'ArrowUp' })).toBe(false);
    field.focus();
    expect(document.activeElement).toBe(field);
    fireEvent.wheel(field, { deltaY: 100 });
    expect(document.activeElement).not.toBe(field);
};

describe('Campos numéricos do processo só mudam digitando', () => {
    it.each(['acquisitionValue', 'originalValue', 'calcFeesPercentage', 'calcPenaltyPercentage'])('cadastro: %s', name => {
        inChakra(<CreateAssetPage />);

        expectOnlyTyped(input(name));
    });

    it('cadastro: a taxa dos juros personalizados', async () => {
        inChakra(<CreateAssetPage />);

        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Personalizado' })); });

        expectOnlyTyped(input('calcMoratoryRate'));
    });

    it.each(['acquisitionValue', 'originalValue', 'contractualIndexRate'])('edição: %s', name => {
        inChakra(<EditAssetPage />);

        expectOnlyTyped(input(name));
    });

    it('edição: os valores gravados continuam aparecendo no campo', () => {
        inChakra(<EditAssetPage />);

        expect(input('acquisitionValue').value).toBe('1500');
        expect(input('originalValue').value).toBe('2500');
        expect(input('contractualIndexRate').value).toBe('0.5');
    });
});
