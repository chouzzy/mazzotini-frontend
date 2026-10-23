import { describe, it, expect } from 'vitest';
import { processesNotWith, processesToMove, referralOutcome, ClientInvestment } from '@/utils/referralChange';

// Carteira fictícia: um processo com o associado A, outro com o B e um sem associado
const investments: ClientInvestment[] = [
    { id: 'inv-1', associateId: 'associado-a', associate: { id: 'associado-a', name: 'Associado A' }, asset: { processNumber: '0000001-00.2020.8.26.0100' } },
    { id: 'inv-2', associateId: 'associado-b', associate: { id: 'associado-b', name: 'Associado B' }, asset: { processNumber: '0000002-00.2020.8.26.0100', nickname: 'Contrato 2' } },
    { id: 'inv-3', associateId: null, associate: null, asset: { processNumber: '0000003-00.2020.8.26.0100' } },
];

describe('processesToMove', () => {
    it('lista os processos que mudariam de associado, com o investimento e o associado de hoje', () => {
        expect(processesToMove('associado-a', 'associado-b', investments)).toEqual([
            { investmentId: 'inv-1', label: '0000001-00.2020.8.26.0100', currentAssociate: 'Associado A' },
            { investmentId: 'inv-3', label: '0000003-00.2020.8.26.0100', currentAssociate: null },
        ]);
    });

    it('sem indicação anterior, também pergunta', () => {
        expect(processesToMove(null, 'associado-a', investments).map(p => p.label)).toEqual([
            '0000002-00.2020.8.26.0100 (Contrato 2)',
            '0000003-00.2020.8.26.0100',
        ]);
    });

    it.each([
        ['a indicação não mudou', 'associado-a', 'associado-a', investments],
        ['a indicação é um nome manual ou ficou vazia', 'associado-a', null, investments],
        ['o cliente não tem processos', 'associado-a', 'associado-b', []],
        ['todos os processos já estão com o associado', 'associado-b', 'associado-a', [investments[0]]],
    ])('não pergunta quando %s', (_, previous, next, list) => {
        expect(processesToMove(previous, next, list)).toEqual([]);
    });
});

describe('processesNotWith', () => {
    it('lista os processos com outro associado ou sem associado', () => {
        expect(processesNotWith('associado-b', investments).map(p => p.investmentId)).toEqual(['inv-1', 'inv-3']);
    });

    it('vazio quando todos já estão com o associado', () => {
        expect(processesNotWith('associado-a', [investments[0]])).toEqual([]);
    });

    it('sem o associateId, usa o id do associado incluído', () => {
        const list: ClientInvestment[] = [{ id: 'inv-9', associate: { id: 'associado-a', name: 'Associado A' }, asset: null }];

        expect(processesNotWith('associado-a', list)).toEqual([]);
        expect(processesNotWith('associado-b', list)).toEqual([
            { investmentId: 'inv-9', label: 'Processo sem número', currentAssociate: 'Associado A' },
        ]);
    });
});

describe('referralOutcome', () => {
    it('ao salvar, confirma quantos processos o associado passa a acompanhar', () => {
        expect(referralOutcome('save', '999 — Associado Exemplo', 2, 2)).toEqual({
            type: 'success',
            title: 'Cadastro atualizado!',
            description: '999 — Associado Exemplo agora acompanha 2 processos do cliente.',
        });
    });

    it('pelo aviso da indicação, confirma no singular', () => {
        expect(referralOutcome('apply', 'Associado Exemplo', 1, 1)).toEqual({
            type: 'success',
            title: 'Associado levado para os processos',
            description: 'Associado Exemplo agora acompanha 1 processo do cliente.',
        });
    });

    it('servidor sem a opção: avisa que os processos ficaram como estavam', () => {
        expect(referralOutcome('save', 'Associado Exemplo', 2, undefined)).toMatchObject({
            type: 'warning',
            title: 'Cadastro atualizado, mas os processos continuam com o associado anterior',
        });
        expect(referralOutcome('apply', 'Associado Exemplo', 2, undefined).title).toBe('Os processos continuam com o associado anterior');
    });

    it('parte dos processos saiu da carteira com a tela aberta: avisa quantos mudaram', () => {
        expect(referralOutcome('save', 'Associado Exemplo', 3, 1)).toMatchObject({
            type: 'warning',
            title: 'Cadastro atualizado, mas só 1 de 3 processos mudaram de associado',
        });
        expect(referralOutcome('apply', 'Associado Exemplo', 2, 0)).toMatchObject({
            type: 'warning',
            title: 'Nenhum processo mudou de associado',
        });
    });
});
