export interface FolderAsset {
    id: string;
    legalOneId: number;
    processNumber: string;
    nickname?: string;
    originalCreditor: string;
    currentValue: number;
    status: string;
    legalOneType?: string;
}

export interface ProcessFolder {
    id: string;
    folderCode: string;
    description: string;
    totalAcquisition: number;
    totalCurrent: number;
    assets: FolderAsset[];
}

export interface PaginatedFoldersResponse {
    items: ProcessFolder[];
    meta: { total: number; page: number; limit: number; totalPages: number };
}
