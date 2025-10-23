// /src/app/perfil/editar/page.tsx
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
    RadioGroup,
    Avatar,
    CheckboxGroup,
    FileUpload,
    Link
} from "@chakra-ui/react";
import { useForm, SubmitHandler, Controller, UseFormRegister, FieldErrors, Control, UseFormSetValue, useController, useWatch } from "react-hook-form";
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { PiCaretDownDuotone, PiDownloadDuotone, PiEnvelope, PiFloppyDisk, PiLetterCircleHDuotone, PiUploadSimple, PiWhatsappLogoDuotone } from "react-icons/pi";
import { Toaster, toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { maskCPFOrCNPJ, maskPhone, unmask, maskCEP } from "@/utils/masks";
import { useSWRConfig } from "swr";
import { useApi } from "@/hooks/useApi";
import { UserProfile } from "@/types";

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
    referredById: string; // ID do Associado (vendedor)

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

    // Campos para os ficheiros
    profilePicture?: FileList;
    personalDocuments?: FileList;
}

// CORREÇÃO: A tipagem agora corresponde ao que a API envia
interface Associate {
    value: string; // O ID do utilizador no *nosso* banco
    label: string; // O Nome do utilizador
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

const contactPreferenceItems = [{ label: 'WhatsApp', value: 'whatsapp' }, { label: 'E-mail', value: 'email' }];

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
    userProfile?: UserProfile;
}

