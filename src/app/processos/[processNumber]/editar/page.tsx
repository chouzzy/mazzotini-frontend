// src/app/processos/[processNumber]/editar/page.tsx
'use client';

import {
    Flex,
    Heading,
    Text,
    VStack,
    Button,
    Icon,
    Field,
    Input,
    Stack,
    SimpleGrid,
    Spinner,
    Select,
    createListCollection,
    Portal,
    // NOVO: Imports para o repetidor
    Box,
    HStack,
    IconButton,
    Combobox,
} from "@chakra-ui/react";
import { motion } from 'framer-motion';
// NOVO: Importar useFieldArray
import { useForm, SubmitHandler, Controller, useFieldArray, Control } from "react-hook-form";
// NOVO: Importar useListCollection, useFilter
import { useListCollection, useFilter } from "@chakra-ui/react";
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
// NOVO: Importar ícone de lixeira
import { PiCaretDownDuotone, PiFloppyDisk, PiPlusCircle, PiTrash } from "react-icons/pi";
import { Toaster, toaster } from "@/components/ui/toaster";
// NOVO: Importar useState, useEffect, useMemo
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from '@/hooks/useApi';
import { DetailedCreditAsset } from "../page";

// ============================================================================
//  INTERFACE PARA OS VALORES DO FORMULÁRIO (ATUALIZADA)
// ============================================================================

// Interface para um único investidor no array
interface InvestorFormInput {
    userId: string;
    share?: number; // Share é opcional
}

interface FormValues {
    processNumber: string;
    originalCreditor: string;
    origemProcesso: string;
    acquisitionValue: number;
    originalValue: number;
    acquisitionDate: string;
    associateId?: string;
    updateIndexType: string;
    contractualIndexRate: number;
    legalOneId: number; // Não editável, mas precisa estar no form
    legalOneType: string; // Não editável, mas precisa estar no form

    // ATUALIZADO: Agora é um array
    investors: InvestorFormInput[];
}

// Tipagem para a lista de utilizadores
interface UserSelectItem {
    value: string;
    label: string;
}

// Coleção de Índices
const indexTypesCollection = createListCollection({
    items: [
        { label: "SELIC", value: "SELIC" },
        { label: "IPCA", value: "IPCA" },
        { label: "CDI", value: "CDI" },
        { label: "IGP-M", value: "IGP-M" },
        { label: "Outro", value: "Outro" },
    ],
});

// ============================================================================
//  SUB-COMPONENTE (Combobox do Investidor)
// =***************************************************************************
// (O mesmo componente que usamos na página /novo)
function InvestorCombobox(props: {
    control: Control<FormValues>,
    index: number,
    allInvestors: UserSelectItem[]
}) {
    const { control, index, allInvestors } = props;

    const { contains } = useFilter({ sensitivity: "base" });
    const { collection, filter } = useListCollection({
        initialItems: allInvestors || [],
        filter: contains,
    });

    return (
        <Controller
            name={`investors.${index}.userId`}
            control={control}
            rules={{ required: "Selecione um investidor" }}
            render={({ field: controllerField, fieldState: { error } }) => (
                <Field.Root invalid={!!error} required >
                    <Field.Label>Investidor {index + 1}</Field.Label>
                    <Combobox.Root
                        width="100%"
                        collection={collection}
                        value={controllerField.value ? [controllerField.value] : []}
                        onValueChange={(details) => controllerField.onChange(details.value[0])}
                        onInputValueChange={(e) => filter(e.inputValue)}
                    >
                        <Combobox.Control>
                            {(() => {
                                const selectedLabel = controllerField.value
                                    ? allInvestors.find(item => item.value === controllerField.value)?.label ?? ''
                                    : '';
                                return (
                                    <Combobox.Input asChild autoComplete="off">
                                        <Input
                                            bgColor={'gray.700'}
                                            borderColor={'gray.600'}
                                            placeholder="Pesquisar investidor..."
                                            defaultValue={selectedLabel}
                                        />
                                    </Combobox.Input>
                                );
                            })()}
                            <Combobox.IndicatorGroup>
                                <Combobox.ClearTrigger />
                                <Combobox.Trigger />
                            </Combobox.IndicatorGroup>
                        </Combobox.Control>
                        <Portal>
                            <Combobox.Positioner>
                                <Combobox.Content>
                                    <Combobox.Empty>Nenhum investidor encontrado</Combobox.Empty>
                                    {collection.items.map((item) => (
                                        <Combobox.Item item={item} key={item.value} _hover={{ bg: 'gray.600' }} _selected={{ bg: 'blue.600' }}>
                                            {item.label}
                                            <Combobox.ItemIndicator />
                                        </Combobox.Item>
                                    ))}
                                </Combobox.Content>
                            </Combobox.Positioner>
                        </Portal>
                    </Combobox.Root>
                    {error && <Field.ErrorText>{error.message}</Field.ErrorText>}
                </Field.Root>
            )}
        />
    );
}
// ============================================================================
//  FIM DO SUB-COMPONENTE
// ============================================================================


