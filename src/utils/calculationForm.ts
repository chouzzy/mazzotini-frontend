/**
 * calculationForm.ts — Conversões do formulário da calculadora judicial (aba "Cálculo Judicial").
 *
 * Um processo pode ter vários cálculos (por exemplo, dois contratos com índices ou juros
 * diferentes). O primeiro fica nos campos de `ProcessCalculationParams`; os demais, em
 * `extraCalculations`, cada um com os mesmos campos e um `label`. O valor do processo é a soma.
 */

export type DeductionPoint = 'DO_VALOR_CORRIGIDO' | 'APOS_HONORARIOS' | 'APOS_MULTA' | 'APOS_TUDO';

export interface Installment {
    baseValue:      string;
    baseDate:       string;  // DD/MM/AAAA no form, convertido para ISO no envio
    description:    string;
    type:           'DEBITO' | 'ABATIMENTO';
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

export const EMPTY_INSTALLMENT: Installment = { baseValue: '', baseDate: '', description: '', type: 'DEBITO', deductionPoint: 'APOS_TUDO' };

/** ISO YYYY-MM-DD → DD/MM/AAAA (para exibição). */
export const toDisplayDate = (iso: string): string => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return '';
    return `${d}/${m}/${y}`;
};

/** DD/MM/AAAA → ISO YYYY-MM-DD (para envio). */
export const parseDisplayDate = (display: string): string => {
    if (!display) return '';
    const match = display.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(display)) return display;
    return '';
};

/** "1.150.972,30" ou "1150972.30" → número. */
export const parseBR = (s: string) => s.includes(',')
    ? parseFloat(s.replace(/\./g, '').replace(',', '.'))
    : parseFloat(s);

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

/** Valores do formulário → corpo da API. Null quando nenhuma parcela tem valor e data válida. */
export const toPayload = (d: CalcDraft) => {
    const installments = d.installments
        .filter(i => i.baseValue && i.baseDate)
        .map(i => {
            const iso = parseDisplayDate(i.baseDate);
            if (!iso) return null;
            return {
                baseValue:      parseBR(i.baseValue),
                baseDate:       new Date(iso + 'T00:00:00Z').toISOString(),
                description:    i.description || undefined,
                type:           i.type,
                deductionPoint: i.type === 'ABATIMENTO' ? i.deductionPoint : undefined,
            };
        })
        .filter(Boolean);

    if (installments.length === 0) return null;

    return {
        correctionIndex:       d.correctionIndex,
        moratoryMode:          d.moratoryMode,
        moratoryRate:          parseFloat(d.moratoryRate   || '0'),
        moratoryRateUnit:      d.moratoryRateUnit          || 'AM',
        moratoryType:          d.moratoryType,
        moratoryStartDate:     d.moratoryStartDate
            ? (parseDisplayDate(d.moratoryStartDate) || null) : null,
        compensatoryRate:      parseFloat(d.compensatoryRate || '0'),
        compensatoryRateUnit:  d.compensatoryRateUnit       || 'AM',
        compensatoryType:      d.compensatoryType           || 'SIMPLES',
        compensatoryStartDate: d.compensatoryStartDate
            ? (parseDisplayDate(d.compensatoryStartDate) || null) : null,
        multaPercentage:       parseFloat(d.multaPercentage || '0'),
        feesMode:              d.feesMode                   || 'PERCENTUAL',
        feesPercentage:        parseFloat(d.feesPercentage  || '0'),
        feesFixedValue:        parseBR(d.feesFixedValue     || '0'),
        penaltyPercentage:     parseFloat(d.penaltyPercentage || '0'),
        feesOnPenalty:         d.feesOnPenalty,
        installments,
    };
};
