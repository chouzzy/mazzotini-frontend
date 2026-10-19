import { describe, it, expect } from 'vitest';
import { buildUpdateIndexTypeOptions, CALCULATOR_INDEXES, NAO_ATUALIZAR, normalizeUpdateIndexType } from '@/utils/indexOptions';

const values = (options: { value: string }[]) => options.map(o => o.value);

describe('normalizeUpdateIndexType', () => {
    it('mantém o índice da calculadora gravado pelo cadastro', () => {
        expect(normalizeUpdateIndexType('TJSP_LEI14905')).toBe('TJSP_LEI14905');
        expect(normalizeUpdateIndexType('IPCA_E')).toBe('IPCA_E');
        expect(normalizeUpdateIndexType(NAO_ATUALIZAR)).toBe(NAO_ATUALIZAR);
    });

    it('acerta maiúsculas e minúsculas: "OUTRO" da importação vira "Outro"', () => {
        expect(normalizeUpdateIndexType('OUTRO')).toBe('Outro');
        expect(normalizeUpdateIndexType('selic')).toBe('SELIC');
    });

    it('mantém um valor fora da lista em vez de trocar por "Outro"', () => {
        expect(normalizeUpdateIndexType('IGPM')).toBe('IGPM');
    });

    it('sem valor, usa "Outro"', () => {
        expect(normalizeUpdateIndexType(null)).toBe('Outro');
        expect(normalizeUpdateIndexType('')).toBe('Outro');
    });
});

describe('buildUpdateIndexTypeOptions', () => {
    it('oferece os índices da calculadora, os da correção antiga e "Outro"', () => {
        const options = values(buildUpdateIndexTypeOptions('TJSP_LEI14905'));

        expect(options).toEqual([...values(CALCULATOR_INDEXES), 'SELIC', 'CDI', 'IGP-M', 'Outro']);
        expect(options).toContain(NAO_ATUALIZAR);
    });

    it('inclui o valor atual do processo quando ele não está na lista', () => {
        const options = buildUpdateIndexTypeOptions('IGPM');

        expect(options[options.length - 1]).toEqual({ label: 'IGPM', value: 'IGPM' });
    });
});
