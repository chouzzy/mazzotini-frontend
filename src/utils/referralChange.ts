/**
 * referralChange.ts — Indicação (associado) × associado dos processos do cliente.
 *
 * A "Indicação (Associado)" do cadastro só registra quem indicou o cliente. Quem acompanha cada
 * processo é o associado da carteira (o do investimento): é ele que o portal do associado usa.
 * Ao trocar a indicação por um associado cadastrado, a tela pergunta se ele deve ir também para
 * os processos do cliente.
 */

/** Investimento como vem de GET /api/management/users/:id. */
export interface ClientInvestment {
    associateId?: string | null;
    associate?: { id: string; name: string } | null;
    asset?: { processNumber?: string | null; nickname?: string | null } | null;
}

/** Um processo que mudaria de associado. */
export interface ProcessToMove {
    label:            string;          // número do processo (e apelido, se houver)
    currentAssociate: string | null;   // nome do associado de hoje, ou null se não tem
}

/**
 * Os processos que mudariam de associado se a nova indicação fosse levada para eles. Vazio
 * quando não há o que perguntar: a indicação não mudou, não é um associado cadastrado (nome
 * manual ou nenhum), o cliente não tem processos ou todos já estão com esse associado.
 */
export function processesToMove(
    previousReferral: string | null | undefined,
    nextReferral: string | null | undefined,
    investments: ClientInvestment[],
): ProcessToMove[] {
    if (!nextReferral || nextReferral === (previousReferral ?? null)) return [];
    return investments
        .filter(inv => (inv.associateId ?? inv.associate?.id ?? null) !== nextReferral)
        .map(inv => {
            const number = inv.asset?.processNumber || 'Processo sem número';
            return {
                label:            inv.asset?.nickname ? `${number} (${inv.asset.nickname})` : number,
                currentAssociate: inv.associate?.name ?? null,
            };
        });
}
