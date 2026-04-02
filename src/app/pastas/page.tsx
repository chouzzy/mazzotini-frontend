'use client';

import {
    Box, Heading, VStack, Text, Flex, Icon, Spinner, Button, Link, Table, Tag, Accordion, Badge, Input, HStack
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useApi } from '@/hooks/useApi';
import {
    PiWarningCircle,
    PiFolderOpen,
    PiArrowRight,
    PiFilesDuotone,
    PiScalesDuotone,
    PiGavelDuotone,
    PiCaretDownBold,
    PiCaretLeftBold,
    PiCaretRightBold
} from 'react-icons/pi';
import { useState, useEffect } from 'react';
import { AuthenticationGuard } from '../components/auth/AuthenticationGuard';

interface AssetSummary {
    id: string;
    legalOneId: number;
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
    assets: AssetSummary[];
}

interface PaginatedFoldersResponse {
    items: ProcessFolder[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

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

const AssetTableRow = ({ asset }: { asset: AssetSummary }) => (
    <Table.Row key={asset.id} _hover={{ bg: 'whiteAlpha.50' }} borderBottom="1px solid" borderColor="gray.800">
        <Table.Cell pl={6}>
            <VStack align="start" gap={1}>
                <Text fontWeight="medium" color="white" fontSize="sm">{asset.processNumber}</Text>
                {asset.nickname && <Text fontSize="xs" color="brand.300">{asset.nickname}</Text>}
            </VStack>
        </Table.Cell>
        <Table.Cell fontSize="sm">{asset.originalCreditor}</Table.Cell>
        <Table.Cell fontSize="sm">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.currentValue)}
        </Table.Cell>
        <Table.Cell>
            <Tag.Root size="sm" variant="solid" colorPalette={getStatusColorScheme(asset.status)}>
                <Tag.Label>{asset.status}</Tag.Label>
            </Tag.Root>
        </Table.Cell>
        <Table.Cell textAlign="right" pr={6}>
            <Link as={NextLink} href={`/processos/${asset.legalOneId}`}>
                <Button size="xs" variant="solid" colorPalette="blue"><Icon as={PiArrowRight} /></Button>
            </Link>
        </Table.Cell>
    </Table.Row>
);

