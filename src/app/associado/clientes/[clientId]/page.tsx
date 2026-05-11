'use client';

import {
    Flex, Heading, Text, VStack, HStack, Spinner, Box,
    Table, Avatar, Badge, Button, Icon,
} from '@chakra-ui/react';
import {
    PiArrowLeft, PiArrowRight, PiScales,
} from 'react-icons/pi';
import { useApi } from '@/hooks/useApi';
import { AuthenticationGuard } from '@/app/components/auth/AuthenticationGuard';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatCurrency } from '@/utils';

interface LastUpdate {
    date: string;
    updatedValue: number;
    description: string;
}

interface AssociateProcess {
    investmentId: string;
    investorShare: number;
    acquisitionDate: string | null;
    legalOneId: number;
    processNumber: string;
    nickname: string | null;
    otherParty: string | null;
    originalCreditor: string;
    currentValue: number;
    acquisitionValue: number;
    status: string;
    lastUpdate: LastUpdate | null;
}

interface ClientProcessesResponse {
    client: {
        id: string;
        name: string;
        email: string;
        picture: string;
    };
    processes: AssociateProcess[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
    ACTIVE:             { label: 'Ativo',       color: 'green' },
    PENDING_ENRICHMENT: { label: 'Em análise',  color: 'yellow' },
    CLOSED:             { label: 'Encerrado',   color: 'gray' },
};

function ClientProcessesContent() {
    const params = useParams();
    const clientId = params.clientId as string;

    const { data, isLoading, error } = useApi<ClientProcessesResponse>(
        clientId ? `/api/associate/clients/${clientId}/processes` : null
    );

    if (isLoading) {
        return <Flex justify="center" align="center" h="60vh"><Spinner size="xl" /></Flex>;
    }

    if (error || !data) {
        return (
            <VStack gap={3} p={10} color="red.300">
                <Text>Não foi possível carregar os processos deste cliente.</Text>
                <Link href="/associado">
                    <Button variant="solid" colorPalette="gray" gap={1}><Icon as={PiArrowLeft} /> Voltar</Button>
                </Link>
            </VStack>
        );
    }

    const { client, processes } = data;

    return (
        <Flex w="100%" p={8} flexDir="column" gap={6}>
            {/* Header */}
            <HStack gap={4} wrap="wrap">
                <Link href="/associado">
                    <Button variant="solid" colorPalette="gray" size="sm" gap={1}>
                        <Icon as={PiArrowLeft} /> Voltar
                    </Button>
                </Link>
                <HStack gap={3}>
                    <Avatar.Root size="md">
                        <Avatar.Fallback name={client.name} />
                        <Avatar.Image src={client.picture} />
                    </Avatar.Root>
                    <VStack align="start" gap={0}>
                        <Heading size="md">{client.name}</Heading>
                        <Text fontSize="sm" color="gray.400">{client.email}</Text>
                    </VStack>
                </HStack>
            </HStack>

            <Text color="gray.400" fontSize="sm">
                {processes.length} processo{processes.length !== 1 ? 's' : ''} vinculado{processes.length !== 1 ? 's' : ''} a você
            </Text>

            <Box bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.700" overflow="hidden">
                {processes.length === 0 ? (
                    <VStack gap={3} p={10} color="gray.500">
                        <Icon as={PiScales} boxSize={10} />
                        <Text>Nenhum processo vinculado a você para este cliente.</Text>
                    </VStack>
                ) : (
                    <Table.Root variant="line" size="md">
                        <Table.Header>
                            <Table.Row bg="gray.800" borderBottom="1px solid" borderColor="gray.700">
                                <Table.ColumnHeader color="brand.500" px={6}>Processo</Table.ColumnHeader>
                                <Table.ColumnHeader color="brand.500" px={6}>Parte Contrária</Table.ColumnHeader>
                                <Table.ColumnHeader color="brand.500" px={6}>Valor Atual</Table.ColumnHeader>
                                <Table.ColumnHeader color="brand.500" px={6}>Último andamento</Table.ColumnHeader>
                                <Table.ColumnHeader color="brand.500" px={6} textAlign="center">Status</Table.ColumnHeader>
                                <Table.ColumnHeader px={6} />
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {processes.map(proc => {
                                const statusCfg = statusLabels[proc.status] ?? { label: proc.status, color: 'gray' };
                                const title = proc.nickname || proc.originalCreditor;
                                return (
                                    <Table.Row key={proc.investmentId} _hover={{ bg: 'whiteAlpha.50' }}>
                                        <Table.Cell px={6} py={4}>
                                            <VStack align="start" gap={0}>
                                                <Text fontWeight="medium" fontSize="sm">{title}</Text>
                                                <Text fontSize="xs" color="gray.500" fontFamily="mono">{proc.processNumber}</Text>
                                            </VStack>
                                        </Table.Cell>
                                        <Table.Cell px={6} py={4}>
                                            <Text fontSize="sm" color="gray.300">{proc.otherParty || '—'}</Text>
                                        </Table.Cell>
                                        <Table.Cell px={6} py={4}>
                                            <Text fontSize="sm" fontWeight="medium" color="green.300">
                                                {formatCurrency(proc.currentValue)}
                                            </Text>
                                        </Table.Cell>
                                        <Table.Cell px={6} py={4} maxW="260px">
                                            {proc.lastUpdate ? (
                                                <VStack align="start" gap={0}>
                                                    <Text fontSize="xs" color="gray.500">
                                                        {new Date(proc.lastUpdate.date).toLocaleDateString('pt-BR')}
                                                    </Text>
                                                    <Text fontSize="xs" color="gray.300" noOfLines={2}>
                                                        {proc.lastUpdate.description}
                                                    </Text>
                                                </VStack>
                                            ) : (
                                                <Text fontSize="xs" color="gray.600">—</Text>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell px={6} py={4} textAlign="center">
                                            <Badge colorPalette={statusCfg.color} variant="solid">
                                                {statusCfg.label}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell px={6} py={4} textAlign="right">
                                            <Link href={`/processos/${proc.legalOneId}`}>
                                                <Button size="sm" colorPalette="brand" variant="solid" gap={1}>
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

export default function AssociateClientProcessesPage() {
    return (
        <AuthenticationGuard>
            <ClientProcessesContent />
        </AuthenticationGuard>
    );
}
