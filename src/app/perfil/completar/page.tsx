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
    Checkbox,
    Stack,
    Fieldset,
    RadioGroup,
    Avatar,
    CheckboxGroup,
    FileUpload,
    Link,
    Box,
    HStack,
    Progress,
    Badge
} from "@chakra-ui/react";
import { useForm, SubmitHandler, Controller, UseFormRegister, FieldErrors, Control, UseFormSetValue, useController, useWatch } from "react-hook-form";
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { PiEnvelope, PiFloppyDisk, PiUploadSimple, PiWhatsappLogoDuotone, PiCheckCircle, PiCircleNotch } from "react-icons/pi";
import { Toaster, toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { maskCPFOrCNPJ, maskPhone, unmask, maskCEP } from "@/utils/masks";
import { useSWRConfig } from "swr";
import { useApi } from "@/hooks/useApi";
import NextLink from 'next/link';

interface OnboardingFormData {
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

    profilePicture?: FileList;
    personalDocuments?: FileList;

    termsAccepted: boolean;
}

interface Associate {
    value: string; 
    label: string; 
}

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

// --- Sub-componente de Endereço ---
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

export default function CompleteProfilePage() {
    const { user } = useAuth0();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // NOVO: Estado para feedback de progresso
    const [statusMessage, setStatusMessage] = useState("");

    const { getAccessTokenSilently } = useAuth0();
    const { register, handleSubmit, formState: { errors }, control, watch, setValue } = useForm<OnboardingFormData>({
        defaultValues: {
            name: '',
            nationality: 'Brasileira',
            useCommercialAddress: false,
            contactPreference: [],
            correspondenceAddress: 'residential',
            unknownAssociate: false,
            termsAccepted: false 
        }
    });
    const router = useRouter();
    const { mutate } = useSWRConfig();

    const useCommercialAddress = watch('useCommercialAddress');
    const unknownAssociate = watch('unknownAssociate'); 
    const profilePictureFile = watch('profilePicture');

    const cpfOrCnpjValue = watch('cpfOrCnpj');
    const unmaskedCpfOrCnpj = unmask(cpfOrCnpjValue || '');
    const isCnpj = unmaskedCpfOrCnpj.length > 11;

    const profilePicturePreview = profilePictureFile && profilePictureFile.length > 0
        ? URL.createObjectURL(profilePictureFile[0])
        : user?.picture;

    const { data: associates, isLoading: isLoadingAssociates } = useApi<Associate[]>('/api/users/associates');

    const associatesCollection = createListCollection({
        items: associates || [],
    });

    const contactPreference = useController({
        control,
        name: "contactPreference",
        defaultValue: [],
    });

    const onSubmit: SubmitHandler<OnboardingFormData> = async (data) => {
        setIsSubmitting(true);
        setStatusMessage("Iniciando envio..."); // 1. Inicia feedback
        
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });

            // Upload Foto
            let profilePictureUrl = user?.picture;
            if (data.profilePicture && data.profilePicture.length > 0) {
                setStatusMessage("Fazendo upload da foto de perfil..."); // 2. Feedback Foto
                
                const file = data.profilePicture[0];
                const formData = new FormData();
                formData.append('profilePicture', file);
                const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/profile-picture`, formData, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                profilePictureUrl = response.data.url;
            }

            // Upload Docs
            const personalDocumentUrls: string[] = [];
            if (data.personalDocuments && data.personalDocuments.length > 0) {
                const files = Array.from(data.personalDocuments);
                const totalDocs = files.length;

                for (let i = 0; i < totalDocs; i++) {
                    const file = files[i];
                    // 3. Feedback detalhado por documento
                    setStatusMessage(`Enviando documento ${i + 1} de ${totalDocs} (${file.name})...`);
                    
                    const formData = new FormData();
                    formData.append('document', file);
                    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/personal-document`, formData, {
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                    });
                    personalDocumentUrls.push(response.data.url);
                }
            }

            // Payload
            setStatusMessage("Salvando dados do perfil..."); // 4. Feedback Final
            
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

            setStatusMessage("Concluído! Redirecionando...");
            toaster.create({ title: "Perfil Atualizado!", description: "Os seus dados foram salvos e enviados para análise.", type: "success" });
            await mutate('/api/users/me');
            router.push('/dashboard');
        } catch (error: any) {
            setStatusMessage(""); // Limpa mensagem em caso de erro
            toaster.create({ title: "Erro ao Salvar.", description: error.response?.data?.error || "Tente novamente.", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Flex w="100%" p={8} bgColor={'bodyBg'} maxW="breakpoint-lg" borderRadius="md" boxShadow="md" flexDir="column" justify="center" align="center" mx='auto'>
            {/* O Toaster está no layout global */}
            <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                <VStack gap={8} align="stretch">
                    <VStack align="start">
                        <Heading as="h1" size="xl">Complete o seu Perfil</Heading>
                        <Text color="gray.400">Para continuar, precisamos de mais algumas informações cadastrais.</Text>
                    </VStack>

                    {/* ... (Seções de Foto, Dados, Endereços mantidas iguais - omitidas para brevidade, mas devem estar no arquivo final) ... */}
                    {/* COLE O CONTEÚDO DOS INPUTS AQUI (FOTO, DADOS PESSOAIS, CONTATO, INDICAÇÃO, ENDEREÇOS, DOCUMENTOS) IGUAL AO ANTERIOR */}
                    {/* Estou recolando tudo para garantir que você tenha o arquivo completo */}
                    
                    {/* FOTO DE PERFIL */}
                    <Field.Root>
                        <Field.Label w='100%' textAlign={'center'} fontSize={'xl'} alignItems={'center'} justifyContent={'center'}> <Text>Foto de Perfil (obrigatório)</Text></Field.Label>
                        <Flex align="center" gap={4} flexDir={'column'} alignItems={'center'} justifyContent={'center'} w='100%' >
                            <Avatar.Root size={'2xl'} my={8}>
                                <Avatar.Fallback name={watch('name')} />
                                <Avatar.Image src={profilePicturePreview || ''} />
                            </Avatar.Root>
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
                            <Field.Label>{isCnpj ? "Razão Social" : "Nome Completo"}</Field.Label>
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
                                <Input bgColor={'gray.700'} {...register("rg")} disabled={isCnpj} />
                            </Field.Root>
                            <Field.Root invalid={!!errors.birthDate} disabled={isCnpj} required={!isCnpj}>
                                <Field.Label>Data de Nascimento</Field.Label>
                                <Input type="date" bgColor={'gray.700'} {...register("birthDate", { required: !isCnpj ? "A data de nascimento é obrigatória" : false })} disabled={isCnpj} />
                            </Field.Root>
                        </SimpleGrid>
                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                            <Field.Root invalid={!!errors.profession}>
                                <Field.Label>Profissão</Field.Label>
                                <Input bgColor={'gray.700'} {...register("profession")} disabled={isCnpj} />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label>Nacionalidade</Field.Label>
                                <Controller name="nationality" control={control} render={({ field }) => (
                                    <Select.Root collection={nacionalidadesCollection} value={field.value ? [field.value] : []} onValueChange={(details) => field.onChange(details.value[0])} disabled={isCnpj}>
                                        <Select.Control><Select.Trigger cursor={isCnpj ? 'not-allowed' : 'pointer'} bgColor={'gray.700'}><Select.ValueText /></Select.Trigger></Select.Control>
                                        <Portal><Select.Positioner><Select.Content>{nacionalidadesCollection.items.map((item) => (<Select.Item item={item} key={item.value}>{item.label}</Select.Item>))}</Select.Content></Select.Positioner></Portal>
                                    </Select.Root>
                                )} />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label>Estado Civil</Field.Label>
                                <Controller name="maritalStatus" control={control} render={({ field }) => (
                                    <Select.Root collection={estadoCivilCollection} value={field.value ? [field.value] : []} onValueChange={(details) => field.onChange(details.value[0])} disabled={isCnpj}>
                                        <Select.Control><Select.Trigger cursor={isCnpj ? 'not-allowed' : 'pointer'} bgColor={'gray.700'}><Select.ValueText placeholder="Selecione..." /></Select.Trigger></Select.Control>
                                        <Portal><Select.Positioner><Select.Content>{estadoCivilCollection.items.map((item) => (<Select.Item item={item} key={item.value}>{item.label}</Select.Item>))}</Select.Content></Select.Positioner></Portal>
                                    </Select.Root>
                                )} />
                            </Field.Root>
                        </SimpleGrid>
                        
                        <Field.Root invalid={!!errors.gender} required={!isCnpj} disabled={isCnpj}>
                            <Field.Label>Gênero</Field.Label>
                            <Controller name="gender" control={control} rules={{ required: !isCnpj ? "O gênero é obrigatório" : false }} render={({ field }) => (
                                <RadioGroup.Root value={field.value} onValueChange={(details) => field.onChange(details.value as "Male" | "Female")} disabled={isCnpj}>
                                    <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
                                        <RadioGroup.Item value="Male"><RadioGroup.ItemHiddenInput onBlur={field.onBlur} /><RadioGroup.ItemIndicator bgColor={isCnpj? 'gray.600' : 'gray.100'} color={'black'} cursor={isCnpj ? 'not-allowed' : 'pointer'} /><RadioGroup.ItemText>Masculino</RadioGroup.ItemText></RadioGroup.Item>
                                        <RadioGroup.Item value="Female"><RadioGroup.ItemHiddenInput onBlur={field.onBlur} /><RadioGroup.ItemIndicator bgColor={isCnpj? 'gray.600' : 'gray.100'} color={'black'} cursor={isCnpj ? 'not-allowed' : 'pointer'} /><RadioGroup.ItemText>Feminino</RadioGroup.ItemText></RadioGroup.Item>
                                    </Stack>
                                </RadioGroup.Root>
                            )} />
                        </Field.Root>
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
                            <CheckboxGroup value={contactPreference.field.value} onValueChange={contactPreference.field.onChange} name={contactPreference.field.name} defaultValue={["E-mail"]}>
                                <Fieldset.Legend fontSize="sm" mb="2">Preferência de Contato</Fieldset.Legend>
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

                    {/* INDICAÇÃO */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Indicação</Heading>
                        <Controller name="unknownAssociate" control={control} render={({ field }) => (
                            <Checkbox.Root checked={field.value} onCheckedChange={(d) => field.onChange(Boolean(d.checked))} mb={2}>
                                <Checkbox.HiddenInput />
                                <Checkbox.Control bgColor={'gray.100'} color={'black'} />
                                <Checkbox.Label>Não sei quem é / Não encontrei meu associado na lista</Checkbox.Label>
                            </Checkbox.Root>
                        )} />
                        {unknownAssociate ? (
                            <Field.Root>
                                <Field.Label>Nome do Associado (Opcional)</Field.Label>
                                <Input placeholder="Digite o nome de quem lhe indicou" bgColor={'gray.700'} {...register("manualReferral")} />
                                <Field.HelperText>Nós iremos verificar esta informação internamente.</Field.HelperText>
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
                                <Checkbox.Label>O endereço comercial é diferente do residencial</Checkbox.Label>
                            </Checkbox.Root>
                        )} />
                        {useCommercialAddress && <AddressBlock type="commercial" {...{ control, register, errors, watch, setValue, isDisabled: !useCommercialAddress }} />}
                    </VStack>

                    {/* DOCUMENTOS */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Documentos</Heading>
                        <Text color="gray.400">Documentos: RG e CPF (ou CNH), Comprovante de residência (opcional), e Última alteração do contrato social (se aplicável).</Text>
                        <Field.Root invalid={!!errors.personalDocuments}>
                            <FileUpload.Root accept={[".pdf", ".jpg", ".jpeg", ".png"]} maxFiles={6} >
                                <FileUpload.HiddenInput  {...register("personalDocuments")} />
                                <FileUpload.Trigger asChild>
                                    <Flex bg={'gray.100'} color={'black'} p={2} alignItems={'center'} cursor={'pointer'} _hover={{ bgColor: 'brand.600', color: 'white' }} gap={2}>
                                        <Icon as={PiUploadSimple} />
                                        Anexar Documentos
                                    </Flex>
                                </FileUpload.Trigger>
                                <FileUpload.List />
                            </FileUpload.Root>
                        </Field.Root>
                    </VStack>

                    {/* Checkbox de Aceite dos Termos (LGPD) */}
                    <Box mt={8} p={4} bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.700">
                        <Controller
                            name="termsAccepted"
                            control={control}
                            rules={{ required: "Você deve ler e aceitar os Termos de Uso e Política de Privacidade para continuar." }}
                            render={({ field }) => (
                                <Checkbox.Root 
                                    checked={field.value} 
                                    onCheckedChange={(details) => field.onChange(Boolean(details.checked))}
                                >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control bgColor={'gray.100'} color={'black'} cursor={'pointer'} />
                                    <Checkbox.Label fontSize="sm" color="gray.300" lineHeight="1.5">
                                        Li, compreendi e concordo com os{' '}
                                        <Link as={NextLink} href="/termos-de-uso" color="brand.400" textDecoration="underline" target="_blank" onClick={(e) => e.stopPropagation()}>
                                            Termos de Uso
                                        </Link>
                                        {' '}e com a{' '}
                                        <Link as={NextLink} href="/politica-privacidade" color="brand.400" textDecoration="underline" target="_blank" onClick={(e) => e.stopPropagation()}>
                                            Política de Privacidade
                                        </Link>
                                        {' '}da Mazzotini.
                                    </Checkbox.Label>
                                </Checkbox.Root>
                            )}
                        />
                        {errors.termsAccepted && (
                            <Text color="red.400" fontSize="xs" mt={2}>{errors.termsAccepted.message}</Text>
                        )}
                    </Box>

                    {/* NOVO: FEEDBACK VISUAL DE STATUS 
                        Mostra uma caixa com a mensagem atual do progresso em vez de apenas o spinner.
                    */}
                    {isSubmitting ? (
                        <VStack mt={8} p={4} bg="brand.900" borderRadius="md" border="1px solid" borderColor="brand.700" w="100%">
                            <HStack gap={3}>
                                <Spinner color="brand.400" />
                                <Text fontWeight="bold" color="white">Processando...</Text>
                            </HStack>
                            <Text fontSize="sm" color="gray.300">{statusMessage}</Text>
                            <Badge fontSize="xs" color="white">Por favor, não feche esta janela.</Badge>
                        </VStack>
                    ) : (
                        <Button type="submit" colorPalette="blue" size="lg" gap={2} alignSelf="stretch" mt={8}>
                            <Icon as={PiFloppyDisk} />
                            Salvar e Enviar para Análise
                        </Button>
                    )}
                    
                </VStack>
            </form>
        </Flex>
    );
}