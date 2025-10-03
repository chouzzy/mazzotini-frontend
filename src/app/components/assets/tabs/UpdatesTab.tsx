'use client';

import {
    Card,
    CardTitle,
    Text,
    VStack,
    Icon,
    Flex,
    Collapsible,
    Box,
    Button,
    Badge,
    Link,
    Tag
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { PiClockClockwise, PiCaretDown } from 'react-icons/pi';
import { DetailedCreditAsset } from '@/app/ativos/[processNumber]/page';
import { extractFreeText } from '@/utils';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

/**
 * Extrai apenas o texto descritivo do andamento, ignorando a tag #SM e os campos de valor.
 * @param description O texto completo do andamento.
 * @returns Apenas a parte descritiva do texto.
 */

interface TabProps {
    asset: DetailedCreditAsset;
}

export function UpdatesTab({ asset }: TabProps) {
    // LÓGICA ATUALIZADA: Filtra apenas os andamentos que contêm a tag '#SM'
    const updatesToDisplay = (asset.updates || [])
        .filter(upd => (upd.fullDescription || upd.description || '').includes('#SM'));

    console.log('Andamentos filtrados com #SM:', updatesToDisplay);
    return (
        <Card.Root variant="outline" bg="gray.900">
            <Card.Body>
                <Card.Title>Histórico de Atualizações do Processo</Card.Title>
                <VStack align="stretch" gap={2} mt={4}>
                    {updatesToDisplay.length > 0 ? (
                        updatesToDisplay.map(upd => {

                            // Extrai o texto limpo para o TÍTULO.
                            const titleText = extractFreeText(upd.fullDescription || upd.description);
                            // Usa a descrição original e completa para o CONTEÚDO.
                            const fullContentText = upd.fullDescription || upd.description;

                            return (
                                <Collapsible.Root key={upd.id} defaultOpen={!upd.read}>
                                    <Collapsible.Trigger
                                        as={Flex}
                                        justifyContent="space-between"
                                        p={4}
                                        bg="gray.800"
                                        _hover={{ bg: 'gray.700' }}
                                        transition="background 0.2s"
                                        cursor="pointer"
                                        w="100%"
                                    >
                                        <Flex align="center">
                                            <VStack align="start" gap={0}>
                                                {/* TÍTULO COM LIMITE: Usa o texto limpo e a prop `noOfLines` o resume. */}
                                                <Text fontWeight="bold">
                                                    <Icon as={PiClockClockwise} mr={2} color={'brand.600'} /> Atualização de crédito: {titleText.length > 80 ? titleText.substring(0, 80).trim() + "..." : titleText}
                                                </Text>
                                                <Text fontSize="sm" color="gray.400">{new Date(upd.date).toLocaleDateString('pt-BR')}</Text>
                                            </VStack>
                                            {(() => {
                                                const today = new Date();
                                                const updateDate = new Date(upd.date);
                                                const isToday =
                                                    updateDate.getDate() === today.getDate() &&
                                                    updateDate.getMonth() === today.getMonth() &&
                                                    updateDate.getFullYear() === today.getFullYear();

                                                const yesterday = new Date();
                                                yesterday.setDate(yesterday.getDate() - 1);
                                                const isYesterday =
                                                    updateDate.getDate() === yesterday.getDate() &&
                                                    updateDate.getMonth() === yesterday.getMonth() &&
                                                    updateDate.getFullYear() === yesterday.getFullYear();

                                                if (isToday) {
                                                    return <Badge variant="solid" colorPalette="green" ml={4}>Hoje!</Badge>;
                                                } else if (isYesterday) {
                                                    return <Badge variant="solid" colorPalette="yellow" ml={4}>Ontem!</Badge>;
                                                } else {
                                                    return null;
                                                }
                                            })()}
                                        </Flex>
                                        <Icon as={PiCaretDown} />
                                    </Collapsible.Trigger>
                                    <Collapsible.Content>
                                        <Flex flexDir={'column'} p={6} border="1px solid" borderColor="gray.700" borderTop="none" bg="gray.900" borderBottomRadius="md" gap={4}>
                                            <Flex align="center" gap={2}>
                                                <Tag.Root size="xl" colorPalette={'black'}>
                                                    <Tag.Label> {upd.type || 'Andamento'}</Tag.Label>
                                                </Tag.Root>
                                            </Flex>
                                            <Text><strong style={{ color: '#B8A76E' }}>Valor Apurado:</strong> {formatCurrency(upd.updatedValue)}</Text>
                                            {/* DESCRIÇÃO COMPLETA: Usa o texto original e completo do andamento. */}
                                            <Text mt={2} color="gray.300" whiteSpace="pre-wrap">
                                                <strong style={{ color: '#B8A76E' }}>Atualização:</strong> {fullContentText}
                                            </Text>
                                            {/* <Link
                                                href={`/ativos/${asset.processNumber}/atualizacao/${upd.id}`}
                                                target='_blank'
                                            >
                                                <Button
                                                    _hover={{ bg: 'brand.500', color: 'black' }}
                                                    size="sm"
                                                    variant="outline"
                                                    mt={4}
                                                >
                                                    Ver Detalhes Completos
                                                </Button>
                                            </Link> */}
                                        </Flex>
                                    </Collapsible.Content>
                                </Collapsible.Root>
                            );
                        })
                    ) : (
                        <Text color="gray.500" p={4}>Nenhum histórico de atualizações (#SM) para este ativo até o momento.</Text>
                    )}
                </VStack>
            </Card.Body>
        </Card.Root>
    );
}

