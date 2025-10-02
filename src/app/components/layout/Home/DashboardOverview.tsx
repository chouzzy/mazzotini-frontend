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
import { useAuth0 } from '@auth0/auth0-react';
import { motion } from 'framer-motion';
import {
    PiChartLineUp,
    PiWallet,
    PiArrowRight,
    PiPlusCircle,
    PiWhatsappLogo,
    PiWarningCircle,
} from 'react-icons/pi';
import NextLink from 'next/link';

// Importe o seu hook de API e as tipagens
import { useApi } from '@/hooks/useApi';
import { InvestorCreditAsset } from '../../dashboard/CreditAssetCard';
import { whatsappLink } from '@/utils';

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
            bg="gray.700"
            borderRadius="md"
            _hover={{ bg: 'gray.600' }}
        >
            {/* CORREÇÃO: 'spacing' trocado por 'gap' */}
            <VStack align="start" gap={0}>
                <Text fontWeight="bold">{asset.processNumber}</Text>
                <Text fontSize="sm" color="gray.400">
                    Adquirido em: {new Date(asset.acquisitionDate).toLocaleDateString('pt-BR')}
                </Text>
            </VStack>
            {/* CORREÇÃO: A sintaxe Link as NextLink é a correta para navegação interna */}
            <Link as={NextLink} href={`/ativos/${asset.processNumber}`} _hover={{ textDecoration: 'none' }}>
                <Button size="sm" _hover={{ bg: 'brand.600' }} >
                    Ver Detalhes <Icon as={PiArrowRight} ml={2} />
                </Button>
            </Link>
        </Flex>
    );
}

// Componente principal do Overview do Dashboard
export function DashboardOverview() {
    const { user } = useAuth0();
    const { data: assets, isLoading, error } = useApi<InvestorCreditAsset[]>('/api/investments/me');

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
    const totalInvested = assets?.reduce((sum, asset) => sum + asset.investedValue, 0) || 0;
    const totalCurrentValue = assets?.reduce((sum, asset) => sum + asset.currentValue, 0) || 0;
    const totalYield = totalCurrentValue - totalInvested;
    const yieldPercentage = totalInvested > 0 ? (totalYield / totalInvested) * 100 : 0;

    // Pega os 3 ativos mais recentes
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
                {/* Saudação */}
                <Box>
                    <Heading as="h1" size={{ base: 'lg', md: 'xl' }}>
                        Olá, {user?.given_name || user?.name}!
                    </Heading>
                    <Text fontSize={{ base: 'lg', md: 'lg' }} color="gray.400">
                        Este é o resumo da sua carteira de investimentos.
                    </Text>
                </Box>

                {/* Cards de Estatísticas */}
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} w="100%">
                    <Stat.Root bg="gray.900" p={5} borderRadius="md">
                        <Stat.Label display="flex" alignItems="center" gap={2} color="gray.400">
                            <Icon as={PiWallet} /> Ativos na Carteira
                        </Stat.Label>
                        <Stat.ValueText fontSize="3xl">{totalAssets}</Stat.ValueText>
                    </Stat.Root>
                    <Stat.Root bg="gray.900" p={5} borderRadius="md">
                        <Stat.Label display="flex" alignItems="center" gap={2} color="gray.400">
                            <Icon as={PiChartLineUp} /> Rendimento Acumulado
                        </Stat.Label>
                        <Stat.ValueText fontSize="3xl" color="green.400">
                            {formatCurrency(totalYield)}
                        </Stat.ValueText>
                    </Stat.Root>
                    <Stat.Root bg="gray.900" p={5} borderRadius="md">
                        <Stat.Label display="flex" alignItems="center" gap={2} color="gray.400">
                            <Icon as={PiArrowRight} /> Rentabilidade Média
                        </Stat.Label>
                        <Stat.ValueText fontSize="3xl">{yieldPercentage.toFixed(2)}%</Stat.ValueText>
                    </Stat.Root>
                </SimpleGrid>

                {/* CORREÇÃO: O componente Divider foi substituído por um Box estilizado */}
                <Box h="1px" bg="gray.700" w="100%" />

                {/* Seção Principal com Ativos Recentes e Ações Rápidas */}
                <SimpleGrid columns={{ base: 1, lg: 3 }} gap={8} w="100%">
                    {/* Coluna da Esquerda: Ativos Recentes */}
                    <VStack
                        gridColumn={{ lg: 'span 2' }}
                        align="start"
                        gap={4}
                        w="100%"
                    >
                        <Heading size="lg">Ativos Adquiridos Recentemente</Heading>
                        {recentAssets && recentAssets.length > 0 ? (
                            <VStack w="100%" gap={3}>
                                {recentAssets.map((asset) => (
                                    <RecentAssetItem key={asset.processNumber} asset={asset} />
                                ))}
                            </VStack>
                        ) : (
                            <Text color="gray.500">Nenhum ativo recente para exibir.</Text>
                        )}
                    </VStack>

                    {/* Coluna da Direita: Ações Rápidas */}
                    <VStack align="start" gap={4} w="100%">
                        <Heading size="lg">Ações Rápidas</Heading>
                        <VStack w="100%" gap={3}>
                            {/* CORREÇÃO: Botões de navegação agora usam o padrão Link > Button */}
                            <Link as={NextLink} href="/ativos" w="100%" _hover={{ textDecoration: 'none' }}>
                                <Button w="100%" size="lg">
                                    <PiWallet />
                                    Ver Todos os Ativos
                                </Button>
                            </Link>
                            <Link as={NextLink} href="/ativos/novo" w="100%" _hover={{ textDecoration: 'none' }}>
                                <Button w="100%" size="lg" >
                                    <PiPlusCircle />
                                    Registrar Novo Ativo
                                </Button>
                            </Link>
                            {/* CORREÇÃO: Botão de link externo agora usa a tag 'a' diretamente */}
                            <Button as="a" onClick={() => window.open(whatsappLink())} w="100%" size="lg" variant="ghost" >
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
