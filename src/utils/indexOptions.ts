/**
 * indexOptions.ts — Opções de índice de correção dos formulários de processo.
 *
 * `correctionIndex`, dos parâmetros da calculadora judicial (aba "Cálculo Judicial" e
 * cadastro de processo). Os valores são os nomes das séries no `IndexSeries` do backend.
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
