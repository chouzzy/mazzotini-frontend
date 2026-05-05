'use client';

import {
    Flex, Heading, Text, VStack, HStack, Button, Icon, Spinner,
    Badge, Box, Table, Collapsible,
} from '@chakra-ui/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { AuthenticationGuard } from '@/app/components/auth/AuthenticationGuard';
import { Toaster, toaster } from '@/components/ui/toaster';
import { PiCheckCircle, PiWarningCircle, PiArrowClockwise, PiCaretDown, PiWarning } from 'react-icons/pi';
import axios from 'axios';

interface CheckResult {
    name: string;
    group: string;
    status: 'ok' | 'warning' | 'error';
    duration: number;
    message: string;
}

interface HealthLog {
    id: string;
    runAt: string;
    status: 'ok' | 'degraded' | 'error';
    checks: CheckResult[];
    triggeredBy: string;
}

const statusConfig = {
    ok:       { color: 'green',  icon: PiCheckCircle,  label: 'OK' },
    warning:  { color: 'yellow', icon: PiWarning,       label: 'ALERTA' },
    error:    { color: 'red',    icon: PiWarningCircle, label: 'ERRO' },
    degraded: { color: 'yellow', icon: PiWarning,       label: 'DEGRADADO' },
};

function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
    const cfg = statusConfig[status] ?? statusConfig.error;
    return (
        <Badge colorPalette={cfg.color} variant="solid" gap={1}>
            <Icon as={cfg.icon} />
            {cfg.label}
        </Badge>
    );
}

