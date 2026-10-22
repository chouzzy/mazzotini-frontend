/**
 * referralChange.ts — Indicação (associado) × associado dos processos do cliente.
 *
 * A "Indicação (Associado)" do cadastro só registra quem indicou o cliente. Quem acompanha cada
 * processo é o associado da carteira (o do investimento): é ele que o portal do associado usa.
 * Ao trocar a indicação por um associado cadastrado, a tela pergunta se ele deve ir também para
 * os processos do cliente; e, com a indicação já gravada, oferece levá-la para os processos que
 * estão com outro associado.
 */

/** Investimento como vem de GET /api/management/users/:id. */
export interface ClientInvestment {
    id?: string;
    associateId?: string | null;
    associate?: { id: string; name: string } | null;
    asset?: { processNumber?: string | null; nickname?: string | null } | null;
}

/** Um processo que mudaria de associado. */
export interface ProcessToMove {
    investmentId:     string;
    label:            string;          // número do processo (e apelido, se houver)
    currentAssociate: string | null;   // nome do associado de hoje, ou null se não tem
}

/** Os processos do cliente que não estão com o associado `associateId`. */
export function processesNotWith(associateId: string, investments: ClientInvestment[]): ProcessToMove[] {
    return investments
        .filter(inv => inv.id && (inv.associateId ?? inv.associate?.id ?? null) !== associateId)
        .map(inv => {
            const number = inv.asset?.processNumber || 'Processo sem número';
            return {
                investmentId:     inv.id as string,
                label:            inv.asset?.nickname ? `${number} (${inv.asset.nickname})` : number,
                currentAssociate: inv.associate?.name ?? null,
            };
        });
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
    return processesNotWith(nextReferral, investments);
}

export interface ReferralToast {
    type:        'success' | 'warning';
    title:       string;
    description: string;
}

/**
 * O aviso depois de levar o associado para os processos, pelo que o servidor contou.
 * `mode`: `save` ao salvar o cadastro junto, `apply` só com os processos.
 * `updated` vazio: o servidor está numa versão sem a opção e gravou só o cadastro.
 * `updated` menor que `requested`: parte dos processos saiu da carteira com a tela aberta
 * (salvar a carteira recria os investimentos).
 */
export function referralOutcome(
    mode: 'save' | 'apply',
    associateName: string,
    requested: number,
    updated: number | undefined,
): ReferralToast {
    const prefix = mode === 'save' ? 'Cadastro atualizado, mas ' : '';
    const sentence = (text: string) => prefix ? prefix + text : text.charAt(0).toUpperCase() + text.slice(1);
    if (updated === undefined) {
        return {
            type:        'warning',
            title:       sentence('os processos continuam com o associado anterior'),
            description: 'Troque o associado de cada processo em Gerenciar Carteira.',
        };
    }
    if (updated < requested) {
        return {
            type:        'warning',
            title:       sentence(updated === 0
                ? 'nenhum processo mudou de associado'
                : `só ${updated} de ${requested} processos mudaram de associado`),
            description: 'A carteira do cliente mudou enquanto a tela estava aberta. Confira o associado de cada processo no resumo da carteira.',
        };
    }
    return {
        type:        'success',
        title:       mode === 'save' ? 'Cadastro atualizado!' : 'Associado levado para os processos',
        description: `${associateName} agora acompanha ${updated === 1 ? '1 processo' : `${updated} processos`} do cliente.`,
    };
}
