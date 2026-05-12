'use client';

import {
    Flex, Heading, VStack, Text, Button, Icon, Spinner, Field, Input,
    HStack, IconButton, Stack, Box, Badge, Separator, Collapsible,
    FileUpload,
} from "@chakra-ui/react";
import { useForm, SubmitHandler, Controller, useFieldArray, useWatch, useController } from "react-hook-form";
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import {
    PiArrowLeft, PiFloppyDisk, PiFilePdf, PiTrash, PiEye,
    PiUploadSimple, PiScales, PiPlusCircle, PiCaretDown, PiPaperclip,
} from "react-icons/pi";
import { Toaster, toaster } from "@/components/ui/toaster";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import Link from 'next/link';
import { useListCollection, useFilter, Combobox, Portal } from "@chakra-ui/react";
import { PaginatedAssetsResponse } from "@/types/api";

// ============================================================================
//  INTERFACES
// ============================================================================
interface InvestmentForm {
    investments: {
        assetId: string;
        share: number;
        documents: string[];
        associateId?: string;
    }[];
}

interface AssetOption {
    label: string;
    value: string;
}

interface AssociateOption {
    label: string;
    value: string;
}

// ============================================================================
//  SUB-COMPONENTE: COMBOBOX DE PROCESSO
// ============================================================================
function AssetCombobox({ index, control, assetOptions, errors }: {
    index: number;
    control: any;
    assetOptions: AssetOption[];
    errors: any;
}) {
    const currentAssetId = useWatch({ control, name: `investments.${index}.assetId` });
    const defaultLabel = useMemo(
        () => assetOptions.find(a => a.value === currentAssetId)?.label || '',
        [currentAssetId, assetOptions]
    );
    const [inputValue, setInputValue] = useState(defaultLabel);
    useEffect(() => { if (defaultLabel) setInputValue(defaultLabel); }, [defaultLabel]);

    const { contains } = useFilter({ sensitivity: "base" });
    const { collection, filter } = useListCollection({ initialItems: assetOptions, filter: contains });

    return (
        <Controller
            name={`investments.${index}.assetId`}
            control={control}
            rules={{ required: "Selecione um processo" }}
            render={({ field }) => (
                <Field.Root invalid={!!errors.investments?.[index]?.assetId} required w="100%">
                    <Combobox.Root
                        collection={collection}
                        value={field.value ? [field.value] : []}
                        onValueChange={(d) => { field.onChange(d.value[0]); setInputValue(d.items[0]?.label); }}
                        inputValue={inputValue}
                        onInputValueChange={(d) => { setInputValue(d.inputValue); filter(d.inputValue); }}
                    >
                        <Combobox.Control>
                            <Combobox.Input asChild autoComplete="off">
                                <Input
                                    bgColor="gray.700"
                                    borderColor="gray.600"
                                    placeholder="Buscar processo..."
                                    onPaste={(e) => {
                                        const text = e.clipboardData.getData('text/plain').trim();
                                        setTimeout(() => { setInputValue(text); filter(text); }, 0);
                                    }}
                                />
                            </Combobox.Input>
                            <Combobox.IndicatorGroup><Combobox.Trigger /></Combobox.IndicatorGroup>
                        </Combobox.Control>
                        <Portal>
                            <Combobox.Positioner>
                                <Combobox.Content maxH="200px" overflowY="auto">
                                    {collection.items.map(item => (
                                        <Combobox.Item key={item.value} item={item}>{item.label}</Combobox.Item>
                                    ))}
                                </Combobox.Content>
                            </Combobox.Positioner>
                        </Portal>
                    </Combobox.Root>
                </Field.Root>
            )}
        />
    );
}

