'use client';

import {
    Flex, Heading, Text, VStack, HStack, Spinner, Box,
    Table, Avatar, Badge, Button, Icon, Input, Field,
} from '@chakra-ui/react';
import { PiArrowRight, PiUsers, PiMagnifyingGlass } from 'react-icons/pi';
import { useApi } from '@/hooks/useApi';
import { AuthenticationGuard } from '@/app/components/auth/AuthenticationGuard';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { maskCPFOrCNPJ } from '@/utils/masks';

interface AssociateClient {
    id: string;
    name: string;
    email: string;
    picture: string;
    cpfOrCnpj: string | null;
    processCount: number;
}

function AssociateDashboardContent() {
    const [search, setSearch] = useState('');
    const { data: clients, isLoading } = useApi<AssociateClient[]>('/api/associate/dashboard');

    const filtered = useMemo(() => {
        if (!clients) return [];
        const q = search.toLowerCase();
        if (!q) return clients;
        return clients.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.cpfOrCnpj && c.cpfOrCnpj.includes(q))
        );
    }, [clients, search]);

    const totalProcesses = clients?.reduce((acc, c) => acc + c.processCount, 0) ?? 0;

    return (
        <Flex w="100%" p={8} flexDir="column" gap={6}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                <VStack align="start" gap={1}>
                    <Heading as="h1" size="lg">Área do Associado</Heading>
                    <Text color="gray.400" fontSize="sm">
                        Clientes com você como associado vinculado nos processos
                    </Text>
                </VStack>
                <HStack gap={4}>
                    <Box textAlign="center" p={4} bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.700" minW="100px">
                        <Text fontSize="2xl" fontWeight="bold" color="brand.400">{clients?.length ?? '—'}</Text>
                        <Text fontSize="xs" color="gray.500">Clientes</Text>
                    </Box>
                    <Box textAlign="center" p={4} bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.700" minW="100px">
                        <Text fontSize="2xl" fontWeight="bold" color="brand.400">{totalProcesses}</Text>
                        <Text fontSize="xs" color="gray.500">Processos</Text>
                    </Box>
                </HStack>
            </Flex>

            <Box>
                <Field.Root maxW="400px">
                    <Field.Label fontSize="sm" color="gray.400">Buscar cliente</Field.Label>
                    <Input
                        placeholder="Nome, e-mail ou CPF/CNPJ..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        bgColor="gray.900"
                        borderColor="gray.700"
                        leftElement={<Icon as={PiMagnifyingGlass} color="gray.500" ml={3} />}
                    />
                </Field.Root>
            </Box>

            <Box bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.700" overflow="hidden">
                {isLoading ? (
                    <Flex justify="center" p={10}><Spinner /></Flex>
                ) : filtered.length === 0 ? (
                    <VStack gap={3} p={10} color="gray.500">
                        <Icon as={PiUsers} boxSize={10} />
                        <Text>{search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente vinculado ainda.'}</Text>
                        <Text fontSize="sm" textAlign="center" maxW="360px">
                            Seus clientes precisam vincular você como associado nos processos deles na plataforma.
                        </Text>
                    </VStack>
                ) : (
                    <Table.Root variant="line" size="md">
                        <Table.Header>
                            <Table.Row bg="gray.800" borderBottom="1px solid" borderColor="gray.700">
                                <Table.ColumnHeader color="brand.500" px={6}>Cliente</Table.ColumnHeader>
                                <Table.ColumnHeader color="brand.500" px={6}>CPF / CNPJ</Table.ColumnHeader>
                                <Table.ColumnHeader color="brand.500" px={6} textAlign="center">Processos</Table.ColumnHeader>
                                <Table.ColumnHeader px={6} />
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {filtered.map(client => (
                                <Table.Row key={client.id} _hover={{ bg: 'whiteAlpha.50' }}>
                                    <Table.Cell px={6} py={4}>
                                        <HStack gap={3}>
                                            <Avatar.Root size="sm">
                                                <Avatar.Fallback name={client.name} />
                                                <Avatar.Image src={client.picture} />
                                            </Avatar.Root>
                                            <VStack align="start" gap={0}>
                                                <Text fontWeight="medium">{client.name}</Text>
                                                <Text fontSize="sm" color="gray.400">{client.email}</Text>
                                            </VStack>
                                        </HStack>
                                    </Table.Cell>
                                    <Table.Cell px={6} py={4}>
                                        <Text fontSize="sm" color="gray.300" fontFamily="mono">
                                            {client.cpfOrCnpj ? maskCPFOrCNPJ(client.cpfOrCnpj) : '—'}
                                        </Text>
                                    </Table.Cell>
                                    <Table.Cell px={6} py={4} textAlign="center">
                                        <Badge colorPalette="brand" variant="solid" borderRadius="full" px={3}>
                                            {client.processCount}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell px={6} py={4} textAlign="right">
                                        <Link href={`/associado/clientes/${client.id}`}>
                                            <Button size="sm" colorPalette="brand" variant="solid" gap={1}>
                                                Ver processos <Icon as={PiArrowRight} />
                                            </Button>
                                        </Link>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                )}
            </Box>
        </Flex>
    );
}

export default function AssociateDashboardPage() {
    return (
        <AuthenticationGuard>
            <AssociateDashboardContent />
        </AuthenticationGuard>
    );
}
