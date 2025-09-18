// ============================================================================
//   DADOS MOCKADOS (Substituir por chamada à API no futuro)

import { InvestorCreditAsset } from "../components/dashboard/CreditAssetCard";

// ============================================================================
const mockInvestorAssets: InvestorCreditAsset[] = [
    {
        processNumber: '0012345-67.2022.8.26.0100',
        originalCreditor: 'Banco ABC S.A.',
        status: 'Ativo',
        acquisitionDate: new Date('2023-05-20T00:00:00Z'),
        investedValue: 50000,
        currentValue: 54250.75,
        investorShare: 100,
        updateIndexType: 'IPCA + 6% a.a'
    },
    {
        processNumber: '0098765-43.2021.8.26.0500',
        originalCreditor: 'Companhia Aérea XYZ',
        status: 'Ativo',
        acquisitionDate: new Date('2023-09-10T00:00:00Z'),
        investedValue: 120000,
        currentValue: 129880.00,
        investorShare: 80,
        updateIndexType: 'SELIC'
    },
    {
        processNumber: '0055555-11.2020.8.11.0202',
        originalCreditor: 'Varejista Magazine Top',
        status: 'Em Negociação',
        acquisitionDate: new Date('2024-01-15T00:00:00Z'),
        investedValue: 75000,
        currentValue: 76125.00,
        investorShare: 90,
        updateIndexType: 'IPCA'
    },
    {
        processNumber: '0044444-22.2019.8.04.0303',
        originalCreditor: 'Construtora Prédio Forte',
        status: 'Liquidado',
        acquisitionDate: new Date('2022-03-30T00:00:00Z'),
        investedValue: 200000,
        currentValue: 255000.00,
        investorShare: 100,
        updateIndexType: 'IPCA + Juros'
    },
];
// ============================================================================


export { mockInvestorAssets }