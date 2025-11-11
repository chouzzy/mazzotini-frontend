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
    InputGroup, // Importado
} from "@chakra-ui/react";
import { motion } from 'framer-motion';
import { useForm, SubmitHandler, Controller, useWatch } from "react-hook-form";
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { PiCaretDownDuotone, PiPlusCircle, PiMagnifyingGlass } from "react-icons/pi"; // Importado
import { Toaster, toaster } from "@/components/ui/toaster";
import { useState } from "react";
import { useApi } from '@/hooks/useApi'; // Importar o useApi

// ============================================================================
//  INTERFACE PARA OS VALORES DO FORMULÁRIO (ATUALIZADA)
// ============================================================================
interface FormValues {
    processNumber: string;
    originalCreditor: string;
    origemProcesso: string;
    acquisitionValue: number;
    originalValue: number;
    acquisitionDate: string;
    investorId: string;
    investorShare: number;
    associateId?: string; // Campo para o ID do associado

    // --- NOVOS CAMPOS PARA CÁLCULO ---
    updateIndexType: string;  // SELIC, IPCA, CDI, etc.
    contractualIndexRate: number; // Taxa adicional (ex: 1% a.m.)

    // NOVOS: Campos ocultos que vêm da busca
    legalOneId: number;
    legalOneType: 'Lawsuit' | 'Appeal' | 'ProceduralIssue';
}

// Interface para a resposta da busca (lookup)
interface LookupResponse {
    originalCreditor: string;
    origemProcesso: string; // "Órgão - Vara/Turma"
}

// NOVO: Tipagem para a resposta da API de Lookup
interface LookupResponse {
    originalCreditor: string;
    origemProcesso: string;
    legalOneId: number;
    legalOneType: 'Lawsuit' | 'Appeal' | 'ProceduralIssue';
}

