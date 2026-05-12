'use client';

import {
    Card, Text, VStack, Button, Icon, Flex, Spinner, Badge, Box, HStack,
    Accordion, Input, Portal, Select, createListCollection,
} from '@chakra-ui/react';
import { useRef, useState } from 'react';
import {
    PiFilePdf, PiFileText, PiImage, PiFile, PiLockKey, PiGavel,
    PiScales, PiUploadSimple, PiTrash, PiDownloadSimple, PiClock,
    PiCaretDownBold, PiSealWarning, PiCheckCircle,
} from 'react-icons/pi';
import { DetailedCreditAsset } from '@/app/processos/[legalOneId]/page';
import { ProcessDocument, DocumentSection, DocumentCategory } from '@/types/api';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { Toaster, toaster } from '@/components/ui/toaster';
import { useApi } from '@/hooks/useApi';

// ── helpers ───────────────────────────────────────────────────────────────────

const getFileIcon = (name: string) => {
    const ext = name?.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return { icon: PiFilePdf, color: 'red.400' };
    if (['doc', 'docx'].includes(ext)) return { icon: PiFileText, color: 'blue.400' };
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return { icon: PiImage, color: 'purple.400' };
    return { icon: PiFile, color: 'gray.400' };
};

const CATEGORY_LABELS: Record<string, string> = {
    TERMO_CESSAO: 'Termo de Cessão',
    PROCURACAO: 'Procuração',
    OUTRO_JURIDICO: 'Outro Jurídico',
    CESSAO: 'Cessão',
    HONORARIOS: 'Honorários',
    ORIENTACAO_FINANCEIRA: 'Orientação Financeira',
    ORIENTACAO_FISCAL: 'Orientação Fiscal',
    COMPROVANTE: 'Comprovantes',
    NOTA_FISCAL: 'Notas Fiscais',
    SENTENCA: 'Sentença',
    DESPACHO: 'Despacho',
    OUTRO_PROCESSUAL: 'Outro Processual',
};

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
    LEGAL_ONE: { label: 'Legal One', color: 'blue' },
    MANUAL: { label: 'Mazzotini', color: 'brand' },
    CLIENTE: { label: 'Cliente', color: 'green' },
};

const JURIDICO_CATEGORIES = createListCollection({
    items: [
        { label: 'Termo de Cessão', value: 'TERMO_CESSAO' },
        { label: 'Procuração', value: 'PROCURACAO' },
        { label: 'Outro Jurídico', value: 'OUTRO_JURIDICO' },
    ],
});

const PRIVADO_CATEGORIES = createListCollection({
    items: [
        { label: 'Cessão', value: 'CESSAO' },
        { label: 'Honorários', value: 'HONORARIOS' },
        { label: 'Orientação Financeira', value: 'ORIENTACAO_FINANCEIRA' },
        { label: 'Orientação Fiscal', value: 'ORIENTACAO_FISCAL' },
        { label: 'Comprovantes', value: 'COMPROVANTE' },
        { label: 'Notas Fiscais', value: 'NOTA_FISCAL' },
    ],
});

const PROCESSUAL_CATEGORIES = createListCollection({
    items: [
        { label: 'Sentença', value: 'SENTENCA' },
        { label: 'Despacho', value: 'DESPACHO' },
        { label: 'Outro Processual', value: 'OUTRO_PROCESSUAL' },
    ],
});

// ── sub-componente: linha de documento ───────────────────────────────────────

