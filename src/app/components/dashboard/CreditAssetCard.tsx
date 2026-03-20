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
    StatHelpText,
    Icon,
    Flex,
    Link,
    Badge
} from '@chakra-ui/react';
import { 
    PiBank, 
    PiCalendarBlank, 
    PiChartLineUp, 
    PiScales, 
    PiFilesDuotone, 
    PiGavelDuotone 
} from 'react-icons/pi';
import NextLink from 'next/link';

export type InvestorCreditAsset = {
    processNumber: string;
    originalCreditor: string;
    status: 'ACTIVE' | 'Liquidado' | 'Em Negociação';
    acquisitionDate: Date;
    investedValue: number;
    currentValue: number;
    investorShare: number;
    updateIndexType: string;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

// TIPAGEM ATUALIZADA
export function CreditAssetCard({ asset }: { asset: AssetSummary }) {
    const yieldValue = asset.currentValue - asset.investedValue;
    const yieldPercentage = asset.investedValue > 0 ? (yieldValue / asset.investedValue) * 100 : 0;

    const getStatusColorScheme = (status: string) => {
        switch (status) {
            case 'ACTIVE':
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

    // Identificadores de Paternidade
    const isAppeal = asset.legalOneType?.toLowerCase() === 'appeal';
    const isIncident = asset.legalOneType?.toLowerCase() === 'proceduralissue';
    const isMain = !isAppeal && !isIncident; // Processo Principal

    return (
        <Link as={NextLink} href={`/processos/${encodeURIComponent(asset.processNumber)}`} _hover={{ textDecoration: 'none' }}>
            <Box w={'100%'} minW={{ base: '100%', md: 'xl' }} borderWidth="1px" borderRadius="lg" p={6} bg="gray.950" borderColor="gray.700" transition="all 0.2s" _hover={{ bgColor:'gray.800',borderColor: 'brand.500', transform: 'translateY(-4px)', shadow: 'lg' }}>
                <VStack align="stretch" gap={4}>
                    
                    {/* LINHA 1: TAGS E STATUS */}
                    <Flex justify="space-between" align="start">
                        <HStack wrap="wrap" gap={2}>
                            {/* TAG PROCESSO PRINCIPAL */}
                            {isMain && (
                                <Badge colorPalette="blue" variant="solid" size="sm" borderRadius="sm">
                                    PROCESSO PRINCIPAL
                                </Badge>
                            )}
                            {/* TAG RECURSO */}
                            {isAppeal && (
                                <Badge colorPalette="orange" variant="solid" size="sm" borderRadius="sm" gap={1}>
                                    <Icon as={PiFilesDuotone} /> RECURSO
                                </Badge>
                            )}
                            {/* TAG INCIDENTE */}
                            {isIncident && (
                                <Badge colorPalette="purple" variant="solid" size="sm" borderRadius="sm" gap={1}>
                                    <Icon as={PiGavelDuotone} /> INCIDENTE
                                </Badge>
                            )}
                        </HStack>
                        
                        <Tag.Root colorPalette={getStatusColorScheme(asset.status)} variant={'subtle'} size="sm">
                            <Tag.Label>{asset.status}</Tag.Label>
                        </Tag.Root>
                    </Flex>

                    {/* LINHA 2: NÚMERO DO PROCESSO E VÍNCULO */}
                    <VStack align="start" gap={1}>
                        <HStack>
                            <Icon as={PiScales} color="brand.400" />
                            <Tooltip content={`Processo Nº ${asset.processNumber}`}>
                                <Heading size="md" maxLines={1} color={'textPrimary'}>
                                    {asset.processNumber}
                                </Heading>
                            </Tooltip>
                        </HStack>
                        
                        {/* MOSTRADOR DE VÍNCULO (NOVO) */}
                        {(isAppeal || isIncident) && asset.parentProcessNumber && (
                            <Text fontSize="xs" color="gray.400" fontWeight="medium">
                                Vínculo: <span style={{ color: '#D2C594' }}>{asset.parentProcessNumber}</span>
                            </Text>
                        )}
                        {/* Se não houver parentProcessNumber mas houver nickname, mostramos por precaução */}
                        {(isAppeal || isIncident) && !asset.parentProcessNumber && asset.nickname && (
                            <Text fontSize="xs" color="gray.400" fontWeight="medium">
                                Vínculo: {asset.nickname}
                            </Text>
                        )}
                    </VStack>

                    {/* Credor */}
                    <HStack color="gray.400">
                        <Icon as={PiBank} />
                        <Text color='textPrimary' fontSize="sm">Parte(s) Contrária(s): {asset.originalCreditor}</Text>
                    </HStack>

                    {/* Grid de Stats */}
                    <SimpleGrid columns={{ base: 1, md: 2}} gap={4} pt={4}>
                        <Stat.Root>
                            <Stat.Label color="gray.400">Estimativa Atual do Valor Total do Crédito</Stat.Label>
                            <Stat.ValueText color={'textPrimary'}>{formatCurrency(asset.currentValue)}</Stat.ValueText>
                            <StatHelpText display="flex" alignItems="center" color={yieldValue >= 0 ? 'green.600' : 'red.600'}>
                                <Icon as={PiChartLineUp} color={yieldValue >= 0 ? "green.400" : "red.400"} mr={1} />
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
