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
    Portal,
    Box,
    Checkbox,
    Stack,
    Fieldset,
    CheckboxGroup,
    For
} from "@chakra-ui/react";
import { useForm, SubmitHandler, Controller, UseFormRegister, FieldErrors, Control, UseFormSetValue, useController } from "react-hook-form";
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { PiFileArchiveBold, PiFloppyDisk, PiUploadSimple, PiUserBold } from "react-icons/pi";
import { Toaster, toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { maskCPFOrCNPJ, maskPhone, unmask, maskCEP } from "@/utils/masks";
import { useSWRConfig } from "swr";

// Tipagem expandida para todos os novos campos
interface OnboardingFormData {
    name: string;
    cpfOrCnpj: string;
    rg: string;
    birthDate: string;
    cellPhone: string;
    phone?: string;
    infoEmail?: string;
    profession?: string;
    contactPreference: string[];

    residentialCep: string;
    residentialStreet: string;
    residentialNumber: string;
    residentialComplement?: string;
    residentialNeighborhood: string;
    residentialCity: string;
    residentialState: string;

    useCommercialAddress: boolean;
    commercialCep?: string;
    commercialStreet?: string;
    commercialNumber?: string;
    commercialComplement?: string;
    commercialNeighborhood?: string;
    commercialCity?: string;
    commercialState?: string;

    nationality: string;
    maritalStatus: string;
}

// ============================================================================
//  COLEÇÕES DE DADOS PARA OS SELECTS
// ============================================================================
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

// ============================================================================
//  SUB-COMPONENTE REUTILIZÁVEL: Bloco de Endereço
// ============================================================================
interface AddressBlockProps {
    type: 'residential' | 'commercial';
    control: Control<OnboardingFormData>;
    register: UseFormRegister<OnboardingFormData>;
    errors: FieldErrors<OnboardingFormData>;
    watch: (name: any) => any;
    setValue: UseFormSetValue<OnboardingFormData>;
    isDisabled?: boolean;
}

function AddressBlock({ type, control, register, errors, watch, setValue, isDisabled }: AddressBlockProps) {
    const [isCepLoading, setIsCepLoading] = useState(false);
    const cepValue = watch(`${type}Cep` as const);

    useEffect(() => {
        const fetchAddress = async (cep: string) => {
            setIsCepLoading(true);
            try {
                const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
                const { logradouro, bairro, localidade, uf, erro } = response.data;
                if (erro) {
                    toaster.create({ title: "CEP não encontrado.", type: "error" });
                    return;
                };

                setValue(`${type}Street`, logradouro);
                setValue(`${type}Neighborhood`, bairro);
                setValue(`${type}City`, localidade);
                setValue(`${type}State`, uf);
            } catch (error) {
                console.error("Erro ao buscar CEP:", error);
            } finally {
                setIsCepLoading(false);
            }
        };

        const unmaskedCep = unmask(cepValue || '');
        if (unmaskedCep.length === 8) {
            fetchAddress(unmaskedCep);
        }
    }, [cepValue, setValue, type]);

    return (
        <VStack gap={4} align="stretch" opacity={isDisabled ? 0.5 : 1}>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Field.Root invalid={!!errors[`${type}Cep`]} required>
                    <Field.Label gap={2}>CEP {isCepLoading && <Spinner size="sm" />}</Field.Label>
                    <Controller name={`${type}Cep`} control={control} rules={{ required: "O CEP é obrigatório" }} render={({ field }) => (
                        <Input disabled={isDisabled} bgColor={'gray.700'} value={field.value ? maskCEP(field.value) : ''} onChange={field.onChange} maxLength={10} />
                    )} />
                </Field.Root>
                <Field.Root invalid={!!errors[`${type}State`]} required>
                    <Field.Label>Estado</Field.Label>
                    <Input disabled bgColor={'gray.700'} {...register(`${type}State`, { required: true })} readOnly />
                </Field.Root>
                <Field.Root invalid={!!errors[`${type}City`]} required>
                    <Field.Label>Cidade</Field.Label>
                    <Input disabled bgColor={'gray.700'} {...register(`${type}City`, { required: true })} readOnly />
                </Field.Root>
            </SimpleGrid>
            <Field.Root invalid={!!errors[`${type}Street`]} required>
                <Field.Label>Rua / Logradouro</Field.Label>
                <Input disabled bgColor={'gray.700'} {...register(`${type}Street`, { required: true })} readOnly />
            </Field.Root>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Field.Root invalid={!!errors[`${type}Number`]} required>
                    <Field.Label>Número</Field.Label>
                    <Input disabled={isDisabled} bgColor={'gray.700'} {...register(`${type}Number`, { required: "O número é obrigatório" })} />
                </Field.Root>
                <Field.Root>
                    <Field.Label>Complemento</Field.Label>
                    <Input disabled={isDisabled} bgColor={'gray.700'} {...register(`${type}Complement`)} />
                </Field.Root>
                <Field.Root invalid={!!errors[`${type}Neighborhood`]} required>
                    <Field.Label>Bairro</Field.Label>
                    <Input disabled bgColor={'gray.700'} {...register(`${type}Neighborhood`, { required: true })} readOnly />
                </Field.Root>
            </SimpleGrid>
        </VStack>
    );
}

// ============================================================================
//  PÁGINA PRINCIPAL
// ============================================================================
export default function CompleteProfilePage() {
    const { user } = useAuth0();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { getAccessTokenSilently } = useAuth0();
    const { register, handleSubmit, formState: { errors }, control, watch, setValue } = useForm<OnboardingFormData>({
        defaultValues: {
            name: user?.name,
            nationality: 'Brasileira',
            useCommercialAddress: false,
        }
    });
    const router = useRouter();
    const { mutate } = useSWRConfig();
    const useCommercialAddress = watch('useCommercialAddress');

    const onSubmit: SubmitHandler<OnboardingFormData> = async (data) => {
        setIsSubmitting(true);
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });

            // Payload para o backend, incluindo todos os novos campos
            const payload = {
                name: data.name,
                cpfOrCnpj: unmask(data.cpfOrCnpj),
                rg: data.rg,
                birthDate: data.birthDate,
                cellPhone: unmask(data.cellPhone),
                phone: unmask(data.phone || ''),
                profession: data.profession,
                contactPreference: data.contactPreference?.join(','),
                infoEmail: data.infoEmail,
                residentialCep: unmask(data.residentialCep),
                residentialStreet: data.residentialStreet,
                residentialNumber: data.residentialNumber,
                residentialComplement: data.residentialComplement,
                residentialNeighborhood: data.residentialNeighborhood,
                residentialCity: data.residentialCity,
                residentialState: data.residentialState,
                // Envia os dados do endereço comercial apenas se o checkbox estiver marcado
                ...(data.useCommercialAddress && {
                    commercialCep: unmask(data.commercialCep || ''),
                    commercialStreet: data.commercialStreet,
                    commercialNumber: data.commercialNumber,
                    commercialComplement: data.commercialComplement,
                    commercialNeighborhood: data.commercialNeighborhood,
                    commercialCity: data.commercialCity,
                    commercialState: data.commercialState,
                }),
                nationality: data.nationality,
                maritalStatus: data.maritalStatus,
            };

            console.log("Payload enviado:", payload);

            await axios.patch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/profile`, payload, { headers: { Authorization: `Bearer ${token}` } });

            toaster.create({ title: "Perfil Atualizado!", type: "success" });
            await mutate('/api/users/me');
            router.push('/dashboard');
        } catch (error: any) {
            toaster.create({ title: "Erro ao Salvar.", description: error.response?.data?.error || "Tente novamente.", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const contactPreference = useController({
        control,
        name: "contactPreference",
        defaultValue: [],
    })

    const contactPreferenceItems = [{ label: 'WhatsApp', value: 'whatsapp' }, { label: 'E-mail', value: 'email' }];

    return (
        <Flex w="100%" p={8} bgColor={'bodyBg'} maxW="breakpoint-lg" borderRadius="md" boxShadow="md" flexDir="column" justify="center" align="center" mx='auto'>
            <Toaster />
            <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                <VStack gap={8} align="stretch">
                    <VStack align="start">
                        <Heading as="h1" size="xl">Complete o seu Perfil</Heading>
                        <Text color="gray.400">Para continuar, precisamos de mais algumas informações cadastrais.</Text>
                    </VStack>

                    {/* DADOS PESSOAIS */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Dados Pessoais</Heading>
                        <Field.Root invalid={!!errors.name} required>
                            <Field.Label>Nome Completo</Field.Label>
                            <Input bgColor={'gray.700'} {...register("name", { required: "Este campo é obrigatório" })} />
                        </Field.Root>
                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                            <Field.Root invalid={!!errors.cpfOrCnpj} required>
                                <Field.Label>CPF ou CNPJ</Field.Label>
                                <Controller name="cpfOrCnpj" control={control} rules={{ required: "Este campo é obrigatório" }} render={({ field }) => (
                                    <Input bgColor={'gray.700'} value={field.value ? maskCPFOrCNPJ(field.value) : ''} onChange={field.onChange} />
                                )} />
                            </Field.Root>
                            <Field.Root invalid={!!errors.rg}>
                                <Field.Label>RG</Field.Label>
                                <Input bgColor={'gray.700'} {...register("rg")} />
                            </Field.Root>
                            <Field.Root invalid={!!errors.birthDate}>
                                <Field.Label>Data de Nascimento</Field.Label>
                                <Input type="date" bgColor={'gray.700'} {...register("birthDate")} />
                            </Field.Root>
                        </SimpleGrid>
                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                            <Field.Root invalid={!!errors.profession} required>
                                <Field.Label>Profissão</Field.Label>
                                <Input bgColor={'gray.700'} {...register("profession", { required: "Este campo é obrigatório" })} />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label>Nacionalidade</Field.Label>
                                <Controller name="nationality" control={control} render={({ field }) => (
                                    <Select.Root collection={nacionalidadesCollection} value={field.value ? [field.value] : []} onValueChange={(details) => field.onChange(details.value[0])}>
                                        <Select.Control><Select.Trigger cursor={'pointer'} bgColor={'gray.700'}><Select.ValueText /></Select.Trigger></Select.Control>
                                        <Portal><Select.Positioner><Select.Content>{nacionalidadesCollection.items.map((item) => (<Select.Item item={item} key={item.value}>{item.label}</Select.Item>))}</Select.Content></Select.Positioner></Portal>
                                    </Select.Root>
                                )} />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label>Estado Civil</Field.Label>
                                <Controller name="maritalStatus" control={control} render={({ field }) => (
                                    <Select.Root collection={estadoCivilCollection} value={field.value ? [field.value] : []} onValueChange={(details) => field.onChange(details.value[0])}>
                                        <Select.Control><Select.Trigger cursor={'pointer'} bgColor={'gray.700'}><Select.ValueText placeholder="Selecione..." /></Select.Trigger></Select.Control>
                                        <Portal><Select.Positioner><Select.Content>{estadoCivilCollection.items.map((item) => (<Select.Item item={item} key={item.value}>{item.label}</Select.Item>))}</Select.Content></Select.Positioner></Portal>
                                    </Select.Root>
                                )} />
                            </Field.Root>
                        </SimpleGrid>
                    </VStack>

                    {/* CONTATO */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Contato</Heading>
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                            <Field.Root invalid={!!errors.cellPhone} required>
                                <Field.Label>Celular</Field.Label>
                                <Controller name="cellPhone" control={control} rules={{ required: "Este campo é obrigatório" }} render={({ field }) => (
                                    <Input bgColor={'gray.700'} value={field.value ? maskPhone(field.value) : ''} onChange={field.onChange} />
                                )} />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label>Telefone Fixo</Field.Label>
                                <Controller name="phone" control={control} render={({ field }) => (
                                    <Input bgColor={'gray.700'} value={field.value ? maskPhone(field.value) : ''} onChange={field.onChange} />
                                )} />
                            </Field.Root>
                        </SimpleGrid>
                        <Field.Root>
                            <Field.Label>E-mail para Informações (Opcional)</Field.Label>
                            <Input type="email" bgColor={'gray.700'} {...register("infoEmail")} />
                        </Field.Root>

                        <Fieldset.Root>
                            <CheckboxGroup
                                value={contactPreference.field.value}
                                onValueChange={contactPreference.field.onChange}
                                name={contactPreference.field.name}
                                defaultValue={["E-mail"]}
                            >
                                <Fieldset.Legend fontSize="sm" mb="2">
                                    Preferência de Contato
                                </Fieldset.Legend>
                                <Fieldset.Content>
                                    {contactPreferenceItems.map((item) => (
                                        <Checkbox.Root key={item.value} value={item.value} variant={'subtle'} colorPalette={'blue'}>
                                            <Checkbox.HiddenInput />
                                            <Checkbox.Control />
                                            <Checkbox.Label>{item.label}</Checkbox.Label>
                                        </Checkbox.Root>
                                    ))}
                                </Fieldset.Content>
                            </CheckboxGroup>
                        </Fieldset.Root>
                    </VStack>

                    {/* ENDEREÇO RESIDENCIAL */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Endereço Residencial</Heading>
                        <AddressBlock type="residential" {...{ control, register, errors, watch, setValue }} />
                    </VStack>

                    {/* ENDEREÇO COMERCIAL */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Endereço Comercial</Heading>
                        <Controller
                            name="useCommercialAddress"
                            control={control}
                            render={({ field }) => (
                                <Checkbox.Root
                                    checked={field.value}
                                    onCheckedChange={(details) => field.onChange(details.checked)}
                                >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                    <Checkbox.Label>O endereço comercial é diferente do residencial</Checkbox.Label>
                                </Checkbox.Root>
                            )}
                        />
                        {useCommercialAddress && <AddressBlock type="commercial" {...{ control, register, errors, watch, setValue }} />}
                    </VStack>

                    {/* FOTO DE PERFIL */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}> <Icon mb={1} as={PiUserBold} /> Foto de Perfil </Heading>
                        <Text color="gray.400">Faça o upload de uma foto de perfil.</Text>
                        <Button variant="solid" >
                            <Icon as={PiUploadSimple} />
                            Anexar Foto de Perfil
                        </Button>
                        {/* A lógica de upload será adicionada aqui futuramente */}
                    </VStack>
                    {/* DOCUMENTOS */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}> <Icon mb={1} as={PiFileArchiveBold} /> Documentos</Heading>
                        <Text color="gray.400">Faça o upload de uma cópia do seu RG ou CNH (frente e verso).</Text>
                        <Button variant="solid" >
                            <Icon as={PiUploadSimple} />
                            Anexar Documentos
                        </Button>
                        {/* A lógica de upload será adicionada aqui futuramente */}
                    </VStack>

                    <Button type="submit" colorPalette="blue" size="lg" loading={isSubmitting} gap={2} alignSelf="stretch">
                        <Icon as={PiFloppyDisk} />
                        Salvar e Continuar
                    </Button>
                </VStack>
            </form>
        </Flex>
    );
}

