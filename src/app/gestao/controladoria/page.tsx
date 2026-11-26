'use client';

import NextLink from 'next/link';
import {
    Box, Button, Flex, Heading, Icon, Link, SimpleGrid, Spinner, Table, Text, VStack,
} from '@chakra-ui/react';
import { PiArrowClockwise, PiWarningCircle } from 'react-icons/pi';
import { useApi } from '@/hooks/useApi';
import { AuthenticationGuard } from '@/app/components/auth/AuthenticationGuard';
import { RoleGuard } from '@/app/components/auth/RoleGuard';

/** Resposta de GET /api/management/control-panel. */
export interface ControlPanel {
    generatedAt: string;
    legalOneStatus: {
        closedByJob: number;
        lastRun: { finishedAt: string | null; checked: number; notFound: number; closed: number; reopened: number } | null;
    };
    withoutAssociate: { investments: number; fixableByReferral: number; freeTextReferralClients: number };
    shadowDuplicates: { accounts: number; shadows: number; shadowInvestments: number; ambiguous: number };
    recalculation: {
        period: string;
        status: string | null;
        finishedAt: string | null;
        recalculated: number;
        failures: number;
        failureList: { legalOneId: number | null; processNumber: string | null; error: string }[] | null;
    } | null;
    backfill: {
        status: string;
        startedAt: string | null;
        finishedAt: string | null;
        total: number;
        errors: number;
        errorList: { processNumber: string; legalOneId: number | null; contactId: number | null; reason: string }[];
    };
    staleIndexes: { indexName: string; label: string; lastMonth: string | null }[];
}

const MAX_ROWS = 50;
const num = (n: number) => n.toLocaleString('pt-BR');
const dateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—');
const period = (p: string) => p.split('-').reverse().join('/');

const BACKFILL_STATUS: Record<string, string> = {
    idle: 'Não rodou desde o último reinício do servidor',
    running: 'Em andamento',
    completed: 'Concluído',
    error: 'Parou com erro',
};

const RECALC_STATUS: Record<string, string> = { RUNNING: 'Em andamento', DONE: 'Concluído', MISSED: 'Não rodou' };

function Counter({ title, value, alert, children }: { title: string; value: number; alert: boolean; children: React.ReactNode }) {
    return (
        <Box bg="gray.900" borderRadius="md" p={5} borderLeftWidth="4px" borderLeftColor={alert ? 'orange.400' : 'green.500'}>
            <Text fontSize="sm" color="gray.400" textTransform="uppercase" letterSpacing="wide">{title}</Text>
            <Text fontSize="3xl" fontWeight="bold" color={alert ? 'orange.300' : 'green.300'} my={1}>{num(value)}</Text>
            <VStack align="start" gap={1} fontSize="sm" color="gray.300">{children}</VStack>
        </Box>
    );
}

function ProcessLink({ legalOneId, processNumber }: { legalOneId: number | null; processNumber: string | null }) {
    const label = processNumber || (legalOneId ? `Legal One ${legalOneId}` : '—');
    if (!legalOneId) return <>{label}</>;
    return (
        <Link asChild color="brand.300">
            <NextLink href={`/processos/${legalOneId}`}>{label}</NextLink>
        </Link>
    );
}

