'use client';

import {
    Flex, Heading, Text, VStack, Button, Icon, Field, Input, SimpleGrid, Spinner, createListCollection, Select, Portal, Checkbox, Stack, RadioGroup, Avatar, CheckboxGroup, Box,
    HStack,
    IconButton
} from "@chakra-ui/react";
import { useForm, SubmitHandler, Controller, UseFormRegister, FieldErrors, Control, UseFormSetValue, useController, useWatch } from "react-hook-form";
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { PiArrowLeft, PiFloppyDisk, PiFilePdf, PiTrash, PiEye, PiPencilSimpleFill } from "react-icons/pi";
import { Toaster, toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { maskCPFOrCNPJ, maskPhone, unmask, maskCEP } from "@/utils/masks";
import { useSWRConfig } from "swr";
import { useApi } from "@/hooks/useApi";
import Link from 'next/link';

// Interfaces
interface UserFormData {
    name: string;
    cpfOrCnpj: string;
    rg: string;
    birthDate: string;
    gender: "Male" | "Female";
    cellPhone: string;
    phone?: string;
    infoEmail?: string;
    profession?: string;
    contactPreference: string[];
    referredById?: string;
    manualReferral?: string;
    unknownAssociate: boolean;
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
    correspondenceAddress: "residential" | "commercial";
    nationality: string;
    maritalStatus: string;

    personalDocumentUrls: string[];
}

interface Associate { value: string; label: string; }

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

// --- Sub-componente de Endereço ---
interface AddressBlockProps {
    type: 'residential' | 'commercial';
    control: Control<UserFormData>;
    register: UseFormRegister<UserFormData>;
    errors: FieldErrors<UserFormData>;
    watch: (name: any) => any;
    setValue: UseFormSetValue<UserFormData>;
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
            } catch (error) { console.error("Erro ao buscar CEP:", error); } finally { setIsCepLoading(false); }
        };
        const unmaskedCep = unmask(cepValue || '');
        if (unmaskedCep.length === 8) fetchAddress(unmaskedCep);
    }, [cepValue, setValue, type]);

    const isRequired = type === 'residential' || !isDisabled;

    return (
        <VStack gap={4} align="stretch" opacity={isDisabled ? 0.5 : 1}>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Field.Root invalid={!!errors[`${type}Cep`]} required={isRequired}>
                    <Field.Label gap={2}>CEP {isCepLoading && <Spinner size="sm" />}</Field.Label>
                    <Controller name={`${type}Cep`} control={control} rules={{ required: isRequired ? "O CEP é obrigatório" : false }} render={({ field }) => (
                        <Input disabled={isDisabled} bgColor={'gray.700'} value={field.value ? maskCEP(field.value) : ''} onChange={field.onChange} maxLength={10} />
                    )} />
                </Field.Root>
                <Field.Root invalid={!!errors[`${type}State`]} required={isRequired}>
                    <Field.Label>Estado</Field.Label>
                    <Input disabled bgColor={'gray.700'} {...register(`${type}State`, { required: isRequired })} readOnly />
                </Field.Root>
                <Field.Root invalid={!!errors[`${type}City`]} required={isRequired}>
                    <Field.Label>Cidade</Field.Label>
                    <Input disabled bgColor={'gray.700'} {...register(`${type}City`, { required: isRequired })} readOnly />
                </Field.Root>
            </SimpleGrid>
            <Field.Root invalid={!!errors[`${type}Street`]} required={isRequired}>
                <Field.Label>Rua / Logradouro</Field.Label>
                <Input disabled bgColor={'gray.700'} {...register(`${type}Street`, { required: isRequired })} readOnly />
            </Field.Root>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Field.Root invalid={!!errors[`${type}Number`]} required={isRequired}>
                    <Field.Label>Número</Field.Label>
                    <Input disabled={isDisabled} bgColor={'gray.700'} {...register(`${type}Number`, { required: isRequired ? "O número é obrigatório" : false })} />
                </Field.Root>
                <Field.Root>
                    <Field.Label>Complemento</Field.Label>
                    <Input disabled={isDisabled} bgColor={'gray.700'} {...register(`${type}Complement`)} />
                </Field.Root>
                <Field.Root invalid={!!errors[`${type}Neighborhood`]} required={isRequired}>
                    <Field.Label>Bairro</Field.Label>
                    <Input disabled bgColor={'gray.700'} {...register(`${type}Neighborhood`, { required: isRequired })} readOnly />
                </Field.Root>
            </SimpleGrid>
        </VStack>
    );
}

