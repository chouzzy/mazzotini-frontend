'use client';

import {
    Text, VStack, Button, Icon, Flex, Spinner, Badge, Box, HStack,
    Accordion, Portal, Select, createListCollection, Avatar, Link,
} from '@chakra-ui/react';
import { useRef, useState } from 'react';
import {
    PiFilePdf, PiFileText, PiImage, PiFile, PiLockKey, PiGavel,
    PiScales, PiUploadSimple, PiTrash, PiDownloadSimple,
    PiCaretDownBold, PiUser, PiPlus,
} from 'react-icons/pi';
import { DetailedCreditAsset } from '@/app/processos/[legalOneId]/page';
import { ProcessDocument, DocumentSection } from '@/types/api';
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
    TERMO_CESSAO: 'Termo de Cessão', PROCURACAO: 'Procuração', OUTRO_JURIDICO: 'Outro Jurídico',
    CESSAO: 'Cessão', HONORARIOS: 'Honorários', ORIENTACAO_FINANCEIRA: 'Orientação Financeira',
    ORIENTACAO_FISCAL: 'Orientação Fiscal', COMPROVANTE: 'Comprovantes', NOTA_FISCAL: 'Notas Fiscais',
    SENTENCA: 'Sentença', DESPACHO: 'Despacho', OUTRO_PROCESSUAL: 'Outro Processual',
};

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
    LEGAL_ONE: { label: 'Legal One', color: 'blue' },
    MANUAL: { label: 'Mazzotini', color: 'brand' },
    CLIENTE: { label: 'Cliente', color: 'green' },
};

const JURIDICO_CATEGORIES = createListCollection({ items: [
    { label: 'Termo de Cessão', value: 'TERMO_CESSAO' },
    { label: 'Procuração', value: 'PROCURACAO' },
    { label: 'Outro Jurídico', value: 'OUTRO_JURIDICO' },
]});

const PRIVADO_CATEGORIES = createListCollection({ items: [
    { label: 'Cessão', value: 'CESSAO' },
    { label: 'Honorários', value: 'HONORARIOS' },
    { label: 'Orientação Financeira', value: 'ORIENTACAO_FINANCEIRA' },
    { label: 'Orientação Fiscal', value: 'ORIENTACAO_FISCAL' },
    { label: 'Comprovantes', value: 'COMPROVANTE' },
    { label: 'Notas Fiscais', value: 'NOTA_FISCAL' },
]});

const PROCESSUAL_CATEGORIES = createListCollection({ items: [
    { label: 'Sentença', value: 'SENTENCA' },
    { label: 'Despacho', value: 'DESPACHO' },
    { label: 'Outro Processual', value: 'OUTRO_PROCESSUAL' },
]});

// ── SectionCard ───────────────────────────────────────────────────────────────

function SectionCard({ icon, iconColor, title, titleColor, description, count, children }: {
    icon: any; iconColor: string; title: string; titleColor: string;
    description: string; count: number; children: React.ReactNode;
}) {
    return (
        <Box borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.700">
            <Flex px={5} py={4} bg="gray.800" align="center" gap={3}>
                <Icon as={icon} color={iconColor} boxSize={5} flexShrink={0} />
                <Box flex={1}>
                    <Text fontSize="sm" fontWeight="bold" color={titleColor} textTransform="uppercase" letterSpacing="wider">
                        {title}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt="1px">{description}</Text>
                </Box>
                <Badge colorPalette="gray" variant="subtle" size="sm">{count}</Badge>
            </Flex>
            <Box bg="gray.900">{children}</Box>
        </Box>
    );
}

// ── DocRow ────────────────────────────────────────────────────────────────────

function DocRow({ doc, canDelete, onDelete, onDownload, loadingId }: {
    doc: ProcessDocument; canDelete: boolean;
    onDelete: (id: string) => void; onDownload: (doc: ProcessDocument) => void; loadingId: string | null;
}) {
    const { icon: FileIcon, color } = getFileIcon(doc.name);
    const source = SOURCE_LABELS[doc.sourceType] ?? { label: doc.sourceType, color: 'gray' };
    return (
        <Flex
            display="flex" flexDirection="row" alignItems="center"
            gap={3} px={4} py={3} cursor="pointer"
            _hover={{ bg: 'whiteAlpha.50' }} transition="background 0.15s"
            borderBottom="1px solid" borderColor="whiteAlpha.50"
            _last={{ borderBottom: 'none' }}
        >
            <Icon as={FileIcon} boxSize={5} color={color} flexShrink={0} />
            <Text fontSize="sm" flex={1} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" color="gray.100">
                {doc.name}
            </Text>
            <HStack gap={2} flexShrink={0}>
                <Badge colorPalette={source.color} variant="subtle" size="sm">{source.label}</Badge>
                {doc.category && (
                    <Badge colorPalette="gray" variant="outline" size="sm">{CATEGORY_LABELS[doc.category] || doc.category}</Badge>
                )}
                <Button size="xs" variant="ghost" colorPalette="brand" cursor="pointer"
                    loading={loadingId === doc.id} onClick={() => onDownload(doc)}>
                    <Icon as={PiDownloadSimple} />
                </Button>
                {canDelete && (
                    <Button size="xs" variant="ghost" colorPalette="red" cursor="pointer" onClick={() => onDelete(doc.id)}>
                        <Icon as={PiTrash} />
                    </Button>
                )}
            </HStack>
        </Flex>
    );
}

