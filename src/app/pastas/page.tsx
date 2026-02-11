'use client';

import {
    Box, Heading, VStack, Text, Flex, Icon, Spinner, Button, Link, Table, Tag, Accordion, Badge, SimpleGrid, Card, Input
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useApi } from '@/hooks/useApi';
import { PiWarningCircle, PiFolderOpen, PiCaretDown, PiMagnifyingGlass, PiArrowRight } from 'react-icons/pi';
import { useState, useMemo } from 'react';
import { AuthenticationGuard } from '../components/auth/AuthenticationGuard';

// Tipagem
interface AssetSummary {
    id: string;
    processNumber: string;
    nickname?: string;
    originalCreditor: string;
    currentValue: number;
    investedValue: number;
    status: string;
    mainInvestorName: string;
}

interface ProcessFolder {
    id: string;
    folderCode: string; // Ex: Proc - 0002356
    description: string;
    totalAcquisition: number;
    totalCurrent: number;
    assets: AssetSummary[];
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

export default function FoldersPage() {
    const { data: folders, isLoading, error } = useApi<ProcessFolder[]>('/api/assets/folders');
    const [searchQuery, setSearchQuery] = useState('');

    // Filtro inteligente: Busca no nome da pasta OU nos processos dentro dela
    const filteredFolders = useMemo(() => {
        if (!folders) return [];
        if (!searchQuery) return folders;

        const lowerQuery = searchQuery.toLowerCase();

        return folders.filter(folder => {
            const matchFolder = folder.folderCode.toLowerCase().includes(lowerQuery) || 
                                (folder.description && folder.description.toLowerCase().includes(lowerQuery));
            
            const matchAssets = folder.assets.some(asset => 
                asset.processNumber.toLowerCase().includes(lowerQuery) ||
                (asset.nickname && asset.nickname.toLowerCase().includes(lowerQuery)) ||
                asset.originalCreditor.toLowerCase().includes(lowerQuery)
            );

            return matchFolder || matchAssets;
        });
    }, [folders, searchQuery]);

    if (isLoading) return <Flex w="100%" h="50vh" justify="center" align="center"><Spinner size="xl" color="brand.500" /></Flex>;
    
    if (error) return (
        <Flex w="100%" justify="center" p={8}>
            <VStack bg="red.900" p={6} borderRadius="md"><Icon as={PiWarningCircle} size={'lg'} color="red.300"/><Text>Erro ao carregar pastas.</Text></VStack>
        </Flex>
    );

    return (
        <AuthenticationGuard>
            <VStack gap={8} align="stretch" w="100%" p={{base: 4, md: 8}}>
                
                {/* Header */}
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
                            placeholder="Buscar pasta, processo ou credor..." 
                            bgColor="gray.800" 
                            borderColor="gray.700"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                         />
                    </Box>
                </Flex>

                {/* Lista de Pastas (Accordion) */}
                {filteredFolders.length === 0 ? (
                    <Flex justify="center" p={10} bg="gray.900" borderRadius="md"><Text color="gray.500">Nenhuma pasta encontrada.</Text></Flex>
                ) : (
                    <Accordion.Root multiple collapsible variant="enclosed" spaceY={4} >
                        {filteredFolders.map((folder) => (
                            <Accordion.Item cursor={'pointer'} key={folder.id} value={folder.id} bg="gray.900" border="1px solid" borderColor="gray.700" borderRadius="md" overflow="hidden">
                                <Accordion.ItemTrigger _hover={{ bg: 'gray.800' }} py={4} px={6} cursor={'pointer'}>
                                    <Flex justify="space-between" w="100%" align="center" wrap="wrap" gap={4}>
                                        <VStack align="start" gap={0}>
                                            <Text fontWeight="bold" fontSize="lg" color="white">{folder.folderCode}</Text>
                                            <Text fontSize="sm" color="gray.400">{folder.description !== `Pasta ${folder.folderCode}` ? folder.description : 'Caso Judicial'}</Text>
                                        </VStack>
                                        
                                        <Flex gap={8} align="center" display={{base: 'none', md: 'flex'}}>
                                            <VStack align="end" gap={0}>
                                                <Text fontSize="xs" color="gray.500" textTransform="uppercase">Processos</Text>
                                                <Badge colorPalette="yellow" size="lg" variant="solid">{folder.assets.length}</Badge>
                                            </VStack>
                                            <VStack align="end" gap={0}>
                                                <Text fontSize="xs" color="gray.500" textTransform="uppercase">Valor Total</Text>
                                                <Text fontWeight="bold" color="brand.400">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(folder.totalCurrent)}
                                                </Text>
                                            </VStack>
                                        </Flex>
                                    </Flex>
                                </Accordion.ItemTrigger>
                                
                                <Accordion.ItemContent bg="blackAlpha.300" p={0}>
                                    <Table.Root size="sm" variant="line">
                                        <Table.Header>
                                            <Table.Row bg="whiteAlpha.50">
                                                <Table.ColumnHeader color="gray.200" pl={6}>Processo / Apelido</Table.ColumnHeader>
                                                <Table.ColumnHeader color="gray.200">Credor</Table.ColumnHeader>
                                                <Table.ColumnHeader color="gray.200">Valor Atual</Table.ColumnHeader>
                                                <Table.ColumnHeader color="gray.200">Status</Table.ColumnHeader>
                                                <Table.ColumnHeader></Table.ColumnHeader>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            {folder.assets.map(asset => (
                                                <Table.Row key={asset.id} _hover={{ bg: 'whiteAlpha.50' }}>
                                                    <Table.Cell pl={6}>
                                                        <VStack align="start" gap={0}>
                                                            <Text fontWeight="medium" color="white">{asset.processNumber}</Text>
                                                            {asset.nickname && <Text fontSize="xs" color="brand.300">{asset.nickname}</Text>}
                                                        </VStack>
                                                    </Table.Cell>
                                                    <Table.Cell>{asset.originalCreditor}</Table.Cell>
                                                    <Table.Cell>
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.currentValue)}
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        <Tag.Root size="sm" variant="solid" colorPalette={getStatusColorScheme(asset.status)}>
                                                            <Tag.Label>{asset.status}</Tag.Label>
                                                        </Tag.Root>
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        <Link as={NextLink} href={`/processos/${encodeURIComponent(asset.processNumber)}`}>
                                                            <Button size="xs" variant="solid" colorPalette="blue"><Icon as={PiArrowRight} /></Button>
                                                        </Link>
                                                    </Table.Cell>
                                                </Table.Row>
                                            ))}
                                        </Table.Body>
                                    </Table.Root>
                                </Accordion.ItemContent>
                            </Accordion.Item>
                        ))}
                    </Accordion.Root>
                )}
            </VStack>
        </AuthenticationGuard>
    );
}