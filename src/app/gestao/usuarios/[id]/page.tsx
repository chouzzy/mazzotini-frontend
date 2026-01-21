'use client';

import {
    Flex, Heading, Text, VStack, Button, Icon, Field, Input, SimpleGrid, Spinner, createListCollection, Select, Portal, Checkbox, Stack, RadioGroup, Avatar, CheckboxGroup, Box,
    HStack,
    IconButton,
    Separator,
    Combobox,
    FileUpload
} from "@chakra-ui/react";
import { useForm, SubmitHandler, Controller, UseFormRegister, FieldErrors, Control, UseFormSetValue, useController, useWatch, useFieldArray } from "react-hook-form";
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { PiArrowLeft, PiFloppyDisk, PiFilePdf, PiTrash, PiEye, PiUploadSimple, PiChartLineUp, PiPlusCircle, PiCaretDownDuotone } from "react-icons/pi";
import { Toaster, toaster } from "@/components/ui/toaster";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { maskCPFOrCNPJ, maskPhone, unmask, maskCEP } from "@/utils/masks";
import { useSWRConfig } from "swr";
import { useApi } from "@/hooks/useApi";
import Link from 'next/link';
import { useListCollection, useFilter } from "@chakra-ui/react";

// ============================================================================
//  INTERFACES
// ============================================================================

interface UserFormData {
    name: string;
    cpfOrCnpj: string;
    rg: string;
    birthDate: string;
    gender: "Male" | "Female";
    cellPhone: string;
    phone?: string;
    infoEmail?: string;
    profession?: string;
    contactPreference: string[];
    referredById?: string;
    manualReferral?: string;
    unknownAssociate: boolean;
    residentialCep: string;
    residentialStreet: string;
    residentialNumber: string;
    residentialComplement?: string;
    residentialNeighborhood: string;
    residentialCity: string;
    residentialState: string;
    useCommercialAddress: boolean;
    commercialCep?: string;
    commercialStreet?: string;
    commercialNumber?: string;
    commercialComplement?: string;
    commercialNeighborhood?: string;
    commercialCity?: string;
    commercialState?: string;
    correspondenceAddress: "residential" | "commercial";
    nationality: string;
    maritalStatus: string;

    personalDocumentUrls: string[];
    personalDocuments?: FileList;
}

interface InvestmentForm {
    investments: {
        assetId: string;
        share: number;
        documents: string[];
    }[];
}

interface AssetOption {
    label: string;
    value: string;
}

interface Associate { value: string; label: string; }

// ============================================================================
//  COLEÇÕES
// ============================================================================
const estadoCivilCollection = createListCollection({
    items: [
        { label: "Solteiro(a)", value: "Solteiro(a)" },
        { label: "Casado(a)", value: "Casado(a)" },
        { label: "Divorciado(a)", value: "Divorciado(a)" },
        { label: "Viúvo(a)", value: "Viúvo(a)" },
        { label: "União Estável", value: "União Estável" },
    ],
});

const nacionalidadesCollection = createListCollection({
    items: [
        { label: "Brasileira", value: "Brasileira" },
        { label: "Portuguesa", value: "Portuguesa" },
        { label: "Italiana", value: "Italiana" },
        { label: "Outra", value: "Outra" },
    ],
});

// ============================================================================
//  SUB-COMPONENTE: ENDEREÇO
// ============================================================================
interface AddressBlockProps {
    type: 'residential' | 'commercial';
    control: Control<UserFormData>;
    register: UseFormRegister<UserFormData>;
    errors: FieldErrors<UserFormData>;
    watch: (name: any) => any;
    setValue: UseFormSetValue<UserFormData>;
    isDisabled?: boolean;
}

