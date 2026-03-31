// Caminho: src/app/dashboard/page.tsx

'use client';

import {
    Box, Heading, VStack, Text, Flex, Icon, Spinner, HStack, Button, Table, Tag, Accordion, Badge, Link,
    createListCollection
} from '@chakra-ui/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useState, useEffect } from 'react';
import NextLink from 'next/link';

import { CreditAssetCard } from '../components/dashboard/CreditAssetCard';
import { AssetsToolbar } from '../components/dashboard/AssetsToolbar';
import { AssetsTable } from '../components/dashboard/AssetsTable';
import { EmptyState } from '../components/dashboard/EmptyState';

import { useApi } from '@/hooks/useApi';
import {
    PiScalesDuotone, PiWarningCircle, PiCaretLeftBold, PiCaretRightBold,
    PiFolderOpen, PiArrowRight, PiFilesDuotone, PiGavelDuotone, PiCaretDownBold,
} from 'react-icons/pi';
import { AssetSummary } from '@/types/api';

// ── interfaces de pastas ──────────────────────────────────────────────────────
interface FolderAsset {
    id: string;
    processNumber: string;
    nickname?: string;
    originalCreditor: string;
    currentValue: number;
    status: string;
    legalOneType?: string;
}
interface ProcessFolder {
    id: string;
    folderCode: string;
    description: string;
    totalAcquisition: number;
    totalCurrent: number;
    assets: FolderAsset[];
}
interface PaginatedFoldersResponse {
    items: ProcessFolder[];
    meta: { total: number; page: number; limit: number; totalPages: number };
}

// ── helpers ───────────────────────────────────────────────────────────────────
const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const statusColor = (s: string) => {
    switch (s) {
        case 'Ativo': return 'green';
        case 'Liquidado': return 'gray';
        case 'Em Negociação': return 'yellow';
        case 'PENDING_ENRICHMENT': return 'purple';
        case 'FAILED_ENRICHMENT': return 'red';
        default: return 'blue';
    }
};

// ── sub-componente: linha da tabela dentro do accordion ───────────────────────
const FolderAssetRow = ({ asset }: { asset: FolderAsset }) => (
    <Table.Row _hover={{ bg: 'whiteAlpha.50' }} borderBottom="1px solid" borderColor="gray.800">
        <Table.Cell pl={6}>
            <VStack align="start" gap={1}>
                <Text fontWeight="medium" color="white" fontSize="sm">{asset.processNumber}</Text>
                {asset.nickname && <Text fontSize="xs" color="brand.300">{asset.nickname}</Text>}
            </VStack>
        </Table.Cell>
        <Table.Cell fontSize="sm">{asset.originalCreditor}</Table.Cell>
        <Table.Cell fontSize="sm">{formatBRL(asset.currentValue)}</Table.Cell>
        <Table.Cell>
            <Tag.Root size="sm" variant="solid" colorPalette={statusColor(asset.status)}>
                <Tag.Label>{asset.status}</Tag.Label>
            </Tag.Root>
        </Table.Cell>
        <Table.Cell textAlign="right" pr={6}>
            <Link as={NextLink} href={`/processos/${encodeURIComponent(asset.processNumber)}`}>
                <Button size="xs" variant="solid" colorPalette="blue"><Icon as={PiArrowRight} /></Button>
            </Link>
        </Table.Cell>
    </Table.Row>
);