function DocRow({
    doc,
    canDelete,
    onDelete,
    onDownload,
    loadingId,
}: {
    doc: ProcessDocument;
    canDelete: boolean;
    onDelete: (id: string) => void;
    onDownload: (doc: ProcessDocument) => void;
    loadingId: string | null;
}) {
    const { icon: FileIcon, color } = getFileIcon(doc.name);
    const source = SOURCE_LABELS[doc.sourceType] ?? { label: doc.sourceType, color: 'gray' };

    return (
        <Flex
            align="center" gap={3} p={3} borderRadius="md" bg="whiteAlpha.50"
            _hover={{ bg: 'whiteAlpha.100' }} transition="background 0.15s"
        >
            <Icon as={FileIcon} boxSize={5} color={color} flexShrink={0} />
            <Text fontSize="sm" flex={1} truncate color="gray.200">{doc.name}</Text>
            <HStack gap={2} flexShrink={0}>
                <Badge colorPalette={source.color} variant="subtle" size="sm">{source.label}</Badge>
                {doc.category && (
                    <Badge colorPalette="gray" variant="outline" size="sm">
                        {CATEGORY_LABELS[doc.category] || doc.category}
                    </Badge>
                )}
                <Button
                    size="xs" variant="ghost" colorPalette="brand"
                    loading={loadingId === doc.id}
                    onClick={() => onDownload(doc)}
                >
                    <Icon as={PiDownloadSimple} />
                </Button>
                {canDelete && (
                    <Button
                        size="xs" variant="ghost" colorPalette="red"
                        onClick={() => onDelete(doc.id)}
                    >
                        <Icon as={PiTrash} />
                    </Button>
                )}
            </HStack>
        </Flex>
    );
}

// ── sub-componente: upload inline ─────────────────────────────────────────────

