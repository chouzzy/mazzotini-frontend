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
import { useApi } from '@/hooks/useApi';

export type InvestorCreditAsset = {
    legalOneId: number;
    processNumber: string;
    originalCreditor: string;
    status: string;
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

export function CreditAssetCard({ asset }: { asset: AssetSummary }) {
    const { data: myProfile } = useApi<{ role: string }>('/api/users/me');
    const isAdminOrOperator = myProfile?.role === 'ADMIN' || myProfile?.role === 'OPERATOR';
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

    const isAppeal = asset.legalOneType?.toLowerCase() === 'appeal';
    const isIncident = asset.legalOneType?.toLowerCase() === 'proceduralissue';
    const isMain = !isAppeal && !isIncident;

    return (
        <Link as={NextLink} href={`/processos/${asset.legalOneId}`} _hover={{ textDecoration: 'none' }} w={{ base: '100%', md: 'auto' }} display="block">
            <Box w={'100%'} minW={{ md: 'xl' }} borderWidth="1px" borderRadius="lg" p={{ base: 4, md: 6 }} bg="gray.950" borderColor="gray.700" transition="all 0.2s" _hover={{ bgColor:'gray.800',borderColor: 'brand.500', transform: 'translateY(-4px)', shadow: 'lg' }}>
                <VStack align="stretch" gap={3}>
                    <Flex justify="space-between" align="start">
                        <HStack wrap="wrap" gap={2}>
                            {isMain && (
                                <Badge colorPalette="blue" variant="solid" size="sm" borderRadius="sm">
                                    PROCESSO PRINCIPAL
                                </Badge>
                            )}
                            {isAppeal && (
                                <Badge colorPalette="orange" variant="solid" size="sm" borderRadius="sm" gap={1}>
                                    <Icon as={PiFilesDuotone} /> RECURSO
                                </Badge>
                            )}
                            {isIncident && (
                                <Badge colorPalette="purple" variant="solid" size="sm" borderRadius="sm" gap={1}>
                                    <Icon as={PiGavelDuotone} /> INCIDENTE
                                </Badge>
                            )}
                        </HStack>
                        {isAdminOrOperator && (
                            <Tag.Root colorPalette={getStatusColorScheme(asset.status)} variant={'subtle'} size="sm">
                                <Tag.Label>{asset.status}</Tag.Label>
                            </Tag.Root>
                        )}
                    </Flex>

                    <VStack align="start" gap={1}>
                        <HStack>
                            <Icon as={PiScales} color="brand.400" boxSize={{ base: 4, md: 5 }} flexShrink={0} />
                            <Tooltip content={`Processo Nº ${asset.processNumber}`}>
                                <Heading size={{ base: 'sm', md: 'md' }} maxLines={1} color={'textPrimary'}>
                                    {asset.processNumber}
                                </Heading>
                            </Tooltip>
                        </HStack>
                        {(isAppeal || isIncident) && asset.parentProcessNumber && (
                            <Text fontSize="xs" color="gray.400" fontWeight="medium">
                                Vínculo: <span style={{ color: '#D2C594' }}>{asset.parentProcessNumber}</span>
                            </Text>
                        )}
                        {(isAppeal || isIncident) && !asset.parentProcessNumber && asset.nickname && (
                            <Text fontSize="xs" color="gray.400" fontWeight="medium">
                                Vínculo: {asset.nickname}
                            </Text>
                        )}
                    </VStack>

                    <HStack color="gray.400" gap={2}>
                        <Icon as={PiBank} boxSize={{ base: 3, md: 4 }} flexShrink={0} />
                        <Text color='textPrimary' fontSize={{ base: 'xs', md: 'sm' }} lineClamp={1}>Parte(s): {asset.nickname || asset.originalCreditor}</Text>
                    </HStack>

                    <Stat.Root pt={3} borderTop="1px" borderColor="gray.800">
                        <Stat.Label color="gray.400" fontSize={{ base: 'xs', md: 'sm' }}>Estimativa Atual</Stat.Label>
                        <Stat.ValueText color={'textPrimary'} fontSize={{ base: 'lg', md: 'xl' }}>{formatCurrency(asset.currentValue)}</Stat.ValueText>
                        <StatHelpText display="flex" alignItems="center" fontSize="xs" color={yieldValue >= 0 ? 'green.600' : 'red.600'}>
                            <Icon as={PiChartLineUp} color={yieldValue >= 0 ? "green.400" : "red.400"} mr={1} />
                            {formatCurrency(yieldValue)} ({yieldPercentage.toFixed(2)}%)
                        </StatHelpText>
                    </Stat.Root>

                    <HStack color="gray.500" gap={2}>
                        <Icon as={PiCalendarBlank} boxSize={3} flexShrink={0} />
                        <Text fontSize="xs">Cessão: {new Date(asset.acquisitionDate).toLocaleDateString('pt-BR')}</Text>
                    </HStack>
                </VStack>
            </Box>
        </Link>
    );
}
