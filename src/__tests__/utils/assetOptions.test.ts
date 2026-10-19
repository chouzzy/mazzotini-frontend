import { describe, it, expect } from 'vitest';
import { buildAssetOptions, formatAssetLabel } from '@/utils/assetOptions';

const processoDaCarteira = { id: 'asset-1', processNumber: '0001234-56.2000.8.26.0001', nickname: 'Empresa Exemplo Ltda.' };
const outroProcesso = { id: 'asset-2', processNumber: '1000123-45.2020.8.26.0100', nickname: null };

describe('formatAssetLabel', () => {
    it('mostra o número do processo e o apelido entre parênteses', () => {
        expect(formatAssetLabel(processoDaCarteira)).toBe('0001234-56.2000.8.26.0001 (Empresa Exemplo Ltda.)');
    });

    it('mostra só o número quando não há apelido', () => {
        expect(formatAssetLabel(outroProcesso)).toBe('1000123-45.2020.8.26.0100');
    });
});

describe('buildAssetOptions', () => {
    it('mostra o processo da carteira mesmo sem a lista geral (falhou ou não chegou)', () => {
        const options = buildAssetOptions([processoDaCarteira], undefined);

        expect(options).toEqual([
            { value: 'asset-1', label: '0001234-56.2000.8.26.0001 (Empresa Exemplo Ltda.)' },
        ]);
    });

    it('junta os processos da lista geral, com os da carteira primeiro', () => {
        const options = buildAssetOptions([processoDaCarteira], [outroProcesso]);

        expect(options.map(o => o.value)).toEqual(['asset-1', 'asset-2']);
    });

    it('não repete o processo que está na carteira e na lista geral', () => {
        const options = buildAssetOptions([processoDaCarteira], [outroProcesso, processoDaCarteira]);

        expect(options).toHaveLength(2);
        expect(options.filter(o => o.value === 'asset-1')).toHaveLength(1);
    });

    it('ignora investimento sem processo', () => {
        const options = buildAssetOptions([null, undefined, processoDaCarteira], []);

        expect(options.map(o => o.value)).toEqual(['asset-1']);
    });
});
