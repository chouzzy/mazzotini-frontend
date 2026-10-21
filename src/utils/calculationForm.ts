/**
 * calculationForm.ts — Conversões do formulário da calculadora judicial (aba "Cálculo Judicial").
 *
 * Um processo pode ter vários cálculos (por exemplo, dois contratos com índices ou juros
 * diferentes). O primeiro fica nos campos de `ProcessCalculationParams`; os demais, em
 * `extraCalculations`, cada um com os mesmos campos e um `label`. O valor do processo é a soma.
 */

export type DeductionPoint = 'DO_VALOR_CORRIGIDO' | 'APOS_HONORARIOS' | 'APOS_MULTA' | 'APOS_TUDO';

/**
 * Débito, abatimento (crédito ou pagamento) ou custa/despesa. A custa só é corrigida, sem juros,
 * multa nem honorários, e entra no fim do total, como no Dr. Calc.
 */
export type InstallmentType = 'DEBITO' | 'ABATIMENTO' | 'CUSTA';

export interface Installment {
    baseValue:      string;
    baseDate:       string;  // DD/MM/AAAA no form, convertido para ISO no envio
    description:    string;
    type:           InstallmentType;
    deductionPoint: DeductionPoint;
}

/** Um dos cálculos do processo, como o formulário edita. */
export interface CalcDraft {
    label:                  string;
    correctionIndex:        string;
    moratoryMode:           string;
    moratoryRate:           string;
    moratoryRateUnit:       string;  // 'AM' | 'AA' | 'AD'
    moratoryType:           string;
    moratoryStartDate:      string;  // DD/MM/AAAA
    compensatoryRate:       string;
    compensatoryRateUnit:   string;  // 'AM' | 'AA' | 'AD'
    compensatoryType:       string;
    compensatoryStartDate:  string;  // DD/MM/AAAA
    multaPercentage:        string;
    feesMode:               string;  // 'PERCENTUAL' | 'FIXO'
    feesPercentage:         string;
    feesFixedValue:         string;
    penaltyPercentage:      string;
    feesOnPenalty:          boolean;
    installments:           Installment[];
}

/** Corpo da API para um cálculo (PUT /api/calculator/:legalOneId/params). */
export interface CalculationPayload {
    correctionIndex:       string;
    moratoryMode:          string;
    moratoryRate:          number;
    moratoryRateUnit:      string;
    moratoryType:          string;
    moratoryStartDate:     string | null;
    compensatoryRate:      number;
    compensatoryRateUnit:  string;
    compensatoryType:      string;
    compensatoryStartDate: string | null;
    multaPercentage:       number;
    feesMode:              string;
    feesPercentage:        number;
    feesFixedValue:        number;
    penaltyPercentage:     number;
    feesOnPenalty:         boolean;
    installments: {
        baseValue:       number;
        baseDate:        string;
        description?:    string;
        type:            InstallmentType;
        deductionPoint?: DeductionPoint;
    }[];
}

export const EMPTY_INSTALLMENT: Installment = { baseValue: '', baseDate: '', description: '', type: 'DEBITO', deductionPoint: 'APOS_TUDO' };

/** ISO YYYY-MM-DD → DD/MM/AAAA (para exibição). */
export const toDisplayDate = (iso: string): string => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return '';
    return `${d}/${m}/${y}`;
};

/**
 * DD/MM/AAAA (ou AAAA-MM-DD) → ISO AAAA-MM-DD (para envio). Vazio quando o texto não é uma
 * data ou a data não existe no calendário (31/02 não pode virar 03/03).
 */
export const parseDisplayDate = (display: string): string => {
    if (!display) return '';
    const br  = display.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const iso = display.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!br && !iso) return '';
    const [y, m, d] = br ? [Number(br[3]), Number(br[2]), Number(br[1])] : [Number(iso![1]), Number(iso![2]), Number(iso![3])];
    const date = new Date(Date.UTC(y, m - 1, d));
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return '';
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

