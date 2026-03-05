'use client';

import {
    Flex, Heading, Text, VStack, Button, Icon, Field, Input, Stack, SimpleGrid, Spinner, Select, createListCollection, Portal, Box, IconButton, Combobox,
} from "@chakra-ui/react";
import { motion } from 'framer-motion';
import { useForm, SubmitHandler, Controller, useFieldArray, Control, useWatch } from "react-hook-form";
import { useListCollection, useFilter } from "@chakra-ui/react";
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { PiCaretDownDuotone, PiFloppyDisk, PiPlusCircle, PiTrash } from "react-icons/pi";
import { Toaster, toaster } from "@/components/ui/toaster";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from '@/hooks/useApi';
import { DetailedCreditAsset } from "../page";

interface InvestorFormInput {
    userId: string;
    share?: number;
    associateId?: string;       // NOVO
    acquisitionDate?: string;   // NOVO
}

interface FormValues {
    processNumber: string;
    nickname?: string; 
    originalCreditor: string;
    origemProcesso: string;
    acquisitionValue: number;
    originalValue: number;
    acquisitionDate: string; // Global
    updateIndexType: string;
    contractualIndexRate: number;
    legalOneId: number;
    legalOneType: string;
    investors: InvestorFormInput[];
}

interface UserSelectItem { value: string; label: string; }

const indexTypesCollection = createListCollection({
    items: [
        { label: "SELIC", value: "SELIC" },
        { label: "IPCA", value: "IPCA" },
        { label: "CDI", value: "CDI" },
        { label: "IGP-M", value: "IGP-M" },
        { label: "Outro", value: "Outro" },
    ],
});

function InvestorCombobox(props: { control: Control<FormValues>, index: number, allInvestors: UserSelectItem[] }) {
    const { control, index, allInvestors } = props;
    const currentUserId = useWatch({ control, name: `investors.${index}.userId` });

    const defaultLabel = useMemo(() => {
        if (!currentUserId || !allInvestors) return "";
        return allInvestors.find(inv => inv.value === currentUserId)?.label || "";
    }, [currentUserId, allInvestors]);

    const [inputValue, setInputValue] = useState(defaultLabel);
    useEffect(() => { if (defaultLabel) setInputValue(defaultLabel); }, [defaultLabel]);

    const { contains } = useFilter({ sensitivity: "base" });
    const { collection, filter } = useListCollection({ initialItems: allInvestors || [], filter: contains });

    const handleInputValueChange = (details: { value: string }) => {
        setInputValue(details.value);
        filter(details.value);
    }

    return (
        <Controller name={`investors.${index}.userId`} control={control} rules={{ required: "Selecione um investidor" }} render={({ field: controllerField, fieldState: { error } }) => (
            <Field.Root invalid={!!error} required >
                <Field.Label>Cliente {index + 1}</Field.Label>
                <Combobox.Root width="100%" collection={collection} value={controllerField.value ? [controllerField.value] : []} onValueChange={(details) => controllerField.onChange(details.value[0])} onInputValueChange={(e) => filter(e.inputValue)} >
                    <Combobox.Control>
                        {(() => {
                            const selectedLabel = controllerField.value ? allInvestors.find(item => item.value === controllerField.value)?.label ?? '' : '';
                            return (
                                <Combobox.Input asChild autoComplete="off">
                                    <Input bgColor={'gray.700'} borderColor={'gray.600'} placeholder="Pesquisar cliente..." defaultValue={selectedLabel} />
                                </Combobox.Input>
                            );
                        })()}
                        <Combobox.IndicatorGroup><Combobox.ClearTrigger /><Combobox.Trigger /></Combobox.IndicatorGroup>
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
        )} />
    );
}

