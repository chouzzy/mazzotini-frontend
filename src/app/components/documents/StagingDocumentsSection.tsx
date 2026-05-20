'use client';

import {
    Box, Heading, Text, Flex, Icon, Spinner, VStack,
    SimpleGrid, Card, Badge, HStack, Button, Link,
} from '@chakra-ui/react';
import { useRef, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import {
    PiCurrencyCircleDollar, PiUploadSimple, PiFilePdf,
    PiDownloadDuotone, PiTrash, PiClock, PiCheckCircle,
} from 'react-icons/pi';
import { toaster } from '@/components/ui/toaster';
import { useApi } from '@/hooks/useApi';
import { UserStagingDocument } from '@/types/api';

export const STAGING_CATEGORIES = [
    { value: 'CESSAO',                label: 'Cessão',                   desc: 'Contrato de cessão de crédito' },
    { value: 'HONORARIOS',            label: 'Honorários',               desc: 'Recibo ou nota de honorários advocatícios' },
    { value: 'ORIENTACAO_FINANCEIRA', label: 'Orientação Financeira',    desc: 'Documento de orientação financeira recebido' },
    { value: 'ORIENTACAO_FISCAL',     label: 'Orientação Fiscal',        desc: 'Documento de orientação fiscal recebido' },
    { value: 'COMPROVANTE',           label: 'Comprovante de Pagamento', desc: 'Comprovante de transferência ou depósito' },
    { value: 'NOTA_FISCAL',           label: 'Nota Fiscal',              desc: 'NF referente à operação' },
];

// Categorias visíveis para o cliente — o restante é enviado pelo admin
const CLIENT_UPLOAD_CATEGORIES = ['COMPROVANTE', 'NOTA_FISCAL'];

const CATEGORY_LABEL_MAP: Record<string, string> = Object.fromEntries(
    STAGING_CATEGORIES.map(c => [c.value, c.label])
);

export function StagingDocumentsSection() {
    const { getAccessTokenSilently } = useAuth0();
    const { data: docs, isLoading, mutate } = useApi<UserStagingDocument[]>('/api/users/me/staging-documents');
    const [pendingCategory, setPendingCategory] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const triggerUpload = (category: string) => {
        setPendingCategory(category);
        setTimeout(() => inputRef.current?.click(), 50);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !pendingCategory) return;
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
            const form = new FormData();
            form.append('document', file);
            form.append('category', pendingCategory);
            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/staging-documents`, form, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toaster.create({ title: `Documento enviado em "${CATEGORY_LABEL_MAP[pendingCategory]}"!`, type: 'success' });
            mutate();
        } catch {
            toaster.create({ title: 'Erro ao enviar documento.', type: 'error' });
        }
        e.target.value = '';
        setPendingCategory('');
    };

    const handleDelete = async (id: string) => {
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
            await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/staging-documents/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toaster.create({ title: 'Documento removido.', type: 'success' });
            mutate();
        } catch (err: any) {
            toaster.create({ title: err?.response?.data?.error || 'Erro ao remover.', type: 'error' });
        }
    };

    return (
        <Box>
            <HStack mb={1} align="center" gap={2}>
                <Icon as={PiCurrencyCircleDollar} color="yellow.400" boxSize={5} />
                <Heading size="md" color="gray.300">Documentos Financeiros Privados</Heading>
            </HStack>
            <Text fontSize="xs" color="gray.500" mb={4}>
                Envie aqui os documentos financeiros referentes à sua operação. Selecione o tipo correto antes de enviar.
                Após o envio, a equipe Mazzotini irá vinculá-los ao seu processo.
            </Text>

            <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleUpload} />

            <SimpleGrid columns={{ base: 2, md: 3 }} gap={3} mb={6}>
                {STAGING_CATEGORIES.filter(cat => CLIENT_UPLOAD_CATEGORIES.includes(cat.value)).map(cat => {
                    const catDocs = docs?.filter(d => d.category === cat.value) || [];
                    return (
                        <Card.Root
                            key={cat.value}
                            variant="outline"
                            bg="gray.800"
                            borderColor={catDocs.length > 0 ? 'brand.700' : 'gray.700'}
                            cursor="pointer"
                            _hover={{ borderColor: 'brand.500', bg: 'gray.750' }}
                            transition="all 0.15s"
                            onClick={() => triggerUpload(cat.value)}
                        >
                            <Card.Body py={3} px={4}>
                                <Flex justify="space-between" align="start" mb={1}>
                                    <Text fontSize="sm" fontWeight="semibold" color="white">{cat.label}</Text>
                                    {catDocs.length > 0 && (
                                        <Badge colorPalette="brand" size="sm">{catDocs.length}</Badge>
                                    )}
                                </Flex>
                                <Text fontSize="xs" color="gray.500" mb={2}>{cat.desc}</Text>
                                <Flex align="center" gap={1} color="brand.400">
                                    <Icon as={PiUploadSimple} boxSize={3} />
                                    <Text fontSize="xs">Clique para enviar</Text>
                                </Flex>
                            </Card.Body>
                        </Card.Root>
                    );
                })}
            </SimpleGrid>

            {isLoading && <Flex justify="center" py={4}><Spinner size="sm" /></Flex>}

            {!isLoading && docs && docs.length > 0 && (() => {
                // Agrupa docs vinculados por processo
                const attached = docs.filter(d => d.status === 'ATTACHED');
                const pending  = docs.filter(d => d.status === 'PENDING');

                const byProcess = attached.reduce((acc, doc) => {
                    const key  = doc.attachedToAssetId || 'unknown';
                    const name = doc.attachedToAssetName || 'Processo';
                    if (!acc[key]) acc[key] = { name, docs: [] };
                    acc[key].docs.push(doc);
                    return acc;
                }, {} as Record<string, { name: string; docs: typeof docs }>);

                const DocRow = ({ doc }: { doc: (typeof docs)[0] }) => (
                    <Flex align="center" gap={3} px={3} py={2} borderRadius="md"
                        bg="whiteAlpha.50" _hover={{ bg: 'whiteAlpha.100' }}>
                        <Icon as={PiFilePdf} color="red.400" boxSize={4} flexShrink={0} />
                        <VStack align="start" gap={0} flex={1} minW={0}>
                            <Text fontSize="sm" truncate color="gray.200">{doc.fileName}</Text>
                            {doc.category && (
                                <Text fontSize="xs" color="gray.500">{CATEGORY_LABEL_MAP[doc.category] || doc.category}</Text>
                            )}
                        </VStack>
                        <HStack gap={1} flexShrink={0}>
                            <Link href={doc.fileUrl} target="_blank" _hover={{ textDecoration: 'none' }}>
                                <Button size="xs" variant="ghost" colorPalette="brand">
                                    <Icon as={PiDownloadDuotone} />
                                </Button>
                            </Link>
                            {doc.status === 'PENDING' && (
                                <Button size="xs" variant="ghost" colorPalette="red" onClick={() => handleDelete(doc.id)}>
                                    <Icon as={PiTrash} />
                                </Button>
                            )}
                        </HStack>
                    </Flex>
                );

                return (
                    <VStack align="stretch" gap={4}>
                        {/* Grupos por processo */}
                        {Object.entries(byProcess).map(([assetId, group]) => (
                            <Box key={assetId}>
                                <HStack mb={2} gap={2}>
                                    <Icon as={PiCheckCircle} color="green.400" boxSize={4} />
                                    <Text fontSize="xs" fontWeight="bold" color="green.400"
                                        textTransform="uppercase" letterSpacing="wider">
                                        {group.name}
                                    </Text>
                                    <Badge colorPalette="green" size="xs">{group.docs.length}</Badge>
                                </HStack>
                                <Card.Root variant="outline" bg="gray.800" borderColor="green.900">
                                    <Card.Body p={2}>
                                        <VStack align="stretch" gap={1}>
                                            {group.docs.map(doc => <DocRow key={doc.id} doc={doc} />)}
                                        </VStack>
                                    </Card.Body>
                                </Card.Root>
                            </Box>
                        ))}

                        {/* Pendentes */}
                        {pending.length > 0 && (
                            <Box>
                                <HStack mb={2} gap={2}>
                                    <Icon as={PiClock} color="orange.400" boxSize={4} />
                                    <Text fontSize="xs" fontWeight="bold" color="orange.400"
                                        textTransform="uppercase" letterSpacing="wider">
                                        Aguardando vinculação
                                    </Text>
                                    <Badge colorPalette="orange" size="xs">{pending.length}</Badge>
                                </HStack>
                                <Card.Root variant="outline" bg="gray.800" borderColor="orange.900">
                                    <Card.Body p={2}>
                                        <VStack align="stretch" gap={1}>
                                            {pending.map(doc => <DocRow key={doc.id} doc={doc} />)}
                                        </VStack>
                                    </Card.Body>
                                </Card.Root>
                            </Box>
                        )}
                    </VStack>
                );
            })()}

            {!isLoading && (!docs || docs.length === 0) && (
                <Text color="gray.600" fontSize="sm" textAlign="center" py={4}>
                    Nenhum documento enviado ainda. Clique em uma categoria acima para começar.
                </Text>
            )}
        </Box>
    );
}
