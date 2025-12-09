'use client';

import {
    Table,
    Tag,
    Link
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { AssetSummary } from '@/types/api';

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
    return (
        <Table.Root variant="line">
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeader>Nº do Processo</Table.ColumnHeader>
                    <Table.ColumnHeader>Credor Original</Table.ColumnHeader>
                    <Table.ColumnHeader>Valor Investido</Table.ColumnHeader>
                    <Table.ColumnHeader>Saldo Atual</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {assets.map((asset) => (
                    <Table.Row key={asset.processNumber} _hover={{ bg: 'gray.700', cursor: 'pointer' }} asChild>
                        <Link as={NextLink} href={`/processos/${encodeURIComponent(asset.processNumber)}`}>
                            <Table.Cell fontWeight="medium">{asset.processNumber}</Table.Cell>
                            <Table.Cell>{asset.originalCreditor}</Table.Cell>
                            <Table.Cell>{formatCurrency(asset.investedValue)}</Table.Cell>
                            <Table.Cell>{formatCurrency(asset.currentValue)}</Table.Cell>
                            <Table.Cell>
                                <Tag.Root variant="subtle" colorScheme={getStatusColorScheme(asset.status)}>
                                    <Tag.Label>{asset.status}</Tag.Label>
                                </Tag.Root>
                            </Table.Cell>
                        </Link>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table.Root>
    );
}
