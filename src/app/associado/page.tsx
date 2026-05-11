'use client';

import {
    Flex, Heading, Text, VStack, HStack, Spinner, Box,
    Table, Avatar, Badge, Button, Icon, Input, Field,
} from '@chakra-ui/react';
import {
    PiArrowRight, PiUsersThree, PiMagnifyingGlass,
} from 'react-icons/pi';
import { useApi } from '@/hooks/useApi';
import { AuthenticationGuard } from '@/app/components/auth/AuthenticationGuard';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { formatCurrency } from '@/utils';

interface AssociateProcessRow {
    investmentId: string;
    clientId: string;
    clientName: string;
    clientEmail: string;
    clientPicture: string;
    legalOneId: number;
    processNumber: string;
    nickname: string | null;
    otherParty: string | null;
    originalCreditor: string;
    currentValue: number;
    status: string;
    lastUpdateDate: string | null;
    lastUpdateDescription: string | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    ACTIVE:             { label: 'Ativo',      color: 'green'  },
    PENDING_ENRICHMENT: { label: 'Em análise', color: 'yellow' },
    CLOSED:             { label: 'Encerrado',  color: 'gray'   },
};

function MeusClientesContent() {
    const [search, setSearch] = useState('');
    const { data: rows, isLoading } = useApi<AssociateProcessRow[]>('/api/associate/processes');

    const filtered = useMemo(() => {
        if (!rows) return [];
        const q = search.toLowerCase();
        if (!q) return rows;
        return rows.filter(r =>
            r.clientName.toLowerCase().includes(q) ||
            r.clientEmail.toLowerCase().includes(q) ||
            r.processNumber.toLowerCase().includes(q) ||
            (r.otherParty && r.otherParty.toLowerCase().includes(q)) ||
            (r.nickname && r.nickname.toLowerCase().includes(q))
        );
    }, [rows, search]);

    return (
        <Flex w="100%" p={8} flexDir="column" gap={6}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                <VStack align="start" gap={1}>
                    <Heading as="h1" size="lg">Meus Clientes</Heading>
                    <Text color="gray.400" fontSize="sm">
                        Processos em que você está vinculado como associado
                    </Text>
                </VStack>
                {rows && (
                    <HStack gap={2}>
                        <Badge colorPalette="brand" variant="solid" px={3} py={1} fontSize="sm">
                            {rows.length} processo{rows.length !== 1 ? 's' : ''}
                        </Badge>
                    </HStack>
                )}
            </Flex>

            <Box maxW="420px">
                <Field.Root>
                    <Input
                        placeholder="Buscar por cliente, processo ou parte contrária..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        bgColor="gray.900"
                        borderColor="gray.700"
                    />
                </Field.Root>
            </Box>

            <Box bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.700" overflow="hidden">
                {isLoading ? (
                    <Flex justify="center" p={10}><Spinner /></Flex>
                ) : filtered.length === 0 ? (
                    <VStack gap={3} p={10} color="gray.500">
                        <Icon as={PiUsersThree} boxSize={10} />
                        <Text>{search ? 'Nenhum resultado encontrado.' : 'Nenhum processo vinculado ainda.'}</Text>
                        <Text fontSize="sm" textAlign="center" maxW="360px">
                            Peça para seus clientes acessarem os processos e vincularem você como associado.
                        </Text>
                    </VStack>
                ) : (
                    <Table.Root variant="line" size="sm">
                        <Table.Header>
                            <Table.Row bg="gray.800" borderBottom="1px solid" borderColor="gray.700">
                                <Table.ColumnHeader color="brand.500" px={5}>Cliente</Table.ColumnHeader>
                                <Table.ColumnHeader color="brand.500" px={5}>Processo</Table.ColumnHeader>
                                <Table.ColumnHeader color="brand.500" px={5}>Parte Contrária</Table.ColumnHeader>
                                <Table.ColumnHeader color="brand.500" px={5}>Valor Atual</Table.ColumnHeader>
                                <Table.ColumnHeader color="brand.500" px={5}>Último andamento</Table.ColumnHeader>
                                <Table.ColumnHeader color="brand.500" px={5} textAlign="center">Status</Table.ColumnHeader>
                                <Table.ColumnHeader px={5} />
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {filtered.map(row => {
                                const st = statusConfig[row.status] ?? { label: row.status, color: 'gray' };
                                const title = row.nickname || row.originalCreditor;
                                return (
                                    <Table.Row key={row.investmentId} _hover={{ bg: 'whiteAlpha.50' }}>
                                        <Table.Cell px={5} py={3}>
                                            <HStack gap={2}>
                                                <Avatar.Root size="xs">
                                                    <Avatar.Fallback name={row.clientName} />
                                                    <Avatar.Image src={row.clientPicture} />
                                                </Avatar.Root>
                                                <VStack align="start" gap={0}>
                                                    <Text fontSize="sm" fontWeight="medium">{row.clientName}</Text>
                                                    <Text fontSize="xs" color="gray.500">{row.clientEmail}</Text>
                                                </VStack>
                                            </HStack>
                                        </Table.Cell>
                                        <Table.Cell px={5} py={3}>
                                            <VStack align="start" gap={0}>
                                                <Text fontSize="sm" fontWeight="medium">{title}</Text>
                                                <Text fontSize="xs" color="gray.500" fontFamily="mono">{row.processNumber}</Text>
                                            </VStack>
                                        </Table.Cell>
                                        <Table.Cell px={5} py={3}>
                                            <Text fontSize="sm" color="gray.300">{row.otherParty || '—'}</Text>
                                        </Table.Cell>
                                        <Table.Cell px={5} py={3}>
                                            <Text fontSize="sm" fontWeight="medium" color="green.300">
                                                {formatCurrency(row.currentValue)}
                                            </Text>
                                        </Table.Cell>
                                        <Table.Cell px={5} py={3} maxW="220px">
                                            {row.lastUpdateDate ? (
                                                <VStack align="start" gap={0}>
                                                    <Text fontSize="xs" color="gray.500">
                                                        {new Date(row.lastUpdateDate).toLocaleDateString('pt-BR')}
                                                    </Text>
                                                    <Text fontSize="xs" color="gray.300" lineClamp={2}>
                                                        {row.lastUpdateDescription}
                                                    </Text>
                                                </VStack>
                                            ) : (
                                                <Text fontSize="xs" color="gray.600">—</Text>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell px={5} py={3} textAlign="center">
                                            <Badge colorPalette={st.color} variant="solid" fontSize="xs">
                                                {st.label}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell px={5} py={3} textAlign="right">
                                            <Link href={`/processos/${row.legalOneId}`}>
                                                <Button size="xs" colorPalette="brand" variant="solid" gap={1}>
                                                    Ver <Icon as={PiArrowRight} />
                                                </Button>
                                            </Link>
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            })}
                        </Table.Body>
                    </Table.Root>
                )}
            </Box>
        </Flex>
    );
}

export default function MeusClientesPage() {
    return (
        <AuthenticationGuard>
            <MeusClientesContent />
        </AuthenticationGuard>
    );
}