function LogRow({ log }: { log: HealthLog }) {
    const problemChecks = log.checks.filter(c => c.status !== 'ok');
    const date = new Date(log.runAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // Group checks by their group field
    const groups = log.checks.reduce<Record<string, CheckResult[]>>((acc, c) => {
        const g = c.group || 'Geral';
        if (!acc[g]) acc[g] = [];
        acc[g].push(c);
        return acc;
    }, {});

    return (
        <Collapsible.Root>
            <Collapsible.Trigger asChild>
                <Table.Row _hover={{ bg: 'whiteAlpha.50' }} cursor="pointer">
                    <Table.Cell px={4} py={3}>
                        <HStack gap={2} flexWrap="wrap">
                            <StatusBadge status={log.status} />
                            {problemChecks.length > 0 && (
                                <Text fontSize="xs" color={log.status === 'degraded' ? 'yellow.300' : 'red.300'}>
                                    {problemChecks.map(c => c.name).join(' · ')}
                                </Text>
                            )}
                        </HStack>
                    </Table.Cell>
                    <Table.Cell px={4} py={3} fontSize="sm" color="gray.400">{date}</Table.Cell>
                    <Table.Cell px={4} py={3}>
                        <Badge colorPalette={log.triggeredBy === 'manual' ? 'blue' : 'gray'} variant="outline" fontSize="xs">
                            {log.triggeredBy === 'manual' ? 'Manual' : 'Cron'}
                        </Badge>
                    </Table.Cell>
                    <Table.Cell px={4} py={3} textAlign="right">
                        <Icon as={PiCaretDown} color="gray.500" />
                    </Table.Cell>
                </Table.Row>
            </Collapsible.Trigger>

            <Collapsible.Content>
                <Table.Row>
                    <Table.Cell colSpan={4} px={4} py={4} bg="gray.800">
                        <VStack align="stretch" gap={4}>
                            {Object.entries(groups).map(([groupName, checks]) => (
                                <VStack key={groupName} align="stretch" gap={1}>
                                    <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                                        {groupName}
                                    </Text>
                                    {checks.map((check) => {
                                        const cfg = statusConfig[check.status] ?? statusConfig.error;
                                        return (
                                            <HStack key={check.name} justify="space-between" p={3} bg="gray.900" borderRadius="md"
                                                borderLeft="3px solid" borderLeftColor={`${cfg.color}.500`} w="100%">
                                                <HStack gap={2} flex={1} minW={0}>
                                                    <Icon as={cfg.icon} color={`${cfg.color}.400`} flexShrink={0} />
                                                    <Text fontSize="sm" fontWeight="medium">{check.name}</Text>
                                                </HStack>
                                                <HStack gap={6} flexShrink={0}>
                                                    <Text fontSize="xs" color={check.status === 'ok' ? 'gray.400' : `${cfg.color}.300`}>
                                                        {check.message}
                                                    </Text>
                                                    <Text fontSize="xs" color="gray.600" minW="50px" textAlign="right">{check.duration}ms</Text>
                                                </HStack>
                                            </HStack>
                                        );
                                    })}
                                </VStack>
                            ))}
                        </VStack>
                    </Table.Cell>
                </Table.Row>
            </Collapsible.Content>
        </Collapsible.Root>
    );
}

function LogsContent() {
    const { getAccessTokenSilently } = useAuth0();
    const [isRunning, setIsRunning] = useState(false);
    const { data: logs, isLoading, mutate } = useApi<HealthLog[]>('/api/admin/health-logs?limit=30');

    const lastLog = logs?.[0];
    const bannerCfg = lastLog ? (statusConfig[lastLog.status] ?? statusConfig.error) : null;

    const runNow = async () => {
        setIsRunning(true);
        try {
            const token = await getAccessTokenSilently({
                authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! }
            });
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/health-check`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toaster.create({ title: 'Health check executado!', type: 'success' });
            await mutate();
        } catch {
            toaster.create({ title: 'Erro ao executar health check.', type: 'error' });
        } finally {
            setIsRunning(false);
        }
    };

    const bannerMessages = {
        ok:       'Todos os sistemas operacionais',
        degraded: 'Atenção: alertas de integridade detectados',
        error:    'Falha crítica detectada em um ou mais serviços',
    };

    return (
        <Flex w="100%" p={8} bgColor="bodyBg" flexDir="column" gap={6}>
            <Toaster />

            <Flex justify="space-between" align="center">
                <VStack align="start" gap={1}>
                    <Heading as="h1" size="lg">Logs de Saúde do Sistema</Heading>
                    <Text color="gray.400" fontSize="sm">
                        9 checks em 4 grupos · Executa diariamente às 8h · Somente administradores
                    </Text>
                </VStack>
                <Button colorPalette="blue" variant="solid" gap={2} loading={isRunning} onClick={runNow}>
                    <Icon as={PiArrowClockwise} />
                    Executar agora
                </Button>
            </Flex>

            {/* Banner de status atual */}
            {lastLog && bannerCfg && (
                <Box p={4} bg={`${bannerCfg.color}.900`} borderRadius="md"
                    border="1px solid" borderColor={`${bannerCfg.color}.700`}>
                    <HStack gap={3}>
                        <Icon as={bannerCfg.icon} boxSize={6} color={`${bannerCfg.color}.300`} />
                        <VStack align="start" gap={0}>
                            <Text fontWeight="bold" color={`${bannerCfg.color}.200`}>
                                {bannerMessages[lastLog.status]}
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                                Última verificação: {new Date(lastLog.runAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                                {' · '}{lastLog.checks.filter(c => c.status === 'ok').length}/{lastLog.checks.length} checks OK
                            </Text>
                        </VStack>
                    </HStack>
                </Box>
            )}

            {/* Tabela */}
            <Box bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.700" overflow="hidden">
                {isLoading ? (
                    <Flex justify="center" p={8}><Spinner /></Flex>
                ) : !logs?.length ? (
                    <Text color="gray.500" p={6} textAlign="center">
                        Nenhum log registrado. Clique em "Executar agora" para iniciar.
                    </Text>
                ) : (
                    <Table.Root variant="line" size="sm">
                        <Table.Header>
                            <Table.Row borderBottom="1px solid" borderColor="gray.700" bg="gray.800">
                                <Table.ColumnHeader px={4} color="brand.500">Status</Table.ColumnHeader>
                                <Table.ColumnHeader px={4} color="brand.500">Data/Hora</Table.ColumnHeader>
                                <Table.ColumnHeader px={4} color="brand.500">Origem</Table.ColumnHeader>
                                <Table.ColumnHeader px={4} />
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {logs.map((log) => <LogRow key={log.id} log={log} />)}
                        </Table.Body>
                    </Table.Root>
                )}
            </Box>
        </Flex>
    );
}

export default function LogsPage() {
    return (
        <AuthenticationGuard>
            <LogsContent />
        </AuthenticationGuard>
    );
}
