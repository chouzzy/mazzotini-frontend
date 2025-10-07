// /src/app/perfil/completar/page.tsx
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
} from "@chakra-ui/react";
import { motion } from 'framer-motion';
import { useForm, SubmitHandler } from "react-hook-form";
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { PiFloppyDisk } from "react-icons/pi";
import { toaster } from "@/components/ui/toaster";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Tipagem para os dados do formulário
interface OnboardingFormData {
    cpfOrCnpj: string;
    phone: string;
    cellPhone: string;
    address: string;
    nationality: string;
    maritalStatus: string;
}

export default function CompleteProfilePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { getAccessTokenSilently } = useAuth0();
    const { register, handleSubmit, formState: { errors } } = useForm<OnboardingFormData>();
    const router = useRouter();

    const onSubmit: SubmitHandler<OnboardingFormData> = async (data) => {
        setIsSubmitting(true);
        try {
            const token = await getAccessTokenSilently({
                authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! },
            });

            await axios.patch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/profile`,
                data,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toaster.create({
                title: "Perfil Atualizado!",
                description: "Os seus dados foram salvos. Bem-vindo(a) à plataforma!",
                type: "success",
            });
            // Redireciona para o dashboard principal após o sucesso
            router.push('/dashboard');
        } catch (error: any) {
            console.error("Erro ao atualizar perfil:", error);
            toaster.create({
                title: "Erro ao Salvar.",
                description: error.response?.data?.error || "Não foi possível salvar os seus dados. Tente novamente.",
                type: "error",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Flex w="100%" p={4} maxW="breakpoint-md" >
            <VStack as="form" onSubmit={handleSubmit(onSubmit)}  w='100%' gap={8}>
                <VStack align="start" w="100%">
                    <Heading as="h1" size="xl">Complete o seu Perfil</Heading>
                    <Text color="gray.400">Para aceder à plataforma, por favor, preencha as suas informações cadastrais.</Text>
                </VStack>
                
                <Flex w='100%' flexDir='column' gap={4}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                        <Field.Root invalid={!!errors.cpfOrCnpj} required>
                            <Field.Label>CPF ou CNPJ</Field.Label>
                            <Input bgColor={'gray.700'} borderColor={'gray.500'}  {...register("cpfOrCnpj", { required: "Este campo é obrigatório" })} />
                        </Field.Root>
                        <Field.Root invalid={!!errors.cellPhone} required>
                            <Field.Label>Celular</Field.Label>
                            <Input bgColor={'gray.700'} borderColor={'gray.500'}  {...register("cellPhone", { required: "Este campo é obrigatório" })} />
                        </Field.Root>
                    </SimpleGrid>
                    
                    <Field.Root>
                        <Field.Label>Telefone Fixo</Field.Label>
                        <Input bgColor={'gray.700'} borderColor={'gray.500'}  {...register("phone")} />
                    </Field.Root>

                     <Field.Root>
                        <Field.Label>Endereço Completo</Field.Label>
                        <Input bgColor={'gray.700'} borderColor={'gray.500'}  {...register("address")} />
                    </Field.Root>

                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                         <Field.Root>
                            <Field.Label>Nacionalidade</Field.Label>
                            <Input bgColor={'gray.700'} borderColor={'gray.500'}  {...register("nationality")} />
                        </Field.Root>
                        <Field.Root>
                            <Field.Label>Estado Civil</Field.Label>
                            <Input bgColor={'gray.700'} borderColor={'gray.500'}  {...register("maritalStatus")} />
                        </Field.Root>
                    </SimpleGrid>
                </Flex>
                
                <Button
                    type="submit"
                    colorPalette="blue"
                    size="lg"
                    alignSelf="stretch"
                    loading={isSubmitting}
                    gap={2}
                >
                    <Icon as={PiFloppyDisk} />
                    Completar cadastro
                </Button>
            </VStack>
        </Flex>
    );
}
