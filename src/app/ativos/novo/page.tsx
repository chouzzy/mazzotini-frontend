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
    Textarea,
    Stack,
    SimpleGrid,
    Spinner,
} from "@chakra-ui/react";
import { motion } from 'framer-motion';
import { useForm, SubmitHandler } from "react-hook-form";
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

// --- Ícones ---
import { PiPlusCircle } from "react-icons/pi";
import { Toaster, toaster } from "@/components/ui/toaster";

// ============================================================================
//   INTERFACE PARA OS VALORES DO FORMULÁRIO
// ============================================================================
// Esta interface deve corresponder aos campos que o operador preenche manualmente.
interface FormValues {
    processNumber: string;
    originalCreditor: string;
    acquisitionValue: number;
    initialValue: number;
    acquisitionDate: string; // O input de data retorna uma string
}

// ============================================================================
//   COMPONENTE PRINCIPAL: CreateAssetPage
// ============================================================================
export default function CreateAssetPage() {
    const MotionFlex = motion(Flex);
    const { getAccessTokenSilently, isAuthenticated, isLoading: isAuthLoading } = useAuth0();

    // Configuração do react-hook-form
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>();

    // Função chamada no envio do formulário
    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        try {
            // 1. Obtém o token de acesso seguro do Auth0
            const token = await getAccessTokenSilently();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

            // 2. Envia os dados para a nossa API do backend
            await axios.post(`${apiBaseUrl}/api/assets`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // 3. Mostra um feedback de sucesso
            toaster.create({
                title: "Ativo Registado!",
                description: `O processo ${data.processNumber} foi registado. A busca de dados no Legal One foi iniciada.`,
                type: "success",
            });

            // TODO: Redirecionar para a página de listagem de ativos
            // router.push('/ativos');

        } catch (error: any) {
            // 4. Mostra um feedback de erro
            console.error("Erro ao criar ativo:", error);
            toaster.create({
                title: "Erro ao Registar Ativo.",
                description: error.response?.data?.error || "Ocorreu um erro inesperado. Tente novamente mais tarde.",
                type: "error",
            });
        }
    };

    // Mostra um spinner enquanto o estado de autenticação está a ser verificado
    if (isAuthLoading) {
        return <Flex w="100%" flex={1} justify="center" align="center"><Spinner size="xl" /></Flex>;
    }

    // Se o utilizador não estiver autenticado, pode mostrar uma mensagem ou redirecionar
    if (!isAuthenticated) {
        return <Flex w="100%" flex={1} justify="center" align="center"><Text>Por favor, faça login para aceder a esta página.</Text></Flex>;
    }

    return (
        <MotionFlex
            direction="column"
            w="100%"
            flex={1} // Garante que o conteúdo ocupe o espaço disponível
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
                        <Field.Root invalid={!!errors.processNumber} required>
                            <Field.Label>Número do Processo</Field.Label>
                            <Input
                                placeholder="Ex: 0012345-67.2023.5.02.0001"
                                {...register("processNumber", { required: "Este campo é obrigatório" })}
                            />
                            <Field.ErrorText>{errors.processNumber?.message}</Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={!!errors.originalCreditor} required>
                            <Field.Label>Credor Original</Field.Label>
                            <Input
                                placeholder="Nome do reclamante original"
                                {...register("originalCreditor", { required: "Este campo é obrigatório" })}
                            />
                        </Field.Root>

                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                             <Field.Root invalid={!!errors.acquisitionValue} required>
                                <Field.Label>Valor de Aquisição (R$)</Field.Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="30000.00"
                                    {...register("acquisitionValue", { required: "Este campo é obrigatório", valueAsNumber: true })}
                                />
                                <Field.ErrorText>{errors.acquisitionValue?.message}</Field.ErrorText>
                            </Field.Root>
                             <Field.Root invalid={!!errors.initialValue} required>
                                <Field.Label>Valor Inicial do Ativo (R$)</Field.Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="30000.00"
                                    {...register("initialValue", { required: "Este campo é obrigatório", valueAsNumber: true })}
                                />
                                <Field.ErrorText>{errors.initialValue?.message}</Field.ErrorText>
                            </Field.Root>
                        </SimpleGrid>

                        <Field.Root invalid={!!errors.acquisitionDate} required>
                            <Field.Label>Data de Aquisição</Field.Label>
                            <Input
                                type="date"
                                {...register("acquisitionDate", { required: "Este campo é obrigatório" })}
                            />
                            <Field.ErrorText>{errors.acquisitionDate?.message}</Field.ErrorText>
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