function UploadInline({
    legalOneId,
    section,
    categoryCollection,
    onSuccess,
}: {
    legalOneId: number;
    section: DocumentSection;
    categoryCollection: ReturnType<typeof createListCollection<{ label: string; value: string }>>;
    onSuccess: () => void;
}) {
    const { getAccessTokenSilently } = useAuth0();
    const inputRef = useRef<HTMLInputElement>(null);
    const [category, setCategory] = useState<string>('');
    const [uploading, setUploading] = useState(false);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !category) {
            toaster.create({ title: 'Selecione uma categoria antes de enviar.', type: 'warning' });
            e.target.value = '';
            return;
        }
        setUploading(true);
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
            const form = new FormData();
            form.append('document', file);
            form.append('section', section);
            form.append('category', category);
            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/${legalOneId}/documents`, form, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toaster.create({ title: 'Documento enviado com sucesso!', type: 'success' });
            onSuccess();
        } catch {
            toaster.create({ title: 'Erro ao enviar documento.', type: 'error' });
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    return (
        <Flex gap={2} align="center" mt={2} wrap="wrap">
            <Select.Root
                collection={categoryCollection}
                value={category ? [category] : []}
                onValueChange={(e) => setCategory(e.value[0])}
                size="xs"
                w="200px"
            >
                <Select.HiddenSelect />
                <Select.Control>
                    <Select.Trigger bg="gray.800" borderColor="gray.600">
                        <Select.ValueText placeholder="Selecionar categoria" />
                    </Select.Trigger>
                </Select.Control>
                <Portal>
                    <Select.Positioner>
                        <Select.Content bg="gray.800" borderColor="gray.600">
                            {categoryCollection.items.map(item => (
                                <Select.Item key={item.value} item={item}>
                                    <Select.ItemText>{item.label}</Select.ItemText>
                                    <Select.ItemIndicator />
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select.Positioner>
                </Portal>
            </Select.Root>

            <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleFile} />
            <Button
                size="xs" colorPalette="brand" variant="outline"
                loading={uploading}
                disabled={!category}
                onClick={() => inputRef.current?.click()}
                gap={1}
            >
                <Icon as={PiUploadSimple} /> Enviar arquivo
            </Button>
        </Flex>
    );
}

// ── componente principal ──────────────────────────────────────────────────────

interface TabProps {
    asset: DetailedCreditAsset;
    onRefresh: () => void;
}

export function DocumentsTab({ asset, onRefresh }: TabProps) {
    const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
    const { getAccessTokenSilently } = useAuth0();
    const { data: myProfile, isLoading: isLoadingProfile } = useApi<{ role: string; id: string }>('/api/users/me');

    if (isLoadingProfile) return <Flex justify="center" p={8}><Spinner color="brand.500" /></Flex>;

    const isAdminOrOperator = myProfile?.role === 'ADMIN' || myProfile?.role === 'OPERATOR';

    const docs = asset.documents || [];
    const juridicoDocs  = docs.filter(d => d.section === 'JURIDICO');
    const privadoDocs   = docs.filter(d => d.section === 'PRIVADO_FINANCEIRO');
    const processualDocs = docs.filter(d => d.section === 'PROCESSUAL');

    const handleDownload = async (doc: ProcessDocument) => {
        if (doc.sourceType === 'LEGAL_ONE' && doc.legalOneDocumentId) {
            setLoadingDocId(doc.id);
            try {
                const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/documents/${doc.id}/download-url`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.data?.url) window.open(res.data.url, '_blank');
            } catch {
                toaster.create({ title: 'Erro ao gerar link de download.', type: 'error' });
            } finally {
                setLoadingDocId(null);
            }
        } else {
            window.open(doc.url, '_blank');
        }
    };

    const handleDelete = async (documentId: string) => {
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
            await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/documents/${documentId}`, { headers: { Authorization: `Bearer ${token}` } });
            toaster.create({ title: 'Documento removido.', type: 'success' });
            onRefresh();
        } catch {
            toaster.create({ title: 'Erro ao remover documento.', type: 'error' });
        }
    };

    return (
        <VStack gap={5} align="stretch" w="100%">
            <Toaster />

            {/* ── SEÇÃO 1: DOCUMENTOS JURÍDICOS ── */}
            <Card.Root bg="gray.900" border="1px solid" borderColor="gray.700">
                <Card.Body>
                    <Flex align="center" gap={2} mb={1}>
                        <Icon as={PiScales} color="brand.400" boxSize={5} />
                        <Card.Title color="brand.300" fontSize="sm" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                            Documentos Jurídicos
                        </Card.Title>
                        <Badge colorPalette="gray" variant="outline" size="sm" ml="auto">{juridicoDocs.length}</Badge>
                    </Flex>
                    <Text fontSize="xs" color="gray.500" mb={4}>
                        Termo de cessão e procuração. Importados do Legal One ou enviados manualmente.
                    </Text>

                    <VStack align="stretch" gap={2}>
                        {juridicoDocs.length === 0 && (
                            <Text fontSize="sm" color="gray.600" py={2}>Nenhum documento jurídico anexado.</Text>
                        )}
                        {juridicoDocs.map(doc => (
                            <DocRow key={doc.id} doc={doc} canDelete={isAdminOrOperator} onDelete={handleDelete} onDownload={handleDownload} loadingId={loadingDocId} />
                        ))}
                        {isAdminOrOperator && (
                            <UploadInline legalOneId={asset.legalOneId!} section="JURIDICO" categoryCollection={JURIDICO_CATEGORIES} onSuccess={onRefresh} />
                        )}
                    </VStack>
                </Card.Body>
            </Card.Root>

            {/* ── SEÇÃO 2: DOCUMENTOS PRIVADOS E FINANCEIROS ── */}
            <Card.Root bg="gray.900" border="1px solid" borderColor="gray.700">
                <Card.Body>
                    <Flex align="center" gap={2} mb={1}>
                        <Icon as={PiLockKey} color="yellow.400" boxSize={5} />
                        <Card.Title color="yellow.300" fontSize="sm" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                            Documentos Privados e Financeiros
                        </Card.Title>
                        <Badge colorPalette="gray" variant="outline" size="sm" ml="auto">{privadoDocs.length}</Badge>
                    </Flex>
                    <Text fontSize="xs" color="gray.500" mb={4}>
                        Cessão, honorários, orientações e comprovantes. Enviados pela Mazzotini ou pelo cliente.
                    </Text>

                    {/* Sub-seções por categoria */}
                    <Accordion.Root multiple collapsible variant="plain" spaceY={2}>
                        {PRIVADO_CATEGORIES.items.map(cat => {
                            const catDocs = privadoDocs.filter(d => d.category === cat.value);
                            return (
                                <Accordion.Item key={cat.value} value={cat.value} border="1px solid" borderColor="gray.700" borderRadius="md" overflow="hidden">
                                    <Accordion.ItemTrigger px={4} py={3} bg="gray.800" _hover={{ bg: 'gray.750' }}>
                                        <Flex justify="space-between" w="100%" align="center">
                                            <Text fontSize="sm" fontWeight="medium">{cat.label}</Text>
                                            <HStack gap={2}>
                                                {catDocs.length > 0 && <Badge colorPalette="yellow" size="sm">{catDocs.length}</Badge>}
                                                <Accordion.ItemIndicator><Icon as={PiCaretDownBold} boxSize={3} color="gray.500" /></Accordion.ItemIndicator>
                                            </HStack>
                                        </Flex>
                                    </Accordion.ItemTrigger>
                                    <Accordion.ItemContent px={4} py={3} bg="blackAlpha.400">
                                        <VStack align="stretch" gap={2}>
                                            {catDocs.length === 0 && (
                                                <Text fontSize="xs" color="gray.600">Nenhum documento nesta categoria.</Text>
                                            )}
                                            {catDocs.map(doc => (
                                                <DocRow key={doc.id} doc={doc} canDelete={isAdminOrOperator} onDelete={handleDelete} onDownload={handleDownload} loadingId={loadingDocId} />
                                            ))}
                                            {isAdminOrOperator && (
                                                <Box>
                                                    <input
                                                        type="file"
                                                        id={`upload-priv-${cat.value}`}
                                                        style={{ display: 'none' }}
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            try {
                                                                const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
                                                                const form = new FormData();
                                                                form.append('document', file);
                                                                form.append('section', 'PRIVADO_FINANCEIRO');
                                                                form.append('category', cat.value);
                                                                await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/${asset.legalOneId}/documents`, form, { headers: { Authorization: `Bearer ${token}` } });
                                                                toaster.create({ title: `Documento enviado em "${cat.label}".`, type: 'success' });
                                                                onRefresh();
                                                            } catch {
                                                                toaster.create({ title: 'Erro ao enviar documento.', type: 'error' });
                                                            }
                                                            e.target.value = '';
                                                        }}
                                                    />
                                                    <Button size="xs" variant="outline" colorPalette="gray" gap={1} mt={1}
                                                        onClick={() => document.getElementById(`upload-priv-${cat.value}`)?.click()}>
                                                        <Icon as={PiUploadSimple} /> Enviar em {cat.label}
                                                    </Button>
                                                </Box>
                                            )}
                                        </VStack>
                                    </Accordion.ItemContent>
                                </Accordion.Item>
                            );
                        })}
                    </Accordion.Root>
                </Card.Body>
            </Card.Root>

            {/* ── SEÇÃO 3: DOCUMENTOS PROCESSUAIS ── */}
            <Card.Root bg="gray.900" border="1px solid" borderColor="gray.700">
                <Card.Body>
                    <Flex align="center" gap={2} mb={1}>
                        <Icon as={PiGavel} color="purple.400" boxSize={5} />
                        <Card.Title color="purple.300" fontSize="sm" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                            Documentos Processuais
                        </Card.Title>
                        <Badge colorPalette="gray" variant="outline" size="sm" ml="auto">{processualDocs.length}</Badge>
                    </Flex>
                    <Text fontSize="xs" color="gray.500" mb={4}>
                        Sentenças, despachos e peças do processo. Enviados manualmente ou via GED do Legal One.
                    </Text>

                    <VStack align="stretch" gap={2}>
                        {processualDocs.length === 0 && (
                            <Text fontSize="sm" color="gray.600" py={2}>Nenhum documento processual anexado.</Text>
                        )}
                        {processualDocs.map(doc => (
                            <DocRow key={doc.id} doc={doc} canDelete={isAdminOrOperator} onDelete={handleDelete} onDownload={handleDownload} loadingId={loadingDocId} />
                        ))}
                        {isAdminOrOperator && (
                            <UploadInline legalOneId={asset.legalOneId!} section="PROCESSUAL" categoryCollection={PROCESSUAL_CATEGORIES} onSuccess={onRefresh} />
                        )}
                    </VStack>
                </Card.Body>
            </Card.Root>
        </VStack>
    );
}
