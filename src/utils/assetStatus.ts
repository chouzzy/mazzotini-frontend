/**
 * assetStatus.ts — Fonte única de verdade para exibição de status de ativos.
 *
 * ## Por que existe
 * O rótulo de status estava duplicado em 6+ arquivos, com três textos diferentes
 * para o MESMO status (`FAILED_ENRICHMENT` aparecia como "Falha no Legal One",
 * "Falha" e "Em Análise"). Pior: o dashboard do investidor renderizava
 * `{asset.status}` cru, expondo o enum em inglês para o cliente final.
 *
 * ## Regra de negócio: o status interno não vaza para o cliente
 * `PENDING_ENRICHMENT` e `FAILED_ENRICHMENT` descrevem o estado da NOSSA
 * integração com o Legal One — não o estado do processo do cliente. O processo
 * existe e o dinheiro dele está lá; o que falhou foi a sincronia de andamentos.
 *
 * Por isso a exibição é por público:
 * - `internal` (admin/operador): vê "Falha no Legal One" — é a fila de trabalho dele.
 * - `client`  (investidor/associado): vê "Em processamento" — neutro e verdadeiro.
 *
 * Nunca renderize `asset.status` direto na tela: use `getStatusLabel`.
 */

export type StatusAudience = 'internal' | 'client';

type StatusPresentation = {
    /** Rótulo mostrado ao admin/operador. */
    internal: string;
    /** Rótulo mostrado ao investidor/associado. */
    client: string;
    colorPalette: string;
};

const STATUS_MAP: Record<string, StatusPresentation> = {
    Ativo: {
        internal: 'Ativo',
        client: 'Ativo',
        colorPalette: 'green',
    },
    // Chaves legadas em caixa alta: o backend grava "Ativo"/"Liquidado", mas os
    // mapas antigos tratavam estas defensivamente. Mantidas para não regredir
    // registros gravados à mão no banco.
    ACTIVE: {
        internal: 'Ativo',
        client: 'Ativo',
        colorPalette: 'green',
    },
    CLOSED: {
        internal: 'Liquidado',
        client: 'Liquidado',
        colorPalette: 'gray',
    },
    'Em Negociação': {
        internal: 'Em Negociação',
        client: 'Em Negociação',
        colorPalette: 'yellow',
    },
    Liquidado: {
        internal: 'Liquidado',
        client: 'Liquidado',
        colorPalette: 'gray',
    },
    PENDING_ENRICHMENT: {
        internal: 'Aguardando Legal One',
        client: 'Em processamento',
        colorPalette: 'purple',
    },
    FAILED_ENRICHMENT: {
        internal: 'Falha no Legal One',
        // Jargão de integração interna nunca chega ao cliente.
        client: 'Em processamento',
        colorPalette: 'red',
    },
};

/**
 * Rótulo do status para o público informado.
 *
 * O fallback devolve o próprio status por ser o comportamento menos destrutivo
 * para valores legados gravados à mão no banco (ex.: "Inativo", "Encerrado"),
 * que são texto legível em português — não enums internos.
 */
export function getStatusLabel(status: string, audience: StatusAudience = 'internal'): string {
    return STATUS_MAP[status]?.[audience] ?? status;
}

/** Cor do badge. Para o cliente, os dois estados de integração viram neutros. */
export function getStatusColor(status: string, audience: StatusAudience = 'internal'): string {
    const entry = STATUS_MAP[status];
    if (!entry) return 'blue';

    if (audience === 'client' && (status === 'FAILED_ENRICHMENT' || status === 'PENDING_ENRICHMENT')) {
        // Vermelho alarmaria o cliente por um problema que é nosso, não dele.
        return 'purple';
    }

    return entry.colorPalette;
}

/**
 * Processo ativo, pelo status gravado: "Ativo", que é o que o backend grava, ou o legado "ACTIVE".
 * As telas que contavam só "ACTIVE" (painel do associado) mostravam zero.
 */
export function isActiveStatus(status: string | null | undefined): boolean {
    return status === 'Ativo' || status === 'ACTIVE';
}

/** Processo encerrado: "Liquidado", "Encerrado" ou o legado "CLOSED". */
export function isClosedStatus(status: string | null | undefined): boolean {
    return status === 'Liquidado' || status === 'Encerrado' || status === 'CLOSED';
}

/** Status que representam falha da nossa integração, não do processo. */
export function isInternalIntegrationStatus(status: string): boolean {
    return status === 'FAILED_ENRICHMENT' || status === 'PENDING_ENRICHMENT';
}
