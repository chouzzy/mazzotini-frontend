/** Um erro da vinculação de clientes aos processos, como o backend devolve no status. */
export interface BackfillErrorItem {
    processNumber: string;
    legalOneId: number | null;
    /** Contato do Legal One, quando o erro foi num participante (e não no processo). */
    contactId: number | null;
    reason: string;
}

function csvCell(value: string | number | null): string {
    const text = value === null || value === undefined ? '' : String(value);
    return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Planilha dos erros em CSV para o Excel em português: separador ";" e BOM,
 * para os acentos abrirem certos.
 */
export function backfillErrorsToCsv(errors: BackfillErrorItem[]): string {
    const header = ['Processo', 'ID no Legal One', 'Contato no Legal One', 'Motivo'];
    const rows = errors.map(e => [e.processNumber, e.legalOneId, e.contactId, e.reason]);
    return '﻿' + [header, ...rows].map(r => r.map(csvCell).join(';')).join('\r\n') + '\r\n';
}

/** Nome do arquivo com a data e a hora locais, como "erros-vinculacao-2026-11-24-1430.csv". */
export function backfillErrorsFileName(date = new Date()): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `erros-vinculacao-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}.csv`;
}
