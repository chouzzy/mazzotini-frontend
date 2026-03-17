// Caminho: src/app/dashboard/page.tsx

'use client';

import {
    Box, Heading, VStack, Text, Flex, Icon, Spinner, HStack, Button, Field, Select, Portal, createListCollection
} from '@chakra-ui/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useState, useEffect } from 'react';

import { CreditAssetCard } from '../components/dashboard/CreditAssetCard';
import { AssetsToolbar } from '../components/dashboard/AssetsToolbar';
import { AssetsTable } from '../components/dashboard/AssetsTable';
import { EmptyState } from '../components/dashboard/EmptyState';

import { useApi } from '@/hooks/useApi';
import {
    PiScalesDuotone, PiWarningCircle, PiCaretLeftBold, PiCaretRightBold
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

const typeOptions = createListCollection({
    items: [
        { label: "Todos os Tipos", value: "ALL" },
        { label: "Processo Principal", value: "LAWSUIT" },
        { label: "Recurso", value: "APPEAL" },
        { label: "Incidente", value: "INCIDENT" },
    ]
});

export default function DashboardPage() {
    const { user } = useAuth0();

    const [page, setPage] = useState(1);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('ALL'); // <-- ESTADO DO TIPO
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

    useEffect(() => {
        setPage(1);
    }, [filterStatus, filterType]);

    // Inclui o filterType na chamada à API
    const { data, isLoading, error } = useApi<PaginatedResponse>(
        `/api/assets?page=${page}&limit=${limit}&status=${filterStatus}&search=${debouncedSearch}&type=${filterType}`
    );

    if (error) {
        return (
            <Flex w="100%" flex={1} justify="center" align="center" p={4}>
                <VStack gap={4} bg="red.900/20" p={8} borderRadius="md" borderWidth="1px" borderColor="red.400">
                    <Icon as={PiWarningCircle} boxSize={10} color="red.300" />
                    <Heading size="md">Ocorreu um Erro</Heading>
                    <Text>Não foi possível carregar os seus processos.</Text>
                </VStack>
            </Flex>
        )
    }

    const assets = data?.items || [];
    const meta = data?.meta;

    return (
        <Flex w='100%'>
            <VStack gap={8} align="stretch" w="100%">
                <Box>
                    <Flex flexDir={{ base: 'column', md: 'row' }} justify="space-between" align="start" mb={6} gap={4}>
                        <Flex flexDir={'column'}>
                            <Flex align="center" gap={2}>
                                <PiScalesDuotone size={24} color='#B8A76E' />
                                <Heading as="h1" size="lg"> Meus Processos</Heading>
                            </Flex>
                            <Text color="gray.400" mt={2}>
                                Acompanhe em tempo real a performance da sua carteira de processos.
                            </Text>
                        </Flex>
                    </Flex>

                    {/* CORREÇÃO DO BUG: Passamos o 'assets' vindo da API para preencher a combobox */}
                    <AssetsToolbar
                        assets={assets}
                        viewMode={viewMode}
                        onViewChange={setViewMode}
                        onFilterChange={setFilterStatus}
                        onSearch={setSearchQuery}
                        onTypeChange={setFilterType} // <-- BASTA ADICIONAR ISTO!
                    />

                    <Box position="relative" mt={4} minH="200px">
                        {isLoading && (
                            <Flex position="absolute" top={0} left={0} right={0} bottom={0} bg="blackAlpha.600" zIndex={2} justify="center" align="center" borderRadius="md">
                                <Spinner size="xl" color="brand.500" />
                            </Flex>
                        )}

                        {assets.length === 0 && !isLoading && !debouncedSearch && !filterStatus && filterType === 'ALL' ? (
                            <EmptyState
                                title="Nenhum Processo na Sua Carteira"
                                description="Você ainda não possui nenhum processo de crédito. Quando um processo for associado a si, ele aparecerá aqui."
                                buttonLabel="Contactar Suporte"
                                buttonHref="#"
                            />
                        ) : assets.length === 0 && !isLoading ? (
                            <Flex justify="center" p={10} bg="gray.900" borderRadius="md">
                                <Text>Nenhum processo encontrado com os filtros aplicados.</Text>
                            </Flex>
                        ) : (
                            <Box opacity={isLoading ? 0.5 : 1} transition="opacity 0.2s">
                                {viewMode === 'grid' ? (
                                    <Flex gap={6} align="stretch" wrap="wrap" w='100%'>
                                        {assets.map((asset) => (
                                            <CreditAssetCard key={asset.processNumber} asset={asset} />
                                        ))}
                                    </Flex>
                                ) : (
                                    <AssetsTable assets={assets} />
                                )}

                                {/* CONTROLES DE PAGINAÇÃO */}
                                {meta && meta.totalPages > 1 && (
                                    <Flex justify="space-between" align="center" mt={8} px={2} pb={8}>
                                        <Text fontSize="sm" color="gray.400" display={{ base: 'none', md: 'block' }}>
                                            Mostrando <b>{assets.length}</b> de <b>{meta.total}</b> processos
                                        </Text>
                                        <HStack gap={2} mx={{ base: 'auto', md: '0' }}>
                                            <Button
                                                size="sm"
                                                variant="outline"
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
                                                            {i > 0 && arr[i - 1] !== p - 1 && <Text color="gray.600">...</Text>}
                                                            <Button
                                                                size="sm"
                                                                variant={page === p ? "solid" : "ghost"}
                                                                colorScheme={page === p ? "brand" : "gray"}
                                                                bg={page === p ? "brand.600" : "transparent"}
                                                                color={page === p ? "white" : "gray.300"}
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
                                                variant="outline"
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
        </Flex>
    );
}