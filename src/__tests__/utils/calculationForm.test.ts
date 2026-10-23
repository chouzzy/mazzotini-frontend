import { describe, it, expect } from 'vitest';
import {
    addMonthsISO, calculationError, formatBR, MORATORY_MODES, newCalculationFrom, nextCalculationLabel, parseBR, parseDisplayDate,
    parseReferenceMonthInput, toDisplayDate, toDraft, toDrafts, toPayload, CalcDraft, InstallmentType,
} from '@/utils/calculationForm';

// Parâmetros fictícios de um processo com dois contratos, como a API devolve
const saved = {
    correctionIndex: 'IPCA',
    moratoryMode: 'PERSONALIZADO',
    moratoryRate: 2,
    moratoryRateUnit: 'AM',
    moratoryType: 'SIMPLES',
    moratoryStartDate: '2025-09-01T00:00:00.000Z',
    compensatoryRate: 12,
    compensatoryRateUnit: 'AA',
    compensatoryType: 'SIMPLES',
    compensatoryStartDate: '2025-09-01T00:00:00.000Z',
    multaPercentage: 0,
    feesMode: 'FIXO',
    feesPercentage: 0,
    feesFixedValue: 2500,
    penaltyPercentage: 0,
    feesOnPenalty: false,
    installments: [{ baseValue: 2000, baseDate: '2025-09-01T00:00:00.000Z', description: 'Parcela A' }],
    calculationLabel: 'Contrato A',
    extraCalculations: [{
        label: 'Contrato B',
        correctionIndex: 'INPC',
        compensatoryRate: 6,
        compensatoryRateUnit: 'AA',
        installments: [{ baseValue: 700, baseDate: '2025-11-15T00:00:00.000Z', type: 'DEBITO' }],
    }],
};

const draftA = () => toDraft(saved, 'Contrato A');
const withRows = (d: CalcDraft, installments: CalcDraft['installments']): CalcDraft => ({ ...d, installments });
const row = (baseValue: string, baseDate: string, type: InstallmentType = 'DEBITO') =>
    ({ baseValue, baseDate, description: '', type, deductionPoint: 'APOS_TUDO' as const });

describe('datas', () => {
    it('converte entre DD/MM/AAAA e ISO', () => {
        expect(toDisplayDate('2025-11-15')).toBe('15/11/2025');
        expect(parseDisplayDate('15/11/2025')).toBe('2025-11-15');
        expect(parseDisplayDate('1/2/2025')).toBe('2025-02-01');
        expect(parseDisplayDate('2025-11-15')).toBe('2025-11-15');
        expect(parseDisplayDate('15-11-2025')).toBe('');
    });

    it('recusa datas que não existem no calendário, em vez de virar outra data', () => {
        expect(parseDisplayDate('31/02/2025')).toBe('');
        expect(parseDisplayDate('29/02/2025')).toBe('');
        expect(parseDisplayDate('15/13/2025')).toBe('');
        expect(parseDisplayDate('00/01/2025')).toBe('');
        expect(parseDisplayDate('29/02/2024')).toBe('2024-02-29');
    });
});

describe('parseBR', () => {
    it('lê valores no formato brasileiro e no americano', () => {
        expect(parseBR('1.150.972,30')).toBe(1150972.3);
        expect(parseBR('1150972.30')).toBe(1150972.3);
        expect(parseBR('R$ 1.000,00')).toBe(1000);
        expect(parseBR('0.5')).toBe(0.5);
    });

    it('lê milhar sem centavos como milhar (150.000 é cento e cinquenta mil)', () => {
        expect(parseBR('150.000')).toBe(150000);
        expect(parseBR('1.000.000')).toBe(1000000);
    });

    it('devolve NaN para o que não é valor', () => {
        expect(parseBR('abc')).toBeNaN();
        expect(parseBR('12abc')).toBeNaN();
    });
});

describe('toDrafts', () => {
    it('monta um cálculo para o principal e um para cada extra, com os nomes', () => {
        const drafts = toDrafts(saved);

        expect(drafts.map(d => d.label)).toEqual(['Contrato A', 'Contrato B']);
        expect(drafts[0]).toMatchObject({
            moratoryStartDate: '01/09/2025',
            compensatoryRate: '12',
            feesMode: 'FIXO',
            feesFixedValue: '2.500,00',
        });
        expect(drafts[0].installments[0]).toMatchObject({ baseValue: '2.000,00', baseDate: '01/09/2025', type: 'DEBITO' });
        // O extra usa os padrões nos campos que não vieram
        expect(drafts[1]).toMatchObject({ correctionIndex: 'INPC', moratoryMode: 'TAXA_LEGAL', compensatoryRate: '6', feesMode: 'PERCENTUAL' });
    });

    it('sem cálculos extras, devolve um cálculo só chamado "Cálculo 1"', () => {
        const drafts = toDrafts({ ...saved, calculationLabel: null, extraCalculations: undefined });

        expect(drafts).toHaveLength(1);
        expect(drafts[0].label).toBe('Cálculo 1');
    });

    it('sem parcelas, abre uma linha vazia', () => {
        expect(toDraft({ installments: [] }, 'Cálculo 1').installments).toEqual([row('', '')]);
    });
});

