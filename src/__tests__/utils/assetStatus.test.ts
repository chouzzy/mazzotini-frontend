import { describe, it, expect } from 'vitest';
import { getStatusLabel, isActiveStatus, isClosedStatus } from '@/utils/assetStatus';

describe('assetStatus', () => {
    it('ativo: "Ativo", que o backend grava, e o legado "ACTIVE"', () => {
        expect(['Ativo', 'ACTIVE'].every(isActiveStatus)).toBe(true);
        expect(['Liquidado', 'PENDING_ENRICHMENT', '', null, undefined].some(isActiveStatus)).toBe(false);
    });

    it('encerrado: "Liquidado", "Encerrado" e o legado "CLOSED"', () => {
        expect(['Liquidado', 'Encerrado', 'CLOSED'].every(isClosedStatus)).toBe(true);
        expect(['Ativo', 'Em Negociação', 'FAILED_ENRICHMENT', null].some(isClosedStatus)).toBe(false);
    });

    it('o cliente nunca vê o status interno da integração', () => {
        expect(getStatusLabel('FAILED_ENRICHMENT', 'client')).toBe('Em processamento');
    });
});