export default function ControlPanelPage() {
    const { data, isLoading, error, mutate } = useApi<ControlPanel>('/api/management/control-panel');

    return (
        <AuthenticationGuard>
            <RoleGuard>
                <VStack gap={8} align="stretch" w="100%">
                    <Flex justify="space-between" align={{ base: 'start', md: 'center' }} gap={4} direction={{ base: 'column', md: 'row' }}>
                        <Box>
                            <Heading as="h1" size="xl">Controladoria</Heading>
                            <Text color="gray.400">
                                Pendências de cadastro e de integração com o Legal One. Os números são lidos na hora; cada correção é feita na tela indicada.
                            </Text>
                        </Box>
                        <Button size="sm" variant="outline" onClick={() => mutate()} loading={isLoading}>
                            <PiArrowClockwise /> Atualizar
                        </Button>
                    </Flex>

                    {isLoading && !data && <Flex justify="center" py={10}><Spinner size="xl" /></Flex>}

                    {error && !data && (
                        <Flex gap={3} bg="red.900" p={4} borderRadius="md" align="center">
                            <Icon as={PiWarningCircle} boxSize={6} color="red.300" />
                            <Text>Não foi possível carregar o painel da Controladoria.</Text>
                        </Flex>
                    )}

                    {data && (
                        <>
                            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={4}>
                                <Counter title="Encerrados pelo Legal One" value={data.legalOneStatus.closedByJob} alert={false}>
                                    <Text>Processos que estavam &quot;Ativo&quot; aqui e baixados no Legal One. O job de domingo, às 2h, ajusta a situação sozinho.</Text>
                                    {data.legalOneStatus.lastRun ? (
                                        <Text color="gray.400">
                                            Última execução: {dateTime(data.legalOneStatus.lastRun.finishedAt)}. {num(data.legalOneStatus.lastRun.checked)} conferidos,{' '}
                                            {num(data.legalOneStatus.lastRun.closed)} encerrados, {num(data.legalOneStatus.lastRun.reopened)} reabertos,{' '}
                                            {num(data.legalOneStatus.lastRun.notFound)} não encontrados no Legal One.
                                        </Text>
                                    ) : (
                                        <Text color="gray.400">O job ainda não rodou.</Text>
                                    )}
                                </Counter>

                                <Counter title="Processos sem associado" value={data.withoutAssociate.investments} alert={data.withoutAssociate.investments > 0}>
                                    <Text>
                                        {num(data.withoutAssociate.fixableByReferral)} têm associado indicado no cadastro do cliente: em{' '}
                                        <Link asChild color="brand.300"><NextLink href="/configuracoes">Configurações</NextLink></Link>, &quot;Simular&quot; e &quot;Aplicar&quot;.
                                    </Text>
                                    <Text color="gray.400">
                                        {num(data.withoutAssociate.freeTextReferralClients)} clientes têm a indicação só em texto livre: escolha o associado em Editar Usuário.
                                    </Text>
                                </Counter>

                                <Counter title="Cadastros duplicados" value={data.shadowDuplicates.shadows} alert={data.shadowDuplicates.shadows > 0 || data.shadowDuplicates.ambiguous > 0}>
                                    <Text>
                                        Cadastros importados do Legal One com o CPF/CNPJ de {num(data.shadowDuplicates.accounts)} contas aprovadas,
                                        com {num(data.shadowDuplicates.shadowInvestments)} processos. A junção é feita pelo suporte.
                                    </Text>
                                    {data.shadowDuplicates.ambiguous > 0 && (
                                        <Text color="orange.300">{num(data.shadowDuplicates.ambiguous)} documentos têm mais de uma conta aprovada e precisam de revisão.</Text>
                                    )}
                                </Counter>

                                <Counter title="Recusados no recálculo" value={data.recalculation?.failures ?? 0} alert={(data.recalculation?.failures ?? 0) > 0}>
                                    {data.recalculation ? (
                                        <Text>
                                            Recálculo de {period(data.recalculation.period)}: {RECALC_STATUS[data.recalculation.status ?? ''] ?? data.recalculation.status ?? '—'},{' '}
                                            {num(data.recalculation.recalculated)} recalculados. O processo recusado fica com o valor anterior.
                                        </Text>
                                    ) : (
                                        <Text>O recálculo mensal ainda não foi registrado.</Text>
                                    )}
                                </Counter>

                                <Counter title='Erros do "Vincular todos"' value={data.backfill.errors} alert={data.backfill.errors > 0}>
                                    <Text>{BACKFILL_STATUS[data.backfill.status] ?? data.backfill.status}{data.backfill.finishedAt ? ` em ${dateTime(data.backfill.finishedAt)}` : ''}.</Text>
                                    <Text color="gray.400">
                                        A lista completa e o CSV ficam em <Link asChild color="brand.300"><NextLink href="/configuracoes">Configurações</NextLink></Link>.
                                    </Text>
                                </Counter>

                                <Counter title="Índices atrasados" value={data.staleIndexes.length} alert={data.staleIndexes.length > 0}>
                                    {data.staleIndexes.length === 0 ? (
                                        <Text>Todos os índices estão em dia.</Text>
                                    ) : (
                                        data.staleIndexes.map(i => (
                                            <Text key={i.indexName}>{i.label}: {i.lastMonth ? `último mês ${i.lastMonth}` : 'nenhum mês no banco'}</Text>
                                        ))
                                    )}
                                </Counter>
                            </SimpleGrid>

                            {data.recalculation && data.recalculation.failures > 0 && (
                                <Box>
                                    <Heading size="md" mb={2}>Recusados no recálculo de {period(data.recalculation.period)}</Heading>
                                    {data.recalculation.failureList ? (
                                        <FailureTable rows={data.recalculation.failureList.map(f => ({ legalOneId: f.legalOneId, processNumber: f.processNumber, reason: f.error }))} />
                                    ) : (
                                        <Text color="gray.400">A lista deste mês não foi registrada (recálculo anterior ao painel). Os recusados aparecem nas notificações.</Text>
                                    )}
                                </Box>
                            )}

                            {data.backfill.errorList.length > 0 && (
                                <Box>
                                    <Heading size="md" mb={2}>Erros do último &quot;Vincular todos&quot;</Heading>
                                    <FailureTable rows={data.backfill.errorList} />
                                </Box>
                            )}

                            <Text fontSize="xs" color="gray.500">Atualizado em {dateTime(data.generatedAt)}.</Text>
                        </>
                    )}
                </VStack>
            </RoleGuard>
        </AuthenticationGuard>
    );
}

function FailureTable({ rows }: { rows: { legalOneId: number | null; processNumber: string | null; reason: string }[] }) {
    return (
        <Box overflowX="auto" bg="gray.900" borderRadius="md">
            <Table.Root size="sm">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>Processo</Table.ColumnHeader>
                        <Table.ColumnHeader>Motivo</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {rows.slice(0, MAX_ROWS).map((r, i) => (
                        <Table.Row key={`${r.legalOneId ?? r.processNumber}-${i}`}>
                            <Table.Cell whiteSpace="nowrap"><ProcessLink legalOneId={r.legalOneId} processNumber={r.processNumber} /></Table.Cell>
                            <Table.Cell>{r.reason}</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
            {rows.length > MAX_ROWS && (
                <Text fontSize="sm" color="gray.400" p={3}>Mostrando {MAX_ROWS} de {num(rows.length)}.</Text>
            )}
        </Box>
    );
}
