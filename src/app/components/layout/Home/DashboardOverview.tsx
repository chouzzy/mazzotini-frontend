'use client';

import {
    Heading, Text, Button, Flex, Icon, VStack, SimpleGrid, Stat, Link, Box, Spinner,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
    PiChartLineUp, PiWallet, PiArrowRight, PiWhatsappLogo, PiWarningCircle,
    PiHandWavingDuotone, PiFolderOpen,
} from 'react-icons/pi';
import NextLink from 'next/link';
import { useApi } from '@/hooks/useApi';
import { InvestorCreditAsset } from '../../dashboard/CreditAssetCard';
import { whatsappLink } from '@/utils';
import { PaginatedFoldersResponse } from '@/types/folders';
import { FoldersSection } from '../../dashboard/FoldersSection';

interface MazzotiniUser {
    name: string;
}

export function DashboardOverview() {
    const { data: assets, isLoading: isLoadingAssets, error: assetsError } = useApi<InvestorCreditAsset[]>('/api/investments/me');
    const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useApi<MazzotiniUser>('/api/users/me');
    const { data: foldersData } = useApi<PaginatedFoldersResponse>('/api/assets/folders?page=1&limit=999');

    const isLoading = isLoadingAssets || isProfileLoading;
    const error = assetsError || profileError;

    if (isLoading) {
        return (
            <Flex justify="center" align="center" h="50vh">
                <Spinner size="xl" />
            </Flex>
        );
    }

    if (error) {
        return (
            <VStack bg="red.900" p={8} borderRadius="md" borderWidth="1px" borderColor="red.400">
                <Icon as={PiWarningCircle} boxSize={10} color="red.300" />
                <Heading size="md">Ocorreu um Erro</Heading>
                <Text>Não foi possível carregar os dados da sua carteira.</Text>
            </VStack>
        );
    }

    const totalAssets = foldersData?.meta?.total ?? assets?.length ?? 0;
    const totalActiveAssets = assets?.filter(a => a.status === 'ACTIVE').length || 0;
    const totalInactiveAssets = assets?.filter(a => a.status === 'Liquidado').length || 0;

    const recentAssets = assets
        ?.sort((a, b) => new Date(b.acquisitionDate).getTime() - new Date(a.acquisitionDate).getTime())
        .slice(0, 3);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <VStack gap={8} align="start">
                {/* Saudação */}
                <Box>
                    <Flex align="center" gap={2} mb={2}>
                        <PiHandWavingDuotone size={28} color="#B8A76E" />
                        <Heading as="h1" size={{ base: 'lg', md: 'xl' }}>
                            Olá, {userProfile?.name || 'Investidor'}!
                        </Heading>
                    </Flex>
                    <Text fontSize="lg" color="gray.400">Este é o resumo da sua carteira de processos.</Text>
                </Box>

                {/* Cards de Estatísticas */}
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} w="100%">
                    <Stat.Root bg="gray.900" p={5} borderRadius="md">
                        <Stat.Label display="flex" alignItems="center" gap={2} color="gray.400">
                            <Icon as={PiWallet} /> Total de Processos
                        </Stat.Label>
                        <Stat.ValueText fontSize="3xl">{totalAssets}</Stat.ValueText>
                    </Stat.Root>
                    <Stat.Root bg="gray.900" p={5} borderRadius="md">
                        <Stat.Label display="flex" alignItems="center" gap={2} color="gray.400">
                            <Icon as={PiChartLineUp} /> Processos Ativos
                        </Stat.Label>
                        <Stat.ValueText fontSize="3xl" color="green.400">{totalActiveAssets}</Stat.ValueText>
                    </Stat.Root>
                    <Stat.Root bg="gray.900" p={5} borderRadius="md">
                        <Stat.Label display="flex" alignItems="center" gap={2} color="gray.400">
                            <Icon as={PiArrowRight} /> Processos Encerrados
                        </Stat.Label>
                        <Stat.ValueText fontSize="3xl">{totalInactiveAssets}</Stat.ValueText>
                    </Stat.Root>
                </SimpleGrid>

                <Box h="1px" bg="gray.700" w="100%" />

                {/* Seção principal: Pastas + Ações Rápidas */}
                <SimpleGrid columns={{ base: 1, lg: 3 }} gap={8} w="100%">
                    <VStack gridColumn={{ lg: 'span 2' }} align="start" gap={4} w="100%">
                        <Flex align="center" gap={2}>
                            <Icon as={PiFolderOpen} color="brand.400" boxSize={5} />
                            <Heading size="lg">Suas Pastas</Heading>
                        </Flex>
                        <FoldersSection foldersData={foldersData} />
                    </VStack>

                    <VStack align="start" gap={4} w="100%">
                        <Heading size="lg">Ações Rápidas</Heading>
                        <VStack w="100%" gap={3}>
                            <Link as={NextLink} href="/processos" w="100%" _hover={{ textDecoration: 'none' }}>
                                <Button bgColor="brand.700" _hover={{ bgColor: 'brand.800', transition: '300ms' }} color="white" w="100%" size="lg" gap={2}>
                                    <PiWallet /> Ver Todos os Processos
                                </Button>
                            </Link>
                            <Button
                                bgColor="gray.900" _hover={{ bgColor: 'gray.950', transition: '300ms' }}
                                color="whatsapp" as="a" onClick={() => window.open(whatsappLink())}
                                w="100%" size="lg" variant="ghost" gap={2}
                            >
                                <PiWhatsappLogo /> Falar com Suporte
                            </Button>
                        </VStack>
                    </VStack>
                </SimpleGrid>
            </VStack>
        </motion.div>
    );
}
