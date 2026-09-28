'use client';

import { Table, VStack, Text, Icon, Button, Link } from '@chakra-ui/react';
import { PiArrowRight } from 'react-icons/pi';
import NextLink from 'next/link';
import { FolderAsset } from '@/types/folders';

export const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// statusColor foi removido daqui: era exportado mas nenhum arquivo o importava,
// e duplicava o mapeamento de status. A fonte única agora é @/utils/assetStatus.

export function FolderAssetRow({ asset }: { asset: FolderAsset }) {
    return (
        <Table.Row _hover={{ bg: 'whiteAlpha.50' }} borderBottom="1px solid" borderColor="gray.800">
            <Table.Cell pl={6}>
                <VStack align="start" gap={1}>
                    <Text fontWeight="medium" color="white" fontSize="sm">{asset.processNumber}</Text>
                    {asset.nickname && <Text fontSize="xs" color="brand.300">{asset.nickname}</Text>}
                </VStack>
            </Table.Cell>
            <Table.Cell fontSize="sm">{asset.originalCreditor}</Table.Cell>
            <Table.Cell fontSize="sm">{formatBRL(asset.currentValue)}</Table.Cell>
            <Table.Cell textAlign="right" pr={6}>
                <Link as={NextLink} href={`/processos/${asset.legalOneId}`}>
                    <Button size="xs" variant="solid" colorPalette="blue"><Icon as={PiArrowRight} /></Button>
                </Link>
            </Table.Cell>
        </Table.Row>
    );
}
