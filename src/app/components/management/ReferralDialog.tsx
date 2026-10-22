'use client';

import { Box, Button, CloseButton, Dialog, Text, VStack } from '@chakra-ui/react';
import { ProcessToMove } from '@/utils/referralChange';

interface ReferralDialogProps {
    /** Associado da nova indicação; null mantém o diálogo fechado. */
    associateName: string | null;
    processes:     ProcessToMove[];
    onCancel:      () => void;
    /** true: leva o associado para os processos; false: grava só a indicação. */
    onConfirm:     (applyToProcesses: boolean) => void;
}

/**
 * Ao trocar a indicação do cliente por um associado cadastrado, pergunta se esse associado deve
 * acompanhar também os processos dele. A indicação só registra quem indicou; o portal do
 * associado mostra os processos pelo associado de cada processo, o mesmo campo da carteira.
 */
export function ReferralDialog({ associateName, processes, onCancel, onConfirm }: ReferralDialogProps) {
    const count = processes.length;
    return (
        <Dialog.Root open={associateName !== null} onOpenChange={(d) => !d.open && onCancel()}>
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content bg="gray.800" maxW={{ base: '95vw', md: 'lg' }}>
                    <Dialog.Header>
                        <Dialog.Title>Levar o associado para os processos?</Dialog.Title>
                        <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                    </Dialog.Header>
                    <Dialog.Body>
                        <VStack align="stretch" gap={3}>
                            <Text fontSize="sm" color="gray.300">
                                A indicação registra quem indicou o cliente. Quem acompanha cada processo é o associado da
                                carteira, e é por ele que o associado vê o cliente no portal.
                            </Text>
                            <Text fontSize="sm">
                                Com a nova indicação, <Text as="span" fontWeight="semibold">{associateName}</Text> pode
                                passar a acompanhar {count === 1 ? 'este processo' : `estes ${count} processos`}:
                            </Text>
                            <Box as="ul" listStyleType="disc" pl={5} fontSize="sm" color="gray.300">
                                {processes.map((p, i) => (
                                    <Box as="li" key={`${p.label}-${i}`}>
                                        {p.label}: hoje {p.currentAssociate ? `com ${p.currentAssociate}` : 'sem associado'}
                                    </Box>
                                ))}
                            </Box>
                        </VStack>
                    </Dialog.Body>
                    <Dialog.Footer flexWrap="wrap">
                        <Button variant="ghost" colorPalette="gray" onClick={onCancel}>Cancelar</Button>
                        <Button variant="outline" colorPalette="gray" onClick={() => onConfirm(false)}>Só a indicação</Button>
                        <Button variant="solid" colorPalette="brand" onClick={() => onConfirm(true)}>
                            {count === 1 ? 'Levar para o processo' : 'Levar para os processos'}
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}
