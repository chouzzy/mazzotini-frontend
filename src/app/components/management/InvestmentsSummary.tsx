'use client';

import { Box, Flex, Heading, Text, Icon, Button, Tag, Badge } from '@chakra-ui/react';
import { PiChartLineUp, PiArrowRight } from 'react-icons/pi';
import Link from 'next/link';
import { useState } from 'react';

const INITIAL_VISIBLE = 3;
const LOAD_MORE_STEP = 10;

interface InvestmentsSummaryProps {
    userId: string;
    investments: any[];
}

const translateStatus = (status: string) => {
    switch (status) {
        case 'ACTIVE':
        case 'Ativo': return 'Ativo';
        case 'CLOSED':
        case 'Liquidado': return 'Liquidado';
        case 'Em Negociação': return 'Em Negociação';
        case 'PENDING_ENRICHMENT': return 'Em Análise';
        case 'FAILED_ENRICHMENT': return 'Falha';
        default: return status;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'ACTIVE':
        case 'Ativo': return 'green';
        case 'CLOSED':
        case 'Liquidado': return 'gray';
        case 'Em Negociação': return 'yellow';
        case 'PENDING_ENRICHMENT': return 'purple';
        case 'FAILED_ENRICHMENT': return 'red';
        default: return 'blue';
    }
};

export function InvestmentsSummary({ userId, investments }: InvestmentsSummaryProps) {
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

    return (
        <Box borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.700">
            {/* Header sólido */}
            <Flex px={5} py={4} bg="gray.800" align="center" justify="space-between">
                <Flex align="center" gap={3}>
                    <Icon as={PiChartLineUp} color="brand.400" boxSize={5} />
                    <Heading size="sm" color="white">Carteira de Investimentos</Heading>
                    {investments.length > 0 && (
                        <Badge colorPalette="brand" variant="solid" size="sm">{investments.length}</Badge>
                    )}
                </Flex>
                <Link href={`/gestao/usuarios/${userId}/carteira`} passHref>
                    <Button size="xs" variant="solid" colorPalette="blue" type="button" gap={1}>
                        <Icon as={PiChartLineUp} /> Gerenciar Carteira
                    </Button>
                </Link>
            </Flex>

            {/* Body */}
            <Box bg="gray.900">
                {investments.length === 0 ? (
                    <Flex px={5} py={6}>
                        <Text color="gray.500" fontSize="sm">Este usuário não possui investimentos vinculados.</Text>
                    </Flex>
                ) : (
                    <>
                        {/* Cabeçalho da tabela */}
                        <Flex px={5} py={2} borderBottom="1px solid" borderColor="gray.700" bg="gray.850">
                            <Text flex={2} fontSize="xs" fontWeight="bold" color="brand.500" textTransform="uppercase" letterSpacing="wider">Nº do Processo</Text>
                            <Text flex={2} fontSize="xs" fontWeight="bold" color="brand.500" textTransform="uppercase" letterSpacing="wider">Parte Contrária</Text>
                            <Text flex={1} fontSize="xs" fontWeight="bold" color="brand.500" textTransform="uppercase" letterSpacing="wider">Status</Text>
                            <Box w="32px" />
                        </Flex>

                        {investments.slice(0, visibleCount).map((inv: any) => (
                            <Flex
                                key={inv.asset.id}
                                px={5} py={3}
                                align="center"
                                borderBottom="1px solid" borderColor="whiteAlpha.50"
                                _last={{ borderBottom: 'none' }}
                                _hover={{ bg: 'whiteAlpha.50' }}
                                transition="all 0.1s"
                            >
                                <Text flex={2} fontWeight="semibold" fontSize="sm" color="white">
                                    {inv.asset.processNumber}
                                </Text>
                                <Text flex={2} fontSize="sm" color="gray.400">
                                    {inv.asset.nickname || inv.asset.otherParty || '—'}
                                </Text>
                                <Box flex={1}>
                                    <Tag.Root size="sm" variant="solid" colorPalette={getStatusColor(inv.asset.status)}>
                                        <Tag.Label>{translateStatus(inv.asset.status)}</Tag.Label>
                                    </Tag.Root>
                                </Box>
                                <Link href={`/processos/${inv.asset.legalOneId}`} passHref>
                                    <Button size="xs" variant="solid" colorPalette="blue" type="button">
                                        <Icon as={PiArrowRight} />
                                    </Button>
                                </Link>
                            </Flex>
                        ))}

                        {investments.length > visibleCount && (
                            <Flex px={5} py={3} justify="center">
                                <Button
                                    variant="solid" size="sm" colorPalette="gray"
                                    onClick={() => setVisibleCount(c => c + LOAD_MORE_STEP)}
                                >
                                    Ver mais {Math.min(LOAD_MORE_STEP, investments.length - visibleCount)} processos
                                    <Text as="span" color="gray.400" ml={1}>({visibleCount} de {investments.length})</Text>
                                </Button>
                            </Flex>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
}
