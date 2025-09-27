'use client';

import {
    Card,
    CardTitle,
    Text,
    VStack,
    Link,
    Button
} from '@chakra-ui/react';
import { PiFilePdf } from 'react-icons/pi';
import NextLink from 'next/link';
import { DetailedCreditAsset } from '@/app/ativos/[processNumber]/page';

// DADOS MOCKADOS PARA OS DOCUMENTOS
const mockDocuments = [
    {
        name: 'Contrato de Cessão de Crédito.pdf',
        url: 'https://file-examples.com/storage/fedaf045be68cc6ad9396d2/2017/10/file-sample_150kB.pdf',
        category: 'Contrato'
    },
    {
        name: 'Sentença Judicial - Primeira Instância.pdf',
        url: 'https://file-examples.com/storage/fedaf045be68cc6ad9396d2/2017/10/file-sample_150kB.pdf',
        category: 'Decisão Judicial'
    },
    {
        name: 'Comprovante de Protocolo.pdf',
        url: 'https://file-examples.com/storage/fedaf045be68cc6ad9396d2/2017/10/file-sample_150kB.pdf',
        category: 'Comprovante'
    }
];


interface TabProps {
    asset: DetailedCreditAsset;
}

export function DocumentsTab({ asset }: TabProps) {
    // Lógica inteligente: se o ativo real não tiver documentos, usamos os dados mockados como fallback.
    const documentsToDisplay = asset.documents && asset.documents.length > 0 ? asset.documents : mockDocuments;

    return (
        <Card.Root variant="outline" bg="gray.900">
            <Card.Body>
                <Card.Title>Documentos do Processo</Card.Title>
                <VStack align="stretch" mt={4}>
                    {documentsToDisplay.length > 0 ? documentsToDisplay.map(doc => (
                        <Link as={NextLink} href={doc.url} key={doc.name} target='_blank' _hover={{ textDecoration: 'none' }}>
                            <Button variant="outline" w="100%" justifyContent="flex-start" >
                                <PiFilePdf style={{ marginRight: '8px' }} />
                                {doc.name} ({doc.category})
                            </Button>
                        </Link>
                    )) : <Text color="gray.500">Nenhum documento anexado.</Text>}
                </VStack>
            </Card.Body>
        </Card.Root>
    );
}
