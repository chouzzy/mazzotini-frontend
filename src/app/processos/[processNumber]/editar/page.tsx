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
} from "@chakra-ui/react";
import { motion } from 'framer-motion';
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { PiCaretDownDuotone, PiFloppyDisk } from "react-icons/pi";
import { Toaster, toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from '@/hooks/useApi'; 
import { DetailedCreditAsset } from "../page";

// Interface para os Valores do Formulário
interface FormValues {
    processNumber: string;
    originalCreditor: string;
    origemProcesso: string; 
    acquisitionValue: number;
    originalValue: number;
    acquisitionDate: string;
    investorId: string;
    investorShare: number;
    associateId?: string;
    updateIndexType: string;
    contractualIndexRate: number;
    legalOneId: number;
    legalOneType: string;
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

    // Coleções para os selects
    const investorsCollection = createListCollection({ items: investors || [] });
    const associatesCollection = createListCollection({ items: associates || [] });


    // [EFEITO]: Preenche o formulário quando os dados chegam
    useEffect(() => {
        if (assetData) {
            const mainInvestment = assetData.investors?.[0];

            const formData: FormValues = {
                processNumber: assetData.processNumber,
                originalCreditor: assetData.originalCreditor,
                origemProcesso: assetData.origemProcesso,
                acquisitionValue: assetData.acquisitionValue,
                originalValue: assetData.originalValue,
                acquisitionDate: new Date(assetData.acquisitionDate).toISOString().split('T')[0],
                investorId: mainInvestment?.user.id || "",
                investorShare: mainInvestment?.investorShare || 0,
                associateId: assetData.associateId || undefined,
                updateIndexType: assetData.updateIndexType || "Outro",
                contractualIndexRate: assetData.contractualIndexRate || 0,
                legalOneId: assetData.legalOneId!,
                legalOneType: assetData.legalOneType!,
            };
            reset(formData);
        }
    }, [assetData, reset]); 


    // [SUBMIT]: Envia o PATCH
    const onSubmit: SubmitHandler<FormValues> = async (data) => {

        console.log("Dados do Formulário para Envio:", data);
        try {
            const token = await getAccessTokenSilently();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

            // =================================================================
            //  CORREÇÃO: Payload de atualização
            //  Removemos 'originalCreditor' e 'origemProcesso', 
            //  pois eles são imutáveis (como você pediu).
            // =================================================================
            const payload = {
                acquisitionValue: data.acquisitionValue,
                originalValue: data.originalValue,
                acquisitionDate: data.acquisitionDate,
                investorId: data.investorId,
                investorShare: data.investorShare,
                associateId: data.associateId || null,
                updateIndexType: data.updateIndexType,
                contractualIndexRate: data.contractualIndexRate,
            };

            await axios.patch(`${apiBaseUrl}/api/assets/${processNumber}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

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

                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                            {/* CAMPO INVESTIDOR */}
                            <Controller
                                name="investorId"
                                control={control}
                                rules={{ required: "Por favor, selecione um investidor" }}
                                render={({ field, fieldState: { error } }) => (
                                    <Field.Root invalid={!!error} required>
                                        <Field.Label>Investidor Associado</Field.Label>
                                        <Select.Root
                                            collection={investorsCollection}
                                            value={field.value ? [field.value] : []}
                                            onValueChange={(details) => field.onChange(details.value[0])}
                                        >
                                            <Select.Control><Select.Trigger ref={field.ref} color={'white'} cursor={'pointer'} borderColor={'gray.600'}><Select.ValueText placeholder="Selecione um investidor..." /><PiCaretDownDuotone /></Select.Trigger></Select.Control>
                                            <Portal><Select.Positioner><Select.Content>
                                                {investorsCollection.items.map((investor) => (
                                                    <Select.Item key={investor.value} item={investor} >
                                                        {investor.label}
                                                    </Select.Item>
                                                ))}
                                            </Select.Content></Select.Positioner></Portal>
                                        </Select.Root>
                                        {error && <Field.ErrorText>{error.message}</Field.ErrorText>}
                                    </Field.Root>
                                )}
                            />

                            {/* CAMPO: ASSOCIADO (VENDEDOR) */}
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
                        </SimpleGrid>

                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
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
                            <Field.Root invalid={!!errors.investorShare} required>
                                <Field.Label>Percentual do Investidor (%)</Field.Label>
                                <Input
                                    _placeholder={{ color: 'gray.400' }}
                                    borderColor={'gray.700'}
                                    type="number"
                                    step="0.1"
                                    placeholder="80"
                                    {...register("investorShare", { required: "Este campo é obrigatório", valueAsNumber: true, min: 0, max: 100 })}
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
            <Toaster />
        </MotionFlex>
    );
}