// ── sub-componente: seção de pastas na home ───────────────────────────────────
function FoldersSection() {
    const { data, isLoading } = useApi<PaginatedFoldersResponse>('/api/assets/folders?page=1&limit=999');
    const folders = data?.items || [];

    if (isLoading) return (
        <Flex justify="center" py={8}><Spinner size="lg" color="brand.500" /></Flex>
    );

    if (folders.length === 0) return null;

    return (
        <Box>
            <Flex align="center" gap={2} mb={4}>
                <Icon as={PiFolderOpen} color="brand.400" boxSize={6} />
                <Heading size="md">Suas Pastas</Heading>
            </Flex>

            <Accordion.Root multiple collapsible variant="enclosed" spaceY={3}>
                {folders.map((folder) => {
                    const lawsuits = folder.assets.filter(a => a.legalOneType?.toLowerCase() === 'lawsuit');
                    const appeals = folder.assets.filter(a => a.legalOneType?.toLowerCase() === 'appeal');
                    const incidents = folder.assets.filter(a => a.legalOneType?.toLowerCase() === 'proceduralissue');
                    const mainList = [
                        ...lawsuits,
                        ...folder.assets.filter(a => !['lawsuit', 'appeal', 'proceduralissue'].includes(a.legalOneType?.toLowerCase() || ''))
                    ];

                    return (
                        <Accordion.Item key={folder.id} value={folder.id} bg="gray.900" border="1px solid" borderColor="gray.700" borderRadius="md" overflow="hidden">
                            <Accordion.ItemTrigger _hover={{ bg: 'gray.800' }} py={4} px={6}>
                                <Flex justify="space-between" w="100%" align="center" gap={4}>
                                    <VStack align="start" gap={0}>
                                        <Text fontWeight="bold" fontSize="md" color="white">{folder.folderCode}</Text>
                                        <Text fontSize="sm" color="gray.400">
                                            {folder.description !== `Pasta ${folder.folderCode}` ? folder.description : 'Caso Judicial'}
                                        </Text>
                                    </VStack>
                                    <HStack gap={6} align="center">
                                        <Flex gap={6} align="center" display={{ base: 'none', md: 'flex' }}>
                                            <VStack align="end" gap={0}>
                                                <Text fontSize="xs" color="gray.500">Processos</Text>
                                                <Badge colorPalette="yellow" variant="solid">{folder.assets.length}</Badge>
                                            </VStack>
                                            <VStack align="end" gap={0}>
                                                <Text fontSize="xs" color="gray.500">Total Atual</Text>
                                                <Text fontWeight="bold" color="brand.400">{formatBRL(folder.totalCurrent)}</Text>
                                            </VStack>
                                        </Flex>
                                        <Accordion.ItemIndicator>
                                            <Icon as={PiCaretDownBold} color="gray.500" />
                                        </Accordion.ItemIndicator>
                                    </HStack>
                                </Flex>
                            </Accordion.ItemTrigger>

                            <Accordion.ItemContent bg="blackAlpha.500" p={0}>
                                <VStack align="stretch" gap={0}>
                                    {mainList.length > 0 && (
                                        <Box>
                                            <HStack bg="blackAlpha.600" px={6} py={2} borderBottom="1px solid" borderColor="gray.800">
                                                <Icon as={PiScalesDuotone} color="brand.400" />
                                                <Text fontSize="xs" fontWeight="bold" color="brand.400" textTransform="uppercase">
                                                    Processos Principais ({mainList.length})
                                                </Text>
                                            </HStack>
                                            <Table.Root size="sm" variant="line">
                                                <Table.Body>{mainList.map(a => <FolderAssetRow key={a.id} asset={a} />)}</Table.Body>
                                            </Table.Root>
                                        </Box>
                                    )}
                                    <Accordion.Root multiple collapsible variant="plain" spaceY={0}>
                                        {appeals.length > 0 && (
                                            <Accordion.Item value="appeals" borderTop="1px solid" borderColor="gray.700">
                                                <Accordion.ItemTrigger px={6} py={3} _hover={{ bg: 'whiteAlpha.100' }}>
                                                    <Flex justify="space-between" w="100%" align="center">
                                                        <HStack gap={2}>
                                                            <Icon as={PiFilesDuotone} color="orange.400" />
                                                            <Text fontSize="xs" fontWeight="bold" color="orange.400" textTransform="uppercase">Recursos ({appeals.length})</Text>
                                                        </HStack>
                                                        <Accordion.ItemIndicator><Icon as={PiCaretDownBold} color="orange.600" boxSize={3} /></Accordion.ItemIndicator>
                                                    </Flex>
                                                </Accordion.ItemTrigger>
                                                <Accordion.ItemContent bg="blackAlpha.400">
                                                    <Table.Root size="sm" variant="line"><Table.Body>{appeals.map(a => <FolderAssetRow key={a.id} asset={a} />)}</Table.Body></Table.Root>
                                                </Accordion.ItemContent>
                                            </Accordion.Item>
                                        )}
                                        {incidents.length > 0 && (
                                            <Accordion.Item value="incidents" borderTop="1px solid" borderColor="gray.700">
                                                <Accordion.ItemTrigger px={6} py={3} _hover={{ bg: 'whiteAlpha.100' }}>
                                                    <Flex justify="space-between" w="100%" align="center">
                                                        <HStack gap={2}>
                                                            <Icon as={PiGavelDuotone} color="purple.400" />
                                                            <Text fontSize="xs" fontWeight="bold" color="purple.400" textTransform="uppercase">Incidentes ({incidents.length})</Text>
                                                        </HStack>
                                                        <Accordion.ItemIndicator><Icon as={PiCaretDownBold} color="purple.600" boxSize={3} /></Accordion.ItemIndicator>
                                                    </Flex>
                                                </Accordion.ItemTrigger>
                                                <Accordion.ItemContent bg="blackAlpha.400">
                                                    <Table.Root size="sm" variant="line"><Table.Body>{incidents.map(a => <FolderAssetRow key={a.id} asset={a} />)}</Table.Body></Table.Root>
                                                </Accordion.ItemContent>
                                            </Accordion.Item>
                                        )}
                                    </Accordion.Root>
                                </VStack>
                            </Accordion.ItemContent>
                        </Accordion.Item>
                    );
                })}
            </Accordion.Root>
        </Box>
    );
}

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