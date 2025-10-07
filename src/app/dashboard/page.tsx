// /src/app/dashboard/page.tsx
'use client';

import { Box, Heading, VStack, Text, Flex, Icon, Spinner } from '@chakra-ui/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useMemo, useState } from 'react';

import { CreditAssetCard, InvestorCreditAsset } from '../components/dashboard/CreditAssetCard';
import { DashboardSummary } from '../components/dashboard/DashboardSummary';
import { AssetsToolbar } from '../components/dashboard/AssetsToolbar';
import { AssetsTable } from '../components/dashboard/AssetsTable';
import { EmptyState } from '../components/dashboard/EmptyState';

import { useApi } from '@/hooks/useApi';
import { PiWarningCircle } from 'react-icons/pi';

// Esta página agora usa a mesma tipagem de retorno que a página do operador
import { AssetSummary } from '@/types/api';


export default function DashboardPage() {
    const { user } = useAuth0();
    // CORREÇÃO: A página do investidor agora chama o mesmo endpoint que a do operador.
    // O backend é responsável por filtrar e devolver apenas os ativos corretos.
    const { data: assets, isLoading, error } = useApi<AssetSummary[]>('/api/assets');

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
                    <Spinner size="xl" color="#9E905A" />
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

    if (!assets || assets.length === 0) {
        return <EmptyState 
            title="Nenhum Ativo na Sua Carteira"
            description="Você ainda não possui nenhum ativo de crédito. Quando um ativo for associado a si, ele aparecerá aqui."
            buttonLabel="Contactar Suporte" // Um call-to-action mais apropriado para o investidor
            buttonHref="#" // Podemos colocar o link do WhatsApp aqui
        />;
    }

    return (
        <Flex w='100%'>
            <VStack gap={8} align="stretch" w="100%">
                <Box>
                    <Heading as="h1" size="xl">
                        Meus Ativos
                    </Heading>
                    <Text color="gray.400" mt={2}>
                        Acompanhe em tempo real a performance da sua carteira de créditos.
                    </Text>
                </Box>

                <DashboardSummary assets={assets} />

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

