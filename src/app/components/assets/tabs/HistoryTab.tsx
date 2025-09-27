'use client';

import {
    SimpleGrid,
    Card,
    CardTitle,
    Text,
    VStack,
    Icon,
    Link,
    Button,
    Flex
} from '@chakra-ui/react';
import { PiClockClockwise, PiFilePdf } from 'react-icons/pi';
import NextLink from 'next/link';
import { DetailedCreditAsset } from '@/app/ativos/[processNumber]/page';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface TabProps {
    asset: DetailedCreditAsset;
}

export function HistoryTab({ asset }: TabProps) {
    return (
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8}>
            <Card.Root variant="outline" bg="gray.900">
                <Card.Body>
                    <Card.Title>Histórico de Atualizações</Card.Title>
                    <VStack align="stretch">
                        {asset.updates.length > 0 ? asset.updates.map(upd => (
                            <Flex key={upd.date} justify="space-between">
                                <Text><Icon as={PiClockClockwise} mr={2} color={'brand.600'} /> {new Date(upd.date).toLocaleDateString('pt-BR')}</Text>
                                <Text fontWeight="bold">{formatCurrency(upd.updatedValue)}</Text>
                            </Flex>
                        )) : <Text color="gray.500">Nenhum histórico para exibir.</Text>}
                    </VStack>
                </Card.Body>
            </Card.Root>
            <Card.Root variant="outline" bg="gray.900">
                <Card.Body>
                    <Card.Title>Documentos</Card.Title>
                    <VStack align="stretch">
                        {asset.documents.length > 0 ? asset.documents.map(doc => (
                            <Link as={NextLink} href={doc.url} key={doc.name} target='_blank' rel='noopener noreferrer' _hover={{ textDecoration: 'none' }}>
                                <Button variant="outline" w="100%" justifyContent="flex-start">
                                    <PiFilePdf />
                                    {doc.name} ({doc.category})
                                </Button>
                            </Link>
                        )) : <Text color="gray.500">Nenhum documento anexado.</Text>}
                    </VStack>
                </Card.Body>
            </Card.Root>
        </SimpleGrid>
    );
}
