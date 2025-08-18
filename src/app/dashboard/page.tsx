// src/app/dashboard/page.tsx
'use client';

import { Box, Container, Heading, VStack, Text, Flex, Icon, Spinner } from '@chakra-ui/react';
import { useAuth0 } from '@auth0/auth0-react';
import { AuthenticationGuard } from '../components/auth/AuthenticationGuard';
import { CreditAssetCard, InvestorCreditAsset } from '../components/dashboard/CreditAssetCard';
import { DashboardSummary } from '../components/dashboard/DashboardSummary';
import { mockInvestorAssets } from '../data/dashboardData';
import { useApi } from '@/hooks/useApi';
import { PiWarningCircle } from 'react-icons/pi';



export default function DashboardPage() {

    const { user } = useAuth0();
    const { data: assets, isLoading, error } = useApi<InvestorCreditAsset[]>('/api/investments/me');


    // NOVO: Tratamento de estado de carregamento (loading).
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
                    <Text fontSize="sm" color="gray.400" pt={2}>Detalhes: {error.message}</Text>
                </VStack>
            </Flex>
        )
    }

    return (
        <AuthenticationGuard>
            <Container maxW="container.xl" py={10}>
                <VStack gap={8} align="stretch">
                    {/* Cabeçalho */}
                    <Box>
                        <Heading as="h1" size="xl">
                            Bem-vindo(a), {user?.name || 'Investidor'}!
                        </Heading>
                        <Text color="gray.400" mt={2}>
                            Acompanhe em tempo real a performance dos seus ativos de crédito.
                        </Text>
                    </Box>

                    {/* Sumário */}
                    <DashboardSummary assets={assets || []} />

                    {/* Lista de Ativos */}
                    <Box>
                        <Heading as="h2" size="lg" mb={6}>
                            Meus Créditos
                        </Heading>
                        <VStack gap={6} align="stretch">
                            {assets?.map((asset) => (
                                <CreditAssetCard key={asset.processNumber} asset={asset} />
                            ))}
                        </VStack>
                    </Box>
                </VStack>
            </Container>
        </AuthenticationGuard>
    );
}