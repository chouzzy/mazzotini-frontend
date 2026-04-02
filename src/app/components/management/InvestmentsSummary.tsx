'use client';

import { Flex, Heading, Text, Icon, Button, Table, Tag, Badge } from '@chakra-ui/react';
import { PiChartLineUp, PiArrowRight } from 'react-icons/pi';
import Link from 'next/link';
import { useState } from 'react';

const INITIAL_VISIBLE = 3;
const LOAD_MORE_STEP = 10;

interface InvestmentsSummaryProps {
    userId: string;
    investments: any[];
}

export function InvestmentsSummary({ userId, investments }: InvestmentsSummaryProps) {
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

    if (investments.length === 0) {
        return (
            <Flex p={6} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700" direction="column" gap={4}>
                <Flex justify="space-between" align="center">
                    <Heading size="md" display="flex" gap={2} alignItems="center">
                        <Icon as={PiChartLineUp} color="brand.400" /> Carteira de Investimentos
                    </Heading>
                    <Link href={`/gestao/usuarios/${userId}/carteira`} passHref>
                        <Button size="xs" variant="solid" colorPalette="blue" type="button">
                            <Icon as={PiChartLineUp} /> Gerenciar Carteira
                        </Button>
                    </Link>
                </Flex>
                <Text color="gray.500" fontSize="sm">Este usuário não possui investimentos vinculados.</Text>
            </Flex>
        );
    }

    return (
        <Flex p={6} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700" direction="column" gap={4}>
            <Flex justify="space-between" align="center">
                <Heading size="md" display="flex" gap={2} alignItems="center">
                    <Icon as={PiChartLineUp} color="brand.400" /> Carteira de Investimentos
                    <Badge colorPalette="cyan" variant="solid" ml={1}>{investments.length}</Badge>
                </Heading>
                <Link href={`/gestao/usuarios/${userId}/carteira`} passHref>
                    <Button size="xs" variant="solid" colorPalette="blue" type="button">
                        <Icon as={PiChartLineUp} /> Gerenciar Carteira
                    </Button>
                </Link>
            </Flex>

            <Table.Root variant="line" size="sm" bgColor="bodyBg">
                <Table.Header>
                    <Table.Row borderBottom="1px solid" borderColor="gray.700" bgColor="gray.900">
                        <Table.ColumnHeader color="brand.600" px={4}>Nº do Processo</Table.ColumnHeader>
                        <Table.ColumnHeader color="brand.600" px={4}>Parte Contrária</Table.ColumnHeader>
                        <Table.ColumnHeader color="brand.600" px={4}>Status</Table.ColumnHeader>
                        <Table.ColumnHeader px={4} />
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {investments.slice(0, visibleCount).map((inv: any) => (
                        <Table.Row key={inv.asset.id} bgColor="gray.900" _hover={{ bg: 'whiteAlpha.50' }}>
                            <Table.Cell px={4} py={3} fontWeight="semibold">{inv.asset.processNumber}</Table.Cell>
                            <Table.Cell px={4} py={3} color="gray.400" fontSize="sm">
                                {inv.asset.nickname || inv.asset.otherParty || '—'}
                            </Table.Cell>
                            <Table.Cell px={4} py={3}>
                                <Tag.Root size="sm" variant="solid" colorPalette={
                                    inv.asset.status === 'Ativo' ? 'green' :
                                    inv.asset.status === 'Liquidado' ? 'gray' :
                                    inv.asset.status === 'Em Negociação' ? 'yellow' : 'blue'
                                }>
                                    <Tag.Label>{inv.asset.status}</Tag.Label>
                                </Tag.Root>
                            </Table.Cell>
                            <Table.Cell px={4} py={3} textAlign="right">
                                <Link href={`/processos/${inv.asset.legalOneId}`} passHref>
                                    <Button size="xs" variant="ghost" colorPalette="blue" type="button">
                                        <Icon as={PiArrowRight} />
                                    </Button>
                                </Link>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>

            {investments.length > visibleCount && (
                <Button
                    variant="ghost" size="sm" colorPalette="gray" alignSelf="center"
                    onClick={() => setVisibleCount(c => c + LOAD_MORE_STEP)}
                >
                    Ver mais {Math.min(LOAD_MORE_STEP, investments.length - visibleCount)} processos
                    <Text as="span" color="gray.500" ml={1}>({visibleCount} de {investments.length})</Text>
                </Button>
            )}
        </Flex>
    );
}
