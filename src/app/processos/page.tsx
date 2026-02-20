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
    Tag
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useAuth0 } from '@auth0/auth0-react';
import { useState, useMemo } from 'react';

import { AssetsToolbar } from '../components/dashboard/AssetsToolbar';
import { EmptyState } from '../components/dashboard/EmptyState';

import { useApi } from '@/hooks/useApi';
import { PiWarningCircle, PiPlusCircle, PiPresentationChartDuotone } from 'react-icons/pi';
import { AssetSummary } from '@/types/api';

// Funções auxiliares
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const translateStatus = (status: string) => {
    switch (status) {
        case 'Ativo':
            return 'Ativo';
        case 'Liquidado':
            return 'Liquidado';
        case 'Em Negociação':
            return 'Em Negociação';
        case 'PENDING_ENRICHMENT':
            return 'Aguardando Legal One';
        case 'FAILED_ENRICHMENT':
            return 'Falha no Legal One';
        default:
            // Fallback: tenta humanizar chaves como SOME_STATUS -> "Some Status"
            return status
                .toString()
                .replace(/_/g, ' ')
                .toLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase());
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
    const { data: assets, isLoading, error } = useApi<AssetSummary[]>('/api/assets');

    // Estados de filtro e busca
    const [filterStatus, setFilterStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredAssets = useMemo(() => {
        if (!assets) return [];
        return assets
            .filter(asset => filterStatus ? asset.status === filterStatus : true)
            .filter(asset =>
                asset.processNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                asset.originalCreditor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (asset.mainInvestorName && asset.mainInvestorName.toLowerCase().includes(searchQuery.toLowerCase()))
            );
    }, [assets, filterStatus, searchQuery]);


    if (isLoading) {
        return (
            <Flex w="100%" flex={1} justify="center" align="center">
                <VStack gap={4}>
                    <Spinner size="xl" color="#9E905A" />
                    <Text>Carregando todos os processos...</Text>
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
                    <Text>Não foi possível carregar os processos. Verifique se tem permissão de Operador.</Text>
                </VStack>
            </Flex>
        )
    }

    if (!assets || assets.length === 0) {
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
                        <Button bgColor={'brand.600'} color={'white'} _hover={{bgColor:'brand.700', color:'white'}} gap={2}>
                            <Icon as={PiPlusCircle} boxSize={5} />
                            Registrar Novo Processo
                        </Button>
                    </Link>
                </Flex>

                <Box>
                    {/* ============================================================ */}
                    {/* A CORREÇÃO ESTÁ AQUI                                       */}
                    {/* Removemos o .map() e passamos 'assets' (a lista completa) */}
                    {/* diretamente para o Toolbar, assim como a pág. do Dashboard. */}
                    {/* ============================================================ */}
                    <AssetsToolbar
                        assets={assets}
                        viewMode={'list'}
                        onViewChange={() => { }} // Não permite mudar a visão para o operador
                        onFilterChange={setFilterStatus}
                        onSearch={setSearchQuery}
                    />

                    {filteredAssets.length > 0 ? (
                        <Table.Root variant={'line'} size={'md'} bgColor={'bodyBg'} >
                            <Table.Header border={'1px solid transparent'}>
                                <Table.Row borderBottom={'1px solid'} borderColor={'gray.700'} bgColor={tableBgColor}>
                                    <Table.ColumnHeader color={'brand.600'} borderColor={'bodyBg'} bgColor={tableBgColor} p={8} borderTopLeftRadius={8}>Nº do Processo</Table.ColumnHeader>
                                    <Table.ColumnHeader color={'brand.600'} borderColor={'bodyBg'} bgColor={tableBgColor} p={8} >Cliente Principal</Table.ColumnHeader>
                                    <Table.ColumnHeader color={'brand.600'} borderColor={'bodyBg'} bgColor={tableBgColor} p={8} >Credor</Table.ColumnHeader>
                                    {/* ATUALIZADO: Agora mostra o Custo de Aquisição (total), que vem do 'investedValue' do Admin */}
                                    {/* <Table.ColumnHeader color={'brand.600'} borderColor={'bodyBg'} bgColor={tableBgColor} p={8} >Custo de Aquisição</Table.ColumnHeader> */}
                                    <Table.ColumnHeader color={'brand.600'} borderColor={'bodyBg'} bgColor={tableBgColor} p={8} >Estimativa Atual do Valor Total do Crédito</Table.ColumnHeader>
                                    <Table.ColumnHeader color={'brand.600'} borderColor={'bodyBg'} bgColor={tableBgColor} p={8} borderTopRightRadius={8}>Status</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body alignItems={'center'} justifyContent={'center'} border={'1px solid'} borderColor={'bodyBg'} bgColor={tableBgColor}>
                                {filteredAssets.map((asset) => (
                                    <Table.Row key={asset.id} cursor={'pointer'} _hover={{ color: 'brand.600' }} bgColor={tableBgColor} onClick={() => window.location.href = `/processos/${encodeURIComponent(asset.processNumber)}`} color={'textPrimary'}>
                                        <Table.Cell px={8} py={4} border={'1px solid'} borderColor={tableBgColor} fontWeight="semibold">{asset.processNumber}</Table.Cell>
                                        <Table.Cell px={8} py={4} border={'1px solid'} borderColor={tableBgColor}>{asset.mainInvestorName}</Table.Cell>
                                        <Table.Cell px={8} py={4} border={'1px solid'} borderColor={tableBgColor}>{asset.originalCreditor}</Table.Cell>
                                        {/* ATUALIZADO: Mostra 'investedValue' (que agora é o Custo de Aquisição total vindo da API) */}
                                        {/* <Table.Cell px={8} py={4} border={'1px solid'} borderColor={tableBgColor}>{formatCurrency(asset.investedValue)}</Table.Cell> */}
                                        <Table.Cell px={8} py={4} border={'1px solid'} borderColor={tableBgColor}>{formatCurrency(asset.currentValue)}</Table.Cell>
                                        <Table.Cell px={8} py={4} border={'1px solid'} borderColor={tableBgColor}>
                                            <Tag.Root variant="subtle" colorPalette={getStatusColorScheme(asset.status)}>
                                                <Tag.Label>{translateStatus(asset.status)}</Tag.Label>
                                            </Tag.Root>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    ) : (
                        <Flex justify="center" p={10} bg="gray.900" borderRadius="md">
                            <Text>Nenhum processo encontrado com os filtros aplicados.</Text>
                        </Flex>
                    )}
                </Box>
            </VStack>
        </Flex>
    );
}