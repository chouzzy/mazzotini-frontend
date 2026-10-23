'use client';

import { Box, Button, CloseButton, Dialog, Text, VStack } from '@chakra-ui/react';
import { ProcessToMove } from '@/utils/referralChange';

interface ReferralDialogProps {
    open:          boolean;
    associateName: string;
    processes:     ProcessToMove[];
    /**
     * `save`: ao salvar o cadastro com a indicação trocada (dá para gravar só a indicação).
     * `apply`: com a indicação já gravada, só leva o associado para os processos.
     */
    mode:          'save' | 'apply';
    onCancel:      () => void;
    /** true: leva o associado para os processos; false: grava só a indicação. */
    onConfirm:     (applyToProcesses: boolean) => void;
}

/**
 * Pergunta se o associado da indicação deve acompanhar também os processos do cliente. A
 * indicação só registra quem indicou; o portal do associado mostra os processos pelo associado
 * de cada processo, o mesmo campo da carteira.
 */
export function ReferralDialog({ open, associateName, processes, mode, onCancel, onConfirm }: ReferralDialogProps) {
    const count = processes.length;
    const someHaveAssociate = processes.some(p => p.currentAssociate);
    return (
        <Dialog.Root open={open} role="alertdialog" onOpenChange={(d) => !d.open && onCancel()}>
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content bg="gray.800" maxW={{ base: '95vw', md: 'lg' }}>
                    <Dialog.Header>
                        <Dialog.Title>Levar o associado para os processos?</Dialog.Title>
                        <Dialog.CloseTrigger asChild><CloseButton size="sm" aria-label="Fechar" /></Dialog.CloseTrigger>
                    </Dialog.Header>
                    <Dialog.Body>
                        <VStack align="stretch" gap={3}>
                            <Text fontSize="sm" color="gray.300">
                                A indicação registra quem indicou o cliente. Quem acompanha cada processo é o associado da
                                carteira, e é por ele que o associado vê o cliente no portal.
                            </Text>
                            <Text fontSize="sm">
                                {mode === 'save' ? 'Com a nova indicação, ' : 'Com a indicação do cadastro, '}
                                <Text as="span" fontWeight="semibold">{associateName}</Text> pode passar a
                                acompanhar {count === 1 ? 'este processo' : `estes ${count} processos`}:
                            </Text>
                            <Box as="ul" listStyleType="disc" pl={5} fontSize="sm" color="gray.300" maxH="40vh" overflowY="auto">
                                {processes.map(p => (
                                    <Box as="li" key={p.investmentId}>
                                        {p.label}: hoje {p.currentAssociate ? `com ${p.currentAssociate}` : 'sem associado'}
                                    </Box>
                                ))}
                            </Box>
                            {someHaveAssociate && (
                                <Text fontSize="sm" color="gray.400">
                                    Quem acompanha esses processos hoje deixa de vê-los no portal do associado.
                                </Text>
                            )}
                        </VStack>
                    </Dialog.Body>
                    <Dialog.Footer flexWrap="wrap">
                        <Button variant="ghost" colorPalette="gray" onClick={onCancel}>
                            {mode === 'save' ? 'Voltar sem salvar' : 'Voltar'}
                        </Button>
                        {mode === 'save' && (
                            <Button variant="outline" colorPalette="gray" onClick={() => onConfirm(false)}>Só a indicação</Button>
                        )}
                        <Button variant="solid" colorPalette="brand" onClick={() => onConfirm(true)}>
                            {count === 1 ? 'Levar para o processo' : 'Levar para os processos'}
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}
