// src\app\ativos\page.tsx
'use client';

import { Box, Heading, VStack, Text, Flex, Icon, Spinner, SimpleGrid } from '@chakra-ui/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useState, useMemo } from 'react';


import { useApi } from '@/hooks/useApi';
import { PiWarningCircle } from 'react-icons/pi';
import { AssetsTable } from '../components/dashboard/AssetsTable';
import { AssetsToolbar } from '../components/dashboard/AssetsToolbar';
import { InvestorCreditAsset, CreditAssetCard } from '../components/dashboard/CreditAssetCard';
import { DashboardSummary } from '../components/dashboard/DashboardSummary';
import { EmptyState } from '../components/dashboard/EmptyState';

export default function AtivosPage() {
    const { user } = useAuth0();
    const { data: assets, isLoading, error } = useApi<InvestorCreditAsset[]>('/api/investments/me');

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterStatus, setFilterStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredAssets = useMemo(() => {
        if (!assets) return [];
        return assets
            .filter(asset => filterStatus ? asset.status === filterStatus : true)
            .filter(asset =>
                asset.processNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                asset.originalCreditor.toLowerCase().includes(searchQuery.toLowerCase())
            );
    }, [assets, filterStatus, searchQuery]);

    if (isLoading) {
        return (
            <Flex w="100%" flex={1} justify="center" align="center">
                <VStack gap={4}>
                    <Spinner size="xl" color="blue.500" />
                    <Text>A carregar os seus investimentos...</Text>
                </VStack>
            </Flex>
        );
    }

    if (error) {
        return (
            <Flex w="100%" flex={1} justify="center" align="center" p={4}>
                 <VStack gap={4} bg="red.900" p={8} borderRadius="md" borderWidth="1px" borderColor="red.400">
                    <Icon as={PiWarningCircle} boxSize={10} color="red.300" />
                    <Heading size="md">Ocorreu um Erro</Heading>
                    <Text>Não foi possível carregar os seus investimentos.</Text>
                </VStack>
            </Flex>
        )
    }

    // Lida com o caso de não haver ativos na carteira
    if (!assets || assets.length === 0) {
        return <EmptyState />;
    }

    return (
        <Flex w='100%'>
            <VStack gap={8} align="stretch" w="100%">
                <Box>
                    <Heading as="h1" size="xl">Meus Ativos</Heading>
                    <Text color="gray.400" mt={2}>
                        Acompanhe em tempo real a performance da sua carteira de créditos.
                    </Text>
                </Box>
                
                {/* NOVO: Grid para organizar o topo do dashboard */}
                <Flex direction={{ base: 'column', lg: 'column' }} gap={8}>
                    <DashboardSummary assets={assets} />
                    {/* <PortfolioChart assets={assets} /> */}
                </Flex>

                <Box>
                    <Heading as="h2" size="lg" mb={6}>Lista de Ativos</Heading>
                    <AssetsToolbar
                        assets={assets}
                        viewMode={viewMode}
                        onViewChange={setViewMode}
                        onFilterChange={setFilterStatus}
                        onSearch={setSearchQuery}
                    />

                    {filteredAssets.length > 0 ? (
                        viewMode === 'grid' ? (
                            <Flex gap={6} align="stretch" wrap="wrap" w='100%'>
                                {filteredAssets.map((asset) => (
                                    <CreditAssetCard key={asset.processNumber} asset={asset} />
                                ))}
                            </Flex>
                        ) : (
                            <AssetsTable assets={filteredAssets} />
                        )
                    ) : (
                        <Flex justify="center" p={10} bg="gray.900" borderRadius="md">
                            <Text>Nenhum ativo encontrado com os filtros aplicados.</Text>
                        </Flex>
                    )}
                </Box>
            </VStack>
        </Flex>
    );
}
