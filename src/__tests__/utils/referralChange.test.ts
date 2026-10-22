import { describe, it, expect } from 'vitest';
import { processesToMove, ClientInvestment } from '@/utils/referralChange';

// Carteira fictícia: um processo com o associado A, outro com o B e um sem associado
const investments: ClientInvestment[] = [
    { associateId: 'associado-a', associate: { id: 'associado-a', name: 'Associado A' }, asset: { processNumber: '0000001-00.2020.8.26.0100' } },
    { associateId: 'associado-b', associate: { id: 'associado-b', name: 'Associado B' }, asset: { processNumber: '0000002-00.2020.8.26.0100', nickname: 'Contrato 2' } },
    { associateId: null, associate: null, asset: { processNumber: '0000003-00.2020.8.26.0100' } },
];

describe('processesToMove', () => {
    it('lista os processos que mudariam de associado, com o associado de hoje', () => {
        expect(processesToMove('associado-a', 'associado-b', investments)).toEqual([
            { label: '0000001-00.2020.8.26.0100', currentAssociate: 'Associado A' },
            { label: '0000003-00.2020.8.26.0100', currentAssociate: null },
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
