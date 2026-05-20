'use client';

import {
    Heading, Text, Button, Flex, Icon, VStack, SimpleGrid, Stat, Link, Box, Spinner, Avatar, Badge, HStack,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
    PiChartLineUp, PiWallet, PiArrowRight, PiWarningCircle,
    PiHandWavingDuotone, PiFolderOpen, PiUsersThree, PiCurrencyCircleDollar,
} from 'react-icons/pi';
import NextLink from 'next/link';
import { useApi } from '@/hooks/useApi';
import { InvestorCreditAsset } from '../../dashboard/CreditAssetCard';
import { PaginatedFoldersResponse } from '@/types/folders';
import { FoldersSection } from '../../dashboard/FoldersSection';
import { formatCurrency } from '@/utils';

interface MazzotiniUser {
    name: string;
    role: string;
}

interface AssociateProcessRow {
    clientId: string;
    clientName: string;
    clientEmail: string;
    clientPicture: string;
    legalOneId: number;
    processNumber: string;
    nickname: string | null;
    otherParty: string | null;
    currentValue: number;
    status: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    ACTIVE:             { label: 'Ativo',      color: 'green'  },
    PENDING_ENRICHMENT: { label: 'Em análise', color: 'yellow' },
    CLOSED:             { label: 'Encerrado',  color: 'gray'   },
};

