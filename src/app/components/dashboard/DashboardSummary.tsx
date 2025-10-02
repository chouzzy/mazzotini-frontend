// src/components/dashboard/DashboardSummary.tsx
'use client';

import { SimpleGrid, Stat, Icon } from '@chakra-ui/react';
import { PiChartLineUp, PiWallet, PiArrowRight } from 'react-icons/pi';
import { InvestorCreditAsset } from './CreditAssetCard';

// Função para formatar valores monetários
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};


export function DashboardSummary({ assets }: { assets: InvestorCreditAsset[] }) {
    const totalInvested = assets.reduce((sum, asset) => sum + asset.investedValue, 0);
    const totalCurrentValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalYield = totalCurrentValue - totalInvested;

    return (
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            <Stat.Root bg="gray.950" p={5} borderRadius="md" borderWidth="1px" borderColor="gray.700" _hover={{ borderColor: 'wave' }} transition="border-color 0.3s">
                <Stat.Label display="flex" alignItems="center" gap={2} color={'textPrimary'}><Icon as={PiWallet} /> Total Investido</Stat.Label>
                <Stat.ValueText fontSize="3xl">{formatCurrency(totalInvested)}</Stat.ValueText>
            </Stat.Root>
            <Stat.Root bg="gray.950" p={5} borderRadius="md" borderWidth="1px" borderColor="gray.700" _hover={{ borderColor: 'wave' }} transition="border-color 0.3s">
                <Stat.Label display="flex" alignItems="center" gap={2} color={'textPrimary'}><Icon as={PiChartLineUp} /> Saldo Atual Total</Stat.Label>
                <Stat.ValueText fontSize="3xl">{formatCurrency(totalCurrentValue)}</Stat.ValueText>
            </Stat.Root>
            <Stat.Root bg="gray.950" p={5} borderRadius="md" borderWidth="1px" borderColor="gray.700" _hover={{ borderColor: 'wave' }} transition="border-color 0.3s">
                <Stat.Label display="flex" alignItems="center" gap={2} color={'textPrimary'}><Icon as={PiArrowRight} /> Rendimento Total</Stat.Label>
                <Stat.ValueText fontSize="3xl" color="green.400">{formatCurrency(totalYield)}</Stat.ValueText>
            </Stat.Root>
        </SimpleGrid>
    )
}