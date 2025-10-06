// /src/types/api.ts

// Este é o "contrato" que o nosso frontend espera receber da API /api/assets.
// Ele espelha a tipagem AssetSummary do backend.
export interface AssetSummary {
    id: string;
    processNumber: string;
    originalCreditor: string;
    currentValue: number;
    status: string;
    acquisitionDate: Date;
    mainInvestorName: string | null;
    investorId: string | null;
    associateId: string | null;
    // Campos necessários para os componentes de UI
    investorShare: number;
    investedValue: number;
    updateIndexType: string | null;
}