export function DashboardOverview() {
    const { data: assets, isLoading: isLoadingAssets, error: assetsError } = useApi<InvestorCreditAsset[]>('/api/investments/me');
    const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useApi<MazzotiniUser>('/api/users/me');
    const { data: foldersData } = useApi<PaginatedFoldersResponse>('/api/assets/folders?page=1&limit=999');

    const isAssociate = userProfile?.role === 'ASSOCIATE';
    const { data: associateRows } = useApi<AssociateProcessRow[]>(isAssociate ? '/api/associate/processes' : null);

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

    // Para associado: agrupa processos por cliente (clientId único)
    const uniqueClients = isAssociate && associateRows
        ? Object.values(
            associateRows.reduce((acc, row) => {
                if (!acc[row.clientId]) acc[row.clientId] = { ...row, processCount: 0 };
                acc[row.clientId].processCount++;
                return acc;
            }, {} as Record<string, AssociateProcessRow & { processCount: number }>)
          )
        : [];

    const totalAssets = isAssociate
        ? uniqueClients.length
        : (assets?.length ?? 0);

    const totalActiveAssets = isAssociate
        ? (associateRows?.filter(a => a.status === 'ACTIVE').length ?? 0)
        : (assets?.filter(a => a.status === 'ACTIVE').length ?? 0);

    const totalInactiveAssets = isAssociate
        ? (associateRows?.filter(a => a.status === 'CLOSED').length ?? 0)
        : (assets?.filter(a => a.status === 'Liquidado').length ?? 0);

    const previewClients = uniqueClients.slice(0, 3);
    const hasMore = uniqueClients.length > 3;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <VStack gap={8} align="start">
                {/* Saudação */}
                <Box>
                    <Flex align="center" gap={2} mb={2}>
                        <PiHandWavingDuotone size={28} color="#B8A76E" />
                        <Heading as="h1" size={{ base: 'lg', md: 'xl' }}>
                            Olá, {userProfile?.name || (isAssociate ? 'Associado' : 'Cliente')}!
                        </Heading>
                    </Flex>
                    <Text fontSize="lg" color="gray.400">Este é o resumo da sua carteira de processos.</Text>
                </Box>

                {/* Cards de Estatísticas */}
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} w="100%">
                    <Stat.Root bg="gray.900" p={5} borderRadius="md">
                        <Stat.Label display="flex" alignItems="center" gap={2} color="gray.400">
                            <Icon as={isAssociate ? PiUsersThree : PiWallet} />
                            {isAssociate ? 'Total de Clientes' : 'Total de Processos'}
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

                {/* CTA documentos financeiros — só para INVESTOR */}
                {!isAssociate && (
                    <Link as={NextLink} href="/meus-documentos" _hover={{ textDecoration: 'none' }} w="100%">
                        {totalAssets === 0 ? (
                            <Flex
                                w="100%" p={4} borderRadius="lg" gap={4} align="center"
                                bg="brand.800"
                                _hover={{ bg: 'brand.700' }} transition="all 0.15s"
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
                                <Button
                                    size="sm" flexShrink={0}
                                    bg="gray.200" color="gray.800"
                                    _hover={{ bg: 'gray.300' }}
                                    fontWeight="bold"
                                    gap={1}
                                >
                                    Enviar documentos <Icon as={PiArrowRight} />
                                </Button>
                            </Flex>
                        ) : (
                            <Flex
                                w="100%" p={4} borderRadius="lg" gap={4} align="center"
                                bg="brand.800"
                                _hover={{ bg: 'brand.700' }} transition="all 0.15s"
                            >
                                <Icon as={PiCurrencyCircleDollar} color="white" boxSize={7} flexShrink={0} />
                                <Box flex={1}>
                                    <Text fontWeight="bold" color="white" mb="2px">
                                        Adquiriu um novo processo?
                                    </Text>
                                    <Text fontSize="sm" color="whiteAlpha.700">
                                        Envie seus documentos financeiros para que nossa equipe possa vinculá-los ao processo.
                                    </Text>
                                </Box>
                                <Button
                                    size="sm" flexShrink={0}
                                    bg="gray.200" color="gray.800"
                                    _hover={{ bg: 'gray.300' }}
                                    fontWeight="bold"
                                    gap={1}
                                >
                                    Enviar documentos <Icon as={PiArrowRight} />
                                </Button>
                            </Flex>
                        )}
                    </Link>
                )}

                <Box h="1px" bg="gray.700" w="100%" />

                {/* Seção principal */}
                <SimpleGrid columns={{ base: 1, lg: 3 }} gap={8} w="100%">
                    <VStack gridColumn={{ lg: 'span 2' }} align="start" gap={4} w="100%">
                        <Flex align="center" gap={2}>
                            <Icon as={isAssociate ? PiUsersThree : PiFolderOpen} color="brand.400" boxSize={5} />
                            <Heading size="lg">{isAssociate ? 'Seus Clientes' : 'Suas Pastas'}</Heading>
                        </Flex>

                        {isAssociate ? (
                            previewClients.length === 0 ? (
                                <Text color="gray.500" fontSize="sm">Nenhum cliente encontrado.</Text>
                            ) : (
                                <VStack align="stretch" gap={3} w="100%">
                                    {previewClients.map(client => {
                                        const st = statusConfig[client.status] ?? { label: client.status, color: 'gray' };
                                        return (
                                            <Link key={client.clientId} as={NextLink} href="/associado" w="100%" display="block" _hover={{ textDecoration: 'none' }}>
                                                <Flex
                                                    w="100%" flexDirection="row" alignItems="center"
                                                    gap={3} px={4} py={3}
                                                    bg="gray.900" borderRadius="lg"
                                                    borderWidth="1px" borderStyle="solid" borderColor="gray.700"
                                                    borderLeftWidth="3px" borderLeftColor={`${st.color}.500`}
                                                    _hover={{ borderColor: 'brand.500', borderLeftColor: `${st.color}.500`, shadow: 'md' }}
                                                    transition="all 0.15s"
                                                >
                                                    <Avatar.Root size="sm" flexShrink={0} bg="brand.700">
                                                        <Avatar.Image src={client.clientPicture} />
                                                        <Avatar.Fallback fontWeight="bold" color="white" fontSize="xs">
                                                            {client.clientName.charAt(0).toUpperCase()}
                                                        </Avatar.Fallback>
                                                    </Avatar.Root>
                                                    <Text flexGrow={1} flexShrink={1} flexBasis={0} minW={0} fontWeight="semibold" fontSize="sm" color="white" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                                                        {client.clientName}
                                                    </Text>
                                                    <Text flexShrink={0} fontSize="sm" fontWeight="bold" color="brand.300" whiteSpace="nowrap" ml="auto">
                                                        {formatCurrency(client.currentValue)}
                                                    </Text>
                                                    <Badge colorPalette={st.color} size="sm" variant="subtle" flexShrink={0}>
                                                        {st.label}
                                                    </Badge>
                                                    <Icon as={PiArrowRight} color="gray.500" boxSize={4} flexShrink={0} />
                                                </Flex>
                                            </Link>
                                        );
                                    })}
                                    {hasMore && (
                                        <Link as={NextLink} href="/associado" _hover={{ textDecoration: 'none' }}>
                                            <Flex align="center" justify="center" gap={2} py={2}
                                                color="brand.400" fontSize="sm" fontWeight="medium"
                                                _hover={{ color: 'brand.300' }} cursor="pointer">
                                                Ver mais {uniqueClients.length - 3} cliente(s)
                                                <Icon as={PiArrowRight} boxSize={4} />
                                            </Flex>
                                        </Link>
                                    )}
                                </VStack>
                            )
                        ) : (
                            <FoldersSection foldersData={foldersData} />
                        )}
                    </VStack>

                    <VStack align="start" gap={4} w="100%">
                        <Heading size="lg">Ações Rápidas</Heading>
                        <VStack w="100%" gap={3}>
                            <Link as={NextLink} href={isAssociate ? '/associado' : '/processos'} w="100%" _hover={{ textDecoration: 'none' }}>
                                <Button bgColor="brand.700" _hover={{ bgColor: 'brand.800', transition: '300ms' }} color="white" w="100%" size="lg" gap={2}>
                                    {isAssociate ? <><PiUsersThree /> Ver Todos os Clientes</> : <><PiWallet /> Ver Todos os Processos</>}
                                </Button>
                            </Link>
                        </VStack>
                    </VStack>
                </SimpleGrid>
            </VStack>
        </motion.div>
    );
}