function AddressBlock({ type, control, register, errors, watch, setValue, isDisabled }: AddressBlockProps) {
    const [isCepLoading, setIsCepLoading] = useState(false);
    const cepValue = watch(`${type}Cep` as const);

    useEffect(() => {
        const fetchAddress = async (cep: string) => {
            setIsCepLoading(true);
            try {
                const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
                const { logradouro, bairro, localidade, uf, erro } = response.data;
                if (erro) {
                    toaster.create({ title: "CEP não encontrado.", type: "error" });
                    return;
                };
                setValue(`${type}Street`, logradouro);
                setValue(`${type}Neighborhood`, bairro);
                setValue(`${type}City`, localidade);
                setValue(`${type}State`, uf);
            } catch (error) { console.error("Erro ao buscar CEP:", error); } finally { setIsCepLoading(false); }
        };
        const unmaskedCep = unmask(cepValue || '');
        if (unmaskedCep.length === 8) fetchAddress(unmaskedCep);
    }, [cepValue, setValue, type]);

    const isRequired = type === 'residential' || !isDisabled;

    return (
        <VStack gap={4} align="stretch" opacity={isDisabled ? 0.5 : 1}>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Field.Root invalid={!!errors[`${type}Cep`]} required={isRequired}>
                    <Field.Label gap={2}>CEP {isCepLoading && <Spinner size="sm" />}</Field.Label>
                    <Controller name={`${type}Cep`} control={control} rules={{ required: isRequired ? "O CEP é obrigatório" : false }} render={({ field }) => (
                        <Input disabled={isDisabled} bgColor={'gray.700'} value={field.value ? maskCEP(field.value) : ''} onChange={field.onChange} maxLength={10} />
                    )} />
                </Field.Root>
                <Field.Root invalid={!!errors[`${type}State`]} required={isRequired}>
                    <Field.Label>Estado</Field.Label>
                    <Input disabled bgColor={'gray.700'} {...register(`${type}State`, { required: isRequired })} readOnly />
                </Field.Root>
                <Field.Root invalid={!!errors[`${type}City`]} required={isRequired}>
                    <Field.Label>Cidade</Field.Label>
                    <Input disabled bgColor={'gray.700'} {...register(`${type}City`, { required: isRequired })} readOnly />
                </Field.Root>
            </SimpleGrid>
            <Field.Root invalid={!!errors[`${type}Street`]} required={isRequired}>
                <Field.Label>Rua / Logradouro</Field.Label>
                <Input disabled bgColor={'gray.700'} {...register(`${type}Street`, { required: isRequired })} readOnly />
            </Field.Root>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Field.Root invalid={!!errors[`${type}Number`]} required={isRequired}>
                    <Field.Label>Número</Field.Label>
                    <Input disabled={isDisabled} bgColor={'gray.700'} {...register(`${type}Number`, { required: isRequired ? "O número é obrigatório" : false })} />
                </Field.Root>
                <Field.Root>
                    <Field.Label>Complemento</Field.Label>
                    <Input disabled={isDisabled} bgColor={'gray.700'} {...register(`${type}Complement`)} />
                </Field.Root>
                <Field.Root invalid={!!errors[`${type}Neighborhood`]} required={isRequired}>
                    <Field.Label>Bairro</Field.Label>
                    <Input disabled bgColor={'gray.700'} {...register(`${type}Neighborhood`, { required: isRequired })} readOnly />
                </Field.Root>
            </SimpleGrid>
        </VStack>
    );
}

