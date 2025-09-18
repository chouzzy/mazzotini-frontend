'use client';

import {
  SimpleGrid,
  Card,
  CardTitle,
  Text,
  Icon,
} from '@chakra-ui/react';
import { PiUser } from 'react-icons/pi';
import { DetailedCreditAsset } from '@/app/ativos/[processNumber]/page';

interface TabProps {
    asset: DetailedCreditAsset;
}

export function OverviewTab({ asset }: TabProps) {
    return (
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8}>
            <Card.Root variant="outline" bg="gray.900">
                <Card.Body>
                    <Card.Title>Detalhes da Aquisição</Card.Title>
                    <Text><strong>Credor Original:</strong> {asset.originalCreditor}</Text>
                    <Text><strong>Data de Aquisição:</strong> {new Date(asset.acquisitionDate).toLocaleDateString('pt-BR')}</Text>
                    <Text><strong>Índice de Correção:</strong> {asset.updateIndexType || 'N/A'}</Text>
                </Card.Body>
            </Card.Root>
            <Card.Root variant="outline" bg="gray.900">
                <Card.Body>
                    <Card.Title>Envolvidos</Card.Title>
                    {asset.investors.map(inv => (
                        <Text key={inv.user.name}>
                            <Icon as={PiUser} mr={2} /> 
                            <strong>Investidor:</strong> {inv.user.name} ({inv.investorShare}%)
                        </Text>
                    ))}
                    {asset.associate && <Text mt={2}><Icon as={PiUser} mr={2} /> <strong>Associado:</strong> {asset.associate.name}</Text>}
                </Card.Body>
            </Card.Root>
        </SimpleGrid>
    );
}