// ============================================================================
//  COMPONENTE PRINCIPAL: EditAssetPage
// ============================================================================
export default function EditAssetPage() {
    const MotionFlex = motion(Flex);
    const { getAccessTokenSilently, isAuthenticated, isLoading: isAuthLoading } = useAuth0();
    const router = useRouter();
    const params = useParams();

    const processNumber = params.processNumber as string;

    // --- Buscas de Dados ---
    const { data: investors, isLoading: isLoadingInvestors } = useApi<UserSelectItem[]>('/api/users');
    const { data: associates, isLoading: isLoadingAssociates } = useApi<UserSelectItem[]>('/api/users/associates');
    const { data: assetData, isLoading: isLoadingAsset } = useApi<DetailedCreditAsset>(
        processNumber ? `/api/assets/${processNumber}` : null
    );

    const isLoadingData = isLoadingInvestors || isLoadingAssociates || isLoadingAsset;

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>();

    // =================================================================
    //  A MUDANÇA (Funcionalidade 2): Lógica do Repetidor
    // =================================================================
    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: "investors"
    });
    // =================================================================

    // Coleções para os selects
    const associatesCollection = createListCollection({ items: associates || [] });


    // [EFEITO]: Preenche o formulário quando os dados chegam
    useEffect(() => {
        if (assetData) {
            console.log("[EditAsset] Dados do ativo carregados:", assetData);

            // =================================================================
            //  A MUDANÇA (Funcionalidade 2): Preenche o useFieldArray
            // =================================================================
            const investorsFromApi: InvestorFormInput[] = assetData.investors.map(inv => ({
                userId: inv.user.id,
                share: inv.investorShare, // (O campo % está comentado, mas carregamos o valor)
            }));
            // =================================================================

            const formData = {
                processNumber: assetData.processNumber,
                originalCreditor: assetData.originalCreditor,
                origemProcesso: assetData.origemProcesso,
                acquisitionValue: assetData.acquisitionValue,
                originalValue: assetData.originalValue,
                acquisitionDate: new Date(assetData.acquisitionDate).toISOString().split('T')[0],

                // ATUALIZADO: Popula o array de investidores
                investors: investorsFromApi.length > 0 ? investorsFromApi : [{ userId: "", share: 0 }], // Garante que há pelo menos 1

                associateId: assetData.associateId || undefined,
                updateIndexType: assetData.updateIndexType || "Outro",
                contractualIndexRate: assetData.contractualIndexRate || 0,
                legalOneId: assetData.legalOneId!,
                legalOneType: assetData.legalOneType!,
            };

            // 'reset' preenche o formulário E o useFieldArray
            reset(formData);
        }
    }, [assetData, reset]);


    // [SUBMIT]: Envia o PATCH
    const onSubmit: SubmitHandler<FormValues> = async (data) => {

        console.log("Dados do Formulário para Envio:", data);
        try {


            // Validação de Duplicidade (Frontend)
            const investorUserIds = data.investors.map(inv => inv.userId);
            const uniqueInvestorIds = new Set(investorUserIds);

            console.log("IDs dos Investidores no Formulário:", investorUserIds);
            console.log("IDs Únicos dos Investidores:", Array.from(uniqueInvestorIds));

            if (Array.from(uniqueInvestorIds).length !== investorUserIds.length) {
                console.log("Investidor duplicado detectado no formulário.");
                toaster.create({
                    title: "Investidor Duplicado",
                    description: "Você não pode adicionar o mesmo investidor duas vezes ao mesmo processo. Por favor, remova o investidor duplicado.",
                    type: "error",
                });
                return;
            }

            const token = await getAccessTokenSilently();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

            // =================================================================
            //  A MUDANÇA (Funcionalidade 2): Envia o payload com o array
            // =================================================================
            const payload = {
                // Campos editáveis do CreditAsset
                acquisitionValue: data.acquisitionValue,
                originalValue: data.originalValue,
                acquisitionDate: new Date(data.acquisitionDate + 'T00:00:00Z'), // Envia como Date
                associateId: data.associateId || null,
                updateIndexType: data.updateIndexType,
                contractualIndexRate: data.contractualIndexRate,

                // O array de investidores (com share 0, como pedido)
                investors: data.investors.map(inv => ({
                    userId: inv.userId,
                    share: 0 // <-- Hardcoded 0%
                })),
            };

            await axios.patch(`${apiBaseUrl}/api/assets/${processNumber}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            // =================================================================

            toaster.create({
                title: "Ativo Atualizado!",
                description: `O processo ${data.processNumber} foi salvo com sucesso.`,
                type: "success",
            });

            router.push(`/processos/${processNumber}`);

        } catch (error: any) {
            console.error("Erro ao atualizar ativo:", error);
            toaster.create({
                title: "Erro ao Salvar",
                description: error.response?.data?.error || "Ocorreu um erro inesperado. Tente novamente.",
                type: "error",
            });
        }
    };

    if (isLoadingData) {
        return <Flex w="100%" flex={1} justify="center" align="center"><Spinner size="xl" /></Flex>;
    }

    if (!isAuthenticated) {
        return <Flex w="100%" flex={1} justify="center" align="center"><Text>Por favor, faça login para aceder a esta página.</Text></Flex>;
    }

    if (!assetData && !isLoadingData) {
        return <Flex w="100%" flex={1} justify="center" align="center"><Text>Ativo não encontrado.</Text></Flex>;
    }

    return (
        <MotionFlex
            direction="column"
            w="100%"
            flex={1}
            p={{ base: 4, md: 8 }}
        >
            
            <VStack w="100%" maxW="container.lg" mx="auto" gap={8} align="stretch">
                <VStack align="start">
                    <Heading as="h1" size="xl">Editar Ativo de Crédito</Heading>
                    <Text color="gray.500">Altere os dados cadastrais do processo.</Text>
                </VStack>

                <Flex as="form" onSubmit={handleSubmit(onSubmit)}>
                    <Stack gap="6" w="100%">
                        <Heading as="h2" size="md" borderBottomWidth="1px" borderColor="gray.700" pb={2}>
                            1. Identificação do Processo (Imutável)
                        </Heading>

                        {/* CAMPOS BLOQUEADOS (readOnly) */}
                        <Field.Root invalid={!!errors.processNumber} required>
                            <Field.Label>Número do Processo (Legal One)</Field.Label>
                            <Input
                                _placeholder={{ color: 'gray.400' }}
                                borderColor={'gray.700'}
                                {...register("processNumber")}
                                readOnly
                                disabled
                                bgColor="gray.700"
                            />
                        </Field.Root>

                        <Field.Root invalid={!!errors.originalCreditor} required>
                            <Field.Label>Credor Original (Cliente Principal)</Field.Label>
                            <Input
                                _placeholder={{ color: 'gray.400' }}
                                borderColor={'gray.700'}
                                {...register("originalCreditor")}
                                readOnly
                                disabled
                                bgColor="gray.700"
                            />
                        </Field.Root>

                        <Field.Root invalid={!!errors.origemProcesso} required>
                            <Field.Label>Origem do Processo (Vara/Turma)</Field.Label>
                            <Input
                                _placeholder={{ color: 'gray.400' }}
                                borderColor={'gray.700'}
                                {...register("origemProcesso")}
                                readOnly
                                disabled
                                bgColor="gray.700"
                            />
                        </Field.Root>

                        <Heading as="h2" size="md" borderBottomWidth="1px" borderColor="gray.700" pb={2} pt={4}>
                            2. Dados da Negociação e Envolvidos (Editável)
                        </Heading>

                        {/* ================================================================= */}
                        {/* A MUDANÇA (Funcionalidade 2): Repetidor de Investidores          */}
                        {/* ================================================================= */}
                        <VStack gap={4} align="stretch" p={4} borderColor="gray.700" borderWidth={1} borderRadius="md">
                            <Heading size="sm">Participação (Investidores)</Heading>

                            {/* O loop agora chama o sub-componente InvestorCombobox */}
                            {fields.map((field, index) => (
                                <SimpleGrid
                                    key={field.id}
                                    columns={{ base: 1, md: 3 }}
                                    gap={4}
                                    alignItems="flex-end"
                                >
                                    <InvestorCombobox
                                        control={control}
                                        index={index}
                                        allInvestors={investors || []}
                                    />

                                    {/* CAMPO SHARE (COMENTADO) */}
                                    {/*
                                    <Field.Root invalid={!!errors.investors?.[index]?.share} required>
                                        <Field.Label>Percentual (%)</Field.Label>
                                        <Input
                                            bgColor={'gray.700'}
                                            _placeholder={{ color: 'gray.400' }}
                                            borderColor={'gray.700'}
                                            type="number"
                                            {...register(`investors.${index}.share` as const, { ... })}
                                        />
                                    </Field.Root>
                                    */}

                                    {/* BOTÃO REMOVER (SÓ APARECE SE TIVER MAIS DE 1) */}
                                    <Field.Root>
                                        {fields.length > 1 && (
                                            <IconButton
                                                aria-label="Remover Investidor"
                                                colorPalette="red"
                                                variant="ghost"
                                                onClick={() => remove(index)}
                                            >
                                                <Icon as={PiTrash} />
                                            </IconButton>
                                        )}
                                    </Field.Root>
                                </SimpleGrid>
                            ))}

                            {/* BOTÃO ADICIONAR NOVO */}
                            <Button
                                size="sm"
                                variant="subtle"
                                colorPalette="blue"
                                onClick={() => append({ userId: "", share: 0 })}
                                alignSelf="flex-start"
                            >
                                <Icon as={PiPlusCircle} /> Adicionar Investidor
                            </Button>
                        </VStack>

                        {/* CAMPO: ASSOCIADO (VENDEDOR) - (Sem mudanças) */}
                        <Controller
                            name="associateId"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <Field.Root invalid={!!error}>
                                    <Field.Label>Associado Responsável (Opcional)</Field.Label>
                                    <Select.Root
                                        collection={associatesCollection}
                                        value={field.value ? [field.value] : []}
                                        onValueChange={(details) => field.onChange(details.value[0])}
                                    >
                                        <Select.Control><Select.Trigger ref={field.ref} color={'white'} cursor={'pointer'} borderColor={'gray.600'}><Select.ValueText placeholder="Selecione um associado..." /><PiCaretDownDuotone /></Select.Trigger></Select.Control>
                                        <Portal><Select.Positioner><Select.Content>
                                            {associatesCollection.items.map((associate) => (
                                                <Select.Item key={associate.value} item={associate}>
                                                    {associate.label}
                                                </Select.Item>
                                            ))}
                                        </Select.Content></Select.Positioner></Portal>
                                    </Select.Root>
                                    {error && <Field.ErrorText>{error.message}</Field.ErrorText>}
                                </Field.Root>
                            )}
                        />
                        {/* ================================================================= */}

                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                            <Field.Root invalid={!!errors.acquisitionValue} required>
                                <Field.Label>Custo de Aquisição (R$)</Field.Label>
                                <Input
                                    _placeholder={{ color: 'gray.400' }}
                                    borderColor={'gray.700'}
                                    type="number"
                                    step="0.01"
                                    placeholder="30000.00"
                                    {...register("acquisitionValue", { required: "Este campo é obrigatório", valueAsNumber: true })}
                                />
                            </Field.Root>
                            <Field.Root invalid={!!errors.originalValue} required>
                                <Field.Label>Valor do Ativo (na data da aquisição)</Field.Label>
                                <Input
                                    _placeholder={{ color: 'gray.400' }}
                                    borderColor={'gray.700'}
                                    type="number"
                                    step="0.01"
                                    placeholder="50000.00"
                                    {...register("originalValue", { required: "Este campo é obrigatório", valueAsNumber: true })}
                                />
                            </Field.Root>
                        </SimpleGrid>

                        {/* --- CAMPOS DE ÍNDICE (Editáveis) --- */}
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                            <Controller
                                name="updateIndexType"
                                control={control}
                                rules={{ required: "Selecione um índice" }}
                                render={({ field, fieldState: { error } }) => (
                                    <Field.Root invalid={!!error} required>
                                        <Field.Label>Índice de Correção Contratual</Field.Label>
                                        <Select.Root
                                            collection={indexTypesCollection}
                                            value={field.value ? [field.value] : []}
                                            onValueChange={(details) => field.onChange(details.value[0])}
                                        >
                                            <Select.Control><Select.Trigger ref={field.ref} color={'white'} cursor={'pointer'} borderColor={'gray.600'}><Select.ValueText placeholder="Selecione um índice..." /><PiCaretDownDuotone /></Select.Trigger></Select.Control>
                                            <Portal><Select.Positioner><Select.Content>
                                                {indexTypesCollection.items.map((item) => (
                                                    <Select.Item key={item.value} item={item}>
                                                        {item.label}
                                                    </Select.Item>
                                                ))}
                                            </Select.Content></Select.Positioner></Portal>
                                        </Select.Root>
                                        {error && <Field.ErrorText>{error.message}</Field.ErrorText>}
                                    </Field.Root>
                                )}
                            />
                            <Field.Root>
                                <Field.Label>Taxa Adicional (ex: +1% a.m.)</Field.Label>
                                <Input
                                    _placeholder={{ color: 'gray.400' }}
                                    borderColor={'gray.700'}
                                    type="number"
                                    step="0.01"
                                    placeholder="1.0"
                                    {...register("contractualIndexRate", { valueAsNumber: true })}
                                />
                            </Field.Root>
                        </SimpleGrid>
                        {/* --- FIM DOS CAMPOS DE ÍNDICE --- */}

                        <Field.Root invalid={!!errors.acquisitionDate} required >
                            <Field.Label>Data de Aquisição</Field.Label>
                            <Input
                                _placeholder={{ color: 'gray.400' }}
                                borderColor={'gray.700'}
                                type="date"
                                cursor={'pointer'}
                                {...register("acquisitionDate", { required: "Este campo é obrigatório" })}
                            />
                        </Field.Root>

                        <Button
                            type="submit"
                            colorPalette="blue"
                            size="lg"
                            w={{ base: '100%', md: 'auto' }}
                            alignSelf="flex-end"
                            loading={isSubmitting}
                            gap={2}
                        >
                            <Icon as={PiFloppyDisk} />
                            <Text>Salvar Alterações</Text>
                        </Button>
                    </Stack>
                </Flex>
            </VStack>
            
        </MotionFlex>
    );
}