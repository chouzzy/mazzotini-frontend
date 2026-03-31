'use client';

import {
    VStack, Text, Flex, Icon, HStack, Heading, Badge,
    Accordion, Table, Box, Button, Link,
} from '@chakra-ui/react';
import {
    PiFolderOpen, PiScalesDuotone, PiFilesDuotone, PiGavelDuotone, PiCaretDownBold, PiArrowRight,
} from 'react-icons/pi';
import NextLink from 'next/link';
import { PaginatedFoldersResponse } from '@/types/folders';
import { FolderAssetRow, formatBRL } from './FolderAssetRow';

interface FoldersSectionProps {
    foldersData?: PaginatedFoldersResponse;
}

export function FoldersSection({ foldersData }: FoldersSectionProps) {
    const folders = foldersData?.items || [];

    if (folders.length === 0) {
        return <Text color="gray.500">Nenhuma pasta encontrada.</Text>;
    }

    return (
        <VStack align="stretch" gap={3} w="100%">
            <Accordion.Root multiple collapsible variant="enclosed" spaceY={3} w="100%">
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
                                    <HStack gap={4} align="center">
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

            {folders.length > 3 && (
                <Link as={NextLink} href="/pastas" _hover={{ textDecoration: 'none' }}>
                    <Button variant="outline" w="100%" size="sm" gap={2} borderColor="gray.600" color="gray.300" _hover={{ bg: 'gray.800' }}>
                        Ver mais {folders.length - 3} pasta{folders.length - 3 !== 1 ? 's' : ''} <Icon as={PiArrowRight} />
                    </Button>
                </Link>
            )}
        </VStack>
    );
}
