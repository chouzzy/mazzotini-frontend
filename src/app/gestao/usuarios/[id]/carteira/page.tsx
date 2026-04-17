'use client';

import {
    Flex, Heading, VStack, Text, Button, Icon, Spinner, Field, Input,
    HStack, IconButton, Stack, Box,
    FileUpload,
} from "@chakra-ui/react";
import { useForm, SubmitHandler, Controller, useFieldArray, useWatch, useController } from "react-hook-form";
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import {
    PiArrowLeft, PiFloppyDisk, PiFilePdf, PiTrash, PiEye,
    PiUploadSimple, PiChartLineUp, PiPlusCircle,
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
        <VStack align="start" w="100%" mt={2} pl={2} borderLeft="2px solid" borderColor="gray.600">
            <Text fontSize="xs" fontWeight="bold" color="gray.400">Documentos do Investimento:</Text>
            {docs.map((url: string, docIndex: number) => {
                const fileName = decodeURIComponent(url.split('/').pop()?.split('-').pop() || `Doc ${docIndex + 1}`);
                return (
                    <HStack key={url} justify="space-between" w="100%" bg="gray.700" p={1} borderRadius="sm">
                        <HStack>
                            <Icon as={PiFilePdf} color="red.300" />
                            <Text fontSize="xs" truncate maxW="200px">{fileName}</Text>
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
                    <Button size="xs" variant="subtle" colorPalette="gray" type="button">
                        <Icon as={PiUploadSimple} /> Anexar Documento
                    </Button>
                </FileUpload.Trigger>
            </FileUpload.Root>
        </VStack>
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
            <Text fontSize="xs" mb={1} color="gray.400">Associado (opcional)</Text>
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
        setIsSaving(true);
        try {
            const token = await getAccessTokenSilently();
            await axios.patch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/management/users/${userId}/investments`,
                data,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toaster.create({ title: "Carteira atualizada!", type: "success" });
        } catch {
            toaster.create({ title: "Erro ao salvar carteira.", type: "error" });
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
        <Flex w="100%" p={8} bgColor="bodyBg" maxW="breakpoint-lg" borderRadius="md" boxShadow="md" flexDir="column" mx="auto">
            <Toaster />

            {/* Cabeçalho */}
            <Flex w="100%" mb={6} justify="space-between" align="center">
                <Link href={`/gestao/usuarios/${userId}`} passHref>
                    <Button variant="solid" colorPalette="gray" size="sm" gap={2} pl={0}>
                        <Icon as={PiArrowLeft} /> Voltar para o Cadastro
                    </Button>
                </Link>
            </Flex>

            <VStack gap={2} align="start" mb={8}>
                <Heading as="h1" size="xl" display="flex" gap={2} alignItems="center">
                    <Icon as={PiChartLineUp} color="brand.400" />
                    Carteira de Investimentos
                </Heading>
                {userData?.name && (
                    <Text color="gray.400">{userData.name}</Text>
                )}
            </VStack>

            <form onSubmit={handleSubmit(onSubmit)}>
                <VStack gap={4} align="stretch" p={6} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">

                    {/* Toolbar: busca + botão adicionar */}
                    <Flex justify="space-between" align="center" gap={4} wrap="wrap">
                        <Input
                            placeholder="Filtrar por número do processo..."
                            bgColor="gray.700"
                            borderColor="gray.600"
                            size="sm"
                            maxW="340px"
                            value={investmentSearch}
                            onChange={e => setInvestmentSearch(e.target.value)}
                        />
                        <Button
                            size="sm"
                            variant="solid"
                            colorPalette="blue"
                            onClick={() => append({ assetId: "", share: 0, documents: [], associateId: "" })}
                            type="button"
                        >
                            <Icon as={PiPlusCircle} /> Adicionar Processo
                        </Button>
                    </Flex>

                    {/* Lista */}
                    {fields.length === 0 ? (
                        <Text color="gray.500" fontSize="sm">Este usuário não possui investimentos vinculados.</Text>
                    ) : visibleFields.length === 0 ? (
                        <Text color="gray.500" fontSize="sm">Nenhum processo encontrado para "{investmentSearch}".</Text>
                    ) : (
                        visibleFields.map(({ field, index }) => (
                            <Box key={field.id} p={4} bg="whiteAlpha.50" borderRadius="md">
                                <Stack direction={{ base: 'column', md: 'row' }} gap={4} align="flex-end">
                                    <Box flex={1}>
                                        <Text fontSize="xs" mb={1} color="gray.400">Processo</Text>
                                        <AssetCombobox
                                            index={index}
                                            control={control}
                                            assetOptions={assetOptions}
                                            errors={errors}
                                        />
                                    </Box>
                                    <Box flex={1}>
                                        <AssociateCombobox
                                            index={index}
                                            control={control}
                                            associateOptions={associateOptions}
                                        />
                                    </Box>
                                    <IconButton
                                        aria-label="Remover"
                                        colorPalette="red"
                                        variant="solid"
                                        onClick={() => remove(index)}
                                        type="button"
                                    >
                                        <Icon as={PiTrash} />
                                    </IconButton>
                                </Stack>
                                <DocumentsList
                                    index={index}
                                    control={control}
                                    userId={userId}
                                    getValues={getValues}
                                    setValue={setValue}
                                />
                            </Box>
                        ))
                    )}

                    <Flex justify="space-between" align="center" pt={4} borderTopWidth="1px" borderColor="gray.700">
                        <Text fontSize="sm" color="gray.500">
                            {fields.length} processo{fields.length !== 1 ? 's' : ''} na carteira
                            {searchTerm && visibleFields.length !== fields.length && ` · ${visibleFields.length} exibido${visibleFields.length !== 1 ? 's' : ''}`}
                        </Text>
                        <Button type="submit" loading={isSaving} colorPalette="green" size="sm">
                            <Icon as={PiFloppyDisk} /> Salvar Carteira
                        </Button>
                    </Flex>
                </VStack>
            </form>
        </Flex>
    );
}
