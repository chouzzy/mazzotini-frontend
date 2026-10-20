import { describe, it, expect } from 'vitest';
import { parseBR, parseDisplayDate, toDisplayDate, toDraft, toDrafts, toPayload } from '@/utils/calculationForm';

// Parâmetros fictícios de um processo com dois contratos, como a API devolve
const saved = {
    correctionIndex: 'TJSP_LEI14905',
    moratoryMode: 'PERSONALIZADO',
    moratoryRate: 1,
    moratoryRateUnit: 'AM',
    moratoryType: 'SIMPLES',
    moratoryStartDate: '2025-10-01T00:00:00.000Z',
    compensatoryRate: 10,
    compensatoryRateUnit: 'AA',
    compensatoryType: 'SIMPLES',
    compensatoryStartDate: '2025-10-01T00:00:00.000Z',
    multaPercentage: 0,
    feesMode: 'FIXO',
    feesPercentage: 0,
    feesFixedValue: 1500,
    penaltyPercentage: 0,
    feesOnPenalty: false,
    installments: [{ baseValue: 1000, baseDate: '2025-10-01T00:00:00.000Z', description: 'Parcela exemplo' }],
    calculationLabel: 'Contrato 1',
    extraCalculations: [{
        label: 'Contrato 2',
        correctionIndex: 'TJSP_LEI14905',
        compensatoryRate: 5,
        compensatoryRateUnit: 'AA',
        installments: [{ baseValue: 500, baseDate: '2025-12-10T00:00:00.000Z', type: 'DEBITO' }],
    }],
};

describe('datas e números', () => {
    it('converte datas entre DD/MM/AAAA e ISO', () => {
        expect(toDisplayDate('2025-12-10')).toBe('10/12/2025');
        expect(parseDisplayDate('10/12/2025')).toBe('2025-12-10');
        expect(parseDisplayDate('1/2/2025')).toBe('2025-02-01');
        expect(parseDisplayDate('31-12-2025')).toBe('');
    });

    it('lê valores no formato brasileiro e no americano', () => {
        expect(parseBR('1.150.972,30')).toBe(1150972.3);
        expect(parseBR('1150972.30')).toBe(1150972.3);
    });
});

describe('toDrafts', () => {
    it('monta um cálculo para o principal e um para cada extra, com os nomes', () => {
        const drafts = toDrafts(saved);

        expect(drafts.map(d => d.label)).toEqual(['Contrato 1', 'Contrato 2']);
        expect(drafts[0]).toMatchObject({
            moratoryStartDate: '01/10/2025',
            compensatoryRate: '10',
            feesMode: 'FIXO',
            feesFixedValue: '1.500,00',
        });
        expect(drafts[0].installments[0]).toMatchObject({ baseValue: '1000', baseDate: '01/10/2025', type: 'DEBITO' });
        // O extra usa os padrões nos campos que não vieram
        expect(drafts[1]).toMatchObject({ moratoryMode: 'TAXA_LEGAL', compensatoryRate: '5', feesMode: 'PERCENTUAL' });
    });

    it('sem cálculos extras, devolve um cálculo só chamado "Cálculo 1"', () => {
        const drafts = toDrafts({ ...saved, calculationLabel: null, extraCalculations: undefined });

        expect(drafts).toHaveLength(1);
        expect(drafts[0].label).toBe('Cálculo 1');
    });

    it('sem parcelas, abre uma linha vazia', () => {
        expect(toDraft({ installments: [] }, 'Cálculo 1').installments).toEqual([
            { baseValue: '', baseDate: '', description: '', type: 'DEBITO', deductionPoint: 'APOS_TUDO' },
        ]);
    });
});

describe('toPayload', () => {
    it('converte o formulário de volta para a API (ida e volta)', () => {
        const payload = toPayload(toDraft(saved, 'Contrato 1'));

        expect(payload).toMatchObject({
            correctionIndex: 'TJSP_LEI14905',
            moratoryRate: 1,
            moratoryStartDate: '2025-10-01',
            compensatoryRate: 10,
            compensatoryRateUnit: 'AA',
            feesMode: 'FIXO',
            feesFixedValue: 1500,
        });
        expect(payload?.installments).toEqual([
            { baseValue: 1000, baseDate: '2025-10-01T00:00:00.000Z', description: 'Parcela exemplo', type: 'DEBITO', deductionPoint: undefined },
        ]);
    });

    it('ignora parcelas incompletas e devolve null quando não sobra nenhuma', () => {
        const draft = toDraft(saved, 'Contrato 1');

        expect(toPayload({ ...draft, installments: [
            { baseValue: '100', baseDate: '', description: '', type: 'DEBITO', deductionPoint: 'APOS_TUDO' },
            { baseValue: '100', baseDate: '31-12-2025', description: '', type: 'DEBITO', deductionPoint: 'APOS_TUDO' },
        ] })).toBeNull();
    });

    it('mantém o ponto de dedução só nos abatimentos', () => {
        const draft = toDraft(saved, 'Contrato 1');
        const payload = toPayload({ ...draft, installments: [
            ...draft.installments,
            { baseValue: '100,00', baseDate: '10/03/2026', description: 'Depósito', type: 'ABATIMENTO', deductionPoint: 'APOS_HONORARIOS' },
        ] });

        expect(payload?.installments[1]).toMatchObject({ baseValue: 100, type: 'ABATIMENTO', deductionPoint: 'APOS_HONORARIOS' });
    });
});
