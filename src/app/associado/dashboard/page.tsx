'use client';

import {
    Flex, Heading, Text, VStack, HStack, Spinner, Box, Icon, Button,
} from '@chakra-ui/react';
import {
    PiUsersThree, PiScales, PiArrowRight, PiCheckCircle,
} from 'react-icons/pi';
import { useApi } from '@/hooks/useApi';
import { useAuth0 } from '@auth0/auth0-react';
import { AuthenticationGuard } from '@/app/components/auth/AuthenticationGuard';
import Link from 'next/link';
import { useMemo } from 'react';

interface AssociateProcessRow {
    investmentId: string;
    clientId: string;
    clientName: string;
    currentValue: number;
    status: string;
}

function KPICard({ label, value, icon, color }: { label: string; value: string | number; icon: any; color: string }) {
    return (
        <Box flex={1} minW="180px" p={6} bg="gray.900" borderRadius="lg" border="1px solid" borderColor="gray.700">
            <HStack justify="space-between" mb={3}>
                <Text fontSize="sm" color="gray.400">{label}</Text>
                <Icon as={icon} color={`${color}.400`} boxSize={5} />
            </HStack>
            <Text fontSize="3xl" fontWeight="bold" color={`${color}.300`}>{value}</Text>
        </Box>
    );
}

function AssociateDashboardContent() {
    const { user } = useAuth0();
    const firstName = user?.name?.split(' ')[0] || 'Associado';

    const { data: rows, isLoading } = useApi<AssociateProcessRow[]>('/api/associate/processes');

    const stats = useMemo(() => {
        if (!rows) return { clients: 0, processes: 0, active: 0 };
        const clientIds = new Set(rows.map(r => r.clientId));
        const active = rows.filter(r => r.status === 'ACTIVE').length;
        return { clients: clientIds.size, processes: rows.length, active };
    }, [rows]);

    if (isLoading) {
        return <Flex justify="center" align="center" h="60vh"><Spinner size="xl" /></Flex>;
    }

    return (
        <Flex w="100%" p={8} flexDir="column" gap={8}>
            <VStack align="start" gap={1}>
                <Heading as="h1" size="lg">Olá, {firstName}!</Heading>
                <Text color="gray.400" fontSize="sm">
                    Este é o resumo da sua área como associado.
                </Text>
            </VStack>

            <Flex gap={4} wrap="wrap">
                <KPICard label="Clientes vinculados" value={stats.clients} icon={PiUsersThree} color="brand" />
                <KPICard label="Total de processos" value={stats.processes} icon={PiScales} color="blue" />
                <KPICard label="Processos ativos" value={stats.active} icon={PiCheckCircle} color="green" />
            </Flex>

            <Box p={6} bg="gray.900" borderRadius="lg" border="1px solid" borderColor="gray.700">
                <HStack justify="space-between" mb={4}>
                    <Text fontWeight="semibold">Seus processos</Text>
                    <Link href="/associado">
                        <Button size="sm" colorPalette="brand" variant="solid" gap={1}>
                            Ver todos <Icon as={PiArrowRight} />
                        </Button>
                    </Link>
                </HStack>
                {stats.processes === 0 ? (
                    <VStack gap={2} py={6} color="gray.500">
                        <Icon as={PiScales} boxSize={8} />
                        <Text fontSize="sm">Nenhum cliente vinculou você como associado ainda.</Text>
                        <Text fontSize="xs" textAlign="center" maxW="360px">
                            Peça para seus clientes acessarem os processos deles e vincularem você como associado.
                        </Text>
                    </VStack>
                ) : (
                    <Text fontSize="sm" color="gray.400">
                        Você está vinculado como associado em <b>{stats.processes}</b> processo{stats.processes !== 1 ? 's' : ''} de <b>{stats.clients}</b> cliente{stats.clients !== 1 ? 's' : ''}.
                    </Text>
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