export default function EditUserPage() {
    const { getAccessTokenSilently } = useAuth0();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    // 1. Busca dados do usuário
    const { data: userData, isLoading: isLoadingUser } = useApi<any>(`/api/management/users/${userId}`);
    const { data: associates, isLoading: isLoadingAssociates } = useApi<Associate[]>('/api/users/associates');

    const { register, handleSubmit, formState: { errors }, control, watch, setValue, reset } = useForm<UserFormData>({
        defaultValues: {
            nationality: 'Brasileira',
            useCommercialAddress: false,
            contactPreference: [],
            correspondenceAddress: 'residential',
            unknownAssociate: false,
            personalDocumentUrls: []
        }
    });

    // 2. Popula o form
    useEffect(() => {
        if (userData) {
            console.log("Dados do usuário carregados:", userData);
            reset({
                ...userData,
                birthDate: userData.birthDate ? new Date(userData.birthDate).toISOString().split('T')[0] : '',
                contactPreference: userData.contactPreference ? userData.contactPreference.split(',') : [],
                unknownAssociate: !!userData.indication,
                manualReferral: userData.indication,
                useCommercialAddress: !!userData.commercialCep,
                personalDocumentUrls: userData.personalDocumentUrls || []
            });
        }
    }, [userData, reset]);

    const useCommercialAddress = watch('useCommercialAddress');
    const unknownAssociate = watch('unknownAssociate');
    const cpfOrCnpjValue = watch('cpfOrCnpj');
    const personalDocuments = watch('personalDocumentUrls') || [];

    const unmaskedCpfOrCnpj = unmask(cpfOrCnpjValue || '');
    const isCnpj = unmaskedCpfOrCnpj.length > 11;

    const associatesCollection = createListCollection({ items: associates || [] });
    const contactPreference = useController({ control, name: "contactPreference", defaultValue: [] });

    // =================================================================
    //  A CORREÇÃO (Delete Real)
    // =================================================================
    const handleDeleteDocument = async (indexToRemove: number) => {
        const urlToDelete = personalDocuments[indexToRemove];
        if (!urlToDelete) return;

        // Feedback otimista
        const previousDocs = [...personalDocuments];
        const updatedDocs = personalDocuments.filter((_, index) => index !== indexToRemove);
        setValue('personalDocumentUrls', updatedDocs);

        try {
            const token = await getAccessTokenSilently();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

            // Chama o endpoint de gestão para deletar o documento
            await axios.delete(`${apiBaseUrl}/api/management/users/${userId}/documents`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { url: urlToDelete } // Envia a URL no corpo
            });

            toaster.create({ title: "Documento excluído.", type: "success" });
        } catch (error) {
            console.error("Erro ao deletar documento:", error);
            // Reverte em caso de erro
            setValue('personalDocumentUrls', previousDocs);
            toaster.create({ title: "Erro ao excluir.", description: "Não foi possível apagar o arquivo.", type: "error" });
        }
    };
    // =================================================================

    const onSubmit: SubmitHandler<UserFormData> = async (data) => {
        setIsSubmitting(true);
        try {
            const token = await getAccessTokenSilently();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

            const payload = {
                name: data.name,
                cpfOrCnpj: unmask(data.cpfOrCnpj),
                rg: data.rg,
                birthDate: data.birthDate,
                gender: data.gender,
                cellPhone: unmask(data.cellPhone),
                phone: unmask(data.phone || ''),
                profession: data.profession,
                contactPreference: data.contactPreference?.join(','),
                infoEmail: data.infoEmail,

                referredById: data.unknownAssociate ? null : data.referredById,
                indication: data.unknownAssociate ? data.manualReferral : null,

                residentialCep: unmask(data.residentialCep),
                residentialStreet: data.residentialStreet,
                residentialNumber: data.residentialNumber,
                residentialComplement: data.residentialComplement,
                residentialNeighborhood: data.residentialNeighborhood,
                residentialCity: data.residentialCity,
                residentialState: data.residentialState,
                correspondenceAddress: data.correspondenceAddress,
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

                // Os documentos são geridos individualmente agora, mas enviamos a lista final por segurança
                personalDocumentUrls: data.personalDocumentUrls
            };

            await axios.patch(`${apiBaseUrl}/api/management/users/${userId}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toaster.create({ title: "Usuário Atualizado!", description: "Os dados foram sincronizados com o Legal One.", type: "success" });
            router.push('/gestao/usuarios');

        } catch (error: any) {
            console.error("Erro ao atualizar:", error);
            toaster.create({ title: "Erro ao Salvar", description: error.response?.data?.error || "Erro desconhecido", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingUser || isLoadingAssociates) {
        return <Flex w="100%" h="50vh" justify="center" align="center"><Spinner size="xl" /></Flex>;
    }

    return (
        <Flex w="100%" p={8} bgColor={'bodyBg'} maxW="breakpoint-lg" borderRadius="md" boxShadow="md" flexDir="column" justify="center" align="center" mx='auto'>
            <Flex w="100%" mb={6}>
                <Link href="/gestao/usuarios" passHref>
                    <Button variant="solid" colorPalette={'cyan'} size="sm" gap={2} >
                        <Icon as={PiArrowLeft} /> Voltar para Lista
                    </Button>
                </Link>
            </Flex>

            <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                <VStack gap={8} align="stretch">
                    <VStack align="start">
                        <Heading as="h1" size="xl">Editar Usuário</Heading>
                        <Text color="gray.400">Edite os dados cadastrais do cliente. As alterações serão refletidas no Legal One.</Text>
                    </VStack>

                    <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'column' }} gap={4}>
                        <Flex align="center" gap={4} flexDir={'column'}>
                            <Avatar.Root size="lg" boxSize={40} border={'1px solid'} borderColor={'brand.600'} bgColor={'bodyBg'}>
                                <Avatar.Image src={userData.profilePictureUrl } alt={userData.name} />
                                <Avatar.Fallback name={userData.name} />
                            </Avatar.Root>
                            <Box>
                                <Heading as="h1" size="xl">{userData.name}</Heading>
                                <Text color="gray.400">{userData.email}</Text>
                            </Box>
                        </Flex>
                    </Flex>


                    {/* DADOS PESSOAIS */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Dados Cadastrais</Heading>
                        <Field.Root invalid={!!errors.name} required>
                            <Field.Label>{isCnpj ? "Razão Social" : "Nome Completo"}</Field.Label>
                            <Input bgColor={'gray.700'} {...register("name", { required: "Obrigatório" })} />
                        </Field.Root>
                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                            <Field.Root invalid={!!errors.cpfOrCnpj} required>
                                <Field.Label>CPF ou CNPJ</Field.Label>
                                <Controller name="cpfOrCnpj" control={control} rules={{ required: "Obrigatório" }} render={({ field }) => (
                                    <Input bgColor={'gray.700'} value={field.value ? maskCPFOrCNPJ(field.value) : ''} onChange={field.onChange} />
                                )} />
                            </Field.Root>
                            <Field.Root invalid={!!errors.rg}>
                                <Field.Label>RG</Field.Label>
                                <Input bgColor={'gray.700'} {...register("rg")} disabled={isCnpj} />
                            </Field.Root>
                            <Field.Root invalid={!!errors.birthDate}>
                                <Field.Label>Data de Nascimento</Field.Label>
                                <Input type="date" bgColor={'gray.700'} {...register("birthDate")} disabled={isCnpj} />
                            </Field.Root>
                        </SimpleGrid>

                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                            <Field.Root disabled={isCnpj}>
                                <Field.Label>Nacionalidade</Field.Label>
                                <Controller name="nationality" control={control} render={({ field }) => (
                                    <Select.Root collection={nacionalidadesCollection} value={field.value ? [field.value] : []} onValueChange={(d) => field.onChange(d.value[0])} disabled={isCnpj}>
                                        <Select.Control><Select.Trigger bgColor={'gray.700'}><Select.ValueText /></Select.Trigger></Select.Control>
                                        <Portal><Select.Positioner><Select.Content>{nacionalidadesCollection.items.map((i) => (<Select.Item item={i} key={i.value}>{i.label}</Select.Item>))}</Select.Content></Select.Positioner></Portal>
                                    </Select.Root>
                                )} />
                            </Field.Root>
                            <Field.Root disabled={isCnpj}>
                                <Field.Label>Gênero</Field.Label>
                                <Controller name="gender" control={control} render={({ field }) => (
                                    <RadioGroup.Root value={field.value} onValueChange={(d) => field.onChange(d.value)} disabled={isCnpj}>
                                        <Stack direction="row" gap={4} mt={2}>
                                            <RadioGroup.Item value="Male"><RadioGroup.ItemHiddenInput /><RadioGroup.ItemIndicator /><RadioGroup.ItemText>Masc.</RadioGroup.ItemText></RadioGroup.Item>
                                            <RadioGroup.Item value="Female"><RadioGroup.ItemHiddenInput /><RadioGroup.ItemIndicator /><RadioGroup.ItemText>Fem.</RadioGroup.ItemText></RadioGroup.Item>
                                        </Stack>
                                    </RadioGroup.Root>
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
                                <Controller name="cellPhone" control={control} rules={{ required: "Obrigatório" }} render={({ field }) => (
                                    <Input bgColor={'gray.700'} value={field.value ? maskPhone(field.value) : ''} onChange={field.onChange} />
                                )} />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label>E-mail</Field.Label>
                                <Input type="email" bgColor={'gray.700'} {...register("infoEmail")} />
                            </Field.Root>
                        </SimpleGrid>
                    </VStack>

                    {/* INDICAÇÃO */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Indicação (Associado)</Heading>
                        <Controller name="unknownAssociate" control={control} render={({ field }) => (
                            <Checkbox.Root checked={field.value} onCheckedChange={(d) => field.onChange(Boolean(d.checked))} mb={2}>
                                <Checkbox.HiddenInput />
                                <Checkbox.Control bgColor={'gray.100'} color={'black'} />
                                <Checkbox.Label>Associado não cadastrado / Manual</Checkbox.Label>
                            </Checkbox.Root>
                        )} />
                        {unknownAssociate ? (
                            <Field.Root>
                                <Field.Label>Nome do Associado</Field.Label>
                                <Input bgColor={'gray.700'} {...register("manualReferral")} />
                            </Field.Root>
                        ) : (
                            <Controller name="referredById" control={control} render={({ field }) => (
                                <Field.Root>
                                    <Field.Label>Selecionar Associado</Field.Label>
                                    <Select.Root collection={associatesCollection} value={field.value ? [field.value] : []} onValueChange={(d) => field.onChange(d.value[0])}>
                                        <Select.Control><Select.Trigger bgColor={'gray.700'}><Select.ValueText placeholder="Selecione..." /></Select.Trigger></Select.Control>
                                        <Portal><Select.Positioner><Select.Content>{associatesCollection.items.map((i) => (<Select.Item key={i.value} item={i}>{i.label}</Select.Item>))}</Select.Content></Select.Positioner></Portal>
                                    </Select.Root>
                                </Field.Root>
                            )} />
                        )}
                    </VStack>

                    {/* ENDEREÇOS */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Endereço Residencial</Heading>
                        <AddressBlock type="residential" {...{ control, register, errors, watch, setValue }} />
                    </VStack>
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Endereço Comercial</Heading>
                        <Controller name="useCommercialAddress" control={control} render={({ field }) => (
                            <Checkbox.Root checked={field.value} onCheckedChange={(d) => field.onChange(Boolean(d.checked))}>
                                <Checkbox.HiddenInput />
                                <Checkbox.Control bgColor={'gray.100'} color={'black'} />
                                <Checkbox.Label>O endereço comercial é diferente</Checkbox.Label>
                            </Checkbox.Root>
                        )} />
                        {useCommercialAddress && <AddressBlock type="commercial" {...{ control, register, errors, watch, setValue, isDisabled: !useCommercialAddress }} />}
                    </VStack>

                    {/* ================================================================= */}
                    {/* SEÇÃO DE DOCUMENTOS (VIEW & DELETE)                               */}
                    {/* ================================================================= */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Documentos do Usuário</Heading>

                        {personalDocuments.length === 0 ? (
                            <Text color="gray.500">Nenhum documento anexado.</Text>
                        ) : (
                            <VStack align="stretch" gap={2}>
                                {personalDocuments.map((url, index) => {
                                    const fileName = decodeURIComponent(url.split('/').pop()?.split('-').pop() || `Documento ${index + 1}`);

                                    return (
                                        <HStack key={index} justify="space-between" p={3} bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700">
                                            <HStack gap={3}>
                                                <Icon as={PiFilePdf} color="red.400" boxSize={6} />
                                                <Text fontWeight="medium" truncate maxW="300px">{fileName}</Text>
                                            </HStack>
                                            <HStack>
                                                <Button
                                                    size="xs"
                                                    variant="solid"
                                                    colorPalette="blue"
                                                    onClick={() => window.open(url, '_blank')}
                                                >
                                                    <Icon as={PiEye} /> Visualizar
                                                </Button>
                                                <IconButton
                                                    aria-label="Excluir documento"
                                                    size="xs"
                                                    colorPalette="red"
                                                    variant="solid"
                                                    onClick={() => handleDeleteDocument(index)}
                                                >
                                                    <Icon as={PiTrash} />
                                                </IconButton>
                                            </HStack>
                                        </HStack>
                                    );
                                })}
                            </VStack>
                        )}
                    </VStack>
                    {/* ================================================================= */}

                    <Button type="submit" colorPalette="blue" size="lg" loading={isSubmitting} gap={2} alignSelf="stretch" mt={8}>
                        <Icon as={PiFloppyDisk} />
                        Salvar Alterações
                    </Button>
                </VStack>
            </form>
        </Flex>
    );
}