describe('toPayload', () => {
    it('converte o formulário de volta para a API (ida e volta)', () => {
        const result = toPayload(draftA());

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.payload).toMatchObject({
            correctionIndex: 'IPCA',
            moratoryRate: 2,
            moratoryStartDate: '2025-09-01',
            compensatoryRate: 12,
            compensatoryRateUnit: 'AA',
            feesMode: 'FIXO',
            feesFixedValue: 2500,
        });
        expect(result.payload.installments).toEqual([
            { baseValue: 2000, baseDate: '2025-09-01T00:00:00.000Z', description: 'Parcela A', type: 'DEBITO', deductionPoint: undefined },
        ]);
    });

    it('ignora a linha totalmente vazia', () => {
        const result = toPayload(withRows(draftA(), [row('2.000,00', '01/09/2025'), row('', '')]));

        expect(result.ok && result.payload.installments).toHaveLength(1);
    });

    it.each([
        ['valor sem data', [row('2.000,00', '')], 'parcela 1: informe a data (DD/MM/AAAA).'],
        ['data sem valor', [row('2.000,00', '01/09/2025'), row('', '01/10/2025')], 'parcela 2: informe o valor.'],
        ['valor inválido', [row('dois mil', '01/09/2025')], 'parcela 1: valor inválido (dois mil).'],
        ['data impossível', [row('2.000,00', '31/02/2025')], 'parcela 1: data inválida (31/02/2025).'],
        ['só abatimento', [row('100,00', '01/09/2025', 'ABATIMENTO')], 'informe ao menos uma parcela de débito com valor e data (DD/MM/AAAA).'],
        ['só custa', [row('100,00', '01/09/2025', 'CUSTA')], 'informe ao menos uma parcela de débito com valor e data (DD/MM/AAAA).'],
        ['custa negativa', [row('2.000,00', '01/09/2025'), row('-100,00', '01/09/2025', 'CUSTA')], 'parcela 2: o valor não pode ser negativo.'],
        ['abatimento negativo', [row('2.000,00', '01/09/2025'), row('-50,00', '01/09/2025', 'ABATIMENTO')], 'parcela 2: o valor não pode ser negativo.'],
    ])('recusa %s, sem descartar nada em silêncio', (_, installments, error) => {
        expect(toPayload(withRows(draftA(), installments))).toEqual({ ok: false, error });
    });

    it('recusa data de início dos juros impossível', () => {
        expect(toPayload({ ...draftA(), moratoryStartDate: '30/02/2025' }))
            .toEqual({ ok: false, error: 'início dos juros moratórios: data inválida (30/02/2025).' });
    });

    it('mantém o ponto de dedução só nos abatimentos', () => {
        const result = toPayload(withRows(draftA(), [
            row('2.000,00', '01/09/2025'),
            { ...row('100,00', '10/03/2026', 'ABATIMENTO'), deductionPoint: 'APOS_HONORARIOS' },
        ]));

        expect(result.ok && result.payload.installments[1]).toMatchObject({ baseValue: 100, type: 'ABATIMENTO', deductionPoint: 'APOS_HONORARIOS' });
    });

    it('envia a custa ou despesa com o tipo, sem ponto de dedução, e o rascunho a recupera', () => {
        const result = toPayload(withRows(draftA(), [
            row('2.000,00', '01/09/2025'),
            { ...row('350,00', '05/10/2025', 'CUSTA'), description: 'Perícia' },
        ]));

        expect(result.ok && result.payload.installments[1]).toEqual({
            baseValue: 350, baseDate: '2025-10-05T00:00:00.000Z', description: 'Perícia', type: 'CUSTA', deductionPoint: undefined,
        });
        const reopened = toDraft({ installments: result.ok ? result.payload.installments : [] }, 'Cálculo 1');
        expect(reopened.installments[1]).toMatchObject({ baseValue: '350,00', baseDate: '05/10/2025', type: 'CUSTA' });
    });
});