/**
 * Valor digitado → número. Aceita "1.150.972,30", "150.000" (milhar sem centavos, em reais),
 * "1150972.30" e "R$ 1.000,00". NaN quando não é um valor.
 */
export const parseBR = (s: string): number => {
    const text = s.replace(/R\$/gi, '').replace(/\s/g, '');
    const normalized = text.includes(',')
        ? text.replace(/\./g, '').replace(',', '.')
        : /^\d{1,3}(\.\d{3})+$/.test(text) ? text.replace(/\./g, '') : text;
    return /^-?\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
};

/** Parâmetros salvos, de um cálculo extra ou do snapshot de um log → valores do formulário. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toDraft = (p: any, label: string): CalcDraft => ({
    label,
    correctionIndex:       p.correctionIndex       ?? 'TJSP_LEI14905',
    moratoryMode:          p.moratoryMode          ?? 'TAXA_LEGAL',
    moratoryRate:          String(p.moratoryRate   ?? 1),
    moratoryRateUnit:      p.moratoryRateUnit      ?? 'AM',
    moratoryType:          p.moratoryType          ?? 'SIMPLES',
    moratoryStartDate:     p.moratoryStartDate ? toDisplayDate(p.moratoryStartDate.substring(0, 10)) : '',
    compensatoryRate:      String(p.compensatoryRate ?? 0),
    compensatoryRateUnit:  p.compensatoryRateUnit  ?? 'AM',
    compensatoryType:      p.compensatoryType      ?? 'SIMPLES',
    compensatoryStartDate: p.compensatoryStartDate ? toDisplayDate(p.compensatoryStartDate.substring(0, 10)) : '',
    multaPercentage:       String(p.multaPercentage ?? 0),
    feesMode:              p.feesMode              ?? 'PERCENTUAL',
    feesPercentage:        String(p.feesPercentage ?? 10),
    feesFixedValue:        p.feesFixedValue
        ? Number(p.feesFixedValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
    penaltyPercentage:     String(p.penaltyPercentage ?? 10),
    feesOnPenalty:         p.feesOnPenalty         ?? false,
    installments: p.installments?.length
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? p.installments.map((i: any) => ({
            baseValue:      String(i.baseValue),
            baseDate:       i.baseDate ? toDisplayDate(i.baseDate.substring(0, 10)) : '',
            description:    i.description ?? '',
            type:           i.type ?? 'DEBITO',
            deductionPoint: i.deductionPoint ?? 'APOS_TUDO',
          }))
        : [{ ...EMPTY_INSTALLMENT }],
});

/** Todos os cálculos de um registro salvo ou de um snapshot: o principal e os extras. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toDrafts = (p: any): CalcDraft[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extras: any[] = Array.isArray(p.extraCalculations) ? p.extraCalculations : [];
    return [
        toDraft(p, p.calculationLabel || 'Cálculo 1'),
        ...extras.map((e, i) => toDraft(e, e.label || `Cálculo ${i + 2}`)),
    ];
};

export type PayloadResult = { ok: true; payload: CalculationPayload } | { ok: false; error: string };

/**
 * Valores do formulário → corpo da API. Linha de parcela totalmente vazia é ignorada; valor
 * ou data faltando, valor ou data inválidos, data de início inválida ou nenhuma parcela de
 * débito viram erro, para nada ser descartado em silêncio.
 */
