'use client';

import {
    Card,
    Text,
    VStack,
    Button,
    Icon,
    Flex,
    Spinner,
    Badge,
    Box
} from '@chakra-ui/react';
import { useState } from 'react';
import { PiFilePdf, PiLockKey, PiGlobe } from 'react-icons/pi';
import { DetailedCreditAsset } from '@/app/processos/[processNumber]/page';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { Toaster, toaster } from '@/components/ui/toaster';
import { useApi } from '@/hooks/useApi';

interface TabProps {
    asset: DetailedCreditAsset;
}

export function DocumentsTab({ asset }: TabProps) {
    const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
    const { getAccessTokenSilently } = useAuth0();
    
    // Busca o perfil do utilizador logado para aplicar o filtro de visualização
    const { data: myProfile, isLoading: isLoadingProfile } = useApi<any>('/api/users/me');

    const handleDownloadGlobal = async (documentId: string, documentName: string) => {
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
                // Abre a URL recebida numa nova aba (Legal One)
                window.open(url, '_blank');
            } else {
                throw new Error('URL de transferência não recebida do servidor.');
            }

        } catch (error) {
            console.error("Erro ao obter URL de transferência:", error);
            toaster.create({
                title: "Erro ao gerar link.",
                description: `Não foi possível obter o link de transferência para "${documentName}". Tente novamente mais tarde.`,
                type: "error",
                duration: 5000,
                closable: true,
            });
        } finally {
            setLoadingDocId(null);
        }
    };

    if (isLoadingProfile) {
        return <Flex justify="center" p={8}><Spinner color="brand.500" /></Flex>;
    }

    const isAdminOrOperator = myProfile?.role === 'ADMIN' || myProfile?.role === 'OPERATOR';

    // Lógica para extrair os documentos privados de cada investidor
    const privateDocs: { url: string; investorName: string; isOwn: boolean }[] = [];
    
    if (asset.investors) {
        asset.investors.forEach((inv: any) => {
            if (inv.documents && inv.documents.length > 0) {
                // O utilizador vê se for Admin/Operator OU se for o dono do documento
                const isOwn = inv.user.id === myProfile?.id;
                
                if (isAdminOrOperator || isOwn) {
                    inv.documents.forEach((url: string) => {
                        privateDocs.push({
                            url,
                            investorName: inv.user.name,
                            isOwn
                        });
                    });
                }
            }
        });
    }

    return (
        <VStack gap={6} align="stretch" w="100%">
            <Toaster />
            
            {/* SECÇÃO 1: Documentos Globais (Legal One) */}
            <Card.Root variant="outline" bg="gray.900" borderColor="gray.700">
                <Card.Body>
                    <Flex gap={2} align="center" mb={4}>
                        <Icon as={PiGlobe} color="brand.500" boxSize={5} />
                        <Card.Title color="white">Documentos Globais (Processo)</Card.Title>
                    </Flex>
                    
                    <VStack align="stretch" gap={3}>
                        {asset.documents && asset.documents.length > 0 ? (
                            asset.documents.map(doc => (
                                <Button
                                    key={doc.id}
                                    variant="outline"
                                    w="100%"
                                    justifyContent="flex-start"
                                    onClick={() => handleDownloadGlobal(doc.id, doc.name)}
                                    loading={loadingDocId === doc.id}
                                    loadingText="A gerar documento, aguarde..."
                                    colorScheme="gray"
                                    color="gray.300"
                                    borderColor="gray.600"
                                    _hover={{ bg: 'gray.800', borderColor: 'brand.500' }}
                                    gap={3}
                                >
                                    <Icon as={PiFilePdf} boxSize={5} color="red.400" />
                                    <Text truncate flex={1} textAlign="left">{doc.name}</Text>
                                    <Badge colorPalette="blue" size="sm">{doc.category || 'Indefinido'}</Badge>
                                </Button>
                            ))
                        ) : (
                            <Text color="gray.500" fontSize="sm">Nenhum documento global sincronizado com o Legal One para este processo.</Text>
                        )}
                    </VStack>
                </Card.Body>
            </Card.Root>

            {/* SECÇÃO 2: Documentos Privados (Investidor) */}
            <Card.Root variant="outline" bg="gray.900" borderColor="gray.700">
                <Card.Body>
                    <Flex gap={2} align="center" mb={4}>
                        <Icon as={PiLockKey} color="brand.500" boxSize={5} />
                        <Card.Title color="white">Documentos Privados (Investidor)</Card.Title>
                    </Flex>
                    
                    <VStack align="stretch" gap={3}>
                        {privateDocs.length > 0 ? (
                            privateDocs.map((doc, index) => {
                                const fileName = decodeURIComponent(doc.url.split('/').pop()?.split('-').pop() || `Documento_Privado_${index + 1}.pdf`);
                                return (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        w="100%"
                                        justifyContent="flex-start"
                                        // Transferência direta do Spaces
                                        onClick={() => window.open(doc.url, '_blank')}
                                        colorScheme="gray"
                                        color="gray.300"
                                        borderColor="gray.600"
                                        _hover={{ bg: 'gray.800', borderColor: 'brand.500' }}
                                        gap={3}
                                    >
                                        <Icon as={PiFilePdf} boxSize={5} color="red.400" />
                                        <Text truncate flex={1} textAlign="left">{fileName}</Text>
                                        {/* Tags de Identificação */}
                                        {isAdminOrOperator && !doc.isOwn && (
                                            <Badge colorPalette="purple" size="sm">De: {doc.investorName}</Badge>
                                        )}
                                        {doc.isOwn && (
                                            <Badge colorPalette="green" size="sm">Meu Documento</Badge>
                                        )}
                                    </Button>
                                );
                            })
                        ) : (
                            <Text color="gray.500" fontSize="sm">Nenhum documento privado atrelado à carteira neste processo.</Text>
                        )}
                    </VStack>
                </Card.Body>
            </Card.Root>

        </VStack>
    );
}