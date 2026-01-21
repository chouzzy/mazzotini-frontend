// src/app/processos/novo/page.tsx
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
    InputGroup,
    Box,
    HStack,
    IconButton,
    // Imports para o Combobox
    Combobox,
} from "@chakra-ui/react";
import { motion } from 'framer-motion';
// =================================================================
//  A MUDANÇA (Baseado na sua documentação)
// =================================================================
// Importar useFieldArray, useListCollection, useFilter
import { useForm, SubmitHandler, Controller, useWatch, useFieldArray, Control } from "react-hook-form";
import { useListCollection, useFilter } from "@chakra-ui/react"; // <-- ADICIONADO
// =================================================================
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
// Importar ícone de lixeira
import { PiCaretDownDuotone, PiPlusCircle, PiMagnifyingGlass, PiTrash } from "react-icons/pi";
import { Toaster, toaster } from "@/components/ui/toaster";
// Adicionando useState (para o fetch)
import { useState } from "react";
import { useApi } from '@/hooks/useApi';

// ============================================================================
//  INTERFACE PARA OS VALORES DO FORMULÁRIO (ATUALIZADA)
// ============================================================================

// Interface para um único cliente  no array
interface InvestorFormInput {
    userId: string;
    share?: number; // <-- Share agora é opcional no formulário
}

// Interface atualizada
interface FormValues {
    processNumber: string;
    originalCreditor: string;
    otherParty: string; // <--- NOVO
    nickname?: string;  // Opcional
    origemProcesso: string;
    // ... outros campos mantidos
    acquisitionValue: number;
    originalValue: number;
    acquisitionDate: string;
    associateId?: string;
    updateIndexType: string;
    contractualIndexRate: number;
    legalOneId: number;
    legalOneType: 'Lawsuit' | 'Appeal' | 'ProceduralIssue';
    investors: InvestorFormInput[];
}

interface LookupResponse {
    originalCreditor: string;
    otherParty?: string; // <--- NOVO
    origemProcesso: string;
    legalOneId: number;
    legalOneType: 'Lawsuit' | 'Appeal' | 'ProceduralIssue';
}

// Tipagem para a lista de utilizadores (cliente es e Associados)
interface UserSelectItem {
    value: string;
    label: string;
}

// --- COLEÇÃO PARA OS ÍNDICES ---
const indexTypesCollection = createListCollection({
    items: [
        { label: "SELIC", value: "SELIC" },
        { label: "IPCA", value: "IPCA" },
        { label: "CDI", value: "CDI" },
        { label: "IGP-M", value: "IGP-M" },
        { label: "Outro", value: "OUTRO" },
    ],
});

// ============================================================================
//  NOVO SUB-COMPONENTE (Para Corrigir o Bug do Combobox)
// ============================================================================
/**
 * Este componente encapsula a lógica de estado do Combobox 
 * (useListCollection e useFilter) para que cada item no 
 * useFieldArray tenha o seu próprio estado de filtro.
 */