// ============================================================================
//  SUB-COMPONENTE: LISTA DE DOCUMENTOS
// ============================================================================
function DocumentsList({ index, control, userId, getValues, setValue }: {
    index: number;
    control: any;
    userId: string;
    getValues: any;
    setValue: any;
}) {
    const { getAccessTokenSilently } = useAuth0();
    const docs = useWatch({ control, name: `investments.${index}.documents` }) || [];

    const handleUpload = async (files: File[]) => {
        const file = files[0];
        if (!file) return;
        toaster.create({ title: "Enviando documento...", type: "info" });
        try {
            const token = await getAccessTokenSilently();
            const formData = new FormData();
            formData.append('document', file);
            const assetId = getValues(`investments.${index}.assetId`);
            if (assetId) formData.append('assetId', assetId);

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/management/users/${userId}/investments/documents`,
                formData,
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
            );
            const url = response.data.url;
            const current = getValues(`investments.${index}.documents`) || [];
            setValue(`investments.${index}.documents`, [...current, url]);
            toaster.create({ title: "Documento anexado!", type: "success" });
        } catch {
            toaster.create({ title: "Erro no upload", type: "error" });
        }
    };

    const handleRemove = (docUrl: string) => {
        const current = getValues(`investments.${index}.documents`) || [];
        setValue(`investments.${index}.documents`, current.filter((d: string) => d !== docUrl));
    };

    return (
        <Collapsible.Root>
            <Collapsible.Trigger asChild>
                <Button size="xs" variant="ghost" colorPalette="gray" type="button" gap={1.5} mt={2}>
                    <Icon as={PiPaperclip} />
                    <Text fontSize="xs" color="gray.400">
                        {docs.length > 0 ? `${docs.length} documento${docs.length > 1 ? 's' : ''}` : 'Documentos'}
                    </Text>
                    {docs.length > 0 && (
                        <Badge colorPalette="brand" variant="solid" fontSize="2xs" borderRadius="full" px={1.5}>
                            {docs.length}
                        </Badge>
                    )}
                    <Icon as={PiCaretDown} boxSize={3} color="gray.500" />
                </Button>
            </Collapsible.Trigger>
            <Collapsible.Content>
                <VStack align="start" w="100%" mt={2} pl={2} borderLeft="2px solid" borderColor="gray.700" gap={1.5}>
                    {docs.map((url: string, docIndex: number) => {
                        const fileName = decodeURIComponent(url.split('/').pop()?.split('-').pop() || `Doc ${docIndex + 1}`);
                        return (
                            <HStack key={url} justify="space-between" w="100%" bg="gray.700" p={2} borderRadius="sm">
                                <HStack gap={2}>
                                    <Icon as={PiFilePdf} color="red.300" boxSize={4} />
                                    <Text fontSize="xs" truncate maxW="220px">{fileName}</Text>
                                </HStack>
                                <HStack gap={1}>
                                    <IconButton size="xs" variant="solid" colorPalette="gray" aria-label="Ver" onClick={() => window.open(url, '_blank')} type="button">
                                        <Icon as={PiEye} />
                                    </IconButton>
                                    <IconButton size="xs" variant="solid" colorPalette="red" aria-label="Remover" onClick={() => handleRemove(url)} type="button">
                                        <Icon as={PiTrash} />
                                    </IconButton>
                                </HStack>
                            </HStack>
                        );
                    })}
                    <FileUpload.Root accept={[".pdf", ".jpg", ".png"]} maxFiles={1} onFileAccept={(e) => handleUpload(e.files)}>
                        <FileUpload.HiddenInput />
                        <FileUpload.Trigger asChild>
                            <Button size="xs" variant="outline" colorPalette="gray" type="button" gap={1}>
                                <Icon as={PiUploadSimple} /> Anexar Documento
                            </Button>
                        </FileUpload.Trigger>
                    </FileUpload.Root>
                </VStack>
            </Collapsible.Content>
        </Collapsible.Root>
    );
}

// ============================================================================
//  SUB-COMPONENTE: COMBOBOX DE ASSOCIADO
// ============================================================================
function AssociateCombobox({ index, control, associateOptions }: {
    index: number;
    control: any;
    associateOptions: AssociateOption[];
}) {
    const { field } = useController({ name: `investments.${index}.associateId`, control });
    const defaultLabel = useMemo(
        () => associateOptions.find(a => a.value === field.value)?.label || '',
        [field.value, associateOptions]
    );
    const [inputValue, setInputValue] = useState(defaultLabel);
    useEffect(() => { setInputValue(defaultLabel); }, [defaultLabel]);

    const { contains } = useFilter({ sensitivity: "base" });
    const { collection, filter } = useListCollection({ initialItems: associateOptions, filter: contains });

    return (
        <Field.Root w="100%">
            <Combobox.Root
                collection={collection}
                value={field.value ? [field.value] : []}
                onValueChange={(d) => { field.onChange(d.value[0] ?? ""); setInputValue(d.items[0]?.label ?? ""); }}
                inputValue={inputValue}
                onInputValueChange={(d) => { setInputValue(d.inputValue); filter(d.inputValue); if (!d.inputValue) field.onChange(""); }}
            >
                <Combobox.Control>
                    <Combobox.Input asChild autoComplete="off">
                        <Input
                            bgColor="gray.700"
                            borderColor="gray.600"
                            placeholder="Nenhum associado..."
                            onPaste={(e) => {
                                const text = e.clipboardData.getData('text/plain').trim();
                                setTimeout(() => { setInputValue(text); filter(text); }, 0);
                            }}
                        />
                    </Combobox.Input>
                    <Combobox.IndicatorGroup><Combobox.ClearTrigger /><Combobox.Trigger /></Combobox.IndicatorGroup>
                </Combobox.Control>
                <Portal>
                    <Combobox.Positioner>
                        <Combobox.Content maxH="200px" overflowY="auto">
                            <Combobox.Empty>Nenhum associado encontrado</Combobox.Empty>
                            {collection.items.map(item => (
                                <Combobox.Item key={item.value} item={item}>{item.label}</Combobox.Item>
                            ))}
                        </Combobox.Content>
                    </Combobox.Positioner>
                </Portal>
            </Combobox.Root>
        </Field.Root>
    );
}

// ============================================================================
//  PÁGINA
// ============================================================================
export default function UserCarteiraPage() {
    const { getAccessTokenSilently } = useAuth0();
    const params = useParams();
    const userId = params.id as string;
    const [isSaving, setIsSaving] = useState(false);
    const [investmentSearch, setInvestmentSearch] = useState('');

    const { data: userData, isLoading: isLoadingUser } = useApi<any>(`/api/management/users/${userId}`);
    const { data: allAssetsResponse, isLoading: isLoadingAssets } = useApi<PaginatedAssetsResponse>('/api/assets?limit=9999');
    const { data: associatesRaw, isLoading: isLoadingAssociates } = useApi<AssociateOption[]>('/api/users/associates');
    const associateOptions: AssociateOption[] = associatesRaw || [];

    const assetOptions: AssetOption[] = useMemo(() => {
        const items = allAssetsResponse?.items || [];
        return items.map(asset => ({
            label: `${asset.processNumber}${asset.nickname ? ` (${asset.nickname})` : ''}`,
            value: asset.id,
        }));
    }, [allAssetsResponse]);

    const { control, handleSubmit, setValue, getValues, reset, formState: { errors } } = useForm<InvestmentForm>({
        defaultValues: { investments: [] }
    });

    const { fields, append, remove } = useFieldArray({ control, name: "investments" });

    useEffect(() => {
        if (userData?.investments) {
            reset({
                investments: userData.investments.map((inv: any) => ({
                    assetId: inv.asset.id,
                    share: inv.investorShare,
                    documents: inv.documents || [],
                    associateId: inv.associate?.id || ""
                }))
            });
        }
    }, [userData, reset]);

    const onSubmit: SubmitHandler<InvestmentForm> = async (data) => {
        // Filtra linhas sem processo selecionado antes de enviar
        const validInvestments = data.investments.filter(inv => inv.assetId && inv.assetId.trim() !== '');
        if (validInvestments.length < data.investments.length) {
            toaster.create({ title: 'Linhas sem processo selecionado foram ignoradas.', type: 'warning' });
        }
        setIsSaving(true);
        try {
            const token = await getAccessTokenSilently();
            await axios.patch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/management/users/${userId}/investments`,
                { investments: validInvestments },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toaster.create({ title: "Carteira atualizada!", type: "success" });
        } catch (err: any) {
            toaster.create({ title: err.response?.data?.error || "Erro ao salvar carteira.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingUser || isLoadingAssets || isLoadingAssociates) {
        return <Flex w="100%" h="50vh" justify="center" align="center"><Spinner size="xl" /></Flex>;
    }

    const searchTerm = investmentSearch.toLowerCase().trim();
    const visibleFields = fields
        .map((field, index) => ({ field, index }))
        .filter(({ field }) => {
            if (!searchTerm) return true;
            const label = assetOptions.find(a => a.value === (field as any).assetId)?.label || '';
            return label.toLowerCase().includes(searchTerm);
        });

    return (
        <Flex w="100%" flexDir="column" gap={0} maxW="900px" mx="auto">
            <Toaster />

            {/* ── Header ── */}
            <Flex align="center" gap={3} mb={6}>
                <Link href={`/gestao/usuarios/${userId}`} passHref>
                    <IconButton aria-label="Voltar" variant="solid" colorPalette="gray" size="sm">
                        <Icon as={PiArrowLeft} />
                    </IconButton>
                </Link>
                <Box>
                    <Heading size="lg" display="flex" alignItems="center" gap={2}>
                        <Icon as={PiScales} color="brand.400" mr={1} />
                        Carteira de Processos
                    </Heading>
                    {userData?.name && (
                        <Text color="gray.400" fontSize="sm" mt={0.5}>{userData.name}</Text>
                    )}
                </Box>
                <Badge
                    ml="auto"
                    colorPalette="brand"
                    variant="outline"
                    fontSize="sm"
                    px={3}
                    py={1}
                    borderRadius="full"
                >
                    {fields.length} processo{fields.length !== 1 ? 's' : ''}
                </Badge>
            </Flex>

            <form onSubmit={handleSubmit(onSubmit)}>
                <VStack gap={3} align="stretch">

                    {/* ── Toolbar ── */}
                    <Flex
                        p={4}
                        bg="gray.900"
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="gray.700"
                        justify="space-between"
                        align="flex-end"
                        gap={4}
                        wrap="wrap"
                    >
                        <Field.Root maxW="360px">
                            <Field.Label fontSize="xs" color="gray.500" mb={1}>
                                Filtrar processos já na carteira
                            </Field.Label>
                            <Input
                                placeholder="Buscar pelo número ou nome..."
                                bgColor="gray.800"
                                borderColor="gray.600"
                                size="sm"
                                value={investmentSearch}
                                onChange={e => setInvestmentSearch(e.target.value)}
                            />
                        </Field.Root>
                        <Button
                            colorPalette="blue"
                            variant="solid"
                            onClick={() => {
                                append({ assetId: "", share: 0, documents: [], associateId: "" });
                                setInvestmentSearch('');
                            }}
                            type="button"
                            gap={2}
                        >
                            <Icon as={PiPlusCircle} boxSize={5} />
                            Adicionar Processo
                        </Button>
                    </Flex>

                    {/* ── Lista vazia ── */}
                    {fields.length === 0 && (
                        <Flex
                            direction="column"
                            align="center"
                            justify="center"
                            py={16}
                            gap={3}
                            bg="gray.900"
                            borderRadius="lg"
                            border="1px dashed"
                            borderColor="gray.700"
                        >
                            <Icon as={PiScales} boxSize={10} color="gray.600" />
                            <Text color="gray.500" fontSize="sm">Nenhum processo na carteira.</Text>
                            <Text color="gray.600" fontSize="xs">Clique em <b>Adicionar Processo</b> para incluir o primeiro.</Text>
                        </Flex>
                    )}

                    {/* ── Filtro sem resultado ── */}
                    {fields.length > 0 && visibleFields.length === 0 && (
                        <Text color="gray.500" fontSize="sm" p={4} bg="gray.900" borderRadius="lg">
                            Nenhum processo corresponde a "{investmentSearch}". O campo acima filtra a lista — use o botão para adicionar novos.
                        </Text>
                    )}

                    {/* ── Cards de investimento ── */}
                    {visibleFields.map(({ field, index }) => (
                        <Box
                            key={field.id}
                            bg="gray.900"
                            borderRadius="lg"
                            border="1px solid"
                            borderColor="gray.700"
                            overflow="hidden"
                            _hover={{ borderColor: 'gray.600' }}
                            transition="border-color 0.15s"
                        >
                            {/* Card header */}
                            <Flex
                                px={5}
                                py={3}
                                bg="gray.800"
                                align="center"
                                justify="space-between"
                                borderBottom="1px solid"
                                borderColor="gray.700"
                            >
                                <Badge
                                    colorPalette="brand"
                                    variant="solid"
                                    fontSize="xs"
                                    fontFamily="mono"
                                    px={2}
                                    borderRadius="sm"
                                >
                                    {String(index + 1).padStart(2, '0')}
                                </Badge>
                                <IconButton
                                    aria-label="Remover processo"
                                    colorPalette="red"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => remove(index)}
                                    type="button"
                                >
                                    <Icon as={PiTrash} />
                                </IconButton>
                            </Flex>

                            {/* Card body */}
                            <VStack align="stretch" gap={4} p={5}>
                                <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
                                    <Box flex={2}>
                                        <Text fontSize="xs" fontWeight="medium" color="gray.400" mb={1.5} textTransform="uppercase" letterSpacing="wider">
                                            Processo
                                        </Text>
                                        <AssetCombobox
                                            index={index}
                                            control={control}
                                            assetOptions={assetOptions}
                                            errors={errors}
                                        />
                                    </Box>
                                    <Box flex={1}>
                                        <Text fontSize="xs" fontWeight="medium" color="gray.400" mb={1.5} textTransform="uppercase" letterSpacing="wider">
                                            Associado
                                        </Text>
                                        <AssociateCombobox
                                            index={index}
                                            control={control}
                                            associateOptions={associateOptions}
                                        />
                                    </Box>
                                </Stack>

                                <Separator borderColor="gray.700" />

                                <DocumentsList
                                    index={index}
                                    control={control}
                                    userId={userId}
                                    getValues={getValues}
                                    setValue={setValue}
                                />
                            </VStack>
                        </Box>
                    ))}

                    {/* ── Barra de salvar ── */}
                    {fields.length > 0 && (
                        <Flex
                            justify="flex-end"
                            pt={2}
                            pb={4}
                        >
                            <Button type="submit" loading={isSaving} colorPalette="green" size="lg" gap={2} px={8}>
                                <Icon as={PiFloppyDisk} boxSize={5} />
                                Salvar Carteira
                            </Button>
                        </Flex>
                    )}
                </VStack>
            </form>
        </Flex>
    );
}
