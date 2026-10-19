/**
 * indexOptions.ts — Opções de índice de correção dos formulários de processo.
 *
 * Há dois campos com índice:
 * - `correctionIndex`, dos parâmetros da calculadora judicial (aba "Cálculo Judicial" e
 *   cadastro de processo). Os valores são os nomes das séries no `IndexSeries` do backend.
 * - `updateIndexType`, do próprio processo. No cadastro ele recebe o mesmo índice da
 *   calculadora. Processos antigos podem ter os valores da correção mensal antiga
 *   (SELIC, IPCA, CDI e IGP-M), o job do dia 1 que lê esse campo.
 */

export interface IndexOption {
    label: string;
    value: string;
}

/** "Não atualizar (fixo)": sem correção monetária; juros, multa e honorários seguem normais. */
export const NAO_ATUALIZAR = 'NAO_ATUALIZAR';

export const CALCULATOR_INDEXES: IndexOption[] = [
    { label: 'TJSP — Lei 14.905 (INPC/IPCA-15)', value: 'TJSP_LEI14905' },
    { label: 'IPCA-E',                            value: 'IPCA_E'        },
    { label: 'INPC',                              value: 'INPC'          },
    { label: 'IPCA',                              value: 'IPCA'          },
    { label: 'IGP-M',                             value: 'IGP_M'         },
    { label: 'CDI Acumulado Mensal',              value: 'CDI_MENSAL'    },
    { label: 'CDI Diária',                        value: 'CDI_DIARIA'    },
    { label: 'Não atualizar (fixo)',              value: NAO_ATUALIZAR   },
];

// Valores da correção mensal antiga que não existem na calculadora (o IPCA existe nas duas)
const LEGACY_UPDATE_INDEX_TYPES: IndexOption[] = [
    { label: 'SELIC (correção antiga)', value: 'SELIC' },
    { label: 'CDI (correção antiga)',   value: 'CDI'   },
    { label: 'IGP-M (correção antiga)', value: 'IGP-M' },
];

const UPDATE_INDEX_TYPES: IndexOption[] = [
    ...CALCULATOR_INDEXES,
    ...LEGACY_UPDATE_INDEX_TYPES,
    { label: 'Outro', value: 'Outro' },
];

/**
 * Valor do banco → valor do formulário. Acerta maiúsculas e minúsculas ("OUTRO", gravado
 * pela importação, vira "Outro") e mantém um valor fora da lista como está, para ele não
 * ser trocado por "Outro" ao salvar.
 */
export function normalizeUpdateIndexType(value: string | null | undefined): string {
    if (!value) return 'Outro';
    const known = UPDATE_INDEX_TYPES.find(o => o.value.toLowerCase() === value.toLowerCase());
    return known ? known.value : value;
}

/** Opções do campo `updateIndexType`, com o valor atual do processo quando ele não está na lista. */
export function buildUpdateIndexTypeOptions(current: string | null | undefined): IndexOption[] {
    const value = normalizeUpdateIndexType(current);
    return UPDATE_INDEX_TYPES.some(o => o.value === value)
        ? UPDATE_INDEX_TYPES
        : [...UPDATE_INDEX_TYPES, { label: value, value }];
}
