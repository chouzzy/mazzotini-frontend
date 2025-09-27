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

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// DADOS MOCKADOS (ENRIQUECIDOS COM MAIS DETALHES)
const mockUpdates = [
    {
        id: 'mock1',
        date: '2025-09-15T10:00:00Z',
        updatedValue: 55250,
        description: 'Sentença favorável em segunda instância',
        type: 'Decisão Judicial',
        read: false,
        fullDescription: 'O tribunal de segunda instância manteve a decisão favorável, ajustando o valor do crédito conforme a apelação. O valor foi recalculado para refletir os juros e a correção monetária até a data da sentença.'
    },
    {
        id: 'mock2',
        date: '2025-07-22T14:30:00Z',
        updatedValue: 52000,
        description: 'Perícia judicial concluiu o novo valor',
        type: 'Ato Processual',
        read: true,
        fullDescription: 'O perito nomeado pelo juiz entregou o laudo técnico, atualizando o valor do crédito com base nos cálculos de juros de mora e correção. Este valor serve como nova base para a negociação.'
    },
    {
        id: 'mock3',
        date: '2025-05-10T09:00:00Z',
        updatedValue: 39500,
        description: 'Recurso da parte contrária recebido',
        type: 'Ato Processual',
        read: true,
        fullDescription: 'A parte devedora entrou com um recurso de apelação contra a decisão inicial, o que suspende temporariamente a execução e leva o processo para a segunda instância.'
    },
];

interface TabProps {
    asset: DetailedCreditAsset;
}

export function UpdatesTab({ asset }: TabProps) {
    // Lógica inteligente: se o ativo real não tiver atualizações, usamos os dados mockados como fallback.
    const updatesToDisplay = asset.updates && asset.updates.length > 0 ? asset.updates : mockUpdates;

    return (
        <Card.Root variant="outline" bg="gray.900">
            <Card.Body>
                <Card.Title>Histórico de Atualizações do Processo</Card.Title>
                <VStack align="stretch" gap={2} mt={4}>
                    {updatesToDisplay.map(upd => (
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
                                        <Text fontWeight="bold">
                                            <Icon as={PiClockClockwise} mr={2} color={'brand.600'}/> {upd.description || "Atualização de Valor"}
                                        </Text>
                                        <Text fontSize="sm" color="gray.400">{new Date(upd.date).toLocaleDateString('pt-BR')}</Text>
                                    </VStack>
                                    {!upd.read && <Badge variant="solid" colorPalette="white" ml={4}>Novo!</Badge>}
                                </Flex>
                                <Icon as={PiCaretDown} />
                            </Collapsible.Trigger>
                            <Collapsible.Content>
                                <Flex flexDir={'column'} p={6} border="1px solid" borderColor="gray.700" borderTop="none" bg="gray.900" borderBottomRadius="md" gap={4}>
                                    <Flex align="center" gap={2}>
                                        <Tag.Root size="xl" colorPalette={'black'}>
                                            <Tag.Label> {upd.type}</Tag.Label>
                                        </Tag.Root>
                                       
                                    </Flex>
                                    <Text><strong style={{ color: '#B8A76E' }}>Valor Apurado:</strong> {formatCurrency(upd.updatedValue)}</Text>
                                    <Text mt={2} color="gray.300"><strong style={{ color: '#B8A76E' }}>Atualização:</strong> {upd.fullDescription}</Text>
                                    <Link
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
                                    </Link>
                                </Flex>
                            </Collapsible.Content>
                        </Collapsible.Root>
                    ))}
                </VStack>
            </Card.Body>
        </Card.Root>
    );
}
