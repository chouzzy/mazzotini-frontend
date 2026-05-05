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
import { PiCheckCircle, PiWarningCircle, PiArrowClockwise, PiCaretDown } from 'react-icons/pi';
import axios from 'axios';

interface CheckResult {
    name: string;
    status: 'ok' | 'error';
    duration: number;
    message: string;
}

interface HealthLog {
    id: string;
    runAt: string;
    status: 'ok' | 'error';
    checks: CheckResult[];
    triggeredBy: string;
}

function StatusBadge({ status }: { status: 'ok' | 'error' }) {
    return (
        <Badge colorPalette={status === 'ok' ? 'green' : 'red'} variant="solid" gap={1}>
            <Icon as={status === 'ok' ? PiCheckCircle : PiWarningCircle} />
            {status === 'ok' ? 'OK' : 'ERRO'}
        </Badge>
    );
}

function LogRow({ log }: { log: HealthLog }) {
    const failedChecks = log.checks.filter(c => c.status === 'error');
    const date = new Date(log.runAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    return (
        <Collapsible.Root>
            <Collapsible.Trigger asChild>
                <Table.Row _hover={{ bg: 'whiteAlpha.50' }} cursor="pointer">
                    <Table.Cell px={4} py={3}>
                        <HStack gap={2}>
                            <StatusBadge status={log.status} />
                            {failedChecks.length > 0 && (
                                <Text fontSize="xs" color="red.300">
                                    {failedChecks.map(c => c.name).join(', ')}
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
                    <Table.Cell colSpan={4} px={4} py={3} bg="gray.800">
                        <VStack align="stretch" gap={2}>
                            {log.checks.map((check) => (
                                <HStack key={check.name} justify="space-between" p={2} bg="gray.900" borderRadius="md">
                                    <HStack gap={2}>
                                        <Icon
                                            as={check.status === 'ok' ? PiCheckCircle : PiWarningCircle}
                                            color={check.status === 'ok' ? 'green.400' : 'red.400'}
                                        />
                                        <Text fontSize="sm" fontWeight="medium">{check.name}</Text>
                                    </HStack>
                                    <HStack gap={4}>
                                        <Text fontSize="xs" color="gray.400">{check.duration}ms</Text>
                                        <Text fontSize="xs" color={check.status === 'ok' ? 'gray.400' : 'red.300'}>
                                            {check.message}
                                        </Text>
                                    </HStack>
                                </HStack>
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

    const runNow = async () => {
        setIsRunning(true);
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/health-check`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toaster.create({ title: 'Health check executado!', type: 'success' });
            await mutate();
        } catch {
            toaster.create({ title: 'Erro ao executar health check.', type: 'error' });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <Flex w="100%" p={8} bgColor="bodyBg" maxW="breakpoint-lg" mx="auto" flexDir="column" gap={6}>
            <Toaster />

            <Flex justify="space-between" align="center">
                <VStack align="start" gap={1}>
                    <Heading as="h1" size="lg">Logs de Saúde do Sistema</Heading>
                    <Text color="gray.400" fontSize="sm">Executa diariamente às 8h. Somente administradores têm acesso.</Text>
                </VStack>
                <Button
                    colorPalette="blue" variant="solid" gap={2}
                    loading={isRunning} onClick={runNow}
                >
                    <Icon as={PiArrowClockwise} />
                    Executar agora
                </Button>
            </Flex>

            {/* Status atual */}
            {lastLog && (
                <Box p={4} bg={lastLog.status === 'ok' ? 'green.900' : 'red.900'} borderRadius="md"
                    border="1px solid" borderColor={lastLog.status === 'ok' ? 'green.600' : 'red.600'}>
                    <HStack gap={3}>
                        <Icon
                            as={lastLog.status === 'ok' ? PiCheckCircle : PiWarningCircle}
                            boxSize={6}
                            color={lastLog.status === 'ok' ? 'green.300' : 'red.300'}
                        />
                        <VStack align="start" gap={0}>
                            <Text fontWeight="bold" color={lastLog.status === 'ok' ? 'green.200' : 'red.200'}>
                                {lastLog.status === 'ok' ? 'Todos os sistemas operacionais' : 'Atenção: falha detectada'}
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                                Última verificação: {new Date(lastLog.runAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                            </Text>
                        </VStack>
                    </HStack>
                </Box>
            )}

            {/* Tabela de histórico */}
            <Box bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.700" overflow="hidden">
                {isLoading ? (
                    <Flex justify="center" p={8}><Spinner /></Flex>
                ) : !logs?.length ? (
                    <Text color="gray.500" p={6} textAlign="center">Nenhum log registrado ainda. Execute o primeiro health check.</Text>
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
