'use client';

import {
    Flex, Heading, Text, VStack, HStack, Box, Icon, Spinner,
    Switch, Badge, Button, Input, Field, Table,
} from '@chakra-ui/react';
import {
    PiGear, PiRobot, PiCheckCircle, PiProhibit,
    PiDownloadSimple, PiCalendar, PiArrowClockwise,
    PiCheckFat, PiX, PiCircleNotch, PiHandshake, PiUsersThree,
} from 'react-icons/pi';
import { useApi } from '@/hooks/useApi';
import { useAuth0 } from '@auth0/auth0-react';
import { AuthenticationGuard } from '@/app/components/auth/AuthenticationGuard';
import { Toaster, toaster } from '@/components/ui/toaster';
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface SystemSettings {
    autoImportAppeals: boolean;
    autoImportProceduralIssues: boolean;
    updatedAt: string;
    updatedBy: string | null;
}

interface ImportLog {
    id: string;
    triggeredAt: string;
    triggeredBy: string;
    since: string | null;
    importedCount: number;
    skippedCount: number;
    errorCount: number;
    status: 'running' | 'completed' | 'failed';
    finishedAt: string | null;
    durationMs: number | null;
    errorMessage: string | null;
}

interface BackfillStatus {
    status: 'idle' | 'running' | 'completed' | 'error';
    total: number;
    processed: number;
    linked: number;
    alreadyLinked: number;
    skipped: number;
    errors: number;
    currentProcess: string | null;
    startedAt: string | null;
    finishedAt: string | null;
}