export const toPayload = (d: CalcDraft): PayloadResult => {
    const invalid = (error: string): PayloadResult => ({ ok: false, error });

    const installments: CalculationPayload['installments'] = [];
    for (let i = 0; i < d.installments.length; i++) {
        const row   = d.installments[i];
        const what  = `parcela ${i + 1}`;
        const value = (row.baseValue ?? '').trim();
        const date  = (row.baseDate ?? '').trim();
        if (!value && !date) continue;
        if (!value) return invalid(`${what}: informe o valor.`);
        if (!date) return invalid(`${what}: informe a data (DD/MM/AAAA).`);
        const amount = parseBR(value);
        if (!Number.isFinite(amount)) return invalid(`${what}: valor inválido (${value}).`);
        const iso = parseDisplayDate(date);
        if (!iso) return invalid(`${what}: data inválida (${date}).`);
        installments.push({
            baseValue:      amount,
            baseDate:       `${iso}T00:00:00.000Z`,
            description:    row.description || undefined,
            type:           row.type,
            deductionPoint: row.type === 'ABATIMENTO' ? row.deductionPoint : undefined,
        });
    }
    if (!installments.some(i => i.type === 'DEBITO')) {
        return invalid('informe ao menos uma parcela de débito com valor e data (DD/MM/AAAA).');
    }

    const moratoryStartDate     = d.moratoryStartDate ? parseDisplayDate(d.moratoryStartDate) : '';
    const compensatoryStartDate = d.compensatoryStartDate ? parseDisplayDate(d.compensatoryStartDate) : '';
    if (d.moratoryStartDate && !moratoryStartDate) {
        return invalid(`início dos juros moratórios: data inválida (${d.moratoryStartDate}).`);
    }
    if (d.compensatoryStartDate && !compensatoryStartDate) {
        return invalid(`início dos juros remuneratórios: data inválida (${d.compensatoryStartDate}).`);
    }

    const feesFixedValue = parseBR(d.feesFixedValue || '0');
    if (!Number.isFinite(feesFixedValue)) return invalid(`honorários (R$): valor inválido (${d.feesFixedValue}).`);

    return {
        ok: true,
        payload: {
            correctionIndex:       d.correctionIndex,
            moratoryMode:          d.moratoryMode,
            moratoryRate:          parseFloat(d.moratoryRate   || '0'),
            moratoryRateUnit:      d.moratoryRateUnit          || 'AM',
            moratoryType:          d.moratoryType,
            moratoryStartDate:     moratoryStartDate || null,
            compensatoryRate:      parseFloat(d.compensatoryRate || '0'),
            compensatoryRateUnit:  d.compensatoryRateUnit       || 'AM',
            compensatoryType:      d.compensatoryType           || 'SIMPLES',
            compensatoryStartDate: compensatoryStartDate || null,
            multaPercentage:       parseFloat(d.multaPercentage || '0'),
            feesMode:              d.feesMode                   || 'PERCENTUAL',
            feesPercentage:        parseFloat(d.feesPercentage  || '0'),
            feesFixedValue,
            penaltyPercentage:     parseFloat(d.penaltyPercentage || '0'),
            feesOnPenalty:         d.feesOnPenalty,
            installments,
        },
    };
};

/** Mensagem de erro de um cálculo, com o nome dele na frente quando o processo tem mais de um. */
export const calculationError = (error: string, label: string | null): string =>
    label ? `${label}: ${error}` : error.charAt(0).toUpperCase() + error.slice(1);

/** Nome para um cálculo novo: "Cálculo N", sem repetir um nome que já existe. */
export const nextCalculationLabel = (labels: string[]): string => {
    for (let n = labels.length + 1; ; n++) {
        const label = `Cálculo ${n}`;
        if (!labels.includes(label)) return label;
    }
};

/**
 * Cálculo novo a partir do aberto: mesmo índice, juros e percentuais, sem parcelas. As datas
 * de início e o honorário fixo ficam em branco, porque costumam ser de cada contrato e,
 * copiados, somariam juros ou honorários a mais sem ninguém perceber.
 */
export const newCalculationFrom = (base: CalcDraft, label: string): CalcDraft => ({
    ...base,
    label,
    moratoryStartDate:     '',
    compensatoryStartDate: '',
    feesFixedValue:        '',
    installments:          [{ ...EMPTY_INSTALLMENT }],
});