// ============================================================================
//  NOVO SUB-COMPONENTE: CARTEIRA DE INVESTIMENTOS
// ============================================================================
function UserInvestmentsSection({ userId, initialInvestments }: { userId: string, initialInvestments: any[] }) {
    const { getAccessTokenSilently } = useAuth0();
    const [isSaving, setIsSaving] = useState(false);

    // Busca todos os ativos disponíveis para o select
    const { data: allAssets } = useApi<any[]>('/api/assets');

    // Prepara as opções para o Combobox
    const assetOptions = useMemo(() => {
        if (!allAssets) return [];
        return allAssets.map(asset => ({
            label: `${asset.processNumber} ${asset.nickname ? `(${asset.nickname})` : ''}`,
            value: asset.id
        }));
    }, [allAssets]);

    const { control, register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<InvestmentForm>({
        defaultValues: {
            investments: initialInvestments.map(inv => ({
                assetId: inv.asset.id,
                share: inv.investorShare,
                documents: inv.documents || []
            }))
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "investments"
    });

    const handleUploadDoc = async (index: number, files: File[]) => {
        const file = files[0];
        if (!file) return;

        toaster.create({ title: "Enviando documento...", type: "info" });
        try {
            const token = await getAccessTokenSilently();
            const formData = new FormData();
            formData.append('document', file);

            // Adiciona o assetId para renomear o arquivo com o número do processo
            const assetId = getValues(`investments.${index}.assetId`);
            if (assetId) {
                formData.append('assetId', assetId);
            }

            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/management/users/${userId}/investments/documents`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });

            const url = response.data.url;
            const currentDocs = getValues(`investments.${index}.documents`) || [];
            setValue(`investments.${index}.documents`, [...currentDocs, url]);

            toaster.create({ title: "Documento anexado!", type: "success" });
        } catch (error) {
            console.error(error);
            toaster.create({ title: "Erro no upload", type: "error" });
        }
    };

    const handleRemoveDoc = (invIndex: number, docUrl: string) => {
        const currentDocs = getValues(`investments.${invIndex}.documents`) || [];
        const newDocs = currentDocs.filter(d => d !== docUrl);
        setValue(`investments.${invIndex}.documents`, newDocs);
    };

    const onSubmit: SubmitHandler<InvestmentForm> = async (data) => {
        setIsSaving(true);
        try {
            const token = await getAccessTokenSilently();
            await axios.patch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/management/users/${userId}/investments`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toaster.create({ title: "Carteira atualizada!", type: "success" });
        } catch (error) {
            toaster.create({ title: "Erro ao salvar carteira.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    // Sub-componente interno para o Combobox de cada linha
    const AssetCombobox = ({ index, control }: { index: number, control: any }) => {
        const currentAssetId = useWatch({ control, name: `investments.${index}.assetId` });
        const defaultLabel = useMemo(() => assetOptions.find(a => a.value === currentAssetId)?.label || "", [currentAssetId]);
        const [inputValue, setInputValue] = useState(defaultLabel);

        useEffect(() => { if (defaultLabel) setInputValue(defaultLabel); }, [defaultLabel]);

        const { contains } = useFilter({ sensitivity: "base" });
        const { collection, filter } = useListCollection({ initialItems: assetOptions, filter: contains });

        return (
            <Controller name={`investments.${index}.assetId`} control={control} rules={{ required: "Selecione um ativo" }} render={({ field }) => (
                <Field.Root invalid={!!errors.investments?.[index]?.assetId} required w="100%">
                    <Combobox.Root collection={collection} value={field.value ? [field.value] : []} onValueChange={(d) => { field.onChange(d.value[0]); setInputValue(d.items[0]?.label); }} inputValue={inputValue} onInputValueChange={(d) => { setInputValue(d.inputValue); filter(d.inputValue); }}>
                        <Combobox.Control>
                            <Combobox.Input asChild autoComplete="off"><Input bgColor={'gray.700'} borderColor={'gray.600'} placeholder="Buscar processo..." /></Combobox.Input>
                            <Combobox.IndicatorGroup><Combobox.Trigger /></Combobox.IndicatorGroup>
                        </Combobox.Control>
                        <Portal><Combobox.Positioner><Combobox.Content maxH="200px" overflowY="auto">{collection.items.map(item => <Combobox.Item key={item.value} item={item}>{item.label}</Combobox.Item>)}</Combobox.Content></Combobox.Positioner></Portal>
                    </Combobox.Root>
                </Field.Root>
            )} />
        );
    };

    // Sub-componente para a Lista de Documentos dentro do Investimento
    const DocumentsList = ({ index }: { index: number }) => {
        const docs = useWatch({ control, name: `investments.${index}.documents` }) || [];

        return (
            <VStack align="start" w="100%" mt={2} pl={2} borderLeft="2px solid" borderColor="gray.600">
                <Text fontSize="xs" fontWeight="bold" color="gray.400">Documentos do Investimento:</Text>

                {docs.map((url, docIndex) => {
                    const fileName = decodeURIComponent(url.split('/').pop()?.split('-').pop() || `Doc ${docIndex + 1}`);
                    return (
                        <HStack key={url} justify="space-between" w="100%" bg="gray.700" p={1} borderRadius="sm">
                            <HStack>
                                <Icon as={PiFilePdf} color="red.300" />
                                <Text fontSize="xs" truncate maxW="150px">{fileName}</Text>
                            </HStack>
                            <HStack gap={1}>
                                <IconButton size="xs" variant="ghost" aria-label="Ver" onClick={() => window.open(url, '_blank')} type="button"><Icon as={PiEye} /></IconButton>
                                <IconButton size="xs" variant="ghost" colorPalette="red" aria-label="Remover" onClick={() => handleRemoveDoc(index, url)} type="button"><Icon as={PiTrash} /></IconButton>
                            </HStack>
                        </HStack>
                    )
                })}

                <FileUpload.Root accept={[".pdf", ".jpg", ".png"]} maxFiles={1} onFileAccept={(e) => handleUploadDoc(index, e.files)}>
                    <FileUpload.HiddenInput />
                    <FileUpload.Trigger asChild>
                        <Button size="xs" variant="subtle" colorPalette="gray" type="button">
                            <Icon as={PiUploadSimple} /> Anexar Documento
                        </Button>
                    </FileUpload.Trigger>
                </FileUpload.Root>
            </VStack>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <VStack gap={4} align="stretch" p={6} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
                <Flex justify="space-between" align="center">
                    <Heading size="md" display="flex" gap={2} alignItems="center">
                        <Icon as={PiChartLineUp} color="brand.400" /> Carteira de Investimentos
                    </Heading>
                    <Button size="xs" variant="outline" colorPalette="blue" onClick={() => append({ assetId: "", share: 0, documents: [] })} type="button">
                        <Icon as={PiPlusCircle} /> Adicionar
                    </Button>
                </Flex>

                {fields.length === 0 ? (
                    <Text color="gray.500" fontSize="sm">Este usuário não possui investimentos vinculados.</Text>
                ) : (
                    fields.map((field, index) => (
                        <Box key={field.id} p={4} bg="whiteAlpha.50" borderRadius="md" mb={2}>
                            <Stack direction={{ base: 'column', md: 'row' }} gap={4} align="flex-end">
                                <Box flex={1}>
                                    <Text fontSize="xs" mb={1} color="gray.400">Processo / Ativo</Text>
                                    <AssetCombobox index={index} control={control} />
                                </Box>
                                <Box w={{ base: '100%', md: '120px' }}>
                                    <Field.Root>
                                        <Field.Label fontSize="xs">Share (%)</Field.Label>
                                        <Input type="number" step="0.1" bgColor={'gray.700'} borderColor={'gray.600'} {...register(`investments.${index}.share`, { valueAsNumber: true })} />
                                    </Field.Root>
                                </Box>
                                <IconButton aria-label="Remover" colorPalette="red" variant="ghost" onClick={() => remove(index)} type="button">
                                    <Icon as={PiTrash} />
                                </IconButton>
                            </Stack>

                            {/* Lista de Documentos do Investimento */}
                            <DocumentsList index={index} />
                        </Box>
                    ))
                )}

                <Flex justify="flex-end" pt={4}>
                    <Button type="submit" loading={isSaving} colorPalette="green" size="sm">
                        <Icon as={PiFloppyDisk} /> Salvar Carteira
                    </Button>
                </Flex>
            </VStack>
        </form>
    );
}

// ============================================================================
//  PÁGINA PRINCIPAL
// ============================================================================
export default function EditUserPage() {
    const { getAccessTokenSilently } = useAuth0();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    // 1. Busca dados do usuário (Agora inclui 'investments' com documentos)
    const { data: userData, isLoading: isLoadingUser } = useApi<any>(`/api/management/users/${userId}`);
    const { data: associates, isLoading: isLoadingAssociates } = useApi<Associate[]>('/api/users/associates');

    // =================================================================
    //  A CORREÇÃO: Adicionado 'getValues' na destruturação
    // =================================================================
    const { register, handleSubmit, formState: { errors }, control, watch, setValue, getValues, reset } = useForm<UserFormData>({
        defaultValues: {
            nationality: 'Brasileira',
            useCommercialAddress: false,
            contactPreference: [],
            correspondenceAddress: 'residential',
            unknownAssociate: false,
            personalDocumentUrls: [] // Inicializa vazio
        }
    });
    // =================================================================

    // 2. Popula o form
    useEffect(() => {
        if (userData) {
            console.log("Dados do usuário carregados:", userData);
            reset({
                ...userData,
                birthDate: userData.birthDate ? new Date(userData.birthDate).toISOString().split('T')[0] : '',
                contactPreference: userData.contactPreference ? userData.contactPreference.split(',') : [],
                unknownAssociate: !!userData.indication,
                manualReferral: userData.indication,
                useCommercialAddress: !!userData.commercialCep,
                personalDocumentUrls: userData.personalDocumentUrls || []
            });
        }
    }, [userData, reset]);

    const useCommercialAddress = watch('useCommercialAddress');
    const unknownAssociate = watch('unknownAssociate');
    const cpfOrCnpjValue = watch('cpfOrCnpj');
    const personalDocuments = watch('personalDocumentUrls') || [];

    const unmaskedCpfOrCnpj = unmask(cpfOrCnpjValue || '');
    const isCnpj = unmaskedCpfOrCnpj.length > 11;

    const associatesCollection = createListCollection({ items: associates || [] });
    const contactPreference = useController({ control, name: "contactPreference", defaultValue: [] });

    // Função de Exclusão de Documentos Pessoais (com botão type="button" corrigido)
    const handleDeleteDocument = async (indexToRemove: number) => {
        const urlToDelete = personalDocuments[indexToRemove];
        if (!urlToDelete) return;

        const previousDocs = [...personalDocuments];
        const updatedDocs = personalDocuments.filter((_, index) => index !== indexToRemove);
        setValue('personalDocumentUrls', updatedDocs, { shouldDirty: true });

        try {
            const token = await getAccessTokenSilently();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

            await axios.delete(`${apiBaseUrl}/api/management/users/${userId}/documents`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { url: urlToDelete }
            });

            toaster.create({ title: "Documento excluído.", type: "success" });
        } catch (error) {
            console.error("Erro ao deletar documento:", error);
            setValue('personalDocumentUrls', previousDocs);
            toaster.create({ title: "Erro ao excluir.", description: "Não foi possível apagar o arquivo.", type: "error" });
        }
    };

    const onSubmit: SubmitHandler<UserFormData> = async (data) => {
        setIsSubmitting(true);
        try {
            const token = await getAccessTokenSilently();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

            // 1. Processar novos uploads de Documentos Pessoais
            const finalDocumentUrls = [...data.personalDocumentUrls];
            if (data.personalDocuments && data.personalDocuments.length > 0) {
                const files = Array.from(data.personalDocuments);
                for (const file of files) {
                    const formData = new FormData();
                    formData.append('document', file);

                    const uploadRes = await axios.post(`${apiBaseUrl}/api/management/users/${userId}/documents`, formData, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    });

                    if (uploadRes.data.url) {
                        finalDocumentUrls.push(uploadRes.data.url);
                    }
                }
            }

            // 2. Enviar dados atualizados
            const payload = {
                name: data.name,
                cpfOrCnpj: unmask(data.cpfOrCnpj),
                rg: data.rg,
                birthDate: data.birthDate,
                gender: data.gender,
                cellPhone: unmask(data.cellPhone),
                phone: unmask(data.phone || ''),
                profession: data.profession,
                contactPreference: data.contactPreference?.join(','),
                infoEmail: data.infoEmail,

                referredById: data.unknownAssociate ? null : data.referredById,
                indication: data.unknownAssociate ? data.manualReferral : null,

                residentialCep: unmask(data.residentialCep),
                residentialStreet: data.residentialStreet,
                residentialNumber: data.residentialNumber,
                residentialComplement: data.residentialComplement,
                residentialNeighborhood: data.residentialNeighborhood,
                residentialCity: data.residentialCity,
                residentialState: data.residentialState,
                correspondenceAddress: data.correspondenceAddress,
                ...(data.useCommercialAddress && {
                    commercialCep: unmask(data.commercialCep || ''),
                    commercialStreet: data.commercialStreet,
                    commercialNumber: data.commercialNumber,
                    commercialComplement: data.commercialComplement,
                    commercialNeighborhood: data.commercialNeighborhood,
                    commercialCity: data.commercialCity,
                    commercialState: data.commercialState,
                }),
                nationality: data.nationality,
                maritalStatus: data.maritalStatus,

                personalDocumentUrls: finalDocumentUrls
            };

            await axios.patch(`${apiBaseUrl}/api/management/users/${userId}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toaster.create({ title: "Usuário Atualizado!", description: "Os dados foram sincronizados com o Legal One.", type: "success" });
            router.push('/gestao/usuarios');

        } catch (error: any) {
            console.error("Erro ao atualizar:", error);
            toaster.create({ title: "Erro ao Salvar", description: error.response?.data?.error || "Erro desconhecido", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingUser || isLoadingAssociates) {
        return <Flex w="100%" h="50vh" justify="center" align="center"><Spinner size="xl" /></Flex>;
    }

    return (
        <Flex w="100%" p={8} bgColor={'bodyBg'} maxW="breakpoint-lg" borderRadius="md" boxShadow="md" flexDir="column" justify="center" align="center" mx='auto'>
            {/* Botão de Voltar */}
            <Flex w="100%" mb={6}>
                <Link href="/gestao/usuarios" passHref>
                    <Button variant="ghost" size="sm" gap={2} pl={0}>
                        <Icon as={PiArrowLeft} /> Voltar para Lista
                    </Button>
                </Link>
            </Flex>

            <VStack gap={8} align="stretch" w="100%">
                <VStack align="start">
                    <Heading as="h1" size="xl">Editar Usuário</Heading>
                    <Text color="gray.400">Gerencie os dados cadastrais e a carteira de investimentos.</Text>
                </VStack>

                {/* 1. SEÇÃO DE CARTEIRA (COM UPLOAD DE DOCUMENTOS) */}
                {userData && <UserInvestmentsSection userId={userId} initialInvestments={userData.investments || []} />}

                <Separator borderColor="gray.700" />

                {/* 2. FORMULÁRIO DE DADOS PESSOAIS */}
                <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                    <VStack gap={6} align="stretch">
                        <Heading as="h2" size="lg" color="brand.400">Dados Cadastrais</Heading>
                        {/* ... Campos de Inputs Pessoais ... */}

                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Dados Pessoais</Heading>
                        <Field.Root invalid={!!errors.name} required>
                            <Field.Label>{isCnpj ? "Razão Social" : "Nome Completo"}</Field.Label>
                            <Input bgColor={'gray.700'} {...register("name", { required: "Obrigatório" })} />
                        </Field.Root>
                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                            <Field.Root invalid={!!errors.cpfOrCnpj} required>
                                <Field.Label>CPF ou CNPJ</Field.Label>
                                <Controller name="cpfOrCnpj" control={control} rules={{ required: "Obrigatório" }} render={({ field }) => (
                                    <Input bgColor={'gray.700'} value={field.value ? maskCPFOrCNPJ(field.value) : ''} onChange={field.onChange} />
                                )} />
                            </Field.Root>
                            <Field.Root invalid={!!errors.rg}>
                                <Field.Label>RG</Field.Label>
                                <Input bgColor={'gray.700'} {...register("rg")} disabled={isCnpj} />
                            </Field.Root>
                            <Field.Root invalid={!!errors.birthDate}>
                                <Field.Label>Data de Nascimento</Field.Label>
                                <Input type="date" bgColor={'gray.700'} {...register("birthDate")} disabled={isCnpj} />
                            </Field.Root>
                        </SimpleGrid>

                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                            <Field.Root disabled={isCnpj}>
                                <Field.Label>Nacionalidade</Field.Label>
                                <Controller name="nationality" control={control} render={({ field }) => (
                                    <Select.Root collection={nacionalidadesCollection} value={field.value ? [field.value] : []} onValueChange={(d) => field.onChange(d.value[0])} disabled={isCnpj}>
                                        <Select.Control><Select.Trigger bgColor={'gray.700'}><Select.ValueText /></Select.Trigger></Select.Control>
                                        <Portal><Select.Positioner><Select.Content>{nacionalidadesCollection.items.map((i) => (<Select.Item item={i} key={i.value}>{i.label}</Select.Item>))}</Select.Content></Select.Positioner></Portal>
                                    </Select.Root>
                                )} />
                            </Field.Root>
                            <Field.Root disabled={isCnpj}>
                                <Field.Label>Gênero</Field.Label>
                                <Controller name="gender" control={control} render={({ field }) => (
                                    <RadioGroup.Root value={field.value} onValueChange={(d) => field.onChange(d.value)} disabled={isCnpj}>
                                        <Stack direction="row" gap={4} mt={2}>
                                            <RadioGroup.Item value="Male"><RadioGroup.ItemHiddenInput /><RadioGroup.ItemIndicator /><RadioGroup.ItemText>Masc.</RadioGroup.ItemText></RadioGroup.Item>
                                            <RadioGroup.Item value="Female"><RadioGroup.ItemHiddenInput /><RadioGroup.ItemIndicator /><RadioGroup.ItemText>Fem.</RadioGroup.ItemText></RadioGroup.Item>
                                        </Stack>
                                    </RadioGroup.Root>
                                )} />
                            </Field.Root>
                        </SimpleGrid>
                    </VStack>

                    {/* CONTATO */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Contato</Heading>
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                            <Field.Root invalid={!!errors.cellPhone} required>
                                <Field.Label>Celular</Field.Label>
                                <Controller name="cellPhone" control={control} rules={{ required: "Obrigatório" }} render={({ field }) => (
                                    <Input bgColor={'gray.700'} value={field.value ? maskPhone(field.value) : ''} onChange={field.onChange} />
                                )} />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label>E-mail</Field.Label>
                                <Input type="email" bgColor={'gray.700'} {...register("infoEmail")} />
                            </Field.Root>
                        </SimpleGrid>
                    </VStack>

                    {/* INDICAÇÃO */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Indicação (Associado)</Heading>
                        <Controller name="unknownAssociate" control={control} render={({ field }) => (
                            <Checkbox.Root checked={field.value} onCheckedChange={(d) => field.onChange(Boolean(d.checked))} mb={2}>
                                <Checkbox.HiddenInput />
                                <Checkbox.Control bgColor={'gray.100'} color={'black'} />
                                <Checkbox.Label>Associado não cadastrado / Manual</Checkbox.Label>
                            </Checkbox.Root>
                        )} />
                        {unknownAssociate ? (
                            <Field.Root>
                                <Field.Label>Nome do Associado</Field.Label>
                                <Input bgColor={'gray.700'} {...register("manualReferral")} />
                            </Field.Root>
                        ) : (
                            <Controller name="referredById" control={control} render={({ field }) => (
                                <Field.Root>
                                    <Field.Label>Selecionar Associado</Field.Label>
                                    <Select.Root collection={associatesCollection} value={field.value ? [field.value] : []} onValueChange={(d) => field.onChange(d.value[0])}>
                                        <Select.Control><Select.Trigger bgColor={'gray.700'}><Select.ValueText placeholder="Selecione..." /></Select.Trigger></Select.Control>
                                        <Portal><Select.Positioner><Select.Content>{associatesCollection.items.map((i) => (<Select.Item key={i.value} item={i}>{i.label}</Select.Item>))}</Select.Content></Select.Positioner></Portal>
                                    </Select.Root>
                                </Field.Root>
                            )} />
                        )}
                    </VStack>

                    {/* ENDEREÇOS */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Endereço Residencial</Heading>
                        <AddressBlock type="residential" {...{ control, register, errors, watch, setValue }} />
                    </VStack>
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Endereço Comercial</Heading>
                        <Controller name="useCommercialAddress" control={control} render={({ field }) => (
                            <Checkbox.Root checked={field.value} onCheckedChange={(d) => field.onChange(Boolean(d.checked))}>
                                <Checkbox.HiddenInput />
                                <Checkbox.Control bgColor={'gray.100'} color={'black'} />
                                <Checkbox.Label>O endereço comercial é diferente</Checkbox.Label>
                            </Checkbox.Root>
                        )} />
                        {useCommercialAddress && <AddressBlock type="commercial" {...{ control, register, errors, watch, setValue, isDisabled: !useCommercialAddress }} />}
                    </VStack>

                    {/* ================================================================= */}
                    {/* SEÇÃO DE DOCUMENTOS (VIEW & DELETE & UPLOAD)                      */}
                    {/* ================================================================= */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Documentos do Usuário</Heading>

                        {/* LISTA DE DOCUMENTOS EXISTENTES */}
                        {personalDocuments.length === 0 ? (
                            <Text color="gray.500">Nenhum documento anexado.</Text>
                        ) : (
                            <VStack align="stretch" gap={2}>
                                {personalDocuments.map((url, index) => {
                                    const fileName = decodeURIComponent(url.split('/').pop()?.split('-').pop() || `Documento ${index + 1}`);

                                    return (
                                        <HStack key={index} justify="space-between" p={3} bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700">
                                            <HStack gap={3}>
                                                <Icon as={PiFilePdf} color="red.400" boxSize={6} />
                                                <Text fontWeight="medium" truncate maxW="300px">{fileName}</Text>
                                            </HStack>
                                            <HStack>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    colorPalette="blue"
                                                    onClick={() => window.open(url, '_blank')}
                                                    type="button"
                                                >
                                                    <Icon as={PiEye} /> Visualizar
                                                </Button>
                                                <IconButton
                                                    aria-label="Excluir documento"
                                                    size="xs"
                                                    colorPalette="red"
                                                    variant="ghost"
                                                    // =================================================================
                                                    // A CORREÇÃO: type="button" para evitar submit
                                                    // =================================================================
                                                    type="button"
                                                    onClick={() => handleDeleteDocument(index)}
                                                >
                                                    <Icon as={PiTrash} />
                                                </IconButton>
                                            </HStack>
                                        </HStack>
                                    );
                                })}
                            </VStack>
                        )}

                        {/* UPLOAD DE NOVOS DOCUMENTOS */}
                        <Field.Root>
                            <Field.Label>Adicionar Novos Documentos Pessoais</Field.Label>
                            <FileUpload.Root accept={[".pdf", ".jpg", ".jpeg", ".png"]} maxFiles={6} >
                                <FileUpload.HiddenInput  {...register("personalDocuments")} />
                                <FileUpload.Trigger asChild>
                                    <Flex bg={'gray.100'} color={'black'} p={2} alignItems={'center'} cursor={'pointer'} _hover={{ bgColor: 'brand.600', color: 'white' }} gap={2}>
                                        <Icon as={PiUploadSimple} />
                                        Anexar Documentos
                                    </Flex>
                                </FileUpload.Trigger>
                                <FileUpload.List />
                            </FileUpload.Root>
                        </Field.Root>
                    </VStack>
                    {/* ================================================================= */}

                    <Button type="submit" colorPalette="green" size="lg" loading={isSubmitting} gap={2} alignSelf="stretch" mt={8}>
                        <Icon as={PiFloppyDisk} />
                        Salvar Dados Cadastrais
                    </Button>
                </form>
            </VStack>
        </Flex>
    );
}