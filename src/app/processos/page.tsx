'use client';

import {
    Box,
    Heading,
    VStack,
    Text,
    Flex,
    Icon,
    Spinner,
    Button,
    Link,
    Table,
    Tag,
    HStack
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { PiCurrencyCircleDollar, PiArrowRight } from 'react-icons/pi';
import { useAuth0 } from '@auth0/auth0-react';
import { useState, useEffect } from 'react';

import { AssetsToolbar } from '../components/dashboard/AssetsToolbar';
import { EmptyState } from '../components/dashboard/EmptyState';

import { useApi } from '@/hooks/useApi';
import { 
    PiWarningCircle, 
    PiPlusCircle, 
    PiPresentationChartDuotone,
    PiCaretLeftBold,
    PiCaretRightBold 
} from 'react-icons/pi';
import { AssetSummary } from '@/types/api';

interface PaginatedResponse {
    items: AssetSummary[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const translateStatus = (status: string) => {
    switch (status) {
        case 'Ativo': return 'Ativo';
        case 'Liquidado': return 'Liquidado';
        case 'Em Negociação': return 'Em Negociação';
        case 'PENDING_ENRICHMENT': return 'Aguardando Legal One';
        case 'FAILED_ENRICHMENT': return 'Falha no Legal One';
        default:
            return status.toString().replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    }
};

const getStatusColorScheme = (status: string) => {
    switch (status) {
        case 'Ativo': return 'green';
        case 'Liquidado': return 'gray';
        case 'Em Negociação': return 'yellow';
        case 'PENDING_ENRICHMENT': return 'purple';
        case 'FAILED_ENRICHMENT': return 'red';
        default: return 'blue';
    }
};

export default function OperatorAssetsPage() {
    const { user } = useAuth0();
    
    // Estados de paginação e filtros
    const [page, setPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const limit = 10;

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Resetar para a página 1 quando mudar filtros estáticos
    useEffect(() => {
        setPage(1);
    }, [filterStatus, filterType]);

    const { data: myProfile } = useApi<{ role: string; name: string }>('/api/users/me');
    const isAdminOrOperator = myProfile?.role === 'ADMIN' || myProfile?.role === 'OPERATOR';

    const { data, isLoading, error, mutate } = useApi<PaginatedResponse>(
        `/api/assets?page=${page}&limit=${limit}&status=${filterStatus}&search=${debouncedSearch}&type=${filterType}`
    );

    if (error) {
        return (
            <Flex w="100%" flex={1} justify="center" align="center" p={4}>
                <VStack gap={4} bg="red.900/20" p={8} borderRadius="md" borderWidth="1px" borderColor="red.400">
                    <Icon as={PiWarningCircle} boxSize={10} color="red.300" />
                    <Heading size="md">Ocorreu um Erro</Heading>
                    <Text>Não foi possível carregar os processos. Tente atualizar a página.</Text>
                    <Button onClick={() => mutate()} variant="solid" colorPalette="gray" size="sm">Tentar Novamente</Button>
                </VStack>
            </Flex>
        )
    }

    const assets = data?.items || [];
    const meta = data?.meta;
    const tableBgColor = 'gray.900';

    return (
        <VStack gap={8} align="stretch">
                
                <Flex justify="space-between" align="start" direction={{ base: 'column', md: 'row' }} gap={4}>
                    <Box w='100%'>
                        <Flex align="center" gap={2} w='100%'>
                            <PiPresentationChartDuotone color='#B8A76E' size={24} />
                            <Heading as="h1" size="xl">GESTÃO DE PROCESSOS</Heading>
                        </Flex>
                        <Text color="gray.400" mt={2}>
                            Visualize, pesquise e gerencie todos os processos de crédito da plataforma.
                        </Text>
                    </Box>
                </Flex>

                {/* CTA documentos — só INVESTOR */}
                {myProfile?.role === 'INVESTOR' && (
                    <Link as={NextLink} href="/meus-documentos" _hover={{ textDecoration: 'none' }} w="100%">
                        {assets.length === 0 && !isLoading ? (
                            <Flex
                                w="100%" p={4} borderRadius="lg" gap={4}
                                align={{ base: 'flex-start', md: 'center' }}
                                flexDir={{ base: 'column', md: 'row' }}
                                bg="brand.800" _hover={{ bg: 'brand.700' }} transition="all 0.15s"
                            >
                                <Icon as={PiCurrencyCircleDollar} color="white" boxSize={7} flexShrink={0} />
                                <Box flex={1}>
                                    <Text fontWeight="bold" color="white" mb="2px">
                                        Você ainda não tem processos vinculados
                                    </Text>
                                    <Text fontSize="sm" color="whiteAlpha.700">
                                        Envie seus documentos financeiros para que nossa equipe possa registrar sua participação.
                                    </Text>
                                </Box>
                                <Button size="sm" alignSelf={{ base: 'flex-end', md: 'auto' }} bg="gray.200" color="gray.800" _hover={{ bg: 'gray.300' }} fontWeight="bold" gap={1}>
                                    Enviar documentos <Icon as={PiArrowRight} />
                                </Button>
                            </Flex>
                        ) : (
                            <Flex
                                w="100%" p={4} borderRadius="lg" gap={4}
                                align={{ base: 'flex-start', md: 'center' }}
                                flexDir={{ base: 'column', md: 'row' }}
                                bg="brand.800" _hover={{ bg: 'brand.700' }} transition="all 0.15s"
                            >
                                <Icon as={PiCurrencyCircleDollar} color="white" boxSize={7} flexShrink={0} />
                                <Box flex={1}>
                                    <Text fontWeight="bold" color="white" mb="2px">
                                        Realizou nova cessão de crédito?
                                    </Text>
                                    <Text fontSize="sm" color="whiteAlpha.700">
                                        Envie seus documentos financeiros para que nossa equipe possa vinculá-los ao processo.
                                    </Text>
                                </Box>
                                <Button size="sm" alignSelf={{ base: 'flex-end', md: 'auto' }} bg="gray.200" color="gray.800" _hover={{ bg: 'gray.300' }} fontWeight="bold" gap={1}>
                                    Enviar documentos <Icon as={PiArrowRight} />
                                </Button>
                            </Flex>
                        )}
                    </Link>
                )}

                <Box>
                    <AssetsToolbar
                        assets={assets}
                        viewMode={'list'}
                        onViewChange={() => { }}
                        onFilterChange={setFilterStatus}
                        onSearch={setSearchQuery}
                        onTypeChange={setFilterType}
                    />

                    <Box position="relative" overflowX="auto" borderRadius="md" mt={4} minH="200px">
                        {isLoading && (
                            <Flex position="absolute" top={0} left={0} right={0} bottom={0} bg="blackAlpha.600" zIndex={2} justify="center" align="center" borderRadius="md">
                                <Spinner size="xl" color="brand.500" />
                            </Flex>
                        )}

                        {assets.length === 0 && !isLoading && !debouncedSearch && !filterStatus && filterType === 'ALL' ? (
                            <EmptyState
                                title="Nenhum processo Registrado"
                                description="Ainda não há nenhum processo de crédito no sistema. Comece por registrar o primeiro."
                                buttonLabel={isAdminOrOperator ? "Registrar Primeiro processo" : undefined}
                                buttonHref={isAdminOrOperator ? "/processos/novo" : undefined}
                            />
                        ) : assets.length === 0 && !isLoading ? (
                            <Flex justify="center" p={10} bg="gray.900" borderRadius="md">
                                <Text color="gray.500">Nenhum processo encontrado com os filtros aplicados.</Text>
                            </Flex>
                        ) : (
                            <Box opacity={isLoading ? 0.5 : 1} transition="opacity 0.2s">
                                <Table.Root variant={'line'} size={'md'} bgColor={'bodyBg'}>
                                    <Table.Header>
                                        <Table.Row borderBottom={'1px solid'} borderColor={'gray.700'} bgColor={tableBgColor}>
                                            <Table.ColumnHeader color={'brand.600'} px={3} py={3}>Nº do Processo</Table.ColumnHeader>
                                            <Table.ColumnHeader color={'brand.600'} px={3} py={3}>Parte Contrária</Table.ColumnHeader>
                                            <Table.ColumnHeader color={'brand.600'} px={3} py={3} display={{ base: 'none', lg: 'table-cell' }}>Cliente Principal</Table.ColumnHeader>
                                            <Table.ColumnHeader color={'brand.600'} px={3} py={3} display={{ base: 'none', lg: 'table-cell' }}>Credor</Table.ColumnHeader>
                                            <Table.ColumnHeader color={'brand.600'} px={3} py={3} display={{ base: 'none', md: 'table-cell' }}>Estimativa Atual</Table.ColumnHeader>
                                            <Table.ColumnHeader color={'brand.600'} px={3} py={3} display={{ base: 'none', md: 'table-cell' }}>Status</Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {assets.map((asset) => (
                                            <Table.Row 
                                                key={asset.id} 
                                                cursor={'pointer'} 
                                                _hover={{ bg: 'whiteAlpha.50', color: 'brand.600' }} 
                                                bgColor={tableBgColor} 
                                                onClick={() => window.location.href = `/processos/${asset.legalOneId}`}
                                            >
                                                <Table.Cell px={3} py={3} fontWeight="semibold">
                                                    <VStack align="start" gap={0}>
                                                        <Text fontSize="sm">{asset.processNumber}</Text>
                                                        {asset.legalOneType === 'Lawsuit' && <Text fontSize="xs" color="blue.400">Processo Principal</Text>}
                                                        {asset.legalOneType === 'Appeal' && <Text fontSize="xs" color="orange.400">Recurso</Text>}
                                                        {asset.legalOneType === 'ProceduralIssue' && <Text fontSize="xs" color="purple.400">Incidente</Text>}
                                                    </VStack>
                                                </Table.Cell>
                                                <Table.Cell px={3} py={3}>{asset.nickname || '—'}</Table.Cell>
                                                <Table.Cell px={3} py={3} display={{ base: 'none', lg: 'table-cell' }}>{myProfile?.name || user?.name || '—'}</Table.Cell>
                                                <Table.Cell px={3} py={3} display={{ base: 'none', lg: 'table-cell' }}>{asset.originalCreditor}</Table.Cell>
                                                <Table.Cell px={3} py={3} display={{ base: 'none', md: 'table-cell' }}>{formatCurrency(asset.currentValue)}</Table.Cell>
                                                <Table.Cell px={3} py={3} display={{ base: 'none', md: 'table-cell' }}>
                                                    <Tag.Root variant="subtle" colorPalette={getStatusColorScheme(asset.status)}>
                                                        <Tag.Label>{translateStatus(asset.status)}</Tag.Label>
                                                    </Tag.Root>
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table.Root>

                                {meta && meta.totalPages > 1 && (
                                    <Flex justify="space-between" align="center" mt={6} px={4} pb={4}>
                                        <Text fontSize="sm" color="gray.400" display={{ base: 'none', md: 'block' }}>
                                            Mostrando <b>{assets.length}</b> de <b>{meta.total}</b> processos
                                        </Text>
                                        <HStack gap={2} mx={{ base: 'auto', md: '0' }}>
                                            <Button
                                                size="sm"
                                                variant="solid"
                                                colorPalette="gray"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                            >
                                                <Icon as={PiCaretLeftBold} mr={1} /> Anterior
                                            </Button>
                                            
                                            <HStack gap={1} display={{ base: 'none', sm: 'flex' }}>
                                                {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                                                    .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                                                    .map((p, i, arr) => (
                                                        <Box key={p}>
                                                            {i > 0 && arr[i-1] !== p - 1 && <Text color="gray.600">...</Text>}
                                                            <Button
                                                                size="sm"
                                                                variant="solid"
                                                                colorPalette={page === p ? "brand" : "gray"}
                                                                onClick={() => setPage(p)}
                                                            >
                                                                {p}
                                                            </Button>
                                                        </Box>
                                                    ))
                                                }
                                            </HStack>

                                            <Button
                                                size="sm"
                                                variant="solid"
                                                colorPalette="gray"
                                                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                                disabled={page === meta.totalPages}
                                            >
                                                Próximo <Icon as={PiCaretRightBold} ml={1} />
                                            </Button>
                                        </HStack>
                                    </Flex>
                                )}
                            </Box>
                        )}
                    </Box>
                </Box>
        </VStack>
    );
}