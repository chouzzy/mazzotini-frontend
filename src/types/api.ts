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