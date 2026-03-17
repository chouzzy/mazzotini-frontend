'use client';

import {
    Flex, Heading, Text, VStack, Button, Icon, Field, Input, SimpleGrid, Spinner, Select, createListCollection, Portal, Box, HStack, IconButton, Combobox, Stack
} from "@chakra-ui/react";
import { motion } from 'framer-motion';
import { useForm, SubmitHandler, Controller, useWatch, useFieldArray, Control } from "react-hook-form";
import { useListCollection, useFilter } from "@chakra-ui/react"; 
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { PiCaretDownDuotone, PiPlusCircle, PiMagnifyingGlass, PiTrash } from "react-icons/pi"; 
import { Toaster, toaster } from "@/components/ui/toaster";
import { useState, useMemo, useEffect } from "react"; 
import { useApi } from '@/hooks/useApi';
import { useRouter } from "next/navigation"; // <-- IMPORTANTE: Adicionado router

// 1. ATUALIZAMOS A INTERFACE DO INVESTIDOR
interface InvestorFormInput {
    userId: string;
    share?: number; 
    associateId?: string;       
    acquisitionDate?: string;   
}

interface FormValues {
    processNumber: string;
    originalCreditor: string;
    otherParty: string; 
    nickname?: string;  
    origemProcesso: string;
    acquisitionValue: number;
    originalValue: number;
    acquisitionDate: string; 
    updateIndexType: string;  
    contractualIndexRate: number; 
    legalOneId: number;
    legalOneType: 'Lawsuit' | 'Appeal' | 'ProceduralIssue';
    folderId?: string; 
    investors: InvestorFormInput[];
}

interface LookupResponse {
    originalCreditor: string;
    otherParty?: string;
    origemProcesso: string;
    legalOneId: number;
    legalOneType: 'Lawsuit' | 'Appeal' | 'ProceduralIssue';
    nickname?: string;
    processFolderId?: string;
    suggestedInvestors?: { userId: string; share: number }[]; 
}

interface UserSelectItem { value: string; label: string; }
const indexTypesCollection = createListCollection({ items: [{ label: "SELIC", value: "SELIC" }, { label: "IPCA", value: "IPCA" }, { label: "CDI", value: "CDI" }, { label: "IGP-M", value: "IGP-M" }, { label: "Outro", value: "OUTRO" }] });

function InvestorCombobox(props: any) { 
    const { control, index, allInvestors } = props;
    const currentUserId = useWatch({ control, name: `investors.${index}.userId` });
    const defaultLabel = useMemo(() => {
        if (!currentUserId || !allInvestors) return "";
        return allInvestors.find((inv: any) => inv.value === currentUserId)?.label || "";
    }, [currentUserId, allInvestors]);
    const [inputValue, setInputValue] = useState(defaultLabel);
    useEffect(() => { if (defaultLabel) setInputValue(defaultLabel); }, [defaultLabel]);
    const { contains } = useFilter({ sensitivity: "base" });
    const { collection, filter } = useListCollection({ initialItems: allInvestors, filter: contains });
    return (
        <Controller name={`investors.${index}.userId`} control={control} rules={{ required: "Selecione um Cliente" }} render={({ field: cf, fieldState: { error } }) => (
            <Field.Root invalid={!!error} required>
                <Field.Label>Cliente {index + 1}</Field.Label>
                <Combobox.Root width="100%" collection={collection} value={cf.value ? [cf.value] : []} onValueChange={(d) => { cf.onChange(d.value[0]); setInputValue((d.items[0] as UserSelectItem)?.label); }} inputValue={inputValue} onInputValueChange={(d) => { setInputValue(d.inputValue); filter(d.inputValue); }}>
                    <Combobox.Control><Combobox.Input asChild autoComplete="off"><Input bgColor={'gray.700'} borderColor={'gray.600'} placeholder="Pesquisar Cliente..." /></Combobox.Input><Combobox.IndicatorGroup><Combobox.Trigger /></Combobox.IndicatorGroup></Combobox.Control>
                    <Portal><Combobox.Positioner><Combobox.Content maxH="200px" overflowY="auto">{collection.items.map((item: any) => (<Combobox.Item item={item} key={item.value} _hover={{ bg: 'gray.600' }} _selected={{ bg: 'blue.600' }}>{item.label}<Combobox.ItemIndicator /></Combobox.Item>))}</Combobox.Content></Combobox.Positioner></Portal>
                </Combobox.Root>
                {error && <Field.ErrorText>{error.message}</Field.ErrorText>}
            </Field.Root>
        )} />
    );
}