// ── UploadInline ──────────────────────────────────────────────────────────────

function UploadInline({ legalOneId, section, categoryCollection, onSuccess }: {
    legalOneId: number; section: DocumentSection;
    categoryCollection: ReturnType<typeof createListCollection<{ label: string; value: string }>>;
    onSuccess: () => void;
}) {
    const { getAccessTokenSilently } = useAuth0();
    const inputRef = useRef<HTMLInputElement>(null);
    const [category, setCategory] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !category) { toaster.create({ title: 'Selecione uma categoria.', type: 'warning' }); e.target.value = ''; return; }
        setUploading(true);
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
            const form = new FormData();
            form.append('document', file); form.append('section', section); form.append('category', category);
            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/${legalOneId}/documents`, form, { headers: { Authorization: `Bearer ${token}` } });
            toaster.create({ title: 'Documento enviado!', type: 'success' }); onSuccess();
        } catch { toaster.create({ title: 'Erro ao enviar.', type: 'error' }); }
        finally { setUploading(false); e.target.value = ''; }
    };

    return (
        <Flex gap={2} align="center" wrap="wrap" px={4} py={3} bg="whiteAlpha.30"
            borderTop="1px dashed" borderColor="gray.700">
            <Select.Root collection={categoryCollection} value={category ? [category] : []}
                onValueChange={e => setCategory(e.value[0])} size="xs" w={{ base: '100%', sm: '180px' }}>
                <Select.HiddenSelect />
                <Select.Control>
                    <Select.Trigger bg="gray.800" borderColor="gray.600" cursor="pointer">
                        <Select.ValueText placeholder="Categoria" />
                    </Select.Trigger>
                </Select.Control>
                <Portal>
                    <Select.Positioner>
                        <Select.Content bg="gray.800" borderColor="gray.600">
                            {categoryCollection.items.map(item => (
                                <Select.Item key={item.value} item={item}
                                    px={3} py={2} cursor="pointer"
                                    _hover={{ bg: 'gray.600' }} _highlighted={{ bg: 'gray.600' }}
                                    _selected={{ bg: 'brand.800/60', color: 'brand.200' }}>
                                    <Select.ItemText>{item.label}</Select.ItemText>
                                    <Select.ItemIndicator />
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select.Positioner>
                </Portal>
            </Select.Root>
            <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleFile} />
            <Button size="xs" colorPalette="brand" loading={uploading} disabled={!category}
                onClick={() => inputRef.current?.click()} gap={1} cursor="pointer">
                <Icon as={PiUploadSimple} /> Enviar arquivo
            </Button>
            {!category && (
                <Text fontSize="xs" color="gray.500">← Selecione a categoria primeiro</Text>
            )}
        </Flex>
    );
}

// ── PrivadoSection ────────────────────────────────────────────────────────────

function PrivadoSection({ asset, docs, isAdminOrOperator, onDelete, onDownload, onRefresh, loadingId }: {
    asset: DetailedCreditAsset; docs: ProcessDocument[];
    isAdminOrOperator: boolean; onDelete: (id: string) => void;
    onDownload: (doc: ProcessDocument) => void; onRefresh: () => void;
    loadingId: string | null; myUserId: string;
}) {
    const { getAccessTokenSilently } = useAuth0();
    const [selectedInvestorId, setSelectedInvestorId] = useState<string>('');

    const investorsCollection = createListCollection({
        items: asset.investors.map(inv => ({ label: inv.user.name, value: inv.user.id })),
    });

    const visibleDocs = isAdminOrOperator
        ? docs.filter(d => selectedInvestorId ? d.investorUserId === selectedInvestorId : false)
        : docs;

    const selectedInvestor = asset.investors.find(inv => inv.user.id === selectedInvestorId);

    return (
        <SectionCard
            icon={PiLockKey} iconColor="yellow.400"
            title="Documentos Privados e Financeiros" titleColor="yellow.300"
            description="Cessão, honorários, orientações e comprovantes. Cada documento é privado por cliente."
            count={docs.length}
        >
            {/* Seletor de cliente */}
            {isAdminOrOperator && (
                <Box px={4} py={3} borderBottom="1px solid" borderColor="gray.800">
                    <Flex align="center" gap={3}>
                        <Icon as={PiUser} color="gray.400" boxSize={4} flexShrink={0} />
                        <Select.Root collection={investorsCollection}
                            value={selectedInvestorId ? [selectedInvestorId] : []}
                            onValueChange={e => setSelectedInvestorId(e.value[0] || '')} size="sm" flex={1}>
                            <Select.HiddenSelect />
                            <Select.Control>
                                <Select.Trigger bg="gray.800" borderColor="gray.700" cursor="pointer"
                                    _hover={{ borderColor: 'gray.500' }}>
                                    <Select.ValueText placeholder="Selecionar cliente..." />
                                </Select.Trigger>
                            </Select.Control>
                            <Portal>
                                <Select.Positioner>
                                    <Select.Content bg="gray.800" borderColor="gray.600">
                                        {investorsCollection.items.map(item => (
                                            <Select.Item key={item.value} item={item}
                                                px={3} py={2} cursor="pointer"
                                                _hover={{ bg: 'gray.600' }} _highlighted={{ bg: 'gray.600' }}
                                                _selected={{ bg: 'brand.800/60', color: 'brand.200' }}>
                                                <Select.ItemText>{item.label}</Select.ItemText>
                                                <Select.ItemIndicator />
                                            </Select.Item>
                                        ))}
                                    </Select.Content>
                                </Select.Positioner>
                            </Portal>
                        </Select.Root>
                        {selectedInvestorId && (
                            <Badge colorPalette="brand" size="sm" flexShrink={0}>
                                {visibleDocs.length} doc(s)
                            </Badge>
                        )}
                    </Flex>
                </Box>
            )}

            {/* Prompt para selecionar cliente */}
            {isAdminOrOperator && !selectedInvestorId ? (
                <Flex justify="center" align="center" py={10} px={4}>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                        Selecione um cliente acima para visualizar os documentos privados.
                    </Text>
                </Flex>
            ) : (
                <Accordion.Root multiple collapsible variant="plain">
                    {PRIVADO_CATEGORIES.items.map((cat, i) => {
                        const catDocs = visibleDocs.filter(d => d.category === cat.value);
                        const isLast = i === PRIVADO_CATEGORIES.items.length - 1;
                        return (
                            <Accordion.Item key={cat.value} value={cat.value}
                                borderBottom={isLast ? 'none' : '1px solid'} borderColor="gray.800">
                                <Accordion.ItemTrigger px={4} py={3} cursor="pointer"
                                    _hover={{ bg: 'whiteAlpha.50' }} transition="background 0.15s">
                                    <Flex justify="space-between" w="100%" align="center">
                                        <Text fontSize="sm" fontWeight="medium" color="gray.200">{cat.label}</Text>
                                        <HStack gap={2}>
                                            {catDocs.length > 0 && (
                                                <Badge colorPalette="yellow" size="sm">{catDocs.length}</Badge>
                                            )}
                                            <Accordion.ItemIndicator>
                                                <Icon as={PiCaretDownBold} boxSize={3} color="gray.500" />
                                            </Accordion.ItemIndicator>
                                        </HStack>
                                    </Flex>
                                </Accordion.ItemTrigger>
                                <Accordion.ItemContent px={0} py={0} bg="blackAlpha.300">
                                    {catDocs.length === 0 ? (
                                        <Text fontSize="xs" color="gray.600" px={4} py={3}>
                                            Nenhum documento nesta categoria.
                                        </Text>
                                    ) : (
                                        catDocs.map(doc => (
                                            <DocRow key={doc.id} doc={doc} canDelete={isAdminOrOperator}
                                                onDelete={onDelete} onDownload={onDownload} loadingId={loadingId} />
                                        ))
                                    )}
                                    {isAdminOrOperator && selectedInvestorId && (
                                        <Flex gap={2} align="center" px={4} py={2}>
                                            <input type="file" id={`upload-priv-${cat.value}-${selectedInvestorId}`}
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
                                                        form.append('investorUserId', selectedInvestorId);
                                                        await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/${asset.legalOneId}/documents`, form, { headers: { Authorization: `Bearer ${token}` } });
                                                        toaster.create({ title: `Documento enviado em "${cat.label}".`, type: 'success' });
                                                        onRefresh();
                                                    } catch (err: any) {
                                                        toaster.create({ title: err?.response?.data?.error || 'Erro ao enviar.', type: 'error' });
                                                    }
                                                    e.target.value = '';
                                                }}
                                            />
                                            <Button size="xs" variant="ghost" colorPalette="gray" gap={1} cursor="pointer"
                                                onClick={() => document.getElementById(`upload-priv-${cat.value}-${selectedInvestorId}`)?.click()}>
                                                <Icon as={PiPlus} /> Enviar em {cat.label}
                                            </Button>
                                        </Flex>
                                    )}
                                </Accordion.ItemContent>
                            </Accordion.Item>
                        );
                    })}
                </Accordion.Root>
            )}
        </SectionCard>
    );
}

