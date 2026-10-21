/**
 * firstCalculation.ts — Primeiro cálculo de um processo, no cadastro (processos/novo).
 */

import axios from 'axios';

export type CalcNotice = { title: string; description: string };

const apiError = (e: any, fallback: string): string => e?.response?.data?.error || fallback;

/**
 * Salva os parâmetros do cálculo e roda o primeiro cálculo do processo recém-criado. Devolve o
 * aviso a mostrar antes de abrir o processo, ou null. Os dois passos têm avisos próprios: se o
 * salvamento falha, nada do cálculo foi gravado e os parâmetros precisam ser digitados de novo.
 */
export async function saveFirstCalculation(legalOneId: number, params: object, token: string): Promise<CalcNotice | null> {
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
