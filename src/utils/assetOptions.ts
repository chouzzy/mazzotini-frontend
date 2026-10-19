/**
 * assetOptions.ts — Opções de processo para os campos de seleção da carteira.
 *
 * ## Por que existe
 * Na tela "Carteira de Processos", o nome do processo de cada linha só aparecia se
 * ele estivesse na lista de todos os processos (`/api/assets?limit=9999`), uma
 * requisição pesada. Quando ela falhava ou estourava o tempo, todas as linhas
 * mostravam "Buscar processo..." e não dava para saber qual processo era qual.
 *
 * Os processos que já estão na carteira chegam junto com o usuário, dentro de cada
 * investimento. Por isso entram aqui primeiro: a linha mostra o próprio processo
 * mesmo que a lista geral ainda não tenha carregado.
 */

import type { AssetSummary } from '@/types/api';

export interface AssetOption {
    label: string;
    value: string;
}

type AssetLike = Pick<AssetSummary, 'id' | 'processNumber' | 'nickname'>;

/** Rótulo exibido no campo: "0001234-56.2000.8.26.0001 (Empresa Exemplo Ltda.)". */
export function formatAssetLabel(asset: Pick<AssetLike, 'processNumber' | 'nickname'>): string {
    return `${asset.processNumber}${asset.nickname ? ` (${asset.nickname})` : ''}`;
}

/**
 * Junta os processos da carteira com a lista geral, sem repetir.
 * Os da carteira vêm primeiro e não dependem da lista geral.
 */
export function buildAssetOptions(
    portfolioAssets: (AssetLike | null | undefined)[],
    allAssets: AssetLike[] = [],
): AssetOption[] {
    const options = new Map<string, AssetOption>();

    for (const asset of [...portfolioAssets, ...allAssets]) {
        if (asset?.id && !options.has(asset.id)) {
            options.set(asset.id, { value: asset.id, label: formatAssetLabel(asset) });
        }
    }

    return Array.from(options.values());
}
