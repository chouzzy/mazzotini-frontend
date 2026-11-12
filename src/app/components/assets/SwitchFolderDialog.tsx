'use client';

import { Badge, Box, Button, Checkbox, Dialog, Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PiX } from 'react-icons/pi';
import { toaster } from '@/components/ui/toaster';

/**
 * Troca a pasta do Legal One a que o processo está ligado (só admin).
 *
 * Serve para o número de processo que está em mais de uma pasta no Legal One, quando o portal
 * ficou com a pasta errada (em geral, a baixada). Mostra as pastas, a prévia do que muda e só
 * troca depois da confirmação. O cálculo, o histórico, os andamentos, os documentos e os
 * clientes ficam no processo. Na prévia, o admin desmarca os envolvidos da pasta nova que
 * não são clientes (o advogado cadastrado como cliente no Legal One, por exemplo).
 */

export interface FolderOption {
    legalOneId: number;
    folder: string;
    legalOneType: string;
    active: boolean;
    terminationDate: string | null;
    isCurrent: boolean;
    inPortal: boolean;
}

/** Envolvido da pasta nova que ainda não é cliente do processo. */
export interface SwitchFolderCandidate {
    contactId: number;
    name: string;
    position: string | null;
    type: string;
}

export interface SwitchFolderResult {
    dryRun: boolean;
    processNumber: string;
    from: { legalOneId: number; folder: string | null };
    to: { legalOneId: number; folder: string; active: boolean };
    kept: { investments: number; updates: number; documents: number; calculationLogs: number; hasCalculation: boolean };
    newClients: string[];
    /** Só nas versões do servidor que aceitam tirar envolvidos */
    candidates?: SwitchFolderCandidate[];
    excluded?: number;
    syncError?: string;
}

interface SwitchFolderDialogProps {
    open: boolean;
    onClose: () => void;
    legalOneId: number;
}

const errorMessage = (err: any, fallback: string) => err?.response?.data?.error || fallback;