export default function CreateAssetPage() {
    const MotionFlex = motion(Flex);
    const { getAccessTokenSilently, isAuthenticated, isLoading: isAuthLoading } = useAuth0();
    const router = useRouter(); // <-- Router instanciado
    const [isFetchingData, setIsFetchingData] = useState(false); 

    // --- Buscas de Dados ---
    const { data: myProfile, isLoading: isLoadingProfile } = useApi<any>('/api/users/me'); // <-- Busca quem está logado
    const { data: investors, isLoading: isLoadingInvestors, mutate: mutateInvestors } = useApi<UserSelectItem[]>('/api/users');
    const { data: associates, isLoading: isLoadingAssociates } = useApi<UserSelectItem[]>('/api/users/associates');
    
    const isLoadingData = isLoadingInvestors || isLoadingAssociates || isLoadingProfile;

    // ============================================================================
    //  TRAVA DE SEGURANÇA (BLOQUEIO DE ROTA PARA INVESTIDORES)
    // ============================================================================
    useEffect(() => {
        if (myProfile && !isLoadingProfile) {
            const isAdminOrOperator = myProfile.role === 'ADMIN' || myProfile.role === 'OPERATOR';
            if (!isAdminOrOperator) {
                toaster.create({ title: "Acesso Negado", description: "Você não tem permissão para registrar processos.", type: "error" });
                router.push('/dashboard');
            }
        }
    }, [myProfile, isLoadingProfile, router]);
    // ============================================================================

    const { register, handleSubmit, control, setValue, getValues, formState: { errors, isSubmitting } } = useForm<FormValues>({
        defaultValues: { processNumber: "", nickname: "", investors: [{ userId: "", share: 0, associateId: "", acquisitionDate: "" }], contractualIndexRate: 0 }
    });

    const { fields, append, remove, replace } = useFieldArray({ control, name: "investors" });
    const processNumberValue = useWatch({ control, name: 'processNumber' });
    const associatesCollection = createListCollection({ items: associates || [] });

    const handleFetchProcessData = async () => {
        setIsFetchingData(true);
        const processNumber = getValues("processNumber"); 
        if (!processNumber) { toaster.create({ title: "Erro", type: "error" }); setIsFetchingData(false); return; }

        try {
            const token = await getAccessTokenSilently();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
            const response = await axios.get<LookupResponse>(`${apiBaseUrl}/api/assets/lookup/${processNumber}`, { headers: { Authorization: `Bearer ${token}` } });
            
            const { originalCreditor, origemProcesso, legalOneId, legalOneType, otherParty, nickname, processFolderId, suggestedInvestors } = response.data;
            
            setValue("originalCreditor", originalCreditor);
            setValue("origemProcesso", origemProcesso);
            if (otherParty) setValue("otherParty", otherParty);
            if (nickname) setValue("nickname", nickname);
            if (processFolderId) setValue("folderId", processFolderId);

            setValue("legalOneId", legalOneId);
            setValue("legalOneType", legalOneType);

            if (suggestedInvestors && suggestedInvestors.length > 0) {
                await mutateInvestors();
                const investorsForm = suggestedInvestors.map(inv => ({
                    userId: inv.userId,
                    share: inv.share,
                    associateId: "", // Vazio por padrão
                    acquisitionDate: ""
                }));
                replace(investorsForm);
                toaster.create({ title: "Clientes vinculados automaticamente!", type: "info" });
            }
            toaster.create({ title: "Dados Encontrados!", type: "success" });
        } catch (error: any) {
            toaster.create({ title: "Erro ao Buscar", description: error.response?.data?.error, type: "error" });
        } finally { setIsFetchingData(false); }
    };

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        if (!data.legalOneId) { toaster.create({ title: "Dados Incompletos", type: "error" }); return; }
        
        const investorUserIds = data.investors.map(inv => inv.userId);
        const uniqueInvestorIds = new Set(investorUserIds);
        if (uniqueInvestorIds.size !== investorUserIds.length) {
            toaster.create({ title: "Cliente Duplicado", description: "Remova os duplicados.", type: "error" });
            return;
        }

        try {
            const token = await getAccessTokenSilently();
            const payload = {
                ...data,
                acquisitionDate: new Date(data.acquisitionDate + 'T00:00:00Z'),
                investors: data.investors.map(inv => ({ 
                    userId: inv.userId, 
                    share: 0,
                    associateId: inv.associateId || null,
                    acquisitionDate: inv.acquisitionDate ? new Date(inv.acquisitionDate + 'T00:00:00Z') : null
                }))
            };

            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets`, payload, { headers: { Authorization: `Bearer ${token}` } });
            toaster.create({ title: "Processo Registrado!", type: "success" });
            window.location.href = `/processos/${data.processNumber}`;
        } catch (error: any) {
            toaster.create({ title: "Erro ao Registrar", description: error.response?.data?.error, type: "error" });
        }
    };

    if (isAuthLoading || isLoadingData) return <Flex w="100%" flex={1} justify="center" align="center"><Spinner size="xl" /></Flex>;
    if (!isAuthenticated) return <Flex w="100%" flex={1} justify="center" align="center"><Text>Login necessário.</Text></Flex>;

    return (
        <MotionFlex direction="column" w="100%" flex={1} p={{ base: 4, md: 8 }}>
            <VStack w="100%" mx="auto" gap={8} align="stretch">
                <VStack align="start"><Heading as="h1" size="xl">Registrar Novo Processo</Heading></VStack>

                <Flex as="form" onSubmit={handleSubmit(onSubmit)}>
                    <Flex flexDir={'column'} gap="6" w="100%">
                        <Heading as="h2" size="md" borderBottomWidth="1px" borderColor="gray.700" pb={2}>1. Identificação</Heading>
                        <input type="hidden" {...register("folderId")} />

                        <Field.Root invalid={!!errors.processNumber} required>
                            <Field.Label>Número do Processo</Field.Label>
                            <Input placeholder="Ex: 0012345..." borderColor={'gray.700'} bgColor={'gray.700'} {...register("processNumber", { required: true, setValueAs: (value) => value?.trim() })} />
                            <Button size="sm" onClick={handleFetchProcessData} loading={isFetchingData} disabled={!processNumberValue} bgColor={'brand.800'} color={'white'} mt={2}>
                                <Icon as={PiMagnifyingGlass} /> Buscar
                            </Button>
                        </Field.Root>

                        <Field.Root invalid={!!errors.originalCreditor} required>
                            <Field.Label>Credor Original (Cliente)</Field.Label>
                            <Input borderColor={'gray.700'} disabled bgColor={'gray.700'} {...register("originalCreditor", { required: true })} readOnly />
                        </Field.Root>
                        
                        <Field.Root required>
                            <Field.Label>Parte Contrária</Field.Label>
                            <Input borderColor={'gray.700'} disabled bgColor={'gray.700'} {...register("otherParty", { required: "Obrigatório" })} readOnly />
                        </Field.Root>

                        <Field.Root invalid={!!errors.origemProcesso} required>
                            <Field.Label>Origem</Field.Label>
                            <Input borderColor={'gray.700'} {...register("origemProcesso", { required: true })} disabled readOnly bgColor="gray.700" />
                        </Field.Root>
                        
                        <Field.Root>
                            <Field.Label>Apelido Interno (Opcional)</Field.Label>
                            <Input borderColor={'gray.700'} bgColor={'gray.700'} {...register("nickname")} placeholder="Ex: Caso da Fazenda" />
                        </Field.Root>

                         <Heading as="h2" size="md" borderBottomWidth="1px" borderColor="gray.700" pb={2} pt={4}>2. Negociação</Heading>
                         
                         <VStack gap={4} align="stretch" p={4} borderColor="gray.700" borderWidth={1} borderRadius="md" bg="gray.800">
                            <Heading size="sm" color="brand.400">Participação (Clientes / Investidores)</Heading>
                            {fields.map((field, index) => (
                                <Box key={field.id} p={4} borderWidth={1} borderColor="gray.600" borderRadius="md" bg="gray.900">
                                    <Stack direction={{ base: 'column', lg: 'row' }} gap={4} alignItems="flex-end">
                                        
                                        <Box flex={2} w="100%">
                                            <InvestorCombobox control={control} index={index} allInvestors={investors || []} />
                                        </Box>
                                        
                                        <Box flex={2} w="100%">
                                            <Controller name={`investors.${index}.associateId`} control={control} render={({ field }) => (
                                                <Field.Root>
                                                    <Field.Label>Associado (Corretor)</Field.Label>
                                                    <Select.Root collection={associatesCollection} value={field.value ? [field.value] : []} onValueChange={(d) => field.onChange(d.value[0])}>
                                                        <Select.Control><Select.Trigger bgColor={'gray.700'} borderColor="gray.600"><Select.ValueText placeholder="Nenhum" /></Select.Trigger></Select.Control>
                                                        <Portal><Select.Positioner><Select.Content>{associatesCollection.items.map((i) => (<Select.Item key={i.value} item={i}>{i.label}</Select.Item>))}</Select.Content></Select.Positioner></Portal>
                                                    </Select.Root>
                                                </Field.Root>
                                            )} />
                                        </Box>

                                        <Box flex={1} w="100%">
                                            <Field.Root>
                                                <Field.Label>Data da Aquisição</Field.Label>
                                                <Input type="date" bgColor={'gray.700'} borderColor="gray.600" {...register(`investors.${index}.acquisitionDate`)} />
                                            </Field.Root>
                                        </Box>

                                        <Field.Root w={{ base: '100%', lg: 'auto' }}>
                                            {fields.length > 1 && (
                                                <IconButton aria-label="Remover" colorScheme="red" variant="outline" w={{ base: '100%', lg: 'auto' }} onClick={() => remove(index)} > <Icon as={PiTrash} /> </IconButton>
                                            )}
                                        </Field.Root>

                                    </Stack>
                                </Box>
                            ))}
                            <Button size="sm" variant="outline" colorScheme="blue" onClick={() => append({ userId: "", share: 0 })} alignSelf="flex-start"> 
                                <Icon as={PiPlusCircle} /> Adicionar Cliente
                            </Button>
                        </VStack>

                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
                            <Field.Root invalid={!!errors.acquisitionValue} required>
                                <Field.Label>Custo Aquisição Total (R$)</Field.Label>
                                <Input bgColor={'gray.700'} borderColor={'gray.700'} type="number" step="0.01" {...register("acquisitionValue", { required: true, valueAsNumber: true })} />
                            </Field.Root>
                            <Field.Root invalid={!!errors.originalValue} required>
                                <Field.Label>Valor Original do Processo (R$)</Field.Label>
                                <Input bgColor={'gray.700'} borderColor={'gray.700'} type="number" step="0.01" {...register("originalValue", { required: true, valueAsNumber: true })} />
                            </Field.Root>
                            <Field.Root invalid={!!errors.acquisitionDate} required>
                                <Field.Label>Data Cessão (Mazzotini)</Field.Label>
                                <Input bgColor={'gray.700'} borderColor={'gray.700'} type="date" {...register("acquisitionDate", { required: true })} />
                            </Field.Root>
                        </SimpleGrid>

                         <Heading as="h2" size="md" borderBottomWidth="1px" borderColor="gray.700" pb={2} pt={4}>3. Correção</Heading>
                         <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                            <Controller name="updateIndexType" control={control} rules={{ required: "Selecione um índice" }} render={({ field }) => (
                                <Field.Root invalid={!!errors.updateIndexType} required>
                                    <Field.Label>Índice</Field.Label>
                                    <Select.Root collection={indexTypesCollection} value={field.value ? [field.value] : []} onValueChange={(d) => field.onChange(d.value[0])}>
                                        <Select.Control><Select.Trigger ref={field.ref} color={'white'} cursor={'pointer'} bgColor={'gray.700'} borderColor={'gray.600'}><Select.ValueText placeholder="Selecione..." /><PiCaretDownDuotone /></Select.Trigger></Select.Control>
                                        <Portal><Select.Positioner><Select.Content>{indexTypesCollection.items.map((i) => (<Select.Item key={i.value} item={i}>{i.label}</Select.Item>))}</Select.Content></Select.Positioner></Portal>
                                    </Select.Root>
                                </Field.Root>
                            )} />
                            <Field.Root>
                                <Field.Label>Taxa Adicional (% a.m.)</Field.Label>
                                <Input bgColor={'gray.700'} borderColor={'gray.700'} type="number" step="0.01" {...register("contractualIndexRate", { valueAsNumber: true })} />
                            </Field.Root>
                        </SimpleGrid>

                        <Button type="submit" color={'white'} bgColor={'brand.700'} size="lg" w={{ base: '100%', md: 'auto' }} alignSelf="flex-end" loading={isSubmitting} gap={2} mt={4}>
                            <Icon as={PiPlusCircle} /> Registrar Processo
                        </Button>
                    </Flex>
                </Flex>
            </VStack>
            <Toaster />
        </MotionFlex>
    );
}