// /src/app/components/assets/tabs/DocumentsTab.tsx
'use client';

import {
    Card,
    CardTitle,
    Text,
    VStack,
    Button,
    Icon
} from '@chakra-ui/react';
import { useState } from 'react';
import { PiFilePdf } from 'react-icons/pi';
import { DetailedCreditAsset } from '@/app/processos/[processNumber]/page';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { Toaster, toaster } from '@/components/ui/toaster';

interface TabProps {
    asset: DetailedCreditAsset;
}

export function DocumentsTab({ asset }: TabProps) {
    const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
    const { getAccessTokenSilently } = useAuth0();

    const handleDownload = async (documentId: string, documentName: string) => {
        setLoadingDocId(documentId);
        try {
            const token = await getAccessTokenSilently({
                authorizationParams: {
                    audience: process.env.NEXT_PUBLIC_API_AUDIENCE!,
                },
            });

            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/documents/${documentId}/download-url`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { url } = response.data;
            if (url) {
                // Abre a URL recebida numa nova aba
                window.open(url, '_blank');
            } else {
                throw new Error('URL de download não recebida do servidor.');
            }

        } catch (error) {
            console.error("Erro ao obter URL de download:", error);
            toaster.create({
                title: "Erro ao gerar link.",
                description: `Não foi possível obter o link de download para "${documentName}". Tente novamente mais tarde.`,
                type: "error",
                duration: 5000,
                closable: true,
            });
        } finally {
            setLoadingDocId(null);
        }
    };

    return (
        <Card.Root variant="outline" bg="gray.900">
            <Card.Body>
                <Card.Title>Documentos do Processo</Card.Title>
                <VStack align="stretch" mt={4} gap={3}>
                    
                    {asset.documents.length > 0 ? (
                        asset.documents.map(doc => (
                            <Button
                                key={doc.id}
                                variant="outline"
                                w="100%"
                                justifyContent="flex-start"
                                onClick={() => handleDownload(doc.id, doc.name)}
                                loading={loadingDocId === doc.id}
                                loadingText="Gerando documento, aguarde..."
                                gap={2}
                            >
                                <Icon as={PiFilePdf} boxSize={5} />
                                {doc.name} ({doc.category || 'Indefinido'})
                            </Button>
                        ))
                    ) : (
                        <Text color="gray.500">Nenhum documento sincronizado para este processo.</Text>
                    )}
                </VStack>
            </Card.Body>
        </Card.Root>
    );
}