// ─── Toggle Card ─────────────────────────────────────────────────────────────
function ToggleCard({ label, description, checked, onChange, loading }: {
    label: string; description: string; checked: boolean;
    onChange: (v: boolean) => void; loading: boolean;
}) {
    return (
        <HStack
            justify="space-between" align={{ base: 'start', md: 'center' }} flexDir={{ base: 'column', md: 'row' }} gap={4} p={5}
            bg={checked ? 'green.900/20' : 'gray.800'}
            borderRadius="lg" border="1px solid"
            borderColor={checked ? 'green.700/50' : 'gray.700'}
            transition="all 0.2s"
        >
            <HStack gap={4} flex={1}>
                <Flex w={9} h={9} borderRadius="md" bg={checked ? 'green.900' : 'gray.700'}
                    align="center" justify="center" flexShrink={0} transition="background 0.2s">
                    <Icon as={checked ? PiCheckCircle : PiProhibit} boxSize={5}
                        color={checked ? 'green.400' : 'gray.500'} transition="color 0.2s" />
                </Flex>
                <VStack align="start" gap={0.5}>
                    <Text fontWeight="semibold" fontSize="sm">{label}</Text>
                    <Text fontSize="xs" color="gray.400" maxW="460px">{description}</Text>
                </VStack>
            </HStack>
            <HStack gap={3} flexShrink={0}>
                <Text fontSize="xs" fontWeight="medium" color={checked ? 'green.400' : 'gray.500'}>
                    {checked ? 'Ativo' : 'Desativado'}
                </Text>
                <Switch.Root checked={checked} onCheckedChange={(e) => onChange(e.checked)}
                    disabled={loading} colorPalette="green" size="md">
                    <Switch.HiddenInput />
                    <Switch.Control><Switch.Thumb /></Switch.Control>
                </Switch.Root>
            </HStack>
        </HStack>
    );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ImportLog['status'] }) {
    const cfg = {
        running:   { color: 'blue',  icon: PiCircleNotch, label: 'Em andamento' },
        completed: { color: 'green', icon: PiCheckFat,    label: 'Concluído'    },
        failed:    { color: 'red',   icon: PiX,           label: 'Falhou'       },
    }[status] ?? { color: 'gray', icon: PiCircleNotch, label: status };

    return (
        <Badge colorPalette={cfg.color} variant="solid" gap={1} fontSize="xs">
            <Icon as={cfg.icon} />
            {cfg.label}
        </Badge>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function ConfiguracoesContent() {
    const { getAccessTokenSilently } = useAuth0();
    const { data: myProfile, isLoading: isLoadingProfile } = useApi<{ role: string }>('/api/users/me');
    const { data: settings, isLoading: isLoadingSettings, mutate: mutateSettings } = useApi<SystemSettings>('/api/admin/settings');
    const { data: logs, isLoading: isLoadingLogs, mutate: mutateLogs } = useApi<ImportLog[]>('/api/admin/import-logs');

    const [savingSettings, setSavingSettings] = useState(false);
    const [importing, setImporting] = useState(false);
    const [sinceDate, setSinceDate] = useState('');
    const [syncingContracts, setSyncingContracts] = useState(false);
    const [syncResult, setSyncResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
    const [backfillingInvestors, setBackfillingInvestors] = useState(false);
    const [backfillStatus, setBackfillStatus] = useState<BackfillStatus | null>(null);
    const [backfillTarget, setBackfillTarget] = useState('');
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startPolling = () => {
        if (pollRef.current) return;
        pollRef.current = setInterval(async () => {
            try {
                const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
                const res = await axios.get<BackfillStatus>(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/backfill-investors/status`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setBackfillStatus(res.data);
                if (res.data.status !== 'running') {
                    clearInterval(pollRef.current!);
                    pollRef.current = null;
                    setBackfillingInvestors(false);
                }
            } catch { /* silencia erros de polling */ }
        }, 3000);
    };

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

    const handleSettingChange = async (field: keyof SystemSettings, value: boolean) => {
        setSavingSettings(true);
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
            await axios.patch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/settings`, { [field]: value },
                { headers: { Authorization: `Bearer ${token}` } });
            toaster.create({ title: value ? 'Importação ativada.' : 'Importação desativada.', type: value ? 'success' : 'warning' });
            await mutateSettings();
        } catch {
            toaster.create({ title: 'Erro ao salvar configuração.', type: 'error' });
        } finally {
            setSavingSettings(false);
        }
    };

    const handleImport = async () => {
        setImporting(true);
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
            const url = sinceDate
                ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/import?since=${sinceDate}`
                : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/import`;
            await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
            toaster.create({
                title: 'Importação iniciada!',
                description: 'Rodando em segundo plano. Atualize a tabela em alguns minutos.',
                type: 'success',
            });
            // Atualiza logs após 3s para capturar o registro "running"
            setTimeout(() => mutateLogs(), 3000);
        } catch {
            toaster.create({ title: 'Erro ao iniciar importação.', type: 'error' });
        } finally {
            setImporting(false);
        }
    };

    const handleBackfillInvestors = async () => {
        setBackfillingInvestors(true);
        setBackfillStatus(null);
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
            const target = backfillTarget.trim();
            const body = target ? { processNumbers: [target] } : {};
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/backfill-investors`,
                body,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toaster.create({
                title: target ? `Backfill iniciado para ${target}` : 'Backfill iniciado!',
                type: 'success',
            });
            startPolling();
        } catch {
            toaster.create({ title: 'Erro ao iniciar backfill.', type: 'error' });
            setBackfillingInvestors(false);
        }
    };

    const handleSyncContracts = async () => {
        setSyncingContracts(true);
        setSyncResult(null);
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/sync-fee-contracts`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSyncResult({
                imported: res.data.documentsImported ?? 0,
                skipped:  res.data.documentsSkipped  ?? 0,
                errors:   res.data.errors            ?? [],
            });
            toaster.create({ title: 'Sincronização concluída!', type: 'success' });
        } catch {
            toaster.create({ title: 'Erro ao sincronizar contratos.', type: 'error' });
        } finally {
            setSyncingContracts(false);
        }
    };

    const formatDuration = (ms: number | null) => {
        if (!ms) return '—';
        if (ms < 60000) return `${Math.round(ms / 1000)}s`;
        return `${Math.round(ms / 60000)}min`;
    };

    if (isLoadingProfile || isLoadingSettings) {
        return <Flex justify="center" align="center" h="40vh"><Spinner size="xl" /></Flex>;
    }

    if (myProfile?.role !== 'ADMIN') {
        return (
            <Flex justify="center" align="center" h="40vh">
                <Text color="gray.500">Acesso restrito a administradores.</Text>
            </Flex>
        );
    }

    return (
        <Flex w="100%" flexDir="column" gap={8}>
            <Toaster />

            <HStack gap={3}>
                <Flex w={10} h={10} borderRadius="lg" bg="brand.900" align="center" justify="center"
                    border="1px solid" borderColor="brand.700">
                    <Icon as={PiGear} boxSize={5} color="brand.400" />
                </Flex>
                <VStack align="start" gap={0}>
                    <Heading size="lg">Configurações</Heading>
                    <Text color="gray.500" fontSize="sm">Controles operacionais — apenas administradores</Text>
                </VStack>
            </HStack>

            <VStack align="stretch" gap={3}>
                <HStack gap={2} mb={1}>
                    <Icon as={PiRobot} color="gray.400" boxSize={4} />
                    <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">
                        Importação Automática · Malha Fina
                    </Text>
                </HStack>

                <Box bg="gray.900" borderRadius="xl" border="1px solid" borderColor="gray.700" overflow="hidden">
                    <Box px={5} py={4} borderBottom="1px solid" borderColor="gray.700/60">
                        <Text fontSize="sm" color="gray.400">
                            Durante a sincronização com o Legal One, o sistema pode descobrir e importar automaticamente
                            processos filhos vinculados ao processo pai. Use os controles abaixo para definir quais tipos devem ser importados.
                        </Text>
                    </Box>
                    <VStack align="stretch" gap={3} p={4}>
                        <ToggleCard
                            label="Recursos (Appeals)"
                            description="Importa automaticamente processos do tipo Recurso vinculados ao processo pai durante a sincronização."
                            checked={settings?.autoImportAppeals ?? true}
                            onChange={(v) => handleSettingChange('autoImportAppeals', v)}
                            loading={savingSettings}
                        />
                        <ToggleCard
                            label="Incidentes Processuais (ProceduralIssues)"
                            description="Importa automaticamente processos do tipo Incidente Processual vinculados ao processo pai durante a sincronização."
                            checked={settings?.autoImportProceduralIssues ?? true}
                            onChange={(v) => handleSettingChange('autoImportProceduralIssues', v)}
                            loading={savingSettings}
                        />
                    </VStack>
                </Box>

                {settings?.updatedAt && (
                    <Text fontSize="xs" color="gray.600" px={1}>
                        Última alteração em {new Date(settings.updatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                        {settings.updatedBy && settings.updatedBy !== 'setup-inicial' ? ` · por ${settings.updatedBy}` : ''}
                    </Text>
                )}
            </VStack>

            <VStack align="stretch" gap={3}>
                <HStack gap={2} mb={1}>
                    <Icon as={PiDownloadSimple} color="gray.400" boxSize={4} />
                    <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">
                        Importação Manual
                    </Text>
                </HStack>

                <Box bg="gray.900" borderRadius="xl" border="1px solid" borderColor="gray.700" overflow="hidden">
                    <Box px={5} py={4} borderBottom="1px solid" borderColor="gray.700/60">
                        <Text fontSize="sm" color="gray.400">
                            Força uma varredura no Legal One e importa processos novos que ainda não existem na plataforma.
                            Use o campo de data para limitar a busca a um período específico — sem data, busca as últimas 48h (padrão do cron).
                        </Text>
                    </Box>

                    <HStack px={5} py={5} gap={4} wrap="wrap">
                        <Field.Root>
                            <Field.Label fontSize="xs" color="gray.400">
                                <Icon as={PiCalendar} mr={1} />
                                Importar processos desde
                            </Field.Label>
                            <Input
                                type="date"
                                value={sinceDate}
                                onChange={e => setSinceDate(e.target.value)}
                                bgColor="gray.800"
                                borderColor="gray.600"
                                size="sm"
                                w={{ base: '100%', md: '180px' }}
                                _focus={{ borderColor: 'brand.500' }}
                            />
                        </Field.Root>

                        <Flex align="flex-end" pb={0.5}>
                            <Button
                                colorPalette="brand"
                                variant="solid"
                                loading={importing}
                                onClick={handleImport}
                                gap={2}
                                size="sm"
                            >
                                <Icon as={PiDownloadSimple} boxSize={4} />
                                {sinceDate ? `Importar desde ${new Date(sinceDate + 'T00:00:00').toLocaleDateString('pt-BR')}` : 'Importar (últimas 48h)'}
                            </Button>
                        </Flex>
                    </HStack>
                </Box>

                <Box bg="gray.900" borderRadius="xl" border="1px solid" borderColor="gray.700" overflow="hidden">
                    <HStack px={5} py={4} borderBottom="1px solid" borderColor="gray.700/60" justify="space-between">
                        <Text fontSize="sm" fontWeight="semibold" color="gray.300">Histórico de Importações</Text>
                        <Button size="xs" variant="ghost" colorPalette="gray" onClick={() => mutateLogs()} gap={1}>
                            <Icon as={PiArrowClockwise} /> Atualizar
                        </Button>
                    </HStack>

                    {isLoadingLogs ? (
                        <Flex justify="center" p={8}><Spinner /></Flex>
                    ) : !logs?.length ? (
                        <Text color="gray.500" fontSize="sm" p={6} textAlign="center">
                            Nenhuma importação registrada ainda. O cron diário (meia-noite) e as importações manuais aparecerão aqui.
                        </Text>
                    ) : (
                        <Box overflowX="auto">
                            <Table.Root size="sm" variant="line">
                                <Table.Header>
                                    <Table.Row bg="gray.800" borderColor="gray.700">
                                        <Table.ColumnHeader color="brand.400" px={4}>Data / Hora</Table.ColumnHeader>
                                        <Table.ColumnHeader color="brand.400" px={4}>Acionado por</Table.ColumnHeader>
                                        <Table.ColumnHeader color="brand.400" px={4}>Desde</Table.ColumnHeader>
                                        <Table.ColumnHeader color="brand.400" px={4} textAlign="center">Importados</Table.ColumnHeader>
                                        <Table.ColumnHeader color="brand.400" px={4} textAlign="center">Pulados</Table.ColumnHeader>
                                        <Table.ColumnHeader color="brand.400" px={4} textAlign="center">Erros</Table.ColumnHeader>
                                        <Table.ColumnHeader color="brand.400" px={4} textAlign="center">Duração</Table.ColumnHeader>
                                        <Table.ColumnHeader color="brand.400" px={4}>Status</Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {logs.map(log => (
                                        <Table.Row key={log.id} _hover={{ bg: 'whiteAlpha.50' }} borderColor="gray.700">
                                            <Table.Cell px={4} py={3} fontSize="sm" whiteSpace="nowrap">
                                                {new Date(log.triggeredAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                                            </Table.Cell>
                                            <Table.Cell px={4} py={3}>
                                                <Badge
                                                    colorPalette={log.triggeredBy === 'cron' ? 'gray' : 'blue'}
                                                    variant="outline" fontSize="xs"
                                                >
                                                    {log.triggeredBy === 'cron' ? 'Cron' : 'Manual'}
                                                </Badge>
                                            </Table.Cell>
                                            <Table.Cell px={4} py={3} fontSize="sm" color="gray.400">
                                                {log.since ? new Date(log.since).toLocaleDateString('pt-BR') : '—'}
                                            </Table.Cell>
                                            <Table.Cell px={4} py={3} textAlign="center">
                                                <Text fontSize="sm" fontWeight="bold" color={log.importedCount > 0 ? 'green.400' : 'gray.500'}>
                                                    {log.importedCount}
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell px={4} py={3} textAlign="center">
                                                <Text fontSize="sm" color="gray.500">{log.skippedCount}</Text>
                                            </Table.Cell>
                                            <Table.Cell px={4} py={3} textAlign="center">
                                                <Text fontSize="sm" color={log.errorCount > 0 ? 'red.400' : 'gray.500'}>
                                                    {log.errorCount}
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell px={4} py={3} textAlign="center">
                                                <Text fontSize="sm" color="gray.400" fontFamily="mono">
                                                    {formatDuration(log.durationMs)}
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell px={4} py={3}>
                                                <VStack align="start" gap={1}>
                                                    <StatusBadge status={log.status} />
                                                    {log.status === 'failed' && log.errorMessage && (
                                                        <Text fontSize="2xs" color="red.400" maxW="260px" lineClamp={2} title={log.errorMessage}>
                                                            {log.errorMessage}
                                                        </Text>
                                                    )}
                                                </VStack>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        </Box>
                    )}
                </Box>
            </VStack>

            {/* ── Vinculação de Clientes ──────────────────────────────── */}
            <VStack align="stretch" gap={3}>
                <HStack gap={2} mb={1}>
                    <Icon as={PiUsersThree} color="gray.400" boxSize={4} />
                    <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">
                        Vinculação de Clientes aos Processos
                    </Text>
                </HStack>

                <Box bg="gray.900" borderRadius="xl" border="1px solid" borderColor="gray.700" overflow="hidden">
                    <Box px={5} py={4} borderBottom="1px solid" borderColor="gray.700/60">
                        <Text fontSize="sm" color="gray.400">
                            Percorre todos os processos cadastrados, cruza todos os participantes (Cessionário, Exequente, etc.) do
                            Legal One com o CPF dos usuários Mazzotini e cria as participações que estiverem faltando.
                            Use para corrigir processos que foram importados sem vínculo de cotista.
                            O percentual de participação ficará em <strong>0%</strong> — preencha manualmente depois em cada processo.
                        </Text>
                    </Box>
                    <VStack px={5} py={5} gap={4} align="stretch">
                        <HStack gap={4} wrap="wrap" align="flex-end">
                            <Field.Root flex={1} minW="220px" maxW="380px">
                                <Field.Label fontSize="xs" color="gray.400">
                                    Processo específico (opcional)
                                </Field.Label>
                                <Input
                                    placeholder="Ex: 1017936-75.2024.8.26.0100"
                                    value={backfillTarget}
                                    onChange={e => setBackfillTarget(e.target.value)}
                                    bgColor="gray.800"
                                    borderColor="gray.600"
                                    size="sm"
                                    fontFamily="mono"
                                    fontSize="xs"
                                    _focus={{ borderColor: 'blue.500' }}
                                />
                                <Field.HelperText fontSize="2xs" color="gray.600">
                                    Vazio = percorre todos os processos
                                </Field.HelperText>
                            </Field.Root>

                            <Button
                                colorPalette="blue"
                                variant="solid"
                                loading={backfillingInvestors}
                                onClick={handleBackfillInvestors}
                                gap={2}
                                size="sm"
                                mb={5}
                            >
                                <Icon as={PiUsersThree} boxSize={4} />
                                {backfillTarget.trim() ? 'Vincular processo específico' : 'Vincular todos os processos'}
                            </Button>
                        </HStack>

                        {backfillStatus && backfillStatus.status !== 'idle' && (
                            <Box bg="gray.800" borderRadius="lg" border="1px solid" borderColor="gray.700" p={4}>
                                <HStack justify="space-between" mb={2}>
                                    <HStack gap={2}>
                                        {backfillStatus.status === 'running' && <Spinner size="xs" color="blue.400" />}
                                        {backfillStatus.status === 'completed' && <Icon as={PiCheckFat} color="green.400" />}
                                        {backfillStatus.status === 'error' && <Icon as={PiX} color="red.400" />}
                                        <Text fontSize="sm" fontWeight="medium" color={
                                            backfillStatus.status === 'completed' ? 'green.400' :
                                            backfillStatus.status === 'error' ? 'red.400' : 'blue.400'
                                        }>
                                            {backfillStatus.status === 'running' ? 'Vinculando...' :
                                             backfillStatus.status === 'completed' ? 'Concluído' : 'Erro'}
                                        </Text>
                                    </HStack>
                                    <Text fontSize="xs" color="gray.500">
                                        {backfillStatus.processed} / {backfillStatus.total} processos
                                    </Text>
                                </HStack>

                                <Box w="100%" bg="gray.700" borderRadius="full" h="6px" mb={3}>
                                    <Box
                                        bg={backfillStatus.status === 'completed' ? 'green.500' :
                                            backfillStatus.status === 'error' ? 'red.500' : 'blue.500'}
                                        h="6px"
                                        borderRadius="full"
                                        w={`${backfillStatus.total > 0 ? Math.round(((backfillStatus.processed + backfillStatus.skipped) / backfillStatus.total) * 100) : 0}%`}
                                        transition="width 0.4s ease"
                                    />
                                </Box>

                                <HStack gap={4} wrap="wrap">
                                    <HStack gap={1}>
                                        <Text fontSize="xs" color="green.400" fontWeight="bold">{backfillStatus.linked}</Text>
                                        <Text fontSize="xs" color="gray.500">vinculados</Text>
                                    </HStack>
                                    <HStack gap={1}>
                                        <Text fontSize="xs" color="gray.400" fontWeight="bold">{backfillStatus.alreadyLinked}</Text>
                                        <Text fontSize="xs" color="gray.500">já vinculados</Text>
                                    </HStack>
                                    <HStack gap={1}>
                                        <Text fontSize="xs" color="gray.500" fontWeight="bold">{backfillStatus.skipped}</Text>
                                        <Text fontSize="xs" color="gray.500">pulados</Text>
                                    </HStack>
                                    {backfillStatus.errors > 0 && (
                                        <HStack gap={1}>
                                            <Text fontSize="xs" color="red.400" fontWeight="bold">{backfillStatus.errors}</Text>
                                            <Text fontSize="xs" color="gray.500">erros</Text>
                                        </HStack>
                                    )}
                                </HStack>

                                {backfillStatus.status === 'running' && backfillStatus.currentProcess && (
                                    <Text fontSize="2xs" color="gray.600" mt={2} fontFamily="mono">
                                        {backfillStatus.currentProcess}
                                    </Text>
                                )}
                            </Box>
                        )}
                    </VStack>
                </Box>
            </VStack>

            {/* ── Contratos de Honorários ─────────────────────────────── */}
            <VStack align="stretch" gap={3}>
                <HStack gap={2} mb={1}>
                    <Icon as={PiHandshake} color="gray.400" boxSize={4} />
                    <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">
                        Contratos de Honorários
                    </Text>
                </HStack>

                <Box bg="gray.900" borderRadius="xl" border="1px solid" borderColor="gray.700" overflow="hidden">
                    <Box px={5} py={4} borderBottom="1px solid" borderColor="gray.700/60">
                        <Text fontSize="sm" color="gray.400">
                            Sincroniza documentos do GED dos Contratos de Honorários do Legal One. Para cada documento
                            com vínculo de Contato (cliente), o sistema localiza o usuário pelo CPF/CNPJ e disponibiliza
                            o documento na área privada do cliente em <strong>Meus Documentos</strong>.
                        </Text>
                    </Box>
                    <HStack px={5} py={5} gap={4} wrap="wrap" align="center">
                        <Button
                            colorPalette="purple"
                            variant="solid"
                            loading={syncingContracts}
                            onClick={handleSyncContracts}
                            gap={2}
                            size="sm"
                        >
                            <Icon as={PiHandshake} boxSize={4} />
                            Sincronizar contratos de honorários
                        </Button>

                        {syncResult && (
                            <HStack gap={3}>
                                <Badge colorPalette="green" variant="solid" gap={1}>
                                    <Icon as={PiCheckFat} />
                                    {syncResult.imported} importado{syncResult.imported !== 1 ? 's' : ''}
                                </Badge>
                                <Badge colorPalette="gray" variant="outline">
                                    {syncResult.skipped} pulado{syncResult.skipped !== 1 ? 's' : ''}
                                </Badge>
                                {syncResult.errors.length > 0 && (
                                    <Badge colorPalette="red" variant="solid" gap={1}>
                                        <Icon as={PiX} />
                                        {syncResult.errors.length} erro{syncResult.errors.length !== 1 ? 's' : ''}
                                    </Badge>
                                )}
                            </HStack>
                        )}
                    </HStack>
                </Box>
            </VStack>
        </Flex>
    );
}

export default function ConfiguracoesPage() {
    return (
        <AuthenticationGuard>
            <ConfiguracoesContent />
        </AuthenticationGuard>
    );
}
