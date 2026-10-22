import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { vi, describe, it, expect } from 'vitest';
import { ReferralDialog } from '@/app/components/management/ReferralDialog';
import { ProcessToMove } from '@/utils/referralChange';

// Processos fictícios que mudariam de associado
const processes: ProcessToMove[] = [
    { label: '0000001-00.2020.8.26.0100', currentAssociate: 'Associado A' },
    { label: '0000002-00.2020.8.26.0100 (Contrato 2)', currentAssociate: null },
];

const dialog = (props: Partial<React.ComponentProps<typeof ReferralDialog>> = {}) => {
    const onCancel  = vi.fn();
    const onConfirm = vi.fn();
    render(
        <ChakraProvider value={defaultSystem}>
            <ReferralDialog associateName="999 — Associado Exemplo" processes={processes} onCancel={onCancel} onConfirm={onConfirm} {...props} />
        </ChakraProvider>,
    );
    return { onCancel, onConfirm };
};

describe('ReferralDialog', () => {
    it('explica os dois campos e lista os processos com o associado de hoje', () => {
        dialog();

        expect(screen.getByText('Levar o associado para os processos?')).toBeInTheDocument();
        expect(screen.getByText(/A indicação registra quem indicou o cliente/)).toBeInTheDocument();
        expect(screen.getByText('999 — Associado Exemplo')).toBeInTheDocument();
        expect(screen.getByText('0000001-00.2020.8.26.0100: hoje com Associado A')).toBeInTheDocument();
        expect(screen.getByText('0000002-00.2020.8.26.0100 (Contrato 2): hoje sem associado')).toBeInTheDocument();
    });

    it('"Levar para os processos" confirma com o associado nos processos', () => {
        const { onConfirm } = dialog();

        fireEvent.click(screen.getByRole('button', { name: 'Levar para os processos' }));

        expect(onConfirm).toHaveBeenCalledWith(true);
    });

    it('"Só a indicação" confirma sem mexer nos processos', () => {
        const { onConfirm } = dialog();

        fireEvent.click(screen.getByRole('button', { name: 'Só a indicação' }));

        expect(onConfirm).toHaveBeenCalledWith(false);
    });

    it('"Cancelar" não salva nada', () => {
        const { onCancel, onConfirm } = dialog();

        fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

        expect(onCancel).toHaveBeenCalled();
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('com um processo só, fala no singular', () => {
        dialog({ processes: [processes[0]] });

        expect(screen.getByRole('button', { name: 'Levar para o processo' })).toBeInTheDocument();
        expect(screen.getByText(/este processo/)).toBeInTheDocument();
    });

    it('sem associado, fica fechado', () => {
        dialog({ associateName: null });

        expect(screen.queryByText('Levar o associado para os processos?')).toBeNull();
    });
});