function AddressBlock({ userProfile, type, control, register, errors, watch, setValue, isDisabled }: AddressBlockProps) {
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
                    <Input defaultValue={type === 'residential' ? userProfile?.residentialState : userProfile?.commercialState} disabled={isDisabled} bgColor={'gray.700'} {...register(`${type}State`, { required: isRequired })} readOnly />
                </Field.Root>
                <Field.Root invalid={!!errors[`${type}City`]} required={isRequired}>
                    <Field.Label>Cidade</Field.Label>
                    <Input defaultValue={type === 'residential' ? userProfile?.residentialCity : userProfile?.commercialCity} disabled={isDisabled} bgColor={'gray.700'} {...register(`${type}City`, { required: isRequired })} readOnly />
                </Field.Root>
            </SimpleGrid>
            <Field.Root invalid={!!errors[`${type}Street`]} required={isRequired}>
                <Field.Label>Rua / Logradouro</Field.Label>
                <Input defaultValue={type === 'residential' ? userProfile?.residentialStreet : userProfile?.commercialStreet} disabled={isDisabled} bgColor={'gray.700'} {...register(`${type}Street`, { required: isRequired })} readOnly />
            </Field.Root>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Field.Root invalid={!!errors[`${type}Number`]} required={isRequired}>
                    <Field.Label>Número</Field.Label>
                    <Input defaultValue={type === 'residential' ? userProfile?.residentialNumber : userProfile?.commercialNumber} disabled={isDisabled} bgColor={'gray.700'} {...register(`${type}Number`, { required: isRequired ? "O número é obrigatório" : false })} />
                </Field.Root>
                <Field.Root>
                    <Field.Label>Complemento</Field.Label>
                    <Input defaultValue={type === 'residential' ? userProfile?.residentialComplement : userProfile?.commercialComplement} disabled={isDisabled} bgColor={'gray.700'} {...register(`${type}Complement`)} />
                </Field.Root>
                <Field.Root invalid={!!errors[`${type}Neighborhood`]} required={isRequired}>
                    <Field.Label>Bairro</Field.Label>
                    <Input defaultValue={type === 'residential' ? userProfile?.residentialNeighborhood : userProfile?.commercialNeighborhood} disabled={isDisabled} bgColor={'gray.700'} {...register(`${type}Neighborhood`, { required: isRequired })} readOnly />
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
            contactPreference: [],
            correspondenceAddress: 'residential',
        }
    });
    const router = useRouter();
    const { mutate } = useSWRConfig();

    const { data: userProfile, isLoading, error } = useApi<UserProfile>('/api/users/me');

    // Observa os campos necessários para a lógica da UI
    const useCommercialAddress = watch('useCommercialAddress');
    const profilePictureFile = watch('profilePicture');
    const profilePicturePreview = profilePictureFile && profilePictureFile.length > 0
        ? URL.createObjectURL(profilePictureFile[0])
        : user?.picture;

    // Busca a lista de associados (vendedores) para o select
    const { data: associates, isLoading: isLoadingAssociates } = useApi<Associate[]>('/api/users/associates');

    const associatesCollection = createListCollection({
        items: associates || [],
    });

    // Controlador para o CheckboxGroup de preferência de contato
    const contactPreference = useController({
        control,
        name: "contactPreference",
        defaultValue: [],
    });

    const onSubmit: SubmitHandler<OnboardingFormData> = async (data) => {
        setIsSubmitting(true);
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });

            console.log("Dados do Formulário:", data);
            // --- Lógica de Upload da Foto de Perfil (Passo 1) ---
            let profilePictureUrl = user?.picture; // Mantém a foto do Auth0 se não for alterada

            if (data.profilePicture && data.profilePicture.length > 0) {
                const file = data.profilePicture[0];
                const formData = new FormData();
                formData.append('profilePicture', file);

                const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/profile-picture`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                profilePictureUrl = response.data.url; // Guarda a nova URL
            }

            // --- Lógica de Upload dos Documentos (Passo 2) ---
            const personalDocumentUrls: string[] = [];
            if (data.personalDocuments && data.personalDocuments.length > 0) {
                for (const file of Array.from(data.personalDocuments)) {
                    const formData = new FormData();
                    formData.append('document', file);
                    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/personal-document`, formData, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    personalDocumentUrls.push(response.data.url);
                }
            }

            // --- Payload para o Perfil (Passo 3) ---
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
                referredById: data.referredById,
                profilePictureUrl: profilePictureUrl,
                personalDocumentUrls: personalDocumentUrls.length > 0 ? personalDocumentUrls : undefined,

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
            };

            await axios.patch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/profile`, payload, { headers: { Authorization: `Bearer ${token}` } });

            toaster.create({ title: "Perfil Atualizado!", description: "Os seus dados foram salvos e enviados para análise.", type: "success" });
            await mutate('/api/users/me'); // Invalida o cache
            router.push('/dashboard'); // Redireciona
        } catch (error: any) {
            toaster.create({ title: "Erro ao Salvar.", description: error.response?.data?.error || "Tente novamente.", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Flex w="100%" p={2} bgColor={'bodyBg'} borderRadius="md" flexDir="column" justify="center" align="center" mx='auto'>
            <Toaster />
            <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                <VStack gap={8} align="stretch">
                    <VStack align="start">
                        <Heading as="h1" size="xl">Edite o seu Perfil</Heading>
                        <Text color="gray.400">Para continuar, precisamos de mais algumas informações cadastrais. Após o envio, o seu perfil passará por uma breve análise da nossa equipe.</Text>
                    </VStack>

                    {/* FOTO DE PERFIL */}
                    <Field.Root>
                        <Field.Label w='100%' textAlign={'center'} fontSize={'xl'} alignItems={'center'} justifyContent={'center'}> <Text>Foto de Perfil</Text></Field.Label>
                        <Flex align="center" gap={4} flexDir={'column'} alignItems={'center'} justifyContent={'center'} w='100%' >
                            <Avatar.Root boxSize={52} my={8}>
                                <Avatar.Fallback name={watch('name')} />
                                <Avatar.Image src={userProfile?.profilePictureUrl || profilePicturePreview} />
                            </Avatar.Root>
                            {/* 4. ATUALIZAÇÃO: Usando o FileUpload.Root */}
                            <FileUpload.Root accept={["image/png", "image/jpeg"]} {...register("profilePicture")} id="profile-picture-upload" maxFiles={1} alignItems={'center'} justifyContent={'center'}>
                                <FileUpload.HiddenInput />
                                <FileUpload.Trigger asChild>
                                    <Button cursor="pointer" bgColor={'gray.100'} color={'black'} _hover={{ bgColor: 'brand.600', color: 'white' }} size="sm">
                                        Subir foto
                                    </Button>
                                </FileUpload.Trigger>
                            </FileUpload.Root>
                        </Flex>
                    </Field.Root>

                    {/* DADOS PESSOAIS */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Dados Pessoais</Heading>
                        <Field.Root invalid={!!errors.name} required>
                            <Field.Label>Nome Completo</Field.Label>
                            <Input defaultValue={userProfile?.name} bgColor={'gray.700'} {...register("name", { required: "Este campo é obrigatório" })} />
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
                                <Input  bgColor={'gray.700'} {...register("rg")}  />
                            </Field.Root>
                            <Field.Root invalid={!!errors.birthDate}>
                                <Field.Label>Data de Nascimento</Field.Label>
                                <Input type="date" defaultValue={userProfile?.birthDate} bgColor={'gray.700'} {...register("birthDate")} />
                            </Field.Root>
                        </SimpleGrid>
                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                            <Field.Root invalid={!!errors.profession}>
                                <Field.Label>Profissão</Field.Label>
                                <Input defaultValue={userProfile?.profession} bgColor={'gray.700'} {...register("profession")} />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label>Nacionalidade</Field.Label>
                                <Controller name="nationality" control={control} render={({ field }) => (
                                    <Select.Root collection={nacionalidadesCollection} value={field.value ? [field.value] : []} onValueChange={(details) => field.onChange(details.value[0])}>
                                        <Select.Control><Select.Trigger cursor={'pointer'} bgColor={'gray.700'}><Select.ValueText defaultValue={userProfile?.nationality} /></Select.Trigger></Select.Control>
                                        <Portal><Select.Positioner><Select.Content>{nacionalidadesCollection.items.map((item) => (<Select.Item item={item} key={item.value}>{item.label}</Select.Item>))}</Select.Content></Select.Positioner></Portal>
                                    </Select.Root>
                                )} />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label>Estado Civil</Field.Label>
                                <Controller name="maritalStatus" control={control} render={({ field }) => (
                                    <Select.Root collection={estadoCivilCollection} value={field.value ? [field.value] : []} onValueChange={(details) => field.onChange(details.value[0])}>
                                        <Select.Control><Select.Trigger cursor={'pointer'} bgColor={'gray.700'}><Select.ValueText defaultValue={userProfile?.maritalStatus} placeholder="Selecione..." /></Select.Trigger></Select.Control>
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
                            <Input defaultValue={userProfile?.infoEmail} type="email" bgColor={'gray.700'} {...register("infoEmail")} />
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
                                        <Checkbox.Root key={item.value} value={item.value} variant={'subtle'} colorPalette={'white'} >
                                            <Checkbox.HiddenInput />
                                            <Checkbox.Control bgColor={'gray.100'} color={'black'} cursor={'pointer'} />
                                            <Checkbox.Label>{item.label === 'WhatsApp' ? <Icon size={'md'} mb={0.5} color={'whatsapp'} as={PiWhatsappLogoDuotone} /> : <Icon size={'md'} mb={0.5} color='wheat' as={PiEnvelope} />} {item.label}</Checkbox.Label>
                                        </Checkbox.Root>
                                    ))}
                                </Fieldset.Content>
                            </CheckboxGroup>
                        </Fieldset.Root>
                    </VStack>

                    {/* ASSOCIADO (VENDEDOR) */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Indicação</Heading>
                        <Controller
                            name="referredById"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <Field.Root invalid={!!error}>
                                    <Field.Label>Associado Responsável</Field.Label>
                                    <Select.Root
                                        collection={associatesCollection}
                                        value={field.value ? [field.value] : undefined}
                                        onValueChange={(details) => field.onChange(details.value[0])}
                                    >
                                        <Select.Control><Select.Trigger ref={field.ref} color={'white'} cursor={'pointer'} borderColor={'gray.600'}><Select.ValueText placeholder="Selecione um associado..." /><PiCaretDownDuotone /></Select.Trigger></Select.Control>
                                        <Portal>
                                            <Select.Positioner>
                                                <Select.Content>
                                                    {isLoadingAssociates ? (
                                                        <Flex w='100%' justify={'center'}><Spinner /></Flex>
                                                    ) : (
                                                        associatesCollection.items.map((associate) => (
                                                            <Select.Item key={associate.value} item={associate}>
                                                                {associate.label}
                                                            </Select.Item>
                                                        ))
                                                    )}
                                                </Select.Content>
                                            </Select.Positioner>
                                        </Portal>
                                    </Select.Root>
                                    {error && <Field.ErrorText>{error.message}</Field.ErrorText>}
                                </Field.Root>
                            )}
                        />
                    </VStack>

                    {/* ENDEREÇO RESIDENCIAL */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Endereço Residencial</Heading>
                        <AddressBlock userProfile={userProfile} type="residential" {...{ control, register, errors, watch, setValue }} />
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
                                    onCheckedChange={(details) => field.onChange(Boolean(details.checked))}
                                >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control bgColor={'gray.100'} color={'black'} />
                                    <Checkbox.Label>O endereço comercial é diferente do residencial</Checkbox.Label>
                                </Checkbox.Root>
                            )}
                        />
                        {useCommercialAddress && <AddressBlock type="commercial" {...{ control, register, errors, watch, setValue, isDisabled: !useCommercialAddress }} />}
                    </VStack>

                    {/* ESCOLHA DO ENDEREÇO DE CORRESPONDÊNCIA */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Endereço de Correspondência</Heading>
                        <Controller
                            name="correspondenceAddress"
                            control={control}
                            render={({ field }) => (
                                <RadioGroup.Root value={field.value} onValueChange={(details) => field.onChange(details.value as "residential" | "commercial")}>
                                    <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
                                        <RadioGroup.Item value="residential">
                                            <RadioGroup.ItemHiddenInput onBlur={field.onBlur} />
                                            <RadioGroup.ItemIndicator bgColor={'gray.100'} color={'black'} cursor={'pointer'} />
                                            <RadioGroup.ItemText>Usar Endereço Residencial</RadioGroup.ItemText>
                                        </RadioGroup.Item>
                                        <RadioGroup.Item value="commercial" disabled={!useCommercialAddress}>
                                            <RadioGroup.ItemHiddenInput onBlur={field.onBlur} />
                                            <RadioGroup.ItemIndicator bgColor={'gray.100'} color={'black'} cursor={'pointer'} />
                                            <RadioGroup.ItemText>Usar Endereço Comercial</RadioGroup.ItemText>
                                        </RadioGroup.Item>
                                    </Stack>
                                </RadioGroup.Root>
                            )}
                        />
                    </VStack>

                    {/* DOCUMENTOS */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Documentos</Heading>
                        <Text color="gray.400">Faça o upload de uma cópia do seu RG ou CNH (frente e verso).</Text>
                        <Field.Root invalid={!!errors.personalDocuments}>
                            {/* 6. ATUALIZAÇÃO: Usando o FileUpload.Root para Documentos */}
                            <FileUpload.Root accept={[".pdf", ".jpg", ".jpeg", ".png"]} maxFiles={6} >
                                <FileUpload.HiddenInput  {...register("personalDocuments")} />
                                <FileUpload.Trigger asChild>
                                    <Flex bg={'gray.100'} color={'black'} p={2} alignItems={'center'} cursor={'pointer'} _hover={{ bgColor: 'brand.600', color: 'white' }} gap={2}>
                                        <Icon as={PiUploadSimple} />
                                        Anexar Documentos
                                    </Flex>
                                </FileUpload.Trigger>
                                <FileUpload.List /> {/* Lista os ficheiros automaticamente */}
                            </FileUpload.Root>
                        </Field.Root>
                        <Flex gap={2} flexWrap="wrap">

                            {userProfile?.personalDocumentUrls?.map((url, index) => (

                                <Link key={index} href={url} target='_blank' color="brand.600">
                                    <Button bgColor={'brand.700'} color={'white'} _hover={{ bgColor: 'brand.900', color: 'white' }}><PiDownloadDuotone /> {decodeURIComponent(url.split('/').pop()?.split('-').pop() || `Documento ${index + 1}`)}</Button>
                                </Link>

                            ))}
                        </Flex>
                        {/* O VStack abaixo não é mais necessário, pois o FileUpload.List faz isso */}
                    </VStack>

                    <Button type="submit" colorPalette="blue" size="lg" loading={isSubmitting} gap={2} alignSelf="stretch">
                        <Icon as={PiFloppyDisk} />
                        Salvar e Enviar para Análise
                    </Button>
                </VStack>
            </form>
        </Flex>
    );
}

