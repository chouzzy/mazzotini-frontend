// Atualize o AssetSummary existente para incluir os campos novos
export interface AssetSummary {
    id: string;
    legalOneId: number;
    processNumber: string;
    nickname?: string | null; // <-- ADICIONADO
    originalCreditor: string;
    currentValue: number;
    status: string;
    acquisitionDate: Date;
    mainInvestorName: string | null;
    investorId: string | null;
    associateId: string | null;
    legalOneType: 'Lawsuit' | 'Appeal' | 'ProceduralIssue' | string; 
    parentProcessNumber?: string | null; // <-- ADICIONADO
    investorShare: number;
    investedValue: number;
    updateIndexType: string | null;
}

export type DocumentSection = 'JURIDICO' | 'PRIVADO_FINANCEIRO' | 'PROCESSUAL';

export type DocumentCategory =
    | 'TERMO_CESSAO' | 'PROCURACAO' | 'OUTRO_JURIDICO'
    | 'CESSAO' | 'HONORARIOS' | 'ORIENTACAO_FINANCEIRA' | 'ORIENTACAO_FISCAL' | 'COMPROVANTE' | 'NOTA_FISCAL'
    | 'SENTENCA' | 'DESPACHO' | 'OUTRO_PROCESSUAL';

export type DocumentSourceType = 'LEGAL_ONE' | 'MANUAL' | 'CLIENTE';

export interface ProcessDocument {
    id: string;
    name: string;
    url: string;
    fileKey?: string | null;
    mimeType?: string | null;
    section: DocumentSection;
    category: DocumentCategory | string;
    sourceType: DocumentSourceType;
    sourceStagingDocId?: string | null;
    uploadedByUserId?: string | null;
    assetId: string;
    legalOneDocumentId?: number | null;
    createdAt?: string | null;
}

export interface UserStagingDocument {
    id: string;
    userId: string;
    fileName: string;
    fileUrl: string;
    fileKey: string;
    mimeType: string;
    status: 'PENDING' | 'ATTACHED';
    attachedToAssetId?: string | null;
    attachedToAssetName?: string | null;
    attachedCategory?: string | null;
    attachedAt?: string | null;
    attachedByUserId?: string | null;
    createdAt?: string | null;
}

// Já crie e exporte a interface paginada para usar no sistema todo!
export interface PaginatedAssetsResponse {
    items: AssetSummary[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}