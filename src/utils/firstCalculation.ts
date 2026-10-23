/**
 * firstCalculation.ts — Primeiro cálculo de um processo, no cadastro (processos/novo).
 */

import axios from 'axios';
import { parseBR, parseDisplayDate } from './calculationForm';

export type CalcNotice = { title: string; description: string };

export interface FirstCalculationRow { baseValue: string; baseDate: string; description?: string }
export interface FirstCalculationInstallment { baseValue: number; baseDate: string; description?: string }

/**
 * Parcelas do primeiro cálculo, conferidas antes de criar o processo, como na aba Cálculo Judicial:
 * linha toda vazia é ignorada; valor sem data, data impossível ou valor inválido viram erro. Antes,
 * a linha incompleta sumia sem aviso (e o processo podia ser criado sem cálculo), e um ano de cinco
 * dígitos dava erro depois de o processo já existir. A data vem do campo do tipo "date" (AAAA-MM-DD).
 */
export function toFirstCalculationInstallments(rows: FirstCalculationRow[]):
    { ok: true; installments: FirstCalculationInstallment[] } | { ok: false; error: string } {
    const installments: FirstCalculationInstallment[] = [];
    for (let i = 0; i < rows.length; i++) {
        const value  = (rows[i].baseValue ?? '').trim();
        const date   = (rows[i].baseDate ?? '').trim();
        if (!value && !date) continue;
        const amount = parseBR(value);
        const iso    = parseDisplayDate(date);
        const error  = !value ? 'informe o valor.'
            : !date ? 'informe a data completa.'
            : !Number.isFinite(amount) ? `valor inválido (${value}).`
            : !iso ? `data inválida (${date}).`
            : null;
        if (error) return { ok: false, error: `Parcela ${i + 1} do cálculo: ${error}` };
        installments.push({ baseValue: amount, baseDate: `${iso}T00:00:00.000Z`, description: rows[i].description || undefined });
    }
    return { ok: true, installments };
}

const apiError = (e: any, fallback: string): string => e?.response?.data?.error || fallback;

/**
 * Salva os parâmetros do cálculo e roda o primeiro cálculo do processo recém-criado. Devolve o
 * aviso a mostrar antes de abrir o processo, ou null. Os dois passos têm avisos próprios: se o
 * salvamento falha, nada do cálculo foi gravado e os parâmetros precisam ser digitados de novo.
 *
 * O token aceita `undefined` porque, nas versões do Auth0 que o build da Vercel instala, o
 * `getAccessTokenSilently` é tipado assim. Sem token, a API recusa e o aviso de salvamento aparece.
 */
export async function saveFirstCalculation(legalOneId: number, params: object, token: string | undefined): Promise<CalcNotice | null> {
    const url     = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/calculator/${legalOneId}`;
    const headers = { Authorization: `Bearer ${token}` };
    try {
        await axios.put(`${url}/params`, params, { headers });
    } catch (e: any) {
        return {
            title:       'Processo criado, mas os parâmetros de cálculo não foram salvos',
            description: `${apiError(e, 'Erro ao salvar os parâmetros.')} Configure o cálculo na aba Cálculo Judicial.`,
        };
    }
    try {
        const res = await axios.post(`${url}/calculate`, {}, { headers });
        const warnings: string[] = res.data?.warnings ?? [];
        return warnings.length > 0
            ? { title: 'Processo criado e calculado, com avisos', description: `${warnings.join(' ')} Confira na aba Cálculo Judicial.` }
            : null;
    } catch (e: any) {
        // O motivo vem do backend (por exemplo, índice sem dados para a data da parcela)
        return {
            title:       'Processo criado, mas o cálculo foi recusado',
            description: `${apiError(e, 'Erro ao calcular.')} Os parâmetros foram salvos; ajuste-os na aba Cálculo Judicial.`,
        };
    }
}