export function SwitchFolderDialog({ open, onClose, legalOneId }: SwitchFolderDialogProps) {
    const { getAccessTokenSilently } = useAuth0();
    const router = useRouter();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    const [options, setOptions] = useState<FolderOption[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [preview, setPreview] = useState<SwitchFolderResult | null>(null);
    const [excludedIds, setExcludedIds] = useState<Set<number>>(new Set());
    const [busy, setBusy] = useState(false);

    const authHeaders = async () => {
        const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
        return { Authorization: `Bearer ${token}` };
    };

    useEffect(() => {
        if (!open) return;
        setOptions(null); setLoadError(null); setSelected(null); setPreview(null); setExcludedIds(new Set());
        let cancelled = false;
        (async () => {
            try {
                const { data } = await axios.get<{ options: FolderOption[] }>(
                    `${apiBaseUrl}/api/assets/${legalOneId}/folder-options`, { headers: await authHeaders() });
                if (!cancelled) setOptions(data.options);
            } catch (err) {
                if (!cancelled) setLoadError(errorMessage(err, 'Não foi possível buscar as pastas no Legal One.'));
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, legalOneId]);

    const choose = (id: number) => { setSelected(id); setPreview(null); setExcludedIds(new Set()); };

    const toggleCandidate = (contactId: number, keep: boolean) => {
        setExcludedIds(prev => {
            const next = new Set(prev);
            if (keep) next.delete(contactId); else next.add(contactId);
            return next;
        });
    };

    const runPreview = async () => {
        if (selected === null) return;
        setBusy(true);
        try {
            const { data } = await axios.post<SwitchFolderResult>(
                `${apiBaseUrl}/api/assets/${legalOneId}/switch-folder`,
                { targetLegalOneId: selected, dryRun: true },
                { headers: await authHeaders() });
            setPreview(data);
            setExcludedIds(new Set());
        } catch (err) {
            toaster.create({ title: 'Não foi possível montar a prévia', description: errorMessage(err, 'Tente de novo.'), type: 'error' });
        } finally {
            setBusy(false);
        }
    };

    const confirm = async () => {
        if (!preview) return;
        setBusy(true);
        try {
            const { data } = await axios.post<SwitchFolderResult>(
                `${apiBaseUrl}/api/assets/${legalOneId}/switch-folder`,
                excludedIds.size > 0
                    ? { targetLegalOneId: preview.to.legalOneId, excludeContactIds: [...excludedIds] }
                    : { targetLegalOneId: preview.to.legalOneId },
                { headers: await authHeaders() });
            toaster.create({
                title: 'Pasta trocada',
                description: data.syncError
                    ?? `O processo agora está ligado à pasta ${data.to.folder}.${data.newClients.length ? ` ${data.newClients.length} cliente(s) entraram no processo.` : ''}`,
                type: data.syncError ? 'warning' : 'success',
                duration: 8000,
            });
            onClose();
            // O endereço da tela usa o id do Legal One, que mudou
            router.replace(`/processos/${data.to.legalOneId}`);
        } catch (err) {
            toaster.create({ title: 'A pasta não foi trocada', description: errorMessage(err, 'Tente de novo.'), type: 'error' });
        } finally {
            setBusy(false);
        }
    };

    const candidates = preview?.candidates;
    const keptCandidates = candidates?.filter(c => !excludedIds.has(c.contactId)) ?? [];
    const others = options?.filter(o => !o.isCurrent) ?? [];
    const current = options?.find(o => o.isCurrent);

    return (
        <Dialog.Root open={open} onOpenChange={(d) => !d.open && !busy && onClose()} size="lg" role="alertdialog">
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content bg="gray.800" maxW={{ base: '95vw', md: 'xl' }}>
                    <Dialog.Header>
                        <Dialog.Title>Trocar pasta do Legal One</Dialog.Title>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="solid" colorPalette="gray" size="sm" aria-label="Fechar" disabled={busy}><PiX /></Button>
                        </Dialog.CloseTrigger>
                    </Dialog.Header>
                    <Dialog.Body>
                        <VStack align="stretch" gap={4}>
                            <Text color="gray.300" fontSize="sm">
                                Use quando o mesmo número de processo está em mais de uma pasta no Legal One e o portal ficou com a errada.
                                O cálculo, o histórico, os andamentos, os documentos e os clientes continuam no processo.
                            </Text>

                            {!options && !loadError && <Flex justify="center" py={6}><Spinner /></Flex>}
                            {loadError && <Text color="red.300">{loadError}</Text>}

                            {current && (
                                <Text fontSize="sm" color="gray.400">
                                    Pasta atual: <b>{current.folder || `Legal One ${current.legalOneId}`}</b> ({current.active ? 'ativa' : 'baixada'})
                                </Text>
                            )}

                            {options && others.length === 0 && (
                                <Text color="gray.300">Não há outra pasta com este número no Legal One.</Text>
                            )}

                            {others.length > 0 && (
                                <VStack align="stretch" gap={2} role="group" aria-label="Pastas com o mesmo número">
                                    {others.map(o => {
                                        const sameType = o.legalOneType === current?.legalOneType;
                                        const disabled = o.inPortal || !sameType || busy;
                                        return (
                                            <Button
                                                key={o.legalOneId}
                                                onClick={() => choose(o.legalOneId)}
                                                disabled={disabled}
                                                aria-pressed={selected === o.legalOneId}
                                                variant={selected === o.legalOneId ? 'solid' : 'outline'}
                                                bgColor={selected === o.legalOneId ? 'brand.700' : undefined}
                                                justifyContent="space-between"
                                                h="auto" py={3} whiteSpace="normal" textAlign="left"
                                            >
                                                <Box>
                                                    <Text fontWeight="semibold">{o.folder || `Legal One ${o.legalOneId}`}</Text>
                                                    <Text fontSize="xs" color="gray.300">
                                                        {o.inPortal ? 'Já está no portal como outro processo'
                                                            : !sameType ? 'É um recurso ou incidente, não o mesmo tipo'
                                                            : `ID ${o.legalOneId} no Legal One`}
                                                    </Text>
                                                </Box>
                                                <Badge colorPalette={o.active ? 'green' : 'gray'} variant="solid">{o.active ? 'Ativa' : 'Baixada'}</Badge>
                                            </Button>
                                        );
                                    })}
                                </VStack>
                            )}

                            {preview && (
                                <Box bg="gray.900" p={4} borderRadius="md" borderWidth="1px" borderColor="brand.700" aria-live="polite">
                                    <Text fontWeight="semibold" mb={2}>O que muda</Text>
                                    <VStack align="stretch" gap={1} fontSize="sm" color="gray.200">
                                        <Text>O processo passa da pasta {preview.from.folder || `do Legal One ${preview.from.legalOneId}`} para a {preview.to.folder}{preview.to.active ? '' : ', que está baixada'}. A pasta atual sai do portal.</Text>
                                        <Text>
                                            Continuam no processo: {preview.kept.investments} cliente(s), {preview.kept.updates} andamento(s), {preview.kept.documents} documento(s)
                                            {preview.kept.hasCalculation ? ', o cálculo' : ''} e {preview.kept.calculationLogs} registro(s) no histórico de cálculos.
                                        </Text>
                                        {candidates && candidates.length > 0 ? (
                                            <Box>
                                                <Text>
                                                    Envolvidos da pasta nova que ainda não estão no processo. Os marcados entram como clientes, sem associado;
                                                    desmarque quem não é cliente (advogado, parte contrária).
                                                </Text>
                                                <VStack align="stretch" gap={1} mt={2} role="group" aria-label="Envolvidos que entram como clientes">
                                                    {candidates.map(c => (
                                                        <Checkbox.Root
                                                            key={c.contactId}
                                                            checked={!excludedIds.has(c.contactId)}
                                                            onCheckedChange={(d) => toggleCandidate(c.contactId, Boolean(d.checked))}
                                                            disabled={busy}
                                                        >
                                                            <Checkbox.HiddenInput />
                                                            <Checkbox.Control bgColor={'gray.100'} color={'black'} />
                                                            <Checkbox.Label>{c.name}{c.position ? ` (${c.position})` : ''}</Checkbox.Label>
                                                        </Checkbox.Root>
                                                    ))}
                                                </VStack>
                                                {keptCandidates.length === 0 && (
                                                    <Text mt={2} color="gray.400">Nenhum envolvido entra: o processo fica só com os clientes de hoje.</Text>
                                                )}
                                            </Box>
                                        ) : (
                                            <Text>
                                                {preview.newClients.length > 0
                                                    ? `Entram como clientes, sem associado: ${preview.newClients.join(', ')}.`
                                                    : 'Nenhum cliente novo: os envolvidos da pasta nova já estão no processo.'}
                                            </Text>
                                        )}
                                        <Text>Depois, a sincronização traz os andamentos e documentos da pasta nova e os recursos e incidentes dela.</Text>
                                    </VStack>
                                </Box>
                            )}
                        </VStack>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
                        {!preview ? (
                            <Button onClick={runPreview} loading={busy} disabled={selected === null} bgColor="brand.500">Ver o que muda</Button>
                        ) : (
                            <Button onClick={confirm} loading={busy} loadingText="Trocando" bgColor="brand.500">Trocar pasta</Button>
                        )}
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}
