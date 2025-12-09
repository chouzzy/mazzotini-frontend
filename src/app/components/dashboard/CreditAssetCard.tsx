// src/components/dashboard/CreditAssetCard.tsx
'use client';

import { Tooltip } from '@/components/ui/tooltip';
import { AssetSummary } from '@/types/api';
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Tag,
    SimpleGrid,
    Stat,
    StatLabel,
    StatHelpText,
    Icon,
    Flex,
    Link,
} from '@chakra-ui/react';
import { PiBank, PiCalendarBlank, PiChartLineUp, PiPercent, PiScales } from 'react-icons/pi';

// Tipagem baseada no nosso futuro retorno da API
export type InvestorCreditAsset = {
    processNumber: string;
    originalCreditor: string;
    status: 'ACTIVE' | 'Liquidado' | 'Em Negociação';
    acquisitionDate: Date;
    // Valores calculados especificamente para a visão do investidor
    investedValue: number;
    currentValue: number;
    investorShare: number;
    updateIndexType: string;
};

// Função para formatar valores monetários
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

export function CreditAssetCard({ asset }: { asset: AssetSummary }) {
    const yieldValue = asset.currentValue - asset.investedValue;
    const yieldPercentage = (yieldValue / asset.investedValue) * 100;

    const getStatusColorScheme = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'green';
            case 'Liquidado':
                return 'gray';
            case 'Em Negociação':
                return 'yellow';
            default:
                return 'blue';
        }
    };

    return (
        <Link href={`/processos/${encodeURIComponent(asset.processNumber)}`} _hover={{ textDecoration: 'none' }}>
            <Box minW={'xl'} borderWidth="1px" borderRadius="lg" p={6} bg="gray.950" borderColor="gray.700" transition="all 0.2s" _hover={{ bgColor:'gray.800',borderColor: 'blue.400', transform: 'translateY(-4px)', shadow: 'lg' }}>
                <VStack align="stretch" gap={4}>
                    {/* Cabeçalho */}
                    <Flex justify="space-between" align="center">
                        <HStack>
                            <Icon as={PiScales} color="blue.400" />
                            <Tooltip content={`Processo Nº ${asset.processNumber}`}>
                                <Heading size="md" maxLines={1} maxW="250px" color={'textPrimary'}>
                                    {asset.processNumber}
                                </Heading>
                            </Tooltip>
                        </HStack>
                        <Tag.Root colorPalette={getStatusColorScheme(asset.status)} variant={'solid'}>
                            <Tag.Label>{asset.status}</Tag.Label>
                        </Tag.Root>
                    </Flex>

                    {/* Credor Original */}
                    <HStack color="gray.400">
                        <Icon as={PiBank} />
                        <Text color='textPrimary' fontSize="sm">Parte(s) Contrária(s): {asset.originalCreditor}</Text>
                    </HStack>

                    {/* Grid de Stats */}
                    <SimpleGrid columns={{ base: 1, md: 2}} gap={4} pt={4}>
                        <Stat.Root>
                            <Stat.Label color="gray.400">Custo de Aquisição</Stat.Label>
                            <Stat.ValueText color={'textPrimary'}>{formatCurrency(asset.investedValue)}</Stat.ValueText>
                        </Stat.Root>
                        <Stat.Root>
                            <Stat.Label color="gray.400">Estimativa Atual do Crédito</Stat.Label>
                            <Stat.ValueText color={'textPrimary'}>{formatCurrency(asset.currentValue)}</Stat.ValueText>
                            <StatHelpText display="flex" alignItems="center" color={yieldValue >= 0 ? 'green.600' : 'red.600'}>
                                <Icon as={PiChartLineUp} color="green.400" mr={1} />
                                {formatCurrency(yieldValue)} ({yieldPercentage.toFixed(2)}%)
                            </StatHelpText>
                        </Stat.Root>
                    </SimpleGrid>

                    {/* Rodapé */}
                    <HStack color="gray.500" pt={4} borderTop="1px" borderColor="gray.700">
                        <Icon as={PiCalendarBlank} />
                        <Text fontSize="xs">Posição Credora em: {new Date(asset.acquisitionDate).toLocaleDateString('pt-BR')}</Text>
                    </HStack>
                </VStack>
            </Box>
        </Link>
    );
}