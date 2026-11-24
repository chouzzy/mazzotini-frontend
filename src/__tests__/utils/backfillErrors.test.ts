import { describe, it, expect } from 'vitest';
import { backfillErrorsToCsv, backfillErrorsFileName } from '@/utils/backfillErrors';

// Dados fictícios.
describe('backfillErrorsToCsv', () => {
    it('gera o CSV com BOM, ";" e uma linha por erro', () => {
        const csv = backfillErrorsToCsv([
            { processNumber: '0001234-56.2020.8.26.0100', legalOneId: 77, contactId: null, reason: 'Não encontrado no Legal One (404)' },
            { processNumber: '0009876-54.2019.8.26.0001', legalOneId: 88, contactId: 10, reason: 'Erro "inesperado"; tente de novo' },
        ]);
        expect(csv.startsWith('﻿')).toBe(true);
        const lines = csv.slice(1).split('\r\n');
        expect(lines[0]).toBe('Processo;ID no Legal One;Contato no Legal One;Motivo');
        expect(lines[1]).toBe('0001234-56.2020.8.26.0100;77;;Não encontrado no Legal One (404)');
        expect(lines[2]).toBe('0009876-54.2019.8.26.0001;88;10;"Erro ""inesperado""; tente de novo"');
    });

    it('só com o cabeçalho quando não há erros', () => {
        expect(backfillErrorsToCsv([]).slice(1).split('\r\n').filter(Boolean)).toHaveLength(1);
    });
});

describe('backfillErrorsFileName', () => {
    it('usa a data e a hora locais', () => {
        expect(backfillErrorsFileName(new Date(2026, 10, 24, 9, 5))).toBe('erros-vinculacao-2026-11-24-0905.csv');
    });
});