describe('opções do Dr. Calc e modos dos juros', () => {
    it('os três modos dos juros de mora, com a taxa legal como padrão', () => {
        expect(MORATORY_MODES.map(m => m.value)).toEqual(['TAXA_LEGAL', 'TAXA_LEGAL_TEMA1368', 'PERSONALIZADO']);
        expect(toDraft({}, 'Cálculo 1').moratoryMode).toBe('TAXA_LEGAL');
    });

    it('cálculo salvo antes das opções abre com as duas desmarcadas, como no Dr. Calc', () => {
        expect(draftA()).toMatchObject({ feesOnMulta: false, deflate: false });

        const result = toPayload(draftA());
        expect(result.ok && result.payload).toMatchObject({ feesOnMulta: false, deflate: false });
    });

    it('as opções marcadas e o modo do Tema 1368 vão e voltam da API', () => {
        const draft = toDraft({ ...saved, moratoryMode: 'TAXA_LEGAL_TEMA1368', feesOnMulta: true, deflate: true }, 'Contrato A');
        const result = toPayload(draft);

        expect(result.ok && result.payload).toMatchObject({ moratoryMode: 'TAXA_LEGAL_TEMA1368', feesOnMulta: true, deflate: true });
        // O cálculo novo copia as opções do aberto, como copia o índice e as taxas
        expect(newCalculationFrom(draft, 'Contrato B')).toMatchObject({ feesOnMulta: true, deflate: true });
    });
});

describe('vários cálculos', () => {
    it('a mensagem de erro leva o nome do cálculo quando há mais de um', () => {
        expect(calculationError('parcela 1: informe o valor.', 'Contrato B')).toBe('Contrato B: parcela 1: informe o valor.');
        expect(calculationError('parcela 1: informe o valor.', null)).toBe('Parcela 1: informe o valor.');
    });

    it('o nome do cálculo novo não repete um que já existe', () => {
        expect(nextCalculationLabel(['Cálculo 1'])).toBe('Cálculo 2');
        expect(nextCalculationLabel(['Cálculo 1', 'Cálculo 3'])).toBe('Cálculo 4');
        expect(nextCalculationLabel(['Contrato A', 'Contrato B'])).toBe('Cálculo 3');
    });

    it('o cálculo novo copia índice e taxas, mas não parcelas, datas de início nem honorário fixo', () => {
        const novo = newCalculationFrom(draftA(), 'Cálculo 2');

        expect(novo).toMatchObject({
            label: 'Cálculo 2',
            correctionIndex: 'IPCA',
            moratoryRate: '2',
            compensatoryRate: '12',
            feesMode: 'FIXO',
            feesFixedValue: '',
            moratoryStartDate: '',
            compensatoryStartDate: '',
        });
        expect(novo.installments).toEqual([row('', '')]);
    });
});

describe('revisão de 23/10', () => {
    it('valor com três casas volta ao formulário sem virar milhar (333,333 não vira 333.333)', () => {
        for (const value of [333.333, 150.123, 0.125, 999.999, 1150972.3, 2000, -100]) {
            const reopened = toDraft({ ...saved, installments: [{ baseValue: value, baseDate: '2025-09-01T00:00:00.000Z' }] }, 'Cálculo 1');
            const result = toPayload(reopened);

            expect(result.ok).toBe(true);
            if (result.ok) expect(result.payload.installments[0].baseValue).toBe(value);
        }
        expect(formatBR(333.333)).toBe('333,333');
        expect(formatBR(1150972.3)).toBe('1.150.972,30');
    });

    it('parseBR: milhar negativo e recusa do formato americano com vírgula de milhar', () => {
        expect(parseBR('-150.000')).toBe(-150000);
        expect(parseBR('1,500.00')).toBeNaN();
        expect(parseBR('1.500,00')).toBe(1500);
    });

    it('Gerar em Massa: parcela mensal desde o dia 31 cai no último dia dos meses curtos', () => {
        expect([0, 1, 2, 3].map(i => addMonthsISO('2025-01-31', i))).toEqual(['2025-01-31', '2025-02-28', '2025-03-31', '2025-04-30']);
        expect(addMonthsISO('2024-01-31', 1)).toBe('2024-02-29');
        expect(addMonthsISO('2025-11-15', 3)).toBe('2026-02-15');
    });

    it('mês de referência em AAAA-MM (campo do Chrome) ou MM/AAAA (Safari e Firefox)', () => {
        expect(parseReferenceMonthInput('')).toEqual({});
        expect(parseReferenceMonthInput('2026-09')).toEqual({ referenceYear: 2026, referenceMonth: 9 });
        expect(parseReferenceMonthInput('09/2026')).toEqual({ referenceYear: 2026, referenceMonth: 9 });
        for (const invalid of ['13/2026', 'setembro', '2026', '09/26']) expect(parseReferenceMonthInput(invalid)).toBeNull();
    });

    it.each([
        ['multaPercentage', '-10', 'multa: o valor não pode ser negativo.'],
        ['feesPercentage', '-5', 'honorários (%): o valor não pode ser negativo.'],
        ['moratoryRate', '-1', 'taxa dos juros moratórios: o valor não pode ser negativo.'],
        ['feesFixedValue', '-1.000,00', 'honorários (R$): o valor não pode ser negativo.'],
    ])('recusa %s negativo antes de enviar', (field, value, error) => {
        expect(toPayload({ ...draftA(), [field]: value })).toEqual({ ok: false, error });
    });
});
