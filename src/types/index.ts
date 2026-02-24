

interface HeroHomepageData {
    hero: {
        title: string;
        subtitle: string;
        ctaButton: string;
        // ctaButtonDemo: string;
        dashboardImage: string | string[];
    };
}

// Tipagem para os dados do perfil que vêm do nosso backend
interface UserProfile {
    id: string;
    name: string;
    email: string;
    profilePictureUrl?: string | null;
    cpfOrCnpj?: string;
    rg?: string;
    birthDate?: string;
    phone?: string;
    cellPhone?: string;
    infoEmail?: string;
    profession?: string;
    contactPreference?: string;

    residentialCep?: string;
    residentialStreet?: string;
    residentialNumber?: string;
    residentialComplement?: string;
    residentialNeighborhood?: string;
    residentialCity?: string;
    residentialState?: string;

    commercialCep?: string;
    commercialStreet?: string;
    commercialNumber?: string;
    commercialComplement?: string;
    commercialNeighborhood?: string;
    commercialCity?: string;
    commercialState?: string;

    correspondenceAddress?: string;

    investments?:
    {
        id: string;
        investorShare: number;
        mazzotiniShare: number;
        userId: string;
        creditAssetId: string;
        asset: {
            id: string;
            [key: string]: any;
        };
        documents: string[];
    }[]

    nationality?: string;
    maritalStatus?: string;
    personalDocumentUrls?: string[];
    referredById?: string | null;
    createdAt: string;
    updatedAt: string;
}

export type { HeroHomepageData, UserProfile };