// src/components/dashboard/CreditAssetCard.tsx
'use client';

import { Tooltip } from '@/components/ui/tooltip';
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
} from '@chakra-ui/react';
import { PiBank, PiCalendarBlank, PiChartLineUp, PiPercent, PiScales } from 'react-icons/pi';

// Tipagem baseada no nosso futuro retorno da API
export type InvestorCreditAsset = {
    processNumber: string;
    originalCreditor: string;
    status: 'Ativo' | 'Liquidado' | 'Em Negociação';
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

export function CreditAssetCard({ asset }: { asset: InvestorCreditAsset }) {
    const yieldValue = asset.currentValue - asset.investedValue;
    const yieldPercentage = (yieldValue / asset.investedValue) * 100;

    const getStatusColorScheme = () => {
        switch (asset.status) {
            case 'Ativo':
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
        <Box borderWidth="1px" borderRadius="lg" p={6} bg="gray.800" borderColor="gray.700" transition="all 0.2s" _hover={{ borderColor: 'blue.400', transform: 'translateY(-4px)', shadow: 'lg' }}>
            <VStack align="stretch" gap={4}>
                {/* Cabeçalho */}
                <Flex justify="space-between" align="center">
                    <HStack>
                        <Icon as={PiScales} color="blue.400" />
                        <Tooltip content={`Processo Nº ${asset.processNumber}`}>
                            <Heading size="md" maxLines={1} maxW="250px">
                                {asset.processNumber}
                            </Heading>
                        </Tooltip>
                    </HStack>
                    <Tag.Root>
                        <Tag.Label>{asset.status}</Tag.Label>
                    </Tag.Root>
                </Flex>

                {/* Credor Original */}
                <HStack color="gray.400">
                    <Icon as={PiBank} />
                    <Text fontSize="sm">Credor Original: {asset.originalCreditor}</Text>
                </HStack>

                {/* Grid de Stats */}
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} pt={4}>
                    <Stat.Root>
                        <Stat.Label>Valor Investido</Stat.Label>
                        <Stat.ValueText>{formatCurrency(asset.investedValue)}</Stat.ValueText>
                    </Stat.Root>
                    <Stat.Root>
                        <Stat.Label>Saldo Atual</Stat.Label>
                        <Stat.ValueText>{formatCurrency(asset.currentValue)}</Stat.ValueText>
                        <StatHelpText display="flex" alignItems="center">
                            <Icon as={PiChartLineUp} color="green.400" mr={1} />
                            {formatCurrency(yieldValue)} ({yieldPercentage.toFixed(2)}%)
                        </StatHelpText>
                    </Stat.Root>
                    <Stat.Root>
                        <Stat.Label>Sua Participação</Stat.Label>
                        <Stat.ValueText>{asset.investorShare.toFixed(2)}%</Stat.ValueText>
                        <StatHelpText>{asset.updateIndexType}</StatHelpText>
                    </Stat.Root>
                </SimpleGrid>

                {/* Rodapé */}
                <HStack color="gray.500" pt={4} borderTop="1px" borderColor="gray.700">
                    <Icon as={PiCalendarBlank} />
                    <Text fontSize="xs">Adquirido em: {new Date(asset.acquisitionDate).toLocaleDateString('pt-BR')}</Text>
                </HStack>
            </VStack>
        </Box>
    );
}