// /src/app/components/dashboard/DashboardOverview.tsx
'use client';

import {
    Heading,
    Text,
    Button,
    Flex,
    Icon,
    VStack,
    SimpleGrid,
    Stat,
    Link,
    Box,
    Spinner,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
    PiChartLineUp,
    PiWallet,
    PiArrowRight,
    PiPlusCircle,
    PiWhatsappLogo,
    PiWarningCircle,
    PiHandWavingDuotone,
} from 'react-icons/pi';
import NextLink from 'next/link';
import { useApi } from '@/hooks/useApi';
import { InvestorCreditAsset } from '../../dashboard/CreditAssetCard';
import { whatsappLink } from '@/utils';

// NOVA INTERFACE: Para os dados do perfil do utilizador vindos do nosso backend
interface MazzotiniUser {
    name: string;
    // ... outros campos que possamos querer usar no futuro
}

// Função auxiliar para formatar valores monetários
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

// Componente para exibir um item na lista de ativos recentes
function RecentAssetItem({ asset }: { asset: InvestorCreditAsset }) {
    return (
        <Flex
            justify="space-between"
            align="center"
            w="100%"
            p={4}
            bg="gray.900"
            borderRadius="md"
            _hover={{ bg: 'gray.700' }}
        >
            <VStack align="start" gap={0}>
                <Text fontWeight="bold">{asset.processNumber}</Text>
                <Text fontSize="sm" color="gray.400">
                    Data da Contratação: {new Date(asset.acquisitionDate).toLocaleDateString('pt-BR')}
                </Text>
            </VStack>
            <Link as={NextLink} href={`/processos/${asset.processNumber}`} _hover={{ textDecoration: 'none' }}>
                <Button size="sm" _hover={{ bg: 'brand.600' }} bgColor={'gray.500'} color={'white'}>
                    Ver Detalhes <Icon as={PiArrowRight} ml={2} />
                </Button>
            </Link>
        </Flex>
    );
}

// Componente principal do Overview do Dashboard
export function DashboardOverview() {
    // Faz as duas chamadas de API em paralelo
    const { data: assets, isLoading: isLoadingAssets, error: assetsError } = useApi<InvestorCreditAsset[]>('/api/investments/me');
    const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useApi<MazzotiniUser>('/api/users/me');

    // Combina os estados de carregamento e erro
    const isLoading = isLoadingAssets || isProfileLoading;
    const error = assetsError || profileError;

    // Estado de Carregamento
    if (isLoading) {
        return (
            <Flex justify="center" align="center" h="50vh">
                <Spinner size="xl" />
            </Flex>
        );
    }

    // Estado de Erro
    if (error) {
        return (
            <VStack bg="red.900" p={8} borderRadius="md" borderWidth="1px" borderColor="red.400">
                <Icon as={PiWarningCircle} boxSize={10} color="red.300" />
                <Heading size="md">Ocorreu um Erro</Heading>
                <Text>Não foi possível carregar os dados da sua carteira.</Text>
            </VStack>
        );
    }

    // Cálculos das estatísticas
    const totalAssets = assets?.length || 0;
    const totalActiveAssets = assets?.filter(asset => asset.status === 'ACTIVE').length || 0;
    const totalInactiveAssets = assets?.filter(asset => asset.status == 'Liquidado').length || 0;
    const totalInvested = assets?.reduce((sum, asset) => sum + asset.investedValue, 0) || 0;
    const totalCurrentValue = assets?.reduce((sum, asset) => sum + asset.currentValue, 0) || 0;
    const totalYield = totalCurrentValue - totalInvested;
    const yieldPercentage = totalInvested > 0 ? (totalYield / totalInvested) * 100 : 0;

    const recentAssets = assets
        ?.sort((a, b) => new Date(b.acquisitionDate).getTime() - new Date(a.acquisitionDate).getTime())
        .slice(0, 3);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <VStack gap={8} align="start">
                {/* Saudação com o nome vindo do nosso backend */}
                <Box>
                    <Flex align="center" gap={2} mb={2}>
                        <PiHandWavingDuotone size={28} color='#B8A76E' />
                        <Heading as="h1" size={{ base: 'lg', md: 'xl' }}>
                            Olá, {userProfile?.name || 'Investidor'}!
                        </Heading>
                    </Flex>
                    <Text fontSize={{ base: 'lg', md: 'lg' }} color="gray.400">
                        Este é o resumo da sua carteira de processos.
                    </Text>
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
                        <Stat.ValueText fontSize="3xl" color="green.400">
                            {totalActiveAssets}
                        </Stat.ValueText>
                    </Stat.Root>
                    <Stat.Root bg="gray.900" p={5} borderRadius="md">
                        <Stat.Label display="flex" alignItems="center" gap={2} color="gray.400">
                            <Icon as={PiArrowRight} /> Processos Encerrados
                        </Stat.Label>
                        <Stat.ValueText fontSize="3xl">{totalInactiveAssets}</Stat.ValueText>
                    </Stat.Root>
                </SimpleGrid>

                <Box h="1px" bg="gray.700" w="100%" />

                {/* Seção Principal com Processos Recentes e Ações Rápidas */}
                <SimpleGrid columns={{ base: 1, lg: 3 }} gap={8} w="100%">
                    <VStack
                        gridColumn={{ lg: 'span 2' }}
                        align="start"
                        gap={4}
                        w="100%"
                    >
                        <Heading size="lg">Meus Processos</Heading>
                        {recentAssets && recentAssets.length > 0 ? (
                            <VStack w="100%" gap={3}>
                                {recentAssets.map((asset) => (
                                    <RecentAssetItem key={asset.processNumber} asset={asset} />
                                ))}
                            </VStack>
                        ) : (
                            <Text color="gray.500">Nenhum processo recente para exibir.</Text>
                        )}
                    </VStack>

                    <VStack align="start" gap={4} w="100%">
                        <Heading size="lg">Ações Rápidas</Heading>
                        <VStack w="100%" gap={3}>
                            <Link as={NextLink} href="/processos" w="100%" _hover={{ textDecoration: 'none' }}>
                                <Button bgColor={'brand.700'} _hover={{ bgColor: 'brand.800', transition: '300ms' }} color={'white'} w="100%" size="lg" gap={2}>
                                    <PiWallet />
                                    Ver Todos os Processos
                                </Button>
                            </Link>
                            <Link as={NextLink} href="/processos/novo" w="100%" _hover={{ textDecoration: 'none' }}>
                                <Button bgColor={'brand.700'} _hover={{ bgColor: 'brand.800', transition: '300ms' }} color={'white'} w="100%" size="lg" gap={2}>
                                    <PiPlusCircle />
                                    Registrar Novo Processo
                                </Button>
                            </Link>
                            <Button bgColor={'gray.900'} _hover={{ bgColor: 'gray.950', transition: '300ms' }} color={'whatsapp'} as="a" onClick={() => window.open(whatsappLink())} w="100%" size="lg" variant="ghost" gap={2}>
                                <PiWhatsappLogo />
                                Falar com Suporte
                            </Button>
                        </VStack>
                    </VStack>
                </SimpleGrid>
            </VStack>
        </motion.div>
    );
}
