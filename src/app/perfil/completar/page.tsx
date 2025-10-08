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
    SimpleGrid,
    Spinner,
    createListCollection,
    Select,
    Portal
} from "@chakra-ui/react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { PiFloppyDisk } from "react-icons/pi";
import { Toaster, toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { maskCPFOrCNPJ, maskPhone, unmask, maskCEP } from "@/utils/masks";

// Tipagem para os dados do formulário
interface OnboardingFormData {
    name: string;
    cpfOrCnpj: string;
    phone: string;
    cellPhone: string;
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    nationality: string;
    maritalStatus: string;
}

// Constantes movidas para fora do componente para evitar recriação
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

export default function CompleteProfilePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCepLoading, setIsCepLoading] = useState(false);
    const { getAccessTokenSilently } = useAuth0();
    const { register, handleSubmit, formState: { errors }, control, watch, setValue } = useForm<OnboardingFormData>({
        defaultValues: {
            nationality: 'Brasileira' // Pré-seleciona a nacionalidade mais comum
        }
    });
    const router = useRouter();
    const cepValue = watch('cep');

    useEffect(() => {
        const fetchAddress = async (cep: string) => {
            setIsCepLoading(true);
            try {
                const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
                const { logradouro, bairro, localidade, uf, erro } = response.data;

                if (erro) {
                    toaster.create({ title: "CEP não encontrado.", type: "error" });
                    return;
                }

                setValue('street', logradouro);
                setValue('neighborhood', bairro);
                setValue('city', localidade);
                setValue('state', uf);

            } catch (error) {
                console.error("Erro ao buscar CEP:", error);
                toaster.create({ title: "Erro ao buscar CEP.", description: "Tente novamente.", type: "error" });
            } finally {
                setIsCepLoading(false);
            }
        };

        const unmaskedCep = unmask(cepValue || '');
        if (unmaskedCep.length === 8) {
            fetchAddress(unmaskedCep);
        }
    }, [cepValue, setValue]);


    const onSubmit: SubmitHandler<OnboardingFormData> = async (data) => {
        setIsSubmitting(true);
        try {
            const token = await getAccessTokenSilently({
                authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! },
            });

            const addressString = `${data.street}, ${data.number}${data.complement ? `, ${data.complement}` : ''} - ${data.neighborhood}, ${data.city} - ${data.state}, CEP: ${data.cep}`;

            const payload = {
                name: data.name,
                cpfOrCnpj: unmask(data.cpfOrCnpj),
                cellPhone: unmask(data.cellPhone),
                phone: unmask(data.phone),
                address: addressString,
                nationality: data.nationality,
                maritalStatus: data.maritalStatus,
            };

            console.log("Payload to be sent:", payload);

            await axios.patch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/profile`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toaster.create({
                title: "Perfil Atualizado!",
                description: "Os seus dados foram salvos. Bem-vindo(a) à plataforma!",
                type: "success",
            });
            window.location.href = '/';
        } catch (error: any) {
            console.error("Erro ao atualizar perfil:", error);
            toaster.create({
                title: "Erro ao Salvar.",
                description: error.response?.data?.error || "Não foi possível salvar os seus dados. Tente novamente.",
                type: "error",
            });
        } finally {
            setIsSubmitting(false);
            window.location.href = '/';
        }
    };

    return (
        <Flex w="100%" p={8} bgColor={'bodyBg'} maxW="breakpoint-md" borderRadius="md" boxShadow="md" flexDir="column" justify="center" align="center" mx='auto'>
            <Toaster />
            <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                <Flex flexDir={'column'} maxW="breakpoint-md" w='100%' gap={8}>
                    <VStack align="start" w="100%">
                        <Heading as="h1" size="xl">Complete o seu Perfil</Heading>
                        <Text color="gray.400">Para aceder à plataforma, por favor, preencha as suas informações cadastrais.</Text>
                    </VStack>

                    <Flex w='100%' flexDir='column' gap={4}>
                        <SimpleGrid gap={4}>
                            <Field.Root invalid={!!errors.cellPhone} required>
                                <Field.Label>Nome completo</Field.Label>
                                <Controller name="name" control={control} rules={{ required: "Este campo é obrigatório" }} render={({ field }) => (
                                    <Input type="text" bgColor={'gray.700'} borderColor={'gray.500'} value={field.value ? field.value : ''} onChange={(e) => field.onChange(e.target.value)} />
                                )} />
                            </Field.Root>
                        </SimpleGrid>
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                            <Field.Root invalid={!!errors.cpfOrCnpj} required>
                                <Field.Label>CPF ou CNPJ</Field.Label>
                                <Controller name="cpfOrCnpj" control={control} rules={{ required: "Este campo é obrigatório" }} render={({ field }) => (
                                    <Input bgColor={'gray.700'} borderColor={'gray.500'} value={field.value ? maskCPFOrCNPJ(field.value) : ''} onChange={(e) => field.onChange(e.target.value)} />
                                )} />
                            </Field.Root>
                            <Field.Root invalid={!!errors.cellPhone} required>
                                <Field.Label>Celular</Field.Label>
                                <Controller name="cellPhone" control={control} rules={{ required: "Este campo é obrigatório" }} render={({ field }) => (
                                    <Input bgColor={'gray.700'} borderColor={'gray.500'} value={field.value ? maskPhone(field.value) : ''} onChange={(e) => field.onChange(e.target.value)} />
                                )} />
                            </Field.Root>
                        </SimpleGrid>

                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                            <Field.Root>
                                <Field.Label>Telefone Fixo</Field.Label>
                                <Controller name="phone" control={control} render={({ field }) => (
                                    <Input bgColor={'gray.700'} borderColor={'gray.500'} value={field.value ? maskPhone(field.value) : ''} onChange={(e) => field.onChange(e.target.value)} />
                                )} />
                            </Field.Root>
                            <Field.Root invalid={!!errors.maritalStatus}>
                                <Field.Label>Estado Civil</Field.Label>
                                <Controller name="maritalStatus" control={control} render={({ field }) => (
                                    <Select.Root collection={estadoCivilCollection} value={field.value ? [field.value] : []} onValueChange={(details) => field.onChange(details.value[0])}>
                                        <Select.Control>
                                            <Select.Trigger cursor={'pointer'} bgColor={'gray.700'} borderColor={'gray.500'}>
                                                <Select.ValueText placeholder="Selecione..." />
                                            </Select.Trigger>
                                            <Select.IndicatorGroup>
                                                <Select.Indicator />
                                            </Select.IndicatorGroup>
                                        </Select.Control>
                                        <Portal>
                                            <Select.Positioner><Select.Content>{estadoCivilCollection.items.map((item) => (<Select.Item item={item} key={item.value}>{item.label}</Select.Item>))}</Select.Content></Select.Positioner>
                                        </Portal>
                                    </Select.Root>
                                )} />
                            </Field.Root>
                        </SimpleGrid>

                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Endereço</Heading>
                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                            <Field.Root invalid={!!errors.cep} required>
                                <Field.Label gap={2}>CEP {isCepLoading && <Spinner color={'brand.600'} size="sm" />}</Field.Label>
                                <Controller name="cep" control={control} rules={{ required: "Este campo é obrigatório" }} render={({ field }) => (
                                    <Input bgColor={'gray.700'} borderColor={'gray.500'} value={field.value ? maskCEP(field.value) : ''} onChange={(e) => field.onChange(e.target.value)} maxLength={10} />
                                )} />
                            </Field.Root>
                            <Field.Root invalid={!!errors.state} required>
                                <Field.Label>Estado</Field.Label>
                                <Input bgColor={'gray.700'} borderColor={'gray.500'} {...register("state", { required: true })} readOnly />
                            </Field.Root>
                            <Field.Root invalid={!!errors.city} required>
                                <Field.Label>Cidade</Field.Label>
                                <Input bgColor={'gray.700'} borderColor={'gray.500'} {...register("city", { required: true })} readOnly />
                            </Field.Root>
                        </SimpleGrid>
                        <Field.Root invalid={!!errors.street} required>
                            <Field.Label>Rua / Logradouro</Field.Label>
                            <Input bgColor={'gray.700'} borderColor={'gray.500'} {...register("street", { required: true })} readOnly />
                        </Field.Root>
                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                            <Field.Root invalid={!!errors.number} required>
                                <Field.Label>Número</Field.Label>
                                <Input bgColor={'gray.700'} borderColor={'gray.500'} {...register("number", { required: "Este campo é obrigatório" })} />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label>Complemento</Field.Label>
                                <Input bgColor={'gray.700'} borderColor={'gray.500'} {...register("complement")} />
                            </Field.Root>
                            <Field.Root invalid={!!errors.neighborhood} required>
                                <Field.Label>Bairro</Field.Label>
                                <Input bgColor={'gray.700'} borderColor={'gray.500'} {...register("neighborhood", { required: true })} readOnly />
                            </Field.Root>
                        </SimpleGrid>

                        <Field.Root invalid={!!errors.nationality}>
                            <Field.Label>Nacionalidade</Field.Label>
                            <Controller name="nationality" control={control} render={({ field }) => (
                                <Select.Root collection={nacionalidadesCollection} value={field.value ? [field.value] : []} onValueChange={(details) => field.onChange(details.value[0])}>
                                    <Select.Control>
                                        <Select.Trigger cursor={'pointer'} bgColor={'gray.700'} borderColor={'gray.500'}>
                                            <Select.ValueText />
                                        </Select.Trigger>
                                    </Select.Control>
                                    <Portal>
                                        <Select.Positioner><Select.Content>{nacionalidadesCollection.items.map((item) => (<Select.Item item={item} key={item.value}>{item.label}</Select.Item>))}</Select.Content></Select.Positioner>
                                    </Portal>
                                </Select.Root>
                            )} />
                        </Field.Root>
                    </Flex>

                    <Button
                        type="submit"
                        bgColor={'brand.700'}
                        color={'white'}
                        _hover={{ bgColor: 'brand.800' }}
                        _disabled={{ bgColor: 'brand.800', cursor: 'not-allowed', opacity: 0.6 }}
                        size="lg"
                        alignSelf="stretch"
                        loading={isSubmitting}
                        gap={2}
                    >
                        <Icon as={PiFloppyDisk} />
                        Completar cadastro
                    </Button>
                </Flex>
            </form>
        </Flex>
    );
}

