'use client';

import {
    Flex, Heading, Text, VStack, Button, Icon, Field, Input, SimpleGrid, Spinner, createListCollection, Select, Portal, Checkbox, Stack, RadioGroup, Box,
    HStack, IconButton, Separator, FileUpload, CheckboxGroup, Alert, Fieldset, Dialog, CloseButton, Card,
} from "@chakra-ui/react";
import { useForm, SubmitHandler, Controller, useController } from "react-hook-form";
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { PiArrowLeft, PiFloppyDisk, PiFilePdf, PiTrash, PiEye, PiUploadSimple, PiWarningCircle, PiKey, PiEnvelope } from "react-icons/pi";
import { Toaster, toaster } from "@/components/ui/toaster";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { maskCPFOrCNPJ, maskPhone, unmask } from "@/utils/masks";
import { useApi } from "@/hooks/useApi";
import Link from 'next/link';
import { AddressBlock } from "@/app/components/management/AddressBlock";
import { InvestmentsSummary } from "@/app/components/management/InvestmentsSummary";

// ============================================================================
//  INTERFACES
// ============================================================================

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
    personalDocuments?: FileList;
}

interface Associate { value: string; label: string; }

// ============================================================================
//  COLEÇÕES
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
//  PÁGINA PRINCIPAL
// ============================================================================
export default function EditUserPage() {
    const { getAccessTokenSilently } = useAuth0();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados para seção de segurança
    const [isSendingReset, setIsSendingReset] = useState(false);
    const [resetLink, setResetLink] = useState<string | null>(null);
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
    const emailInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    // 1. Busca dados do usuário e solicitações pendentes
    const { data: userData, isLoading: isLoadingUser } = useApi<any>(`/api/management/users/${userId}`);
    const { data: associates, isLoading: isLoadingAssociates } = useApi<Associate[]>('/api/users/associates');
    const { data: pendingChanges, mutate: mutatePendingChanges } = useApi<any[]>('/api/management/profile-changes');
    const pendingChange = pendingChanges?.find((r: any) => r.userId === userId) || null;

    // =================================================================
    //  A CORREÇÃO: Adicionado 'getValues' na destruturação
    // =================================================================
    const { register, handleSubmit, formState: { errors }, control, watch, setValue, getValues, reset } = useForm<UserFormData>({
        defaultValues: {
            nationality: 'Brasileira',
            useCommercialAddress: false,
            contactPreference: [],
            correspondenceAddress: 'residential',
            unknownAssociate: false,
            personalDocumentUrls: [] // Inicializa vazio
        }
    });
    // =================================================================

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

    // Função de Exclusão de Documentos Pessoais (com botão type="button" corrigido)
    const handleDeleteDocument = async (indexToRemove: number) => {
        const urlToDelete = personalDocuments[indexToRemove];
        if (!urlToDelete) return;

        const previousDocs = [...personalDocuments];
        const updatedDocs = personalDocuments.filter((_, index) => index !== indexToRemove);
        setValue('personalDocumentUrls', updatedDocs, { shouldDirty: true });

        try {
            const token = await getAccessTokenSilently();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

            await axios.delete(`${apiBaseUrl}/api/management/users/${userId}/documents`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { url: urlToDelete }
            });

            toaster.create({ title: "Documento excluído.", type: "success" });
        } catch (error) {
            console.error("Erro ao deletar documento:", error);
            setValue('personalDocumentUrls', previousDocs);
            toaster.create({ title: "Erro ao excluir.", description: "Não foi possível apagar o arquivo.", type: "error" });
        }
    };

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
            };

            // Envia como solicitação de alteração — pendente até aprovação do ADM
            await axios.post(`${apiBaseUrl}/api/management/users/${userId}/request-change`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            mutatePendingChanges();
            toaster.create({
                title: "Solicitação enviada!",
                description: "As alterações ficam pendentes até aprovação de outro administrador.",
                type: "success"
            });

        } catch (error: any) {
            console.error("Erro ao solicitar alteração:", error);
            toaster.create({ title: "Erro ao Salvar", description: error.response?.data?.error || "Erro desconhecido", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingUser || isLoadingAssociates) {
        return <Flex w="100%" h="50vh" justify="center" align="center"><Spinner size="xl" /></Flex>;
    }

    return (
        <Flex w="100%" p={8} bgColor={'bodyBg'} borderRadius="md" boxShadow="md" flexDir="column" justify="center" align="center" mx='auto'>
            {/* Botão de Voltar */}
            <Flex w="100%" mb={6}>
                <Link href="/gestao/usuarios" passHref>
                    <Button variant="ghost" size="sm" gap={2} pl={0}>
                        <Icon as={PiArrowLeft} /> Voltar para Lista
                    </Button>
                </Link>
            </Flex>

            <VStack gap={8} align="stretch" w="100%">
                <VStack align="start">
                    <Heading as="h1" size="xl">Editar Usuário</Heading>
                    <Text color="gray.400">Gerencie os dados cadastrais do investidor.</Text>
                </VStack>

                {/* 1. RESUMO DA CARTEIRA (read-only) */}
                {userData && <InvestmentsSummary userId={userId} investments={userData.investments || []} />}

                {/* 2. SEGURANÇA */}
                {userData?.auth0UserId && (
                    <Card.Root bg="gray.900" borderColor="gray.700" borderWidth={1}>
                        <Card.Body>
                            <Heading size="sm" color="brand.400" mb={4}>Segurança da Conta</Heading>
                            <HStack gap={4} wrap="wrap">
                                <Button
                                    variant="outline" colorPalette="orange" gap={2}
                                    loading={isSendingReset}
                                    onClick={async () => {
                                        setIsSendingReset(true);
                                        setResetLink(null);
                                        try {
                                            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
                                            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/management/users/${userData.auth0UserId}/password-reset`, {}, { headers: { Authorization: `Bearer ${token}` } });
                                            setResetLink(res.data.resetLink);
                                            toaster.create({ title: 'Link gerado!', description: 'Copie o link abaixo e envie ao usuário.', type: 'success' });
                                        } catch {
                                            toaster.create({ title: 'Erro ao gerar link.', type: 'error' });
                                        } finally {
                                            setIsSendingReset(false);
                                        }
                                    }}
                                >
                                    <Icon as={PiKey} /> Gerar Link de Redefinição de Senha
                                </Button>
                                <Button variant="outline" colorPalette="blue" gap={2} onClick={() => { setNewEmail(''); setConfirmEmail(''); setIsEmailDialogOpen(true); }}>
                                    <Icon as={PiEnvelope} /> Alterar E-mail
                                </Button>
                            </HStack>
                            {resetLink && (
                                <Box mt={3} p={3} bg="orange.900/20" border="1px solid" borderColor="orange.700" borderRadius="md">
                                    <Text fontSize="xs" color="gray.400" mb={1}>Link de redefinição (válido por 5 dias):</Text>
                                    <Text fontSize="xs" color="orange.300" wordBreak="break-all">{resetLink}</Text>
                                    <Button size="xs" mt={2} colorPalette="orange" onClick={() => { navigator.clipboard.writeText(resetLink); toaster.create({ title: 'Copiado!', type: 'success' }); }}>
                                        Copiar link
                                    </Button>
                                </Box>
                            )}
                        </Card.Body>
                    </Card.Root>
                )}

                {/* DIALOG: Alterar E-mail */}
                <Dialog.Root open={isEmailDialogOpen} onOpenChange={(d) => !d.open && setIsEmailDialogOpen(false)}>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content bg="gray.800">
                            <Dialog.Header>
                                <Dialog.Title>Alterar E-mail do Usuário</Dialog.Title>
                                <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                            </Dialog.Header>
                            <Dialog.Body>
                                <VStack gap={4} align="stretch">
                                    <Text fontSize="sm" color="gray.400">E-mail atual: <strong>{userData?.email}</strong></Text>
                                    <Alert.Root status="warning" borderRadius="md" fontSize="xs">
                                        <Alert.Indicator />
                                        <Alert.Description>O usuário precisará fazer login novamente com o novo e-mail. O e-mail precisará ser verificado.</Alert.Description>
                                    </Alert.Root>
                                    <Field.Root>
                                        <Field.Label>Novo E-mail</Field.Label>
                                        <Input ref={emailInputRef} type="email" bgColor="gray.700" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="novo@email.com" />
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label>Confirmar Novo E-mail</Field.Label>
                                        <Input type="email" bgColor="gray.700" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder="novo@email.com" borderColor={confirmEmail && newEmail !== confirmEmail ? 'red.500' : 'gray.600'} />
                                        {confirmEmail && newEmail !== confirmEmail && <Field.ErrorText>Os e-mails não coincidem.</Field.ErrorText>}
                                    </Field.Root>
                                </VStack>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Button variant="ghost" onClick={() => setIsEmailDialogOpen(false)}>Cancelar</Button>
                                <Button
                                    colorPalette="blue"
                                    loading={isUpdatingEmail}
                                    disabled={!newEmail || newEmail !== confirmEmail}
                                    onClick={async () => {
                                        setIsUpdatingEmail(true);
                                        try {
                                            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
                                            await axios.patch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/management/users/${userData.auth0UserId}/email`, { newEmail }, { headers: { Authorization: `Bearer ${token}` } });
                                            toaster.create({ title: 'E-mail atualizado!', description: 'O usuário deve fazer login com o novo e-mail.', type: 'success' });
                                            setIsEmailDialogOpen(false);
                                        } catch (err: any) {
                                            toaster.create({ title: 'Erro ao atualizar e-mail.', description: err.response?.data?.error || err.message, type: 'error' });
                                        } finally {
                                            setIsUpdatingEmail(false);
                                        }
                                    }}
                                >
                                    Confirmar Alteração
                                </Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Dialog.Root>

                <Separator borderColor="gray.700" />

                {/* BANNER: alteração pendente de aprovação */}
                {pendingChange && (
                    <Alert.Root status="warning" borderRadius="md">
                        <Alert.Indicator><Icon as={PiWarningCircle} /></Alert.Indicator>
                        <Alert.Content>
                            <Alert.Title>Alteração aguardando aprovação</Alert.Title>
                            <Alert.Description>
                                Existe uma solicitação de edição pendente para este perfil, enviada em{' '}
                                {new Date(pendingChange.createdAt).toLocaleString('pt-BR')}.
                                As alterações abaixo substituirão a solicitação anterior se submetidas novamente.
                            </Alert.Description>
                        </Alert.Content>
                    </Alert.Root>
                )}

                {/* 2. FORMULÁRIO DE DADOS PESSOAIS */}
                <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                    <VStack gap={6} align="stretch">
                        <Heading as="h2" size="lg" color="brand.400">Dados Cadastrais</Heading>
                        {/* ... Campos de Inputs Pessoais ... */}

                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Dados Pessoais</Heading>
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
                                <Field.Label>Estado Civil</Field.Label>
                                <Controller name="maritalStatus" control={control} render={({ field }) => (
                                    <Select.Root collection={estadoCivilCollection} value={field.value ? [field.value] : []} onValueChange={(d) => field.onChange(d.value[0])} disabled={isCnpj}>
                                        <Select.Control><Select.Trigger bgColor={'gray.700'}><Select.ValueText placeholder="Selecione..." /></Select.Trigger></Select.Control>
                                        <Portal><Select.Positioner><Select.Content>{estadoCivilCollection.items.map((i) => (<Select.Item item={i} key={i.value}>{i.label}</Select.Item>))}</Select.Content></Select.Positioner></Portal>
                                    </Select.Root>
                                )} />
                            </Field.Root>
                            <Field.Root disabled={isCnpj}>
                                <Field.Label>Gênero</Field.Label>
                                <Controller name="gender" control={control} render={({ field }) => (
                                    <RadioGroup.Root value={field.value} onValueChange={(d) => field.onChange(d.value)} disabled={isCnpj}>
                                        <Stack direction="row" gap={4} mt={2}>
                                            <RadioGroup.Item value="Male"><RadioGroup.ItemHiddenInput /><RadioGroup.ItemIndicator bgColor={field.value === 'Male' ? 'brand.700' : 'gray.200'} /><RadioGroup.ItemText>Masc.</RadioGroup.ItemText></RadioGroup.Item>
                                            <RadioGroup.Item value="Female"><RadioGroup.ItemHiddenInput /><RadioGroup.ItemIndicator bgColor={field.value === 'Female' ? 'brand.700' : 'gray.200'} /><RadioGroup.ItemText>Fem.</RadioGroup.ItemText></RadioGroup.Item>
                                        </Stack>
                                    </RadioGroup.Root>
                                )} />
                            </Field.Root>
                        </SimpleGrid>
                        <Field.Root disabled={isCnpj}>
                            <Field.Label>Profissão</Field.Label>
                            <Input bgColor={'gray.700'} {...register("profession")} disabled={isCnpj} />
                        </Field.Root>
                    </VStack>

                    {/* CONTATO */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Contato</Heading>
                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                            <Field.Root invalid={!!errors.cellPhone} required>
                                <Field.Label>Celular</Field.Label>
                                <Controller name="cellPhone" control={control} rules={{ required: "Obrigatório" }} render={({ field }) => (
                                    <Input bgColor={'gray.700'} value={field.value ? maskPhone(field.value) : ''} onChange={field.onChange} />
                                )} />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label>Telefone Fixo</Field.Label>
                                <Controller name="phone" control={control} render={({ field }) => (
                                    <Input bgColor={'gray.700'} value={field.value ? maskPhone(field.value) : ''} onChange={field.onChange} />
                                )} />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label>E-mail Informativo</Field.Label>
                                <Input type="email" bgColor={'gray.700'} {...register("infoEmail")} />
                            </Field.Root>
                        </SimpleGrid>
                        <Fieldset.Root>
                            <Fieldset.Legend>Preferência de Contato</Fieldset.Legend>
                            <CheckboxGroup
                                value={contactPreference.field.value}
                                onValueChange={contactPreference.field.onChange}
                                name={contactPreference.field.name}
                            >
                                <Fieldset.Content display="flex" flexDirection="row" flexWrap="wrap" gap={4} mt={1}>
                                    {['WhatsApp', 'E-mail', 'Telefone', 'SMS'].map(opt => (
                                        <Checkbox.Root key={opt} value={opt}>
                                            <Checkbox.HiddenInput />
                                            <Checkbox.Control bgColor={'gray.100'} color={'black'} />
                                            <Checkbox.Label>{opt}</Checkbox.Label>
                                        </Checkbox.Root>
                                    ))}
                                </Fieldset.Content>
                            </CheckboxGroup>
                        </Fieldset.Root>
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
                        <AddressBlock type="residential" control={control as any} register={register as any} errors={errors} watch={watch} setValue={setValue as any} />
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
                        {useCommercialAddress && <AddressBlock type="commercial" control={control as any} register={register as any} errors={errors} watch={watch} setValue={setValue as any} isDisabled={!useCommercialAddress} />}
                    </VStack>

                    {/* ================================================================= */}
                    {/* SEÇÃO DE DOCUMENTOS (VIEW & DELETE & UPLOAD)                      */}
                    {/* ================================================================= */}
                    <VStack gap={4} align="stretch">
                        <Heading as="h2" size="md" pt={4} borderTopWidth="1px" borderColor="gray.700" mt={4}>Documentos do Usuário</Heading>

                        {/* LISTA DE DOCUMENTOS EXISTENTES */}
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
                                                    variant='solid'
                                                    colorPalette="blue"
                                                    onClick={() => window.open(url, '_blank')}
                                                    type="button"
                                                >
                                                    <Icon as={PiEye} /> Visualizar
                                                </Button>
                                                <IconButton
                                                    aria-label="Excluir documento"
                                                    size="xs"
                                                    colorPalette="red"
                                                    variant="ghost"
                                                    // =================================================================
                                                    // A CORREÇÃO: type="button" para evitar submit
                                                    // =================================================================
                                                    type="button"
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

                        {/* UPLOAD DE NOVOS DOCUMENTOS */}
                        <Field.Root>
                            <Field.Label>Adicionar Novos Documentos Pessoais</Field.Label>
                            <FileUpload.Root accept={[".pdf", ".jpg", ".jpeg", ".png"]} maxFiles={6} >
                                <FileUpload.HiddenInput  {...register("personalDocuments")} />
                                <FileUpload.Trigger asChild>
                                    <Flex bg={'brand.400'} color={'black'} p={2} alignItems={'center'} cursor={'pointer'} _hover={{ bgColor: 'brand.600', color: 'white' }} gap={2} borderRadius={4}>
                                        <Icon as={PiUploadSimple} />
                                        Anexar Documentos
                                    </Flex>
                                </FileUpload.Trigger>
                                <FileUpload.List />
                            </FileUpload.Root>
                        </Field.Root>
                    </VStack>
                    {/* ================================================================= */}

                    <Button type="submit" colorPalette="yellow" size="lg" loading={isSubmitting} gap={2} alignSelf="stretch" mt={8}>
                        <Icon as={PiFloppyDisk} />
                        Solicitar Alteração (Pendente de Aprovação)
                    </Button>
                </form>
            </VStack>
        </Flex>
    );
}