'use client';
// /src/app/ativos/page.tsx

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
import { PiWarningCircle, PiPlusCircle } from 'react-icons/pi';

// Tipagem para os dados que o endpoint GET /api/assets retorna
export interface OperatorAsset {
    id: string;
    processNumber: string;
    originalCreditor: string;
    currentValue: number;
    status: string;
    acquisitionDate: Date;
    mainInvestorName: string | null;
}

// Funções auxiliares
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
    // ATENÇÃO: Chamando o novo endpoint para TODOS os ativos
    const { data: assets, isLoading, error } = useApi<OperatorAsset[]>('/api/assets');

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
                asset.mainInvestorName?.toLowerCase().includes(searchQuery.toLowerCase())
            );
    }, [assets, filterStatus, searchQuery]);

    if (isLoading) {
        return (
            <Flex w="100%" flex={1} justify="center" align="center">
                <VStack gap={4}>
                    <Spinner size="xl" color="blue.500" />
                    <Text>A carregar todos os ativos...</Text>
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
                    <Text>Não foi possível carregar os ativos. Verifique se tem permissão de Operador.</Text>
                </VStack>
            </Flex>
        )
    }

    if (!assets || assets.length === 0) {
        return <EmptyState
            title="Nenhum Ativo Registado"
            description="Ainda não há nenhum ativo de crédito no sistema. Comece por registar o primeiro."
            buttonLabel="Registar Primeiro Ativo"
            buttonHref="/ativos/novo"
         />;
    }

    return (
        <Flex w='100%'>
            <VStack gap={8} align="stretch" w="100%">
                <Flex justify="space-between" align="center" direction={{base: 'column', md: 'row'}} gap={4}>
                    <Box>
                        <Heading as="h1" size="xl">Gestão de Ativos</Heading>
                        <Text color="gray.400" mt={2}>
                            Visualize, pesquise e gira todos os ativos de crédito da plataforma.
                        </Text>
                    </Box>
                    <Link as={NextLink} href="/ativos/novo" _hover={{textDecoration: 'none'}}>
                        <Button colorPalette="blue" gap={2}>
                            <Icon as={PiPlusCircle} boxSize={5} />
                            Registar Novo Ativo
                        </Button>
                    </Link>
                </Flex>
                
                <Box>
                    <AssetsToolbar
                        assets={assets.map(a => ({...a, status: a.status as any, processNumber: a.processNumber, originalCreditor: a.originalCreditor, investedValue: a.currentValue, currentValue: a.currentValue, acquisitionDate: a.acquisitionDate, investorShare: 0, updateIndexType: '' }))}
                        viewMode={'list'}
                        onViewChange={() => {}} // Não permite mudar a visão para o operador
                        onFilterChange={setFilterStatus}
                        onSearch={setSearchQuery}
                    />

                    {filteredAssets.length > 0 ? (
                        <Table.Root variant="line">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader>Nº do Processo</Table.ColumnHeader>
                                    <Table.ColumnHeader>Investidor Principal</Table.ColumnHeader>
                                    <Table.ColumnHeader>Credor Original</Table.ColumnHeader>
                                    <Table.ColumnHeader>Valor Atual</Table.ColumnHeader>
                                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {filteredAssets.map((asset) => (
                                    <Table.Row key={asset.id} _hover={{ bg: 'gray.700', cursor: 'pointer' }} onClick={() => window.location.href = `/ativos/${encodeURIComponent(asset.processNumber)}`}>
                                        <Table.Cell fontWeight="medium">{asset.processNumber}</Table.Cell>
                                        <Table.Cell>{asset.mainInvestorName}</Table.Cell>
                                        <Table.Cell>{asset.originalCreditor}</Table.Cell>
                                        <Table.Cell>{formatCurrency(asset.currentValue)}</Table.Cell>
                                        <Table.Cell>
                                            <Tag.Root variant="subtle" colorScheme={getStatusColorScheme(asset.status)}>
                                                <Tag.Label>{asset.status}</Tag.Label>
                                            </Tag.Root>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
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

