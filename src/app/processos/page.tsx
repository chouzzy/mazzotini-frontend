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

// Tipagem para a resposta paginada
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
    const [searchQuery, setSearchQuery] = useState('');
    const limit = 10;

    // A URL agora envia os parâmetros para o servidor processar a busca e paginação
    const { data, isLoading, error, mutate } = useApi<PaginatedResponse>(
        `/api/assets?page=${page}&limit=${limit}&status=${filterStatus}&search=${searchQuery}`
    );

    // Resetar para a página 1 quando mudar o filtro ou busca
    useEffect(() => {
        setPage(1);
    }, [filterStatus, searchQuery]);

    if (isLoading && !data) {
        return (
            <Flex w="100%" flex={1} justify="center" align="center">
                <VStack gap={4}>
                    <Spinner size="xl" color="#9E905A" />
                    <Text>Carregando processos...</Text>
                </VStack>
            </Flex>
        );
    }

    if (error) {
        return (
            <Flex w="100%" flex={1} justify="center" align="center" p={4}>
                <VStack gap={4} bg="red.900/20" p={8} borderRadius="md" borderWidth="1px" borderColor="red.400">
                    <Icon as={PiWarningCircle} boxSize={10} color="red.300" />
                    <Heading size="md">Ocorreu um Erro</Heading>
                    <Text>Não foi possível carregar os processos. Tente atualizar a página.</Text>
                    <Button onClick={() => mutate()} variant="outline" size="sm">Tentar Novamente</Button>
                </VStack>
            </Flex>
        )
    }

    const assets = data?.items || [];
    const meta = data?.meta;

    if (!isLoading && assets.length === 0 && !searchQuery && !filterStatus) {
        return <EmptyState
            title="Nenhum processo Registado"
            description="Ainda não há nenhum processo de crédito no sistema. Comece por registrar o primeiro."
            buttonLabel="Registrar Primeiro processo"
            buttonHref="/processos/novo"
        />;
    }

    const tableBgColor = 'gray.900';

    return (
        <Flex w='100%'>
            <VStack gap={8} align="stretch" w="100%">
                <Flex justify="space-between" align="start" direction={{ base: 'column', md: 'row' }} gap={4}>
                    <Box w='100%'>
                        <Flex align="center" gap={2} w='100%'>
                            <PiPresentationChartDuotone color='#B8A76E' size={24} />
                            <Heading as="h1" size="xl">GESTÃO DE PROCESSOS</Heading>
                        </Flex>
                        <Text color="gray.400" mt={2}>
                            Visualize, pesquise e gira todos os processos de crédito da plataforma.
                        </Text>
                    </Box>
                    <Link as={NextLink} href="/processos/novo" _hover={{ textDecoration: 'none' }}>
                        <Button bgColor={'brand.600'} color={'white'} _hover={{bgColor:'brand.700'}} gap={2}>
                            <Icon as={PiPlusCircle} boxSize={5} />
                            Registrar Novo Processo
                        </Button>
                    </Link>
                </Flex>

                <Box>
                    <AssetsToolbar
                        assets={[]} // Toolbar agora apenas emite eventos, não precisa da lista completa
                        viewMode={'list'}
                        onViewChange={() => { }}
                        onFilterChange={setFilterStatus}
                        onSearch={setSearchQuery}
                    />

                    <Box overflowX="auto" borderRadius="md" mt={4}>
                        <Table.Root variant={'line'} size={'md'} bgColor={'bodyBg'}>
                            <Table.Header>
                                <Table.Row borderBottom={'1px solid'} borderColor={'gray.700'} bgColor={tableBgColor}>
                                    <Table.ColumnHeader color={'brand.600'} p={8}>Nº do Processo</Table.ColumnHeader>
                                    <Table.ColumnHeader color={'brand.600'} p={8}>Cliente Principal</Table.ColumnHeader>
                                    <Table.ColumnHeader color={'brand.600'} p={8}>Credor</Table.ColumnHeader>
                                    <Table.ColumnHeader color={'brand.600'} p={8}>Estimativa Atual</Table.ColumnHeader>
                                    <Table.ColumnHeader color={'brand.600'} p={8}>Status</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {assets.length > 0 ? (
                                    assets.map((asset) => (
                                        <Table.Row 
                                            key={asset.id} 
                                            cursor={'pointer'} 
                                            _hover={{ bg: 'whiteAlpha.50', color: 'brand.600' }} 
                                            bgColor={tableBgColor} 
                                            onClick={() => window.location.href = `/processos/${encodeURIComponent(asset.processNumber)}`}
                                        >
                                            <Table.Cell px={8} py={4} fontWeight="semibold">{asset.processNumber}</Table.Cell>
                                            <Table.Cell px={8} py={4}>{asset.mainInvestorName}</Table.Cell>
                                            <Table.Cell px={8} py={4}>{asset.originalCreditor}</Table.Cell>
                                            <Table.Cell px={8} py={4}>{formatCurrency(asset.currentValue)}</Table.Cell>
                                            <Table.Cell px={8} py={4}>
                                                <Tag.Root variant="subtle" colorPalette={getStatusColorScheme(asset.status)}>
                                                    <Tag.Label>{translateStatus(asset.status)}</Tag.Label>
                                                </Tag.Root>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))
                                ) : (
                                    <Table.Row>
                                        <Table.Cell colSpan={5} textAlign="center" py={10}>
                                            <Text color="gray.500">Nenhum processo encontrado.</Text>
                                        </Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table.Root>
                    </Box>

                    {/* CONTROLES DE PAGINAÇÃO */}
                    {meta && meta.totalPages > 1 && (
                        <Flex justify="space-between" align="center" mt={6} px={4}>
                            <Text fontSize="sm" color="gray.400">
                                Mostrando <b>{assets.length}</b> de <b>{meta.total}</b> processos
                            </Text>
                            <HStack gap={2}>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <Icon as={PiCaretLeftBold} />   
                                    Anterior
                                </Button>
                                
                                <HStack gap={1}>
                                    {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                                        .map((p, i, arr) => (
                                            <Flex key={p}>
                                                {i > 0 && arr[i-1] !== p - 1 && <Text color="gray.600">...</Text>}
                                                <Button
                                                    size="sm"
                                                    variant={page === p ? "solid" : "ghost"}
                                                    colorScheme={page === p ? "brand" : "gray"}
                                                    bg={page === p ? "brand.600" : "transparent"}
                                                    onClick={() => setPage(p)}
                                                >
                                                    {p}
                                                </Button>
                                            </Flex>
                                        ))
                                    }
                                </HStack>

                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                    disabled={page === meta.totalPages}
                                >
                                    Próximo
                                    <Icon as={PiCaretRightBold} />
                                </Button>
                            </HStack>
                        </Flex>
                    )}
                </Box>
            </VStack>
        </Flex>
    );
}