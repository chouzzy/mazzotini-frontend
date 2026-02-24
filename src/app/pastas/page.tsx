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
    PiCaretDownBold
} from 'react-icons/pi';
import { useState, useMemo } from 'react';
import { AuthenticationGuard } from '../components/auth/AuthenticationGuard';

// Tipagem refletindo o banco com legalOneType
interface AssetSummary {
    id: string;
    processNumber: string;
    nickname?: string;
    originalCreditor: string;
    currentValue: number;
    investedValue: number;
    status: string;
    mainInvestorName: string;
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

// Componente para a linha da tabela
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
            <Link as={NextLink} href={`/processos/${encodeURIComponent(asset.processNumber)}`}>
                <Button size="xs" variant="solid" colorPalette="blue"><Icon as={PiArrowRight} /></Button>
            </Link>
        </Table.Cell>
    </Table.Row>
);

export default function FoldersPage() {
    const { data: folders, isLoading, error } = useApi<ProcessFolder[]>('/api/assets/folders');
    const [searchQuery, setSearchQuery] = useState('');

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
                
                {/* Header Section */}
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

                {/* Folders List */}
                {filteredFolders.length === 0 ? (
                    <Flex justify="center" p={10} bg="gray.900" borderRadius="md"><Text color="gray.500">Nenhuma pasta encontrada.</Text></Flex>
                ) : (
                    <Accordion.Root multiple collapsible variant="enclosed" spaceY={4} >
                        {filteredFolders.map((folder) => {
                            
                            // Agrupamento por tipo
                            const lawsuits = folder.assets.filter(a => a.legalOneType?.toLowerCase() === 'lawsuit');
                            const appeals = folder.assets.filter(a => a.legalOneType?.toLowerCase() === 'appeal');
                            const incidents = folder.assets.filter(a => a.legalOneType?.toLowerCase() === 'proceduralissue');
                            const outros = folder.assets.filter(a => !a.legalOneType || (
                                a.legalOneType?.toLowerCase() !== 'lawsuit' && 
                                a.legalOneType?.toLowerCase() !== 'appeal' && 
                                a.legalOneType?.toLowerCase() !== 'proceduralissue'
                            ));

                            const mainList = [...lawsuits, ...outros];

                            return (
                                <Accordion.Item key={folder.id} value={folder.id} bg="gray.900" border="1px solid" borderColor="gray.700" borderRadius="md" overflow="hidden">
                                    <Accordion.ItemTrigger _hover={{ bg: 'gray.800' }} py={4} px={6}>
                                        <Flex justify="space-between" w="100%" align="center" gap={4}>
                                            <VStack align="start" gap={0}>
                                                <Text fontWeight="bold" fontSize="lg" color="white">{folder.folderCode}</Text>
                                                <Text fontSize="sm" color="gray.400">{folder.description !== `Pasta ${folder.folderCode}` ? folder.description : 'Caso Judicial'}</Text>
                                            </VStack>
                                            
                                            <HStack gap={8} align="center">
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
                                                <Accordion.ItemIndicator>
                                                    <Icon as={PiCaretDownBold} color="gray.500" />
                                                </Accordion.ItemIndicator>
                                            </HStack>
                                        </Flex>
                                    </Accordion.ItemTrigger>
                                    
                                    <Accordion.ItemContent bg="blackAlpha.500" p={0}>
                                        <VStack align="stretch" gap={0}>
                                            
                                            {/* SEÇÃO 1: PROCESSOS PRINCIPAIS */}
                                            {mainList.length > 0 && (
                                                <Box>
                                                    <HStack bg="blackAlpha.600" px={6} py={2} borderBottom="1px solid" borderColor="gray.800">
                                                        <Icon as={PiScalesDuotone} color="brand.400" />
                                                        <Text fontSize="xs" fontWeight="bold" color="brand.400" textTransform="uppercase">
                                                            Processos Principais ({mainList.length})
                                                        </Text>
                                                    </HStack>
                                                    <Table.Root size="sm" variant="line">
                                                        <Table.Body>
                                                            {mainList.map(asset => <AssetTableRow key={asset.id} asset={asset} />)}
                                                        </Table.Body>
                                                    </Table.Root>
                                                </Box>
                                            )}

                                            {/* SEÇÃO 2: SUB-ACORDEÕES (Recursos e Incidentes) */}
                                            <Accordion.Root multiple collapsible variant="plain" spaceY={0}>
                                                
                                                {/* ACORDEÃO DE RECURSOS */}
                                                {appeals.length > 0 && (
                                                    <Accordion.Item value="appeals" borderTop="1px solid" borderColor="gray.700">
                                                        <Accordion.ItemTrigger px={6} py={3} _hover={{ bg: 'whiteAlpha.100' }}>
                                                            <Flex justify="space-between" w="100%" align="center">
                                                                <HStack gap={2}>
                                                                    <Icon as={PiFilesDuotone} color="orange.400" />
                                                                    <Text fontSize="xs" fontWeight="bold" color="orange.400" textTransform="uppercase">
                                                                        Recursos ({appeals.length})
                                                                    </Text>
                                                                </HStack>
                                                                <Accordion.ItemIndicator>
                                                                    <Icon as={PiCaretDownBold} color="orange.600" boxSize={3} />
                                                                </Accordion.ItemIndicator>
                                                            </Flex>
                                                        </Accordion.ItemTrigger>
                                                        <Accordion.ItemContent bg="blackAlpha.400">
                                                            <Table.Root size="sm" variant="line">
                                                                <Table.Body>
                                                                    {appeals.map(asset => <AssetTableRow key={asset.id} asset={asset} />)}
                                                                </Table.Body>
                                                            </Table.Root>
                                                        </Accordion.ItemContent>
                                                    </Accordion.Item>
                                                )}

                                                {/* ACORDEÃO DE INCIDENTES */}
                                                {incidents.length > 0 && (
                                                    <Accordion.Item value="incidents" borderTop="1px solid" borderColor="gray.700">
                                                        <Accordion.ItemTrigger px={6} py={3} _hover={{ bg: 'whiteAlpha.100' }}>
                                                            <Flex justify="space-between" w="100%" align="center">
                                                                <HStack gap={2}>
                                                                    <Icon as={PiGavelDuotone} color="purple.400" />
                                                                    <Text fontSize="xs" fontWeight="bold" color="purple.400" textTransform="uppercase">
                                                                        Incidentes ({incidents.length})
                                                                    </Text>
                                                                </HStack>
                                                                <Accordion.ItemIndicator>
                                                                    <Icon as={PiCaretDownBold} color="purple.600" boxSize={3} />
                                                                </Accordion.ItemIndicator>
                                                            </Flex>
                                                        </Accordion.ItemTrigger>
                                                        <Accordion.ItemContent bg="blackAlpha.400">
                                                            <Table.Root size="sm" variant="line">
                                                                <Table.Body>
                                                                    {incidents.map(asset => <AssetTableRow key={asset.id} asset={asset} />)}
                                                                </Table.Body>
                                                            </Table.Root>
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
                )}
            </VStack>
        </AuthenticationGuard>
    );
}