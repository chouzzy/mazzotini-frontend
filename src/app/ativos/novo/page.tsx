// src/app/ativos/novo/page.tsx
'use client';

// --- React e Frameworks ---
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
import { useEffect, useState } from "react";

// --- Ícones ---
import { PiPlusCircle } from "react-icons/pi";
import { Toaster, toaster } from "@/components/ui/toaster";

// ============================================================================
//   INTERFACE PARA OS VALORES DO FORMULÁRIO
// ============================================================================
interface FormValues {
    processNumber: string;
    originalCreditor: string;
    acquisitionValue: number;
    originalValue: number;
    acquisitionDate: string;
    investorId: string;
    investorShare: number;
    investor: { label: string; value: string }[]; // Ajuste para o formato esperado pelo backend
}

// ============================================================================
//   COMPONENTE PRINCIPAL: CreateAssetPage
// ============================================================================
export default function CreateAssetPage() {
    const MotionFlex = motion(Flex);
    const { getAccessTokenSilently, isAuthenticated, isLoading: isAuthLoading } = useAuth0();

    const [investors, setInvestors] = useState<{ label: string; value: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Funções para gerar dados aleatórios para testes ---
    const generateRandomProcessNumber = () => Math.floor(Math.random() * 1000000).toString().padStart(7, '0') + '-67.2023.5.02.0001';
    const generateRandomCPF = () => Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('');
    const generateRandomDate = () => {
        const start = new Date(2023, 0, 1);
        const end = new Date();
        const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return randomDate.toISOString().split('T')[0];
    };

    // Configuração do react-hook-form com valores padrão para testes
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            processNumber: generateRandomProcessNumber(),
            originalCreditor: generateRandomCPF(),
            acquisitionDate: generateRandomDate(),
        }
    });

    useEffect(() => {
        const fetchInvestors = async () => {
            if (!isAuthenticated) return; // Garante que não executa sem estar logado
            setIsLoading(true);
            try {
                const token = await getAccessTokenSilently();
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

                // A MUDANÇA É AQUI:
                const response = await axios.get(`${apiBaseUrl}/api/users`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                // A resposta da nossa API já vem no formato { label, value }, então a formatação muda
                setInvestors(response.data);

            } catch (err: any) {
                setError(err.message || 'Erro ao buscar investidores');
                console.error("Erro ao buscar investidores:", err);
                toaster.create({
                    title: "Erro ao carregar investidores",
                    description: "Não foi possível buscar a lista de investidores. Verifique suas permissões.",
                    type: "error",
                })
            } finally {
                setIsLoading(false);
            }
        };
        fetchInvestors();
    }, [isAuthenticated, getAccessTokenSilently]); // Adiciona dependências ao useEffect

    const investorsCollection = createListCollection({
        items: investors,
    });

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        try {
            const token = await getAccessTokenSilently();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;


            await axios.post(`${apiBaseUrl}/api/assets`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            toaster.create({
                title: "Ativo Registado!",
                description: `O processo ${data.processNumber} foi registado. A busca de dados no Legal One foi iniciada.`,
                type: "success",
            });

        } catch (error: any) {
            console.error("Erro ao criar ativo:", error);
            toaster.create({
                title: "Erro ao Registar Ativo.",
                description: error.response?.data?.error || "Ocorreu um erro inesperado. Tente novamente.",
                type: "error",
            });
        }
    };

    if (isAuthLoading || isLoading) {
        return <Flex w="100%" flex={1} justify="center" align="center"><Spinner size="xl" /></Flex>;
    }

    if (!isAuthenticated) {
        return <Flex w="100%" flex={1} justify="center" align="center"><Text>Por favor, faça login para aceder a esta página.</Text></Flex>;
    }

    return (
        <MotionFlex
            direction="column"
            w="100%"
            flex={1}
            p={{ base: 4, md: 8 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <VStack w="100%" maxW="container.lg" mx="auto" gap={8} align="stretch">
                <VStack align="start">
                    <Heading as="h1" size="xl">Registar Novo Ativo de Crédito</Heading>
                    <Text color="gray.500">Preencha os dados iniciais para registar um novo processo e iniciar a busca de informações no Legal One.</Text>
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
                                {...register("processNumber", { required: "Este campo é obrigatório" })}
                            />
                            <Field.ErrorText>{errors.processNumber?.message}</Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={!!errors.originalCreditor} required>
                            <Field.Label>Credor Original (Nome ou CPF/CNPJ)</Field.Label>
                            <Input
                                placeholder="O identificador usado para a busca no Legal One"
                                {...register("originalCreditor", { required: "Este campo é obrigatório" })}
                            />
                        </Field.Root>

                        <Heading as="h2" size="md" borderBottomWidth="1px" borderColor="gray.700" pb={2} pt={4}>
                            2. Dados da Negociação e Investidor
                        </Heading>

                        <Controller
                            name="investorId"
                            control={control}
                            rules={{ required: "Por favor, selecione um investidor" }} // Regras de validação
                            render={({ field, fieldState: { error } }) => (
                                <Field.Root invalid={!!error} required>
                                    <Field.Label>Investidor Associado</Field.Label>
                                    <Select.Root
                                        collection={investorsCollection}
                                        // Conecta o valor do react-hook-form ao Select do Chakra
                                        // O Chakra v3 espera um array de strings para o valor.
                                        value={field.value ? [field.value] : undefined}
                                        // Conecta o evento de mudança do Chakra ao react-hook-form
                                        // `details.value` é um array, pegamos o primeiro item para um select simples.
                                        onValueChange={(details) => field.onChange(details.value[0])}

                                    // Você pode ligar o onBlur se precisar de validação "on blur"
                                    // onOpenChange={(open) => !open && field.onBlur()}
                                    >
                                        <Select.Control>
                                            <Select.Trigger ref={field.ref}>
                                                <Select.ValueText placeholder="Selecione um investidor..." />
                                            </Select.Trigger>
                                        </Select.Control>
                                        <Portal>
                                            <Select.Positioner>
                                                <Select.Content>
                                                    {investorsCollection.items.map((investor) => (
                                                        <Select.Item key={investor.value} item={investor}>
                                                            {investor.label}
                                                        </Select.Item>
                                                    ))}
                                                </Select.Content>
                                            </Select.Positioner>
                                        </Portal>
                                    </Select.Root>
                                    {/* Exibe a mensagem de erro, se houver */}
                                    {error && <Field.ErrorText>{error.message}</Field.ErrorText>}
                                </Field.Root>
                            )}
                        />


                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
                            <Field.Root invalid={!!errors.acquisitionValue} required>
                                <Field.Label>Valor de Aquisição (R$)</Field.Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="30000.00"
                                    {...register("acquisitionValue", { required: "Este campo é obrigatório", valueAsNumber: true })}
                                />
                            </Field.Root>
                            <Field.Root invalid={!!errors.originalValue} required>
                                <Field.Label>Valor Original do Ativo (R$)</Field.Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="50000.00"
                                    {...register("originalValue", { required: "Este campo é obrigatório", valueAsNumber: true })}
                                />
                            </Field.Root>
                            <Field.Root invalid={!!errors.investorShare} required>
                                <Field.Label>Percentual do Investidor (%)</Field.Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="80"
                                    {...register("investorShare", { required: "Este campo é obrigatório", valueAsNumber: true, min: 0, max: 100 })}
                                />
                            </Field.Root>
                        </SimpleGrid>

                        <Field.Root invalid={!!errors.acquisitionDate} required>
                            <Field.Label>Data de Aquisição</Field.Label>
                            <Input
                                type="date"
                                {...register("acquisitionDate", { required: "Este campo é obrigatório" })}
                            />
                        </Field.Root>

                        <Button
                            type="submit"
                            colorScheme="blue"
                            size="lg"
                            w={{ base: '100%', md: 'auto' }}
                            alignSelf="flex-end"
                            loading={isSubmitting}
                        >
                            <Flex align="center" justify="center" gap={2}>
                                <Icon as={PiPlusCircle} />
                                <Text>Registar e Buscar Dados</Text>
                            </Flex>
                        </Button>
                    </Stack>
                </Flex>
            </VStack>
            <Toaster />
        </MotionFlex>
    );
}
