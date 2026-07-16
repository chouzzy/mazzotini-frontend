'use client';

import {
    Box, Heading, Text, Flex, Icon, Spinner, VStack, Badge, HStack, Button,
} from '@chakra-ui/react';
import {
    PiLockKey, PiFilePdf, PiDownloadDuotone, PiFileText,
} from 'react-icons/pi';
import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useApi } from '@/hooks/useApi';
import { PrivateDocument } from '@/types/api';

const CATEGORY_LABELS: Record<string, string> = {
    CESSAO:                'Cessão',
    HONORARIOS:            'Honorários',
    ORIENTACAO_FINANCEIRA: 'Orientação Financeira',
    ORIENTACAO_FISCAL:     'Orientação Fiscal',
    NOTA_FISCAL:           'Nota Fiscal',
    COMPROVANTE:           'Comprovante',
};

function DocRow({ doc }: { doc: PrivateDocument }) {
    const label = CATEGORY_LABELS[doc.category] || doc.category;
    const [loading, setLoading] = useState(false);
    const { getAccessTokenSilently } = useAuth0();

    const handleDownload = async () => {
        setLoading(true);
        try {
            const token = await getAccessTokenSilently({
                authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! },
            });
            const res = await axios.get<{ url: string }>(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/documents/${doc.id}/download-url`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            window.open(res.data.url, '_blank');
        } catch {
            // silently fail — link inativo
        } finally {
            setLoading(false);
        }
    };

    return (
        <Flex
            align="center" gap={3} px={4} py={3}
            _hover={{ bg: 'whiteAlpha.50' }}
            transition="all 0.1s"
            borderBottom="1px solid"
            borderColor="whiteAlpha.50"
            _last={{ borderBottom: 'none' }}
        >
            <Icon as={PiFilePdf} color="red.400" boxSize={5} flexShrink={0} />
            <Text
                flex={1} fontSize="sm" color="gray.100"
                overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap"
            >
                {doc.name}
            </Text>
            <Badge variant="subtle" colorPalette="purple" size="sm" flexShrink={0}>
                {label}
            </Badge>
            <Button size="xs" variant="ghost" colorPalette="brand" onClick={handleDownload} loading={loading}>
                <Icon as={PiDownloadDuotone} />
            </Button>
        </Flex>
    );
}

export function PrivateDocumentsSection() {
    const { data: docs, isLoading } = useApi<PrivateDocument[]>('/api/documents/private');

    return (
        <Box>
            <HStack mb={1} align="center" gap={2}>
                <Icon as={PiLockKey} color="purple.400" boxSize={5} />
                <Heading size="md" color="gray.300">Contratos de Cessões e Honorários Unificados</Heading>
            </HStack>
            <Text fontSize="xs" color="gray.500" mb={4}>
                Documentos do seu contrato, sincronizados automaticamente pelo sistema.
            </Text>

            {isLoading && (
                <Flex justify="center" py={4}>
                    <Spinner size="sm" />
                </Flex>
            )}

            {!isLoading && docs && docs.length > 0 && (
                <Box borderRadius="xl" overflow="hidden" border="1px solid" borderColor="purple.800">
                    <Flex px={4} py={3} bg="purple.700" align="center" gap={2}>
                        <Icon as={PiFileText} color="white" boxSize={4} />
                        <Text fontSize="sm" fontWeight="bold" color="white" flex={1}>
                            Documentos do contrato
                        </Text>
                        <Badge colorPalette="purple" variant="solid" size="sm">
                            {docs.length}
                        </Badge>
                    </Flex>
                    <Box bg="gray.900">
                        <VStack align="stretch" gap={0}>
                            {docs.map(doc => (
                                <DocRow key={doc.id} doc={doc} />
                            ))}
                        </VStack>
                    </Box>
                </Box>
            )}

            {!isLoading && (!docs || docs.length === 0) && (
                <Text color="gray.600" fontSize="sm" textAlign="center" py={4}>
                    Nenhum documento de contrato encontrado. A sincronização ocorre automaticamente.
                </Text>
            )}
        </Box>
    );
}
