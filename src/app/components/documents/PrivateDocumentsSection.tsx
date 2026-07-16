'use client';

import {
    Box, Heading, Text, Flex, Icon, Spinner, VStack, Badge, HStack, Button, Link,
} from '@chakra-ui/react';
import {
    PiLockKey, PiFilePdf, PiDownloadDuotone, PiFileText,
} from 'react-icons/pi';
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
            {doc.url && (
                <Link href={doc.url} target="_blank" _hover={{ textDecoration: 'none' }}>
                    <Button size="xs" variant="ghost" colorPalette="brand">
                        <Icon as={PiDownloadDuotone} />
                    </Button>
                </Link>
            )}
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