export default function FoldersPage() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState(''); // <-- ESTADO DO DEBOUNCE
    const limit = 10;

    // EFEITO DE DEBOUNCE: Aguarda 300ms após parar de escrever para atualizar a busca
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Volta à pág 1 ao pesquisar
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // A API agora consome a pesquisa com debounce
    const { data, isLoading, error } = useApi<PaginatedFoldersResponse>(
        `/api/assets/folders?page=${page}&limit=${limit}&search=${debouncedSearch}`
    );

    if (error) return (
        <Flex w="100%" justify="center" p={8}>
            <VStack bg="red.900/20" p={6} borderRadius="md" border="1px solid" borderColor="red.500">
                <Icon as={PiWarningCircle} boxSize={10} color="red.300" /><Text>Erro ao carregar as pastas do servidor.</Text>
            </VStack>
        </Flex>
    );

    const folders = data?.items || [];
    const meta = data?.meta;

    return (
        <AuthenticationGuard>
            <VStack gap={8} align="stretch" w="100%" p={{ base: 4, md: 8 }}>

                {/* CABEÇALHO E PESQUISA SEMPRE VISÍVEIS */}
                <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                    <Box>
                        <Flex align="center" gap={2}>
                            <Icon as={PiFolderOpen} color="brand.400" boxSize={8} />
                            <Heading as="h1" size="xl">Gestão de Pastas</Heading>
                        </Flex>
                        <Text color="gray.400" mt={1}>Visualização agrupada por casos jurídicos.</Text>
                    </Box>
                    <Box w={{ base: "100%", md: "300px" }}>
                        <Input
                            placeholder="Buscar pasta ou processo..."
                            bgColor="gray.800"
                            borderColor="gray.700"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </Box>
                </Flex>

                {/* ÁREA DOS DADOS (COM LOADING ISOLADO) */}
                <Box position="relative" minH="200px">
                    {/* OVERLAY DE LOADING */}
                    {isLoading && (
                        <Flex position="absolute" top={0} left={0} right={0} bottom={0} bg="blackAlpha.600" zIndex={2} justify="center" align="center" borderRadius="md">
                            <Spinner size="xl" color="brand.500" />
                        </Flex>
                    )}

                    {folders.length === 0 && !isLoading ? (
                        <Flex justify="center" p={10} bg="gray.900" borderRadius="md"><Text color="gray.500">Nenhuma pasta encontrada.</Text></Flex>
                    ) : (
                        <Box opacity={isLoading ? 0.5 : 1} transition="opacity 0.2s">
                            <Accordion.Root multiple collapsible variant="enclosed" spaceY={4} >
                                {folders.map((folder) => {
                                    const lawsuits = folder.assets.filter(a => a.legalOneType?.toLowerCase() === 'lawsuit');
                                    const appeals = folder.assets.filter(a => a.legalOneType?.toLowerCase() === 'appeal');
                                    const incidents = folder.assets.filter(a => a.legalOneType?.toLowerCase() === 'proceduralissue');
                                    const mainList = [...lawsuits, ...folder.assets.filter(a => !['lawsuit', 'appeal', 'proceduralissue'].includes(a.legalOneType?.toLowerCase() || ''))];

                                    return (
                                        <Accordion.Item key={folder.id} value={folder.id} bg="gray.900" border="1px solid" borderColor="gray.700" borderRadius="md" overflow="hidden">
                                            <Accordion.ItemTrigger _hover={{ bg: 'gray.800' }} py={4} px={6}>
                                                <Flex justify="space-between" w="100%" align="center" gap={4}>
                                                    <VStack align="start" gap={0}>
                                                        <Text fontWeight="bold" fontSize="lg" color="white">{folder.folderCode}</Text>
                                                        <Text fontSize="sm" color="gray.400">{folder.description !== `Pasta ${folder.folderCode}` ? folder.description : 'Caso Judicial'}</Text>
                                                    </VStack>

                                                    <HStack gap={8} align="center">
                                                        <Flex gap={8} align="center" display={{ base: 'none', md: 'flex' }}>
                                                            <VStack align="end" gap={0}>
                                                                <Text fontSize="xs" color="gray.500">Processos</Text>
                                                                <Badge colorPalette="yellow" variant="solid">{folder.assets.length}</Badge>
                                                            </VStack>
                                                            <VStack align="end" gap={0}>
                                                                <Text fontSize="xs" color="gray.500">Total Atual</Text>
                                                                <Text fontWeight="bold" color="brand.400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(folder.totalCurrent)}</Text>
                                                            </VStack>
                                                        </Flex>
                                                        <Accordion.ItemIndicator><Icon as={PiCaretDownBold} color="gray.500" /></Accordion.ItemIndicator>
                                                    </HStack>
                                                </Flex>
                                            </Accordion.ItemTrigger>

                                            <Accordion.ItemContent bg="blackAlpha.500" p={0}>
                                                <VStack align="stretch" gap={0}>
                                                    {mainList.length > 0 && (
                                                        <Box>
                                                            <HStack bg="blackAlpha.600" px={6} py={2} borderBottom="1px solid" borderColor="gray.800">
                                                                <Icon as={PiScalesDuotone} color="brand.400" /><Text fontSize="xs" fontWeight="bold" color="brand.400" textTransform="uppercase">Processos Principais ({mainList.length})</Text>
                                                            </HStack>
                                                            <Table.Root size="sm" variant="line"><Table.Body>{mainList.map(asset => <AssetTableRow key={asset.id} asset={asset} />)}</Table.Body></Table.Root>
                                                        </Box>
                                                    )}
                                                    <Accordion.Root multiple collapsible variant="plain" spaceY={0}>
                                                        {appeals.length > 0 && (
                                                            <Accordion.Item value="appeals" borderTop="1px solid" borderColor="gray.700">
                                                                <Accordion.ItemTrigger px={6} py={3} _hover={{ bg: 'whiteAlpha.100' }}><Flex justify="space-between" w="100%" align="center"><HStack gap={2}><Icon as={PiFilesDuotone} color="orange.400" /><Text fontSize="xs" fontWeight="bold" color="orange.400" textTransform="uppercase">Recursos ({appeals.length})</Text></HStack><Accordion.ItemIndicator><Icon as={PiCaretDownBold} color="orange.600" boxSize={3} /></Accordion.ItemIndicator></Flex></Accordion.ItemTrigger>
                                                                <Accordion.ItemContent bg="blackAlpha.400"><Table.Root size="sm" variant="line"><Table.Body>{appeals.map(asset => <AssetTableRow key={asset.id} asset={asset} />)}</Table.Body></Table.Root></Accordion.ItemContent>
                                                            </Accordion.Item>
                                                        )}
                                                        {incidents.length > 0 && (
                                                            <Accordion.Item value="incidents" borderTop="1px solid" borderColor="gray.700">
                                                                <Accordion.ItemTrigger px={6} py={3} _hover={{ bg: 'whiteAlpha.100' }}><Flex justify="space-between" w="100%" align="center"><HStack gap={2}><Icon as={PiGavelDuotone} color="purple.400" /><Text fontSize="xs" fontWeight="bold" color="purple.400" textTransform="uppercase">Incidentes ({incidents.length})</Text></HStack><Accordion.ItemIndicator><Icon as={PiCaretDownBold} color="purple.600" boxSize={3} /></Accordion.ItemIndicator></Flex></Accordion.ItemTrigger>
                                                                <Accordion.ItemContent bg="blackAlpha.400"><Table.Root size="sm" variant="line"><Table.Body>{incidents.map(asset => <AssetTableRow key={asset.id} asset={asset} />)}</Table.Body></Table.Root></Accordion.ItemContent>
                                                            </Accordion.Item>
                                                        )}
                                                    </Accordion.Root>
                                                </VStack>
                                            </Accordion.ItemContent>
                                        </Accordion.Item>
                                    );
                                })}
                            </Accordion.Root>

                            {/* PAGINAÇÃO */}
                            {meta && meta.totalPages > 1 && (
                                <Flex justify="space-between" align="center" mt={6} px={4} pb={10}>
                                    <Text fontSize="sm" color="gray.400">Mostrando <b>{folders.length}</b> de <b>{meta.total}</b> pastas</Text>
                                    <HStack gap={2}>
                                        <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><Icon as={PiCaretLeftBold} /> Anterior</Button>
                                        <HStack gap={1}>
                                            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                                                .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                                                .map((p, i, arr) => (
                                                    <Flex key={p}>
                                                        {i > 0 && arr[i - 1] !== p - 1 && <Text color="gray.600">...</Text>}
                                                        <Button size="sm" variant={page === p ? "solid" : "ghost"} bg={page === p ? "brand.600" : "transparent"} onClick={() => setPage(p)}>{p}</Button>
                                                    </Flex>
                                                ))
                                            }
                                        </HStack>
                                        <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>Próximo <Icon as={PiCaretRightBold} /></Button>
                                    </HStack>
                                </Flex>
                            )}
                        </Box>
                    )}
                </Box>
            </VStack>
        </AuthenticationGuard>
    );
}