export default function EditAssetPage() {
    const MotionFlex = motion(Flex);
    const { getAccessTokenSilently, isAuthenticated, isLoading: isAuthLoading } = useAuth0();
    const router = useRouter();
    const params = useParams();

    const processNumber = params.processNumber as string;

    const { data: investors, isLoading: isLoadingInvestors } = useApi<UserSelectItem[]>('/api/users');
    const { data: associates, isLoading: isLoadingAssociates } = useApi<UserSelectItem[]>('/api/users/associates');
    const { data: assetData, isLoading: isLoadingAsset } = useApi<any>(
        processNumber ? `/api/assets/${processNumber}` : null
    );

    const isLoadingData = isLoadingInvestors || isLoadingAssociates || isLoadingAsset;

    const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormValues>();

    const { fields, append, remove } = useFieldArray({ control, name: "investors" });

    const associatesCollection = createListCollection({ items: associates || [] });

    useEffect(() => {
        if (assetData) {
            
            // 3. RECUPERA OS NOVOS CAMPOS DO BANCO
            const investorsFromApi: InvestorFormInput[] = assetData.investors.map((inv: any) => ({
                userId: inv.user.id,
                share: inv.investorShare,
                associateId: inv.associateId || "",
                acquisitionDate: inv.acquisitionDate ? new Date(inv.acquisitionDate).toISOString().split('T')[0] : ""
            }));

            const formData = {
                processNumber: assetData.processNumber,
                nickname: assetData.nickname || "", 
                originalCreditor: assetData.originalCreditor,
                origemProcesso: assetData.origemProcesso,
                acquisitionValue: assetData.acquisitionValue,
                originalValue: assetData.originalValue,
                acquisitionDate: new Date(assetData.acquisitionDate).toISOString().split('T')[0],

                investors: investorsFromApi.length > 0 ? investorsFromApi : [{ userId: "", share: 0, associateId: "", acquisitionDate: "" }],

                updateIndexType: assetData.updateIndexType || "Outro",
                contractualIndexRate: assetData.contractualIndexRate || 0,
                legalOneId: assetData.legalOneId!,
                legalOneType: assetData.legalOneType!,
            };

            reset(formData);
        }
    }, [assetData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        const investorUserIds = data.investors.map(inv => inv.userId);
        const uniqueInvestorIds = new Set(investorUserIds);

        if (uniqueInvestorIds.size !== investorUserIds.length) {
            toaster.create({ title: "Cliente Duplicado", description: "Remova o duplicado.", type: "error" });
            return;
        }

        try {
            const token = await getAccessTokenSilently();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

            const payload = {
                nickname: data.nickname, 
                acquisitionValue: data.acquisitionValue,
                originalValue: data.originalValue,
                acquisitionDate: new Date(data.acquisitionDate + 'T00:00:00Z'),
                updateIndexType: data.updateIndexType,
                contractualIndexRate: data.contractualIndexRate,

                // 4. ENVIA OS NOVOS CAMPOS PARA O BACKEND
                investors: data.investors.map(inv => ({
                    userId: inv.userId,
                    share: 0,
                    associateId: inv.associateId || null,
                    acquisitionDate: inv.acquisitionDate ? new Date(inv.acquisitionDate + 'T00:00:00Z') : null
                })),
            };

            await axios.patch(`${apiBaseUrl}/api/assets/${processNumber}`, payload, { headers: { Authorization: `Bearer ${token}` } });
            toaster.create({ title: "Processo Atualizado!", type: "success" });
            router.push(`/processos/${processNumber}`);

        } catch (error: any) {
            toaster.create({ title: "Erro ao Salvar", description: "Falha na atualização.", type: "error" });
        }
    };

    if (isLoadingData) return <Flex w="100%" flex={1} justify="center" align="center"><Spinner size="xl" /></Flex>;
    if (!isAuthenticated) return <Flex w="100%" flex={1} justify="center" align="center"><Text>Por favor, faça login.</Text></Flex>;
    if (!assetData && !isLoadingData) return <Flex w="100%" flex={1} justify="center" align="center"><Text>Processo não encontrado.</Text></Flex>;

    return (
        <MotionFlex direction="column" w="100%" flex={1} p={{ base: 4, md: 8 }}>
            <VStack w="100%" maxW="container.lg" mx="auto" gap={8} align="stretch">
                <VStack align="start">
                    <Heading as="h1" size="xl">Editar Processo de Crédito</Heading>
                    <Text color="gray.500">Altere os dados cadastrais do processo.</Text>
                </VStack>

                <Flex as="form" onSubmit={handleSubmit(onSubmit)}>
                    <Stack gap="6" w="100%">
                        <Heading as="h2" size="md" borderBottomWidth="1px" borderColor="gray.700" pb={2}>1. Identificação do Processo</Heading>

                        <Field.Root>
                            <Field.Label>Nome do Processo (Opcional)</Field.Label>
                            <Input placeholder="Ex: Processo da Fazenda" _placeholder={{ color: 'gray.400' }} borderColor={'gray.700'} bgColor={'gray.700'} {...register("nickname")} />
                        </Field.Root>
                        <Field.Root invalid={!!errors.processNumber} required>
                            <Field.Label>Número do Processo (Legal One)</Field.Label>
                            <Input borderColor={'gray.700'} {...register("processNumber")} disabled bgColor="gray.700" />
                        </Field.Root>
                        <Field.Root invalid={!!errors.originalCreditor} required>
                            <Field.Label>Credor</Field.Label>
                            <Input borderColor={'gray.700'} {...register("originalCreditor")} disabled bgColor="gray.700" />
                        </Field.Root>
                        <Field.Root invalid={!!errors.origemProcesso} required>
                            <Field.Label>Origem do Processo</Field.Label>
                            <Input borderColor={'gray.700'} {...register("origemProcesso")} disabled bgColor="gray.700" />
                        </Field.Root>

                        <Heading as="h2" size="md" borderBottomWidth="1px" borderColor="gray.700" pb={2} pt={4}>2. Dados da Negociação e Envolvidos</Heading>

                        <VStack gap={4} align="stretch" p={4} borderColor="gray.700" borderWidth={1} borderRadius="md" bg="gray.800">
                            <Heading size="sm" color="brand.400">Participação (Clientes / Investidores)</Heading>

                            {fields.map((field, index) => (
                                <Box key={field.id} p={4} borderWidth={1} borderColor="gray.600" borderRadius="md" bg="gray.900">
                                    <Stack direction={{ base: 'column', lg: 'row' }} gap={4} alignItems="flex-end">
                                        
                                        {/* A. CLIENTE */}
                                        <Box flex={2} w="100%">
                                            <InvestorCombobox control={control} index={index} allInvestors={investors || []} />
                                        </Box>

                                        {/* B. ASSOCIADO (INDIVIDUAL) */}
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

                                        {/* C. DATA DE AQUISIÇÃO (INDIVIDUAL) */}
                                        <Box flex={1} w="100%">
                                            <Field.Root>
                                                <Field.Label>Data da Aquisição</Field.Label>
                                                <Input type="date" bgColor={'gray.700'} borderColor="gray.600" {...register(`investors.${index}.acquisitionDate`)} />
                                            </Field.Root>
                                        </Box>

                                        {/* D. BOTÃO REMOVER */}
                                        <Field.Root w={{ base: '100%', lg: 'auto' }}>
                                            {fields.length > 1 && (
                                                <IconButton aria-label="Remover" colorScheme="red" variant="outline" w={{ base: '100%', lg: 'auto' }} onClick={() => remove(index)}> <Icon as={PiTrash} /></IconButton>
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
                                <Field.Label>Custo de Aquisição (R$)</Field.Label>
                                <Input bgColor={'gray.700'} borderColor={'gray.700'} type="number" step="0.01" {...register("acquisitionValue", { required: true, valueAsNumber: true })} />
                            </Field.Root>
                            <Field.Root invalid={!!errors.originalValue} required>
                                <Field.Label>Valor do Processo (na data)</Field.Label>
                                <Input bgColor={'gray.700'} borderColor={'gray.700'} type="number" step="0.01" {...register("originalValue", { required: true, valueAsNumber: true })} />
                            </Field.Root>
                            <Field.Root invalid={!!errors.acquisitionDate} required >
                                <Field.Label>Data Cessão (Mazzotini)</Field.Label>
                                <Input bgColor={'gray.700'} borderColor={'gray.700'} type="date" cursor={'pointer'} {...register("acquisitionDate", { required: true })} />
                            </Field.Root>
                        </SimpleGrid>

                        <Heading as="h2" size="md" borderBottomWidth="1px" borderColor="gray.700" pb={2} pt={4}>3. Índices de Correção</Heading>
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                            <Controller name="updateIndexType" control={control} rules={{ required: "Selecione um índice" }} render={({ field, fieldState: { error } }) => (
                                <Field.Root invalid={!!error} required>
                                    <Field.Label>Índice de Correção</Field.Label>
                                    <Select.Root collection={indexTypesCollection} value={field.value ? [field.value] : []} onValueChange={(details) => field.onChange(details.value[0])}>
                                        <Select.Control><Select.Trigger bgColor={'gray.700'} borderColor={'gray.600'}><Select.ValueText placeholder="Selecione..." /><PiCaretDownDuotone /></Select.Trigger></Select.Control>
                                        <Portal><Select.Positioner><Select.Content>{indexTypesCollection.items.map((item) => (<Select.Item key={item.value} item={item}>{item.label}</Select.Item>))}</Select.Content></Select.Positioner></Portal>
                                    </Select.Root>
                                </Field.Root>
                            )} />
                            <Field.Root invalid={!!errors.contractualIndexRate}>
                                <Field.Label>Taxa Adicional (% a.m.)</Field.Label>
                                <Input bgColor={'gray.700'} borderColor={'gray.700'} type="number" step="0.01" {...register("contractualIndexRate", { valueAsNumber: true })} />
                            </Field.Root>
                        </SimpleGrid>

                        <Button type="submit" colorPalette="blue" size="lg" w={{ base: '100%', md: 'auto' }} alignSelf="flex-end" loading={isSubmitting} gap={2}>
                            <Icon as={PiFloppyDisk} /> <Text>Salvar Alterações</Text>
                        </Button>
                    </Stack>
                </Flex>
            </VStack>
            <Toaster />
        </MotionFlex>
    );
}