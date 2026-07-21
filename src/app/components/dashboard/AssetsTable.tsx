'use client';

import {
    Table,
    Tag,
    Link,
    Box
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { AssetSummary } from '@/types/api';
import { useApi } from '@/hooks/useApi';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const getStatusColorScheme = (status: string) => {
    switch (status) {
      case 'Ativo': return 'green';
      case 'Liquidado': return 'gray';
      case 'Em Negociação': return 'yellow';
      default: return 'blue';
    }
};

interface AssetsTableProps {
    assets: AssetSummary[];
}

export function AssetsTable({ assets }: AssetsTableProps) {
    const { data: myProfile } = useApi<{ role: string }>('/api/users/me');
    const isAdminOrOperator = myProfile?.role === 'ADMIN' || myProfile?.role === 'OPERATOR';

    return (
        <Box overflowX="auto" w="100%">
        <Table.Root variant="line">
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeader>Nº do Processo</Table.ColumnHeader>
                    <Table.ColumnHeader>Credor</Table.ColumnHeader>
                    <Table.ColumnHeader>Valor Investido</Table.ColumnHeader>
                    <Table.ColumnHeader>Saldo Atual</Table.ColumnHeader>
                    {isAdminOrOperator && <Table.ColumnHeader>Status</Table.ColumnHeader>}
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {assets.map((asset) => (
                    <Table.Row key={asset.id} _hover={{ bg: 'gray.700', cursor: 'pointer' }} asChild>
                        <Link as={NextLink} href={`/processos/${asset.legalOneId}`}>
                            <Table.Cell fontWeight="medium">{asset.processNumber}</Table.Cell>
                            <Table.Cell>{asset.originalCreditor}</Table.Cell>
                            <Table.Cell>{formatCurrency(asset.investedValue)}</Table.Cell>
                            <Table.Cell>{formatCurrency(asset.currentValue)}</Table.Cell>
                            {isAdminOrOperator && (
                                <Table.Cell>
                                    <Tag.Root variant="subtle" colorPalette={getStatusColorScheme(asset.status)}>
                                        <Tag.Label>{asset.status}</Tag.Label>
                                    </Tag.Root>
                                </Table.Cell>
                            )}
                        </Link>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table.Root>
        </Box>
    );
}
