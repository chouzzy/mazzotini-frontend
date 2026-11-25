'use client';

import { useState } from 'react';
import { Badge, Box, Button, HStack, Icon, Table, Text, VStack } from '@chakra-ui/react';
import { PiHandshake } from 'react-icons/pi';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { toaster } from '@/components/ui/toaster';

interface MissingReferralItem {
    userId: string;
    userName: string | null;
    associateId: string;
    associateName: string | null;
    investments: number;
}

interface ApplyMissingReferralsResult {
    dryRun: boolean;
    clients: number;
    investments: number;
    items: MissingReferralItem[];
    freeTextReferrals: number;
}

const ENDPOINT = '/api/management/referrals/apply-missing';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Leva o associado indicado no cadastro aos processos do cliente que estão sem associado (D20).
 * Primeiro simula; o "Aplicar" só aparece depois da simulação.
 */
export function ReferralToProcessesSection() {
    const { getAccessTokenSilently } = useAuth0();
    const [result, setResult] = useState<ApplyMissingReferralsResult | null>(null);
    const [running, setRunning] = useState<'simulate' | 'apply' | null>(null);

    const run = async (dryRun: boolean) => {
        setRunning(dryRun ? 'simulate' : 'apply');
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE } });
            const { data } = await axios.post<ApplyMissingReferralsResult>(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}${ENDPOINT}`,
                { dryRun },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            setResult(data);
            if (!dryRun) {
                toaster.create({
                    title: 'Indicação levada aos processos.',
                    description: `${plural(data.investments, 'processo recebeu', 'processos receberam')} o associado da indicação.`,
                    type: 'success',
                });
            }
        } catch (err: any) {
            toaster.create({
                title: dryRun ? 'Não foi possível simular.' : 'Não foi possível aplicar.',
                description: err?.response?.data?.error,
                type: 'error',
            });
        } finally {
            setRunning(null);
        }
    };

    const canApply = result?.dryRun && result.investments > 0;

    return (
        <>
            <HStack gap={2} mb={1} mt={6}>
                <Icon as={PiHandshake} color="gray.400" boxSize={4} />
                <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">
                    Indicação nos Processos
                </Text>
            </HStack>

            <Box bg="gray.900" borderRadius="xl" border="1px solid" borderColor="gray.700" overflow="hidden">
                <Box px={5} py={4} borderBottom="1px solid" borderColor="gray.700/60">
                    <Text fontSize="sm" color="gray.400">
                        Leva o associado indicado no cadastro do cliente para os processos dele que estão <strong>sem associado</strong>.
                        Só usa indicação de um associado cadastrado, e o processo que já tem associado não muda.
                        Comece por <strong>Simular</strong>: nada é gravado até você clicar em Aplicar.
                    </Text>
                </Box>

                <VStack px={5} py={5} gap={4} align="stretch">
                    <HStack gap={3} wrap="wrap">
                        <Button size="sm" variant="outline" colorPalette="gray" loading={running === 'simulate'} disabled={running !== null} onClick={() => run(true)}>
                            Simular
                        </Button>
                        {canApply && (
                            <Button size="sm" colorPalette="blue" loading={running === 'apply'} disabled={running !== null} onClick={() => run(false)}>
                                Aplicar em {plural(result!.investments, 'processo', 'processos')}
                            </Button>
                        )}
                    </HStack>

                    {result && (
                        <VStack align="stretch" gap={3}>
                            <HStack gap={2} wrap="wrap">
                                <Badge colorPalette={result.dryRun ? 'yellow' : 'green'} variant="subtle">
                                    {result.dryRun ? 'Simulação' : 'Aplicado'}
                                </Badge>
                                <Text fontSize="sm" color="gray.300">
                                    {result.dryRun
                                        ? `${plural(result.investments, 'processo', 'processos')} de ${plural(result.clients, 'cliente', 'clientes')} receberiam o associado da indicação.`
                                        : `${plural(result.investments, 'processo recebeu', 'processos receberam')} o associado da indicação.`}
                                </Text>
                            </HStack>

                            {result.freeTextReferrals > 0 && (
                                <Text fontSize="xs" color="gray.500">
                                    {plural(result.freeTextReferrals, 'cliente tem', 'clientes têm')} indicação só em texto livre e processos sem
                                    associado. Para esses, escolha o associado cadastrado em Editar Usuário.
                                </Text>
                            )}

                            {result.dryRun && result.items.length > 0 && (
                                <Box maxH="320px" overflowY="auto" border="1px solid" borderColor="gray.700" borderRadius="lg">
                                    <Table.Root size="sm" variant="line">
                                        <Table.Header>
                                            <Table.Row>
                                                <Table.ColumnHeader>Cliente</Table.ColumnHeader>
                                                <Table.ColumnHeader>Associado da indicação</Table.ColumnHeader>
                                                <Table.ColumnHeader textAlign="end">Processos</Table.ColumnHeader>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            {result.items.map(item => (
                                                <Table.Row key={item.userId}>
                                                    <Table.Cell>{item.userName ?? '—'}</Table.Cell>
                                                    <Table.Cell>{item.associateName ?? '—'}</Table.Cell>
                                                    <Table.Cell textAlign="end">{item.investments}</Table.Cell>
                                                </Table.Row>
                                            ))}
                                        </Table.Body>
                                    </Table.Root>
                                </Box>
                            )}
                        </VStack>
                    )}
                </VStack>
            </Box>
        </>
    );
}