// ── DocumentsTab principal ────────────────────────────────────────────────────

interface TabProps { asset: DetailedCreditAsset; onRefresh: () => void; }

export function DocumentsTab({ asset, onRefresh }: TabProps) {
    const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
    const { getAccessTokenSilently } = useAuth0();
    const { data: myProfile, isLoading: isLoadingProfile } = useApi<{ role: string; id: string }>('/api/users/me');

    if (isLoadingProfile) return <Flex justify="center" p={8}><Spinner color="brand.500" /></Flex>;

    const isAdminOrOperator = myProfile?.role === 'ADMIN' || myProfile?.role === 'OPERATOR';
    const docs = asset.documents || [];
    const juridicoDocs   = docs.filter(d => d.section === 'JURIDICO');
    const privadoDocs    = docs.filter(d => d.section === 'PRIVADO_FINANCEIRO');
    const processualDocs = docs.filter(d => d.section === 'PROCESSUAL');

    const handleDownload = async (doc: ProcessDocument) => {
        if (doc.sourceType === 'LEGAL_ONE' && doc.legalOneDocumentId) {
            setLoadingDocId(doc.id);
            try {
                const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/documents/${doc.id}/download-url`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.data?.url) window.open(res.data.url, '_blank');
            } catch { toaster.create({ title: 'Erro ao gerar link.', type: 'error' }); }
            finally { setLoadingDocId(null); }
        } else {
            window.open(doc.url, '_blank');
        }
    };

    const handleDelete = async (documentId: string) => {
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
            await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/documents/${documentId}`, { headers: { Authorization: `Bearer ${token}` } });
            toaster.create({ title: 'Documento removido.', type: 'success' }); onRefresh();
        } catch { toaster.create({ title: 'Erro ao remover.', type: 'error' }); }
    };

    return (
        <VStack gap={4} align="stretch" w="100%">
            <Toaster />

            {/* Jurídicos */}
            <SectionCard icon={PiScales} iconColor="brand.400" title="Documentos Jurídicos"
                titleColor="brand.300" description="Termo de cessão e procuração. Visíveis para todos os clientes do processo."
                count={juridicoDocs.length}>
                {juridicoDocs.length === 0 && !isAdminOrOperator && (
                    <Text fontSize="sm" color="gray.600" px={4} py={4}>Nenhum documento jurídico anexado.</Text>
                )}
                {juridicoDocs.map(doc => (
                    <DocRow key={doc.id} doc={doc} canDelete={isAdminOrOperator}
                        onDelete={handleDelete} onDownload={handleDownload} loadingId={loadingDocId} />
                ))}
                {isAdminOrOperator && (
                    <UploadInline legalOneId={asset.legalOneId!} section="JURIDICO"
                        categoryCollection={JURIDICO_CATEGORIES} onSuccess={onRefresh} />
                )}
            </SectionCard>

            {/* Privados/Financeiros */}
            <PrivadoSection asset={asset} docs={privadoDocs} isAdminOrOperator={isAdminOrOperator}
                onDelete={handleDelete} onDownload={handleDownload} onRefresh={onRefresh}
                loadingId={loadingDocId} myUserId={myProfile?.id || ''} />

            {/* Processuais */}
            <SectionCard icon={PiGavel} iconColor="purple.400" title="Documentos Processuais"
                titleColor="purple.300" description="Sentenças, despachos e peças. Visíveis para todos os clientes do processo."
                count={processualDocs.length}>
                {processualDocs.length === 0 && !isAdminOrOperator && (
                    <Text fontSize="sm" color="gray.600" px={4} py={4}>Nenhum documento processual anexado.</Text>
                )}
                {processualDocs.map(doc => (
                    <DocRow key={doc.id} doc={doc} canDelete={isAdminOrOperator}
                        onDelete={handleDelete} onDownload={handleDownload} loadingId={loadingDocId} />
                ))}
                {isAdminOrOperator && (
                    <UploadInline legalOneId={asset.legalOneId!} section="PROCESSUAL"
                        categoryCollection={PROCESSUAL_CATEGORIES} onSuccess={onRefresh} />
                )}
            </SectionCard>
        </VStack>
    );
}