function InvestorCombobox(props: {
    control: Control<FormValues>,
    index: number,
    allInvestors: UserSelectItem[]
}) {
    const { control, index, allInvestors } = props;

    // 1. Pega a função de filtro 'contains'
    const { contains } = useFilter({ sensitivity: "base" });

    // 2. Cria a coleção de cliente es filtrável (ESTADO LOCAL)
    const { collection, filter } = useListCollection({
        initialItems: allInvestors || [], // Usa os dados da nossa API
        filter: contains, // Usa o filtro 'contains'
    });

    return (
        <Controller
            name={`investors.${index}.userId`}
            control={control}
            rules={{ required: "Selecione um cliente" }}
            render={({ field: controllerField, fieldState: { error } }) => (
                <Field.Root invalid={!!error} required>
                    <Field.Label>Cliente {index + 1}</Field.Label>

                    <Combobox.Root
                        width="100%"
                        collection={collection} // <-- Usa a coleção local filtrável
                        // Sincroniza o valor do Controller (RHF) com o Combobox
                        value={controllerField.value ? [controllerField.value] : []}
                        onValueChange={(details) => controllerField.onChange(details.value[0])}
                        // Atualiza o filtro da coleção local
                        onInputValueChange={(e) => filter(e.inputValue)}
                    >
                        <Combobox.Control>
                            <Combobox.Input
                                asChild
                                autoComplete="off"
                            >
                                <Input
                                    bgColor={'gray.700'}
                                    borderColor={'gray.600'}
                                    placeholder="Pesquisar cliente..."
                                />
                            </Combobox.Input>
                            {/* Usando o IndicatorGroup como na documentação */}
                            <Combobox.IndicatorGroup>
                                <Combobox.ClearTrigger />
                                <Combobox.Trigger />
                            </Combobox.IndicatorGroup>
                        </Combobox.Control>
                        <Portal>
                            <Combobox.Positioner>
                                <Combobox.Content>
                                    <Combobox.Empty>Nenhum cliente encontrado</Combobox.Empty>
                                    {/* Itera sobre 'collection.items' */}
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
//  COMPONENTE PRINCIPAL: CreateAssetPage
// ============================================================================
export default function CreateAssetPage() {
    const MotionFlex = motion(Flex);
    const { getAccessTokenSilently, isAuthenticated, isLoading: isAuthLoading } = useAuth0();
    const [isFetchingData, setIsFetchingData] = useState(false);

    // --- Busca de Dados para os Selects ---
    const { data: investors, isLoading: isLoadingInvestors } = useApi<UserSelectItem[]>('/api/users');
    const { data: associates, isLoading: isLoadingAssociates } = useApi<UserSelectItem[]>('/api/users/associates');

    const isLoadingData = isLoadingInvestors || isLoadingAssociates;

    const {
        register,
        handleSubmit,
        control,
        setValue,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            processNumber: "",
            nickname: "", // Default vazio
            originalCreditor: "",
            acquisitionDate: "",
            origemProcesso: "",
            contractualIndexRate: 0,
            investors: [{ userId: "", share: 0 }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "investors"
    });

    // Observa o campo processNumber para habilitar o botão de busca
    const processNumberValue = useWatch({ control, name: 'processNumber' });

    // Coleção para o select de Associados (este é um Select normal, não Combobox)
    const associatesCollection = createListCollection({ items: associates || [] });

    // (handleFetchProcessData... sem mudanças)
    // BUSCA DE DADOS (ATUALIZADA)
    const handleFetchProcessData = async () => {
        setIsFetchingData(true);
        const processNumber = getValues("processNumber");
        if (!processNumber) { toaster.create({ title: "Erro", type: "error" }); setIsFetchingData(false); return; }

        try {
            const token = await getAccessTokenSilently();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
            const response = await axios.get<LookupResponse>(`${apiBaseUrl}/api/assets/lookup/${processNumber}`, { headers: { Authorization: `Bearer ${token}` } });

            const { originalCreditor, origemProcesso, legalOneId, legalOneType, otherParty } = response.data;

            setValue("originalCreditor", originalCreditor);
            setValue("origemProcesso", origemProcesso);
            if (otherParty) setValue("otherParty", otherParty); // <--- Preenche Parte Contrária

            setValue("legalOneId", legalOneId);
            setValue("legalOneType", legalOneType);

            toaster.create({ title: "Dados Encontrados!", type: "success" });
        } catch (error: any) {
            console.error("Erro busca:", error);
            toaster.create({ title: "Erro ao Buscar", description: error.response?.data?.error, type: "error" });
        } finally { setIsFetchingData(false); }
    };


    // --- FUNÇÃO DE SUBMISSÃO (CADASTRO) ---
    // (Lógica do share: 0 mantida)

    // --- FUNÇÃO DE SUBMISSÃO (CADASTRO) ---
    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        if (!data.legalOneId) { toaster.create({ title: "Dados Incompletos", type: "error" }); return; }

        try {
            const token = await getAccessTokenSilently();
            const payload = {
                ...data,
                acquisitionDate: new Date(data.acquisitionDate + 'T00:00:00Z'),
                investors: data.investors.map(inv => ({ userId: inv.userId, share: 0 })),
                associateId: data.associateId || null,
            };
            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets`, payload, { headers: { Authorization: `Bearer ${token}` } });
            toaster.create({ title: "Ativo Registado!", type: "success" });
            window.location.href = `/processos/${data.processNumber}`;
        } catch (error: any) {
            toaster.create({ title: "Erro ao Registrar", description: error.response?.data?.error, type: "error" });
        }
    };

    // --- (Carregamento e Autenticação... sem mudanças) ---
    if (isAuthLoading || isLoadingData) {
        return <Flex w="100%" flex={1} justify="center" align="center"><Spinner size="xl" /></Flex>;
    }
    if (!isAuthenticated) {
        return <Flex w="100%" flex={1} justify="center" align="center"><Text>Por favor, faça login para acessar a esta página.</Text></Flex>;
    }
    // --- Fim ---

    return (
        <MotionFlex direction="column" w="100%" flex={1} p={{ base: 4, md: 8 }}>
            <VStack w="100%" mx="auto" gap={8} align="stretch" >
                <VStack align="start" > <Heading as="h1" size="xl" > Registrar Novo Ativo </Heading></VStack >

                <Flex as="form" onSubmit={handleSubmit(onSubmit)} >
                    <Stack gap="6" w="100%" >
                        <Heading as="h2" size="md" borderBottomWidth="1px" borderColor="gray.700" color={'brand.500'} pb={2} > 1. Identificação </Heading>

                        {/* Processo */}
                        <Field.Root invalid={!!errors.processNumber} required >
                            <Field.Label>Número do Processo </Field.Label>
                            < Input placeholder="Ex: 0012345..." borderColor={'gray.700'} bgColor={'gray.700'} {...register("processNumber", { required: true })} />
                            < Button size="sm" onClick={handleFetchProcessData} loading={isFetchingData} disabled={!processNumberValue} bgColor={'brand.800'} color={'white'} >
                                <Icon as={PiMagnifyingGlass} /> Buscar
                            </Button>
                        </Field.Root>

                        {/* Campos de Dados do Processo */}
                        <Field.Root invalid={!!errors.originalCreditor} required >
                            <Field.Label>Cliente Principal </Field.Label>
                            < Input borderColor={'gray.700'} disabled bgColor={'gray.700'} {...register("originalCreditor", { required: true })} readOnly placeholder="Preenchido pela busca..." />
                        </Field.Root>

                        {/* NOVO CAMPO: Parte Contrária (Preenchido auto, mas visível) */}
                        <Field.Root required >
                            <Field.Label>Parte Contrária </Field.Label>
                            < Input borderColor={'gray.700'} disabled bgColor={'gray.700'} {...register("otherParty", { required: "Parte contrária obrigatória" })} readOnly placeholder="Preenchido pela busca..." />
                        </Field.Root>

                        < Field.Root invalid={!!errors.origemProcesso} required >
                            <Field.Label>Origem(Vara) </Field.Label>
                            < Input borderColor={'gray.700'} {...register("origemProcesso", { required: true })} disabled readOnly bgColor="gray.700" placeholder="Preenchido pela busca..." />
                        </Field.Root>

                        {/* Apelido Interno (Opcional) */}
                        <Field.Root>
                            <Field.Label>Apelido Interno(Opcional) </Field.Label>
                            < Input borderColor={'gray.700'} bgColor={'gray.700'} {...register("nickname")} placeholder="Ex: Caso da Fazenda" />
                        </Field.Root>
                        {/* --- Fim dos Campos de Processo --- */}


                        <Heading as="h2" size="md" borderBottomWidth="1px" color={'brand.500'} borderColor="gray.700" pb={2} pt={4}>
                            2. Dados da Negociação e Envolvidos
                        </Heading>

                        {/* ================================================================= */}
                        {/* Repetidor de Clientes (COM O NOVO SUB-COMPONENTE)            */}
                        {/* ================================================================= */}
                        <VStack gap={4} align="stretch" p={4} borderColor="gray.700" borderWidth={1} borderRadius="md">
                            <Heading size="sm">Participação (Clientes)</Heading>

                            {fields.map((field, index) => (
                                <SimpleGrid
                                    key={field.id}
                                    columns={{ base: 1, md: 3 }}
                                    gap={4}
                                    alignItems="flex-end"
                                >
                                    {/* A MÁGICA: Renderiza o componente com estado encapsulado */}
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
                                                aria-label="Remover Cliente"
                                                colorPalette="red"
                                                variant="plain"
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
                                variant="solid"
                                colorPalette="blue"
                                onClick={() => append({ userId: "", share: 0 })} // Adiciona com share 0
                                alignSelf="flex-start"
                            >
                                <Icon as={PiPlusCircle} /> Adicionar Cliente
                            </Button>
                        </VStack>

                        {/* CAMPO: ASSOCIADO (VENDEDOR) - (Sem mudanças) */}
                        <Controller
                            name="associateId"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <Field.Root invalid={!!errors.associateId}>
                                    <Field.Label>Associado Responsável (Opcional)</Field.Label>
                                    <Select.Root
                                        collection={associatesCollection}
                                        value={field.value ? [field.value] : undefined}
                                        onValueChange={(details) => field.onChange(details.value[0])}
                                    >
                                        <Select.Control><Select.Trigger ref={field.ref} color={'white'} cursor={'pointer'} bgColor={'gray.700'} borderColor={'gray.600'}><Select.ValueText placeholder="Selecione um associado..." /><PiCaretDownDuotone /></Select.Trigger></Select.Control>
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
                        {/* FIM DA MUDANÇA (Funcionalidade 2)                                  */}
                        {/* ================================================================= */}

                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                            <Field.Root invalid={!!errors.acquisitionValue} required>
                                <Field.Label>Custo de Aquisição (R$)</Field.Label>
                                <Input
                                    bgColor={'gray.700'}
                                    _placeholder={{ color: 'gray.400' }}
                                    borderColor={'gray.700'}
                                    type="number"
                                    step="0.01"
                                    placeholder="Ex: 30000.00"
                                    {...register("acquisitionValue", { required: "Este campo é obrigatório", valueAsNumber: true })}
                                />
                            </Field.Root>
                            <Field.Root invalid={!!errors.originalValue} required>
                                <Field.Label>Valor na Data do Crédito (R$)</Field.Label>
                                <Input
                                    bgColor={'gray.700'}
                                    _placeholder={{ color: 'gray.400' }}
                                    borderColor={'gray.700'}
                                    type="number"
                                    step="0.01"
                                    placeholder="Ex: 50000.00"
                                    {...register("originalValue", { required: "Este campo é obrigatório", valueAsNumber: true })}
                                />
                            </Field.Root>
                        </SimpleGrid>

                        {/* --- CAMPOS DE ÍNDICE --- */}
                        <Heading as="h2" size="md" borderBottomWidth="1px" color={'brand.500'} borderColor="gray.700" pb={2} pt={4}>
                            3. Índices de Correção
                        </Heading>
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                            <Controller
                                name="updateIndexType"
                                control={control}
                                rules={{ required: "Selecione um índice" }}
                                render={({ field, fieldState: { error } }) => (
                                    <Field.Root invalid={!!errors.updateIndexType} required>
                                        <Field.Label>Índice de Correção Contratual</Field.Label>
                                        <Select.Root
                                            collection={indexTypesCollection}
                                            value={field.value ? [field.value] : []}
                                            onValueChange={(details) => field.onChange(details.value[0])}
                                        >
                                            <Select.Control><Select.Trigger ref={field.ref} color={'white'} cursor={'pointer'} bgColor={'gray.700'} borderColor={'gray.600'}><Select.ValueText placeholder="Selecione o índice..." /><PiCaretDownDuotone /></Select.Trigger></Select.Control>
                                            <Portal><Select.Positioner><Select.Content>
                                                {indexTypesCollection.items.map((item) => (
                                                    <Select.Item key={item.value} item={item} >
                                                        {item.label}
                                                    </Select.Item>
                                                ))}
                                            </Select.Content></Select.Positioner></Portal>
                                        </Select.Root>
                                        {error && <Field.ErrorText>{error.message}</Field.ErrorText>}
                                    </Field.Root>
                                )}
                            />
                            <Field.Root invalid={!!errors.contractualIndexRate}>
                                <Field.Label>Taxa Adicional (% a.m.)</Field.Label>
                                <Input
                                    bgColor={'gray.700'}
                                    _placeholder={{ color: 'gray.400' }}
                                    borderColor={'gray.700'}
                                    type="number"
                                    step="0.01"
                                    placeholder="1.0"
                                    {...register("contractualIndexRate", { valueAsNumber: true, min: 0 })}
                                />
                                <Field.HelperText>Deixe 0 se não houver taxa adicional (ex: SELIC + 0%).</Field.HelperText>
                            </Field.Root>
                        </SimpleGrid>
                        {/* --- FIM DOS CAMPOS --- */}


                        <Field.Root invalid={!!errors.acquisitionDate} required >
                            <Field.Label>Data de Aquisição</Field.Label>
                            <Input
                                _placeholder={{ color: 'gray.400' }}
                                borderColor={'gray.700'}
                                bgColor={'gray.700'}
                                type="date"
                                cursor={'pointer'}
                                {...register("acquisitionDate", { required: "Este campo é obrigatório" })}
                            />
                        </Field.Root>

                        <Button
                            type="submit"
                            color={'white'}
                            bgColor={'brand.700'}
                            size="lg"
                            w={{ base: '100%', md: 'auto' }}
                            alignSelf="flex-end"
                            loading={isSubmitting}
                            gap={2}
                            mt={4}
                        >
                            <Icon as={PiPlusCircle} />
                            <Text>Registrar Ativo</Text>
                        </Button>
                    </Stack>
                </Flex>
            </VStack>

        </MotionFlex>
    );
}