// Tipagem para a lista de utilizadores (Investidores e Associados)
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
//  COMPONENTE PRINCIPAL: CreateAssetPage
// ============================================================================
export default function CreateAssetPage() {
    const MotionFlex = motion(Flex);
    const { getAccessTokenSilently, isAuthenticated, isLoading: isAuthLoading } = useAuth0();
    const [isFetchingData, setIsFetchingData] = useState(false); // Estado para o loading da busca

    // --- Busca de Dados para os Selects ---
    const { data: investors, isLoading: isLoadingInvestors } = useApi<UserSelectItem[]>('/api/users');
    const { data: associates, isLoading: isLoadingAssociates } = useApi<UserSelectItem[]>('/api/users/associates');

    const isLoadingData = isLoadingInvestors || isLoadingAssociates;

    const {
        register,
        handleSubmit,
        control,
        setValue, // Importado para preencher o formulário
        getValues, // NOVO: Para ler o número do processo
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            processNumber: "",
            originalCreditor: "",
            acquisitionDate: "",
            origemProcesso: "",
            contractualIndexRate: 0,
        }
    });

    // Observa o campo processNumber para habilitar o botão de busca
    const processNumberValue = useWatch({ control, name: 'processNumber' });

    // Coleções para os selects
    const investorsCollection = createListCollection({ items: investors || [] });
    const associatesCollection = createListCollection({ items: associates || [] });

    const handleFetchProcessData = async () => {
        setIsFetchingData(true);
        const processNumber = getValues("processNumber"); // Pega o número digitado

        if (!processNumber) {
            toaster.create({ title: "Erro", description: "Por favor, digite um número de processo para buscar.", type: "error" });
            setIsFetchingData(false);
            return;
        }

        try {
            const token = await getAccessTokenSilently();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

            // Chama o nosso novo endpoint de "lookup"
            const response = await axios.get<LookupResponse>(
                `${apiBaseUrl}/api/assets/lookup/${processNumber}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { originalCreditor, origemProcesso, legalOneId, legalOneType } = response.data;

            // Preenche os campos do formulário com os dados encontrados
            setValue("originalCreditor", originalCreditor);
            setValue("origemProcesso", origemProcesso);
            // Salva os dados ocultos (mas essenciais)
            setValue("legalOneId", legalOneId);
            setValue("legalOneType", legalOneType);

            console.log("Dados do processo encontrados:", response.data);

            toaster.create({ title: "Dados Encontrados!", description: `Credor "${originalCreditor}" localizado.`, type: "success" });

        } catch (error: any) {
            console.error("Erro ao buscar dados do processo:", error);
            // Limpa os campos se der erro
            setValue("originalCreditor", "");
            setValue("origemProcesso", "");
            toaster.create({
                title: "Erro ao Buscar Processo",
                description: error.response?.data?.error || "Processo não encontrado no Legal One.",
                type: "error",
            });
        } finally {
            setIsFetchingData(false);
        }
    };

    // --- FUNÇÃO DE SUBMISSÃO (CADASTRO) ---
    const onSubmit: SubmitHandler<FormValues> = async (data) => {

        // Validação final: Garante que os dados do Legal One foram buscados
        if (!data.legalOneId || !data.legalOneType) {
            toaster.create({
                title: "Dados Incompletos",
                description: "Por favor, clique em 'Buscar Dados' ao lado do número do processo antes de salvar.",
                type: "error",
            });
            return; // Impede o submit
        }

        try {
            const token = await getAccessTokenSilently();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

            // O payload agora inclui os dados do Legal One e os novos índices
            const payload = {
                ...data,
                associateId: data.associateId || null,
            };

            console.log("Enviando payload:", payload);

            await axios.post(`${apiBaseUrl}/api/assets`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            toaster.create({
                title: "Ativo Registado!",
                description: `O processo ${data.processNumber} foi registado com sucesso.`,
                type: "success",
            });
            // TODO: Limpar o formulário ou redirecionar?
            // reset(); // Limpa o formulário

        } catch (error: any) {
            console.error("Erro ao criar ativo:", error);
            toaster.create({
                title: "Erro ao Registar Ativo.",
                description: error.response?.data?.error || "Ocorreu um erro inesperado. Tente novamente.",
                type: "error",
            });
        }
    };

    if (isAuthLoading || isLoadingData) {
        return <Flex w="100%" flex={1} justify="center" align="center"><Spinner size="xl" /></Flex>;
    }

    if (!isAuthenticated) {
        return <Flex w="100%" flex={1} justify="center" align="center"><Text>Por favor, faça login para acessar a esta página.</Text></Flex>;
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
                    <Heading as="h1" size="xl">Registar Novo Ativo de Crédito</Heading>
                    <Text color="gray.500">Insira o número do processo e clique em "Buscar" para carregar os dados.</Text>
                </VStack>

                <Flex as="form" onSubmit={handleSubmit(onSubmit)}>
                    <Stack gap="6" w="100%">
                        <Heading as="h2" size="md" borderBottomWidth="1px" borderColor="gray.700" pb={2}>
                            1. Identificação do Processo
                        </Heading>
                        <Field.Root invalid={!!errors.processNumber} required>
                            <Field.Label>Número do Processo</Field.Label>
                            <Input
                                placeholder="Ex: 0012345-67.2023.5.02.0001"
                                _placeholder={{ color: 'gray.400' }}
                                borderColor={'gray.700'}
                                {...register("processNumber", { required: "Este campo é obrigatório" })}
                            />
                            <Button
                                size="sm"
                                onClick={handleFetchProcessData}
                                loading={isFetchingData}
                                disabled={!processNumberValue}
                                colorPalette="blue"
                            >
                                <Icon as={PiMagnifyingGlass} />
                                Buscar
                            </Button>
                            <Field.ErrorText>{errors.processNumber?.message}</Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={!!errors.originalCreditor} required>
                            <Field.Label>Credor Original (Cliente Principal)</Field.Label>
                            <Input
                                placeholder="Preenchido pela busca..."
                                _placeholder={{ color: 'gray.400' }}
                                borderColor={'gray.700'}
                                {...register("originalCreditor", { required: "Este campo é obrigatório" })}
                                readOnly // Agora é preenchido pela API
                                bgColor={"gray.800"} // Feedback visual
                            />
                        </Field.Root>

                        <Field.Root invalid={!!errors.origemProcesso} required>
                            <Field.Label>Origem do Processo (Órgão e Vara)</Field.Label>
                            <Input
                                placeholder="Preenchido pela busca..."
                                _placeholder={{ color: 'gray.400' }}
                                borderColor={'gray.700'}
                                {...register("origemProcesso", { required: "Este campo é obrigatório" })}
                                readOnly // Agora é preenchido pela API
                                bgColor="gray.800" // Feedback visual
                            />
                        </Field.Root>

                        <Heading as="h2" size="md" borderBottomWidth="1px" borderColor="gray.700" pb={2} pt={4}>
                            2. Dados da Negociação e Envolvidos
                        </Heading>

                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                            {/* CAMPO INVESTIDOR */}
                            <Controller
                                name="investorId"
                                control={control}
                                rules={{ required: "Por favor, selecione um investidor" }}
                                render={({ field, fieldState: { error } }) => (
                                    <Field.Root invalid={!!errors.investorId} required>
                                        <Field.Label>Investidor Associado</Field.Label>
                                        <Select.Root
                                            collection={investorsCollection}
                                            value={field.value ? [field.value] : undefined}
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
                                    <Field.Root invalid={!!errors.associateId}>
                                        <Field.Label>Associado Responsável (Opcional)</Field.Label>
                                        <Select.Root
                                            collection={associatesCollection}
                                            value={field.value ? [field.value] : undefined}
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
                                <Field.Label>Valor na Data do Crédito (R$)</Field.Label>
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

                        {/* --- CAMPOS DE ÍNDICE --- */}
                        <Heading as="h2" size="md" borderBottomWidth="1px" borderColor="gray.700" pb={2} pt={4}>
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
                                            value={field.value ? [field.value] : undefined}
                                            onValueChange={(details) => field.onChange(details.value[0])}
                                        >
                                            <Select.Control><Select.Trigger ref={field.ref} color={'white'} cursor={'pointer'} borderColor={'gray.600'}><Select.ValueText placeholder="Selecione o índice..." /><PiCaretDownDuotone /></Select.Trigger></Select.Control>
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
                            mt={4} // Adicionado espaço
                        >
                            <Icon as={PiPlusCircle} />
                            <Text>Registar Ativo</Text> {/* Texto ajustado */}
                        </Button>
                    </Stack>
                </Flex>
            </VStack>
            <Toaster />
        </MotionFlex>
    );
}