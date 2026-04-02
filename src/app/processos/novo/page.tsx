'use client';

import {
    Flex, Heading, Text, VStack, Button, Icon, Field, Input, SimpleGrid, Spinner, Select, createListCollection, Portal, Box, HStack, IconButton, Combobox, Stack, Alert
} from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import { motion } from 'framer-motion';
import { useForm, SubmitHandler, Controller, useWatch, useFieldArray, Control } from "react-hook-form";
import { useListCollection, useFilter } from "@chakra-ui/react";
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { PiCaretDownDuotone, PiPlusCircle, PiMagnifyingGlass, PiTrash, PiInfo, PiWarning, PiFolderOpen, PiHash } from "react-icons/pi";
import { Toaster, toaster } from "@/components/ui/toaster";
import { useState, useMemo, useEffect } from "react";
import { useApi } from '@/hooks/useApi';
import { useRouter } from "next/navigation";

// 1. ATUALIZAMOS A INTERFACE DO INVESTIDOR
interface InvestorFormInput {
    userId: string;
    share?: number;
    acquisitionDate?: string;
}

interface FormValues {
    processNumber: string;
    originalCreditor: string;
    otherParty: string; 
    nickname?: string;  
    origemProcesso: string;
    acquisitionValue: number;
    originalValue: number;
    acquisitionDate: string; 
    updateIndexType: string;  
    contractualIndexRate: number; 
    legalOneId: number;
    legalOneType: 'Lawsuit' | 'Appeal' | 'ProceduralIssue';
    folderId?: string; 
    investors: InvestorFormInput[];
}

interface LegalOneMatch {
    legalOneId: number;
    folderCode: string;
    legalOneType: string;
}

interface LookupResponse {
    processNumber: string;
    originalCreditor: string;
    otherParty?: string;
    origemProcesso: string;
    legalOneId: number;
    legalOneType: 'Lawsuit' | 'Appeal' | 'ProceduralIssue';
    nickname?: string;
    processFolderId?: string;
    suggestedInvestors?: { userId: string; share: number }[];
    legalOneMatches: LegalOneMatch[];
}

interface UserSelectItem { value: string; label: string; }
const indexTypesCollection = createListCollection({ items: [{ label: "SELIC", value: "SELIC" }, { label: "IPCA", value: "IPCA" }, { label: "CDI", value: "CDI" }, { label: "IGP-M", value: "IGP-M" }, { label: "Outro", value: "OUTRO" }] });

function InvestorCombobox(props: any) { 
    const { control, index, allInvestors } = props;
    const currentUserId = useWatch({ control, name: `investors.${index}.userId` });
    const defaultLabel = useMemo(() => {
        if (!currentUserId || !allInvestors) return "";
        return allInvestors.find((inv: any) => inv.value === currentUserId)?.label || "";
    }, [currentUserId, allInvestors]);
    const [inputValue, setInputValue] = useState(defaultLabel);
    useEffect(() => { if (defaultLabel) setInputValue(defaultLabel); }, [defaultLabel]);
    const { contains } = useFilter({ sensitivity: "base" });
    const { collection, filter } = useListCollection({ initialItems: allInvestors, filter: contains });
    return (
        <Controller name={`investors.${index}.userId`} control={control} rules={{ required: "Selecione um Cliente" }} render={({ field: cf, fieldState: { error } }) => (
            <Field.Root invalid={!!error} required>
                <Field.Label>Cliente {index + 1}</Field.Label>
                <Combobox.Root width="100%" collection={collection} value={cf.value ? [cf.value] : []} onValueChange={(d) => { cf.onChange(d.value[0]); setInputValue((d.items[0] as UserSelectItem)?.label); }} inputValue={inputValue} onInputValueChange={(d) => { setInputValue(d.inputValue); filter(d.inputValue); }}>
                    <Combobox.Control><Combobox.Input asChild autoComplete="off"><Input bgColor={'gray.700'} borderColor={'gray.600'} placeholder="Pesquisar Cliente..." onPaste={(e) => { const text = e.clipboardData.getData('text/plain').trim(); setTimeout(() => { setInputValue(text); filter(text); }, 0); }} /></Combobox.Input><Combobox.IndicatorGroup><Combobox.Trigger /></Combobox.IndicatorGroup></Combobox.Control>
                    <Portal><Combobox.Positioner><Combobox.Content maxH="200px" overflowY="auto">{collection.items.map((item: any) => (<Combobox.Item item={item} key={item.value} _hover={{ bg: 'gray.600' }} _selected={{ bg: 'blue.600' }}>{item.label}<Combobox.ItemIndicator /></Combobox.Item>))}</Combobox.Content></Combobox.Positioner></Portal>
                </Combobox.Root>
                {error && <Field.ErrorText>{error.message}</Field.ErrorText>}
            </Field.Root>
        )} />
    );
}

type SearchMode = 'processNumber' | 'folderCode';

export default function CreateAssetPage() {
    const MotionFlex = motion(Flex);
    const { getAccessTokenSilently, isAuthenticated, isLoading: isAuthLoading } = useAuth0();
    const router = useRouter();
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [searchMode, setSearchMode] = useState<SearchMode>('processNumber');
    const [folderCodeInput, setFolderCodeInput] = useState('');
    const [legalOneMatches, setLegalOneMatches] = useState<LegalOneMatch[]>([]);

    // --- Buscas de Dados ---
    const { data: myProfile, isLoading: isLoadingProfile } = useApi<any>('/api/users/me'); // <-- Busca quem está logado
    const { data: investors, isLoading: isLoadingInvestors, mutate: mutateInvestors } = useApi<UserSelectItem[]>('/api/users');

    const isLoadingData = isLoadingInvestors || isLoadingProfile;

    // ============================================================================
    //  TRAVA DE SEGURANÇA (BLOQUEIO DE ROTA PARA INVESTIDORES)
    // ============================================================================
    useEffect(() => {
        if (myProfile && !isLoadingProfile) {
            const isAdminOrOperator = myProfile.role === 'ADMIN' || myProfile.role === 'OPERATOR';
            if (!isAdminOrOperator) {
                toaster.create({ title: "Acesso Negado", description: "Você não tem permissão para registrar processos.", type: "error" });
                router.push('/dashboard');
            }
        }
    }, [myProfile, isLoadingProfile, router]);
    // ============================================================================

    const { register, handleSubmit, control, setValue, getValues, formState: { errors, isSubmitting } } = useForm<FormValues>({
        defaultValues: {
            processNumber: "",
            originalCreditor: "",
            otherParty: "",
            nickname: "",
            origemProcesso: "",
            acquisitionValue: 0,
            originalValue: 0,
            acquisitionDate: "",
            updateIndexType: "",
            contractualIndexRate: 0,
            legalOneId: 0,
            legalOneType: "Lawsuit",
            folderId: "",
            investors: [{ userId: "", share: 0, acquisitionDate: "" }]
        }
    });

    const { fields, append, remove, replace } = useFieldArray({ control, name: "investors" });
    const processNumberValue = useWatch({ control, name: 'processNumber' });

    const applyLookupResponse = async (data: LookupResponse) => {
        const { processNumber: pn, originalCreditor, origemProcesso, legalOneId, legalOneType, otherParty, nickname, processFolderId, suggestedInvestors, legalOneMatches: matches } = data;

        if (pn) setValue("processNumber", pn);
        setValue("originalCreditor", originalCreditor);
        setValue("origemProcesso", origemProcesso);
        if (otherParty) setValue("otherParty", otherParty);
        if (nickname) setValue("nickname", nickname);
        if (processFolderId) setValue("folderId", processFolderId);
        setValue("legalOneId", legalOneId);
        setValue("legalOneType", legalOneType);

        setLegalOneMatches(matches || []);

        if (suggestedInvestors && suggestedInvestors.length > 0) {
            await mutateInvestors();
            replace(suggestedInvestors.map(inv => ({ userId: inv.userId, share: inv.share, associateId: "", acquisitionDate: "" })));
            toaster.create({ title: "Clientes vinculados automaticamente!", type: "info" });
        }

        toaster.create({ title: "Dados Encontrados!", type: "success" });
    };

    const handleFetchProcessData = async () => {
        setIsFetchingData(true);
        setLegalOneMatches([]);
        const processNumber = getValues("processNumber");
        if (!processNumber) { toaster.create({ title: "Informe o número do processo", type: "error" }); setIsFetchingData(false); return; }

        try {
            const token = await getAccessTokenSilently();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
            const response = await axios.get<LookupResponse>(`${apiBaseUrl}/api/assets/lookup/${processNumber}`, { headers: { Authorization: `Bearer ${token}` } });
            await applyLookupResponse(response.data);
        } catch (error: any) {
            toaster.create({ title: "Erro ao Buscar", description: error.response?.data?.error, type: "error" });
        } finally { setIsFetchingData(false); }
    };

    const handleFetchByFolder = async () => {
        setIsFetchingData(true);
        setLegalOneMatches([]);
        if (!folderCodeInput.trim()) { toaster.create({ title: "Informe o código da pasta", type: "error" }); setIsFetchingData(false); return; }

        try {
            const token = await getAccessTokenSilently();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
            const encoded = encodeURIComponent(folderCodeInput.trim());
            const response = await axios.get<LookupResponse>(`${apiBaseUrl}/api/assets/lookup/folder/${encoded}`, { headers: { Authorization: `Bearer ${token}` } });
            await applyLookupResponse(response.data);
        } catch (error: any) {
            toaster.create({ title: "Pasta não encontrada", description: error.response?.data?.error || "Verifique o código da pasta e tente novamente.", type: "error" });
        } finally { setIsFetchingData(false); }
    };

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        if (!data.legalOneId) { toaster.create({ title: "Dados Incompletos", type: "error" }); return; }
        
        const investorUserIds = data.investors.map(inv => inv.userId);
        const uniqueInvestorIds = new Set(investorUserIds);
        if (uniqueInvestorIds.size !== investorUserIds.length) {
            toaster.create({ title: "Cliente Duplicado", description: "Remova os duplicados.", type: "error" });
            return;
        }

        try {
            const token = await getAccessTokenSilently();
            const payload = {
                ...data,
                acquisitionDate: new Date(data.acquisitionDate + 'T00:00:00Z'),
                investors: data.investors.map(inv => ({
                    userId: inv.userId,
                    share: 0,
                    associateId: null,
                    acquisitionDate: inv.acquisitionDate ? new Date(inv.acquisitionDate + 'T00:00:00Z') : null
                }))
            };

            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets`, payload, { headers: { Authorization: `Bearer ${token}` } });
            toaster.create({ title: "Processo Registrado!", type: "success" });
            window.location.href = `/processos/${data.legalOneId}`;
        } catch (error: any) {
            toaster.create({ title: "Erro ao Registrar", description: error.response?.data?.error, type: "error" });
        }
    };

    if (isAuthLoading || isLoadingData) return <Flex w="100%" flex={1} justify="center" align="center"><Spinner size="xl" /></Flex>;
    if (!isAuthenticated) return <Flex w="100%" flex={1} justify="center" align="center"><Text>Login necessário.</Text></Flex>;

    return (
        <MotionFlex direction="column" w="100%" flex={1} p={{ base: 4, md: 8 }}>
            <VStack w="100%" mx="auto" gap={8} align="stretch">
                <VStack align="start"><Heading as="h1" size="xl">Registrar Novo Processo</Heading></VStack>

                <Flex as="form" onSubmit={handleSubmit(onSubmit)}>
                    <Flex flexDir={'column'} gap="6" w="100%">
                        <Heading as="h2" size="md" borderBottomWidth="1px" borderColor="gray.700" pb={2}>1. Identificação</Heading>
                        <input type="hidden" {...register("folderId")} />

                        {/* Toggle de modo de busca */}
                        <HStack gap={2}>
                            <Button
                                size="sm"
                                variant={searchMode === 'processNumber' ? 'solid' : 'outline'}
                                colorPalette="blue"
                                onClick={() => { setSearchMode('processNumber'); setLegalOneMatches([]); }}
                            >
                                <Icon as={PiHash} /> Número do Processo
                            </Button>
                            <Button
                                size="sm"
                                variant={searchMode === 'folderCode' ? 'solid' : 'outline'}
                                colorPalette="blue"
                                onClick={() => { setSearchMode('folderCode'); setLegalOneMatches([]); }}
                            >
                                <Icon as={PiFolderOpen} /> Código da Pasta
                            </Button>
                        </HStack>

                        {/* Busca por número de processo */}
                        {searchMode === 'processNumber' && (
                            <Field.Root invalid={!!errors.processNumber} required>
                                <Field.Label>Número do Processo</Field.Label>
                                <Input placeholder="Ex: 0012345-67.2023.8.26.0100" borderColor={'gray.700'} bgColor={'gray.700'} {...register("processNumber", { required: true, setValueAs: (value) => value?.trim() })} />
                                <Button size="sm" onClick={handleFetchProcessData} loading={isFetchingData} disabled={!processNumberValue} bgColor={'brand.800'} color={'white'} mt={2}>
                                    <Icon as={PiMagnifyingGlass} /> Buscar
                                </Button>
                            </Field.Root>
                        )}

                        {/* Busca por código de pasta */}
                        {searchMode === 'folderCode' && (
                            <Field.Root>
                                <Field.Label>Código da Pasta</Field.Label>
                                <Input
                                    placeholder="Ex: Proc-0002091/032"
                                    borderColor={'gray.700'}
                                    bgColor={'gray.700'}
                                    value={folderCodeInput}
                                    onChange={e => setFolderCodeInput(e.target.value)}
                                />
                                <Text fontSize="xs" color="gray.500" mt={1}>Digite o código exato da pasta conforme aparece no Legal One.</Text>
                                <Button size="sm" onClick={handleFetchByFolder} loading={isFetchingData} disabled={!folderCodeInput.trim()} bgColor={'brand.800'} color={'white'} mt={2}>
                                    <Icon as={PiMagnifyingGlass} /> Buscar Pasta
                                </Button>
                            </Field.Root>
                        )}

                        {/* Banner: múltiplas pastas no Legal One para este número de processo */}
                        {legalOneMatches.length > 1 && (
                            <Alert.Root status="warning" borderRadius="md" borderWidth="1px" borderColor="yellow.600">
                                <Alert.Indicator />
                                <Alert.Content>
                                    <Alert.Title>
                                        Este número de processo existe em {legalOneMatches.length} pastas no Legal One
                                    </Alert.Title>
                                    <Alert.Description>
                                        <VStack align="start" gap={1} mt={1}>
                                            {legalOneMatches.map(m => (
                                                <Text key={m.legalOneId} fontSize="sm">
                                                    • {m.folderCode || 'Sem pasta'}
                                                </Text>
                                            ))}
                                            <Text fontSize="sm" color="yellow.200" mt={1}>
                                                Você está registrando a pasta <strong>{legalOneMatches.find(m => m.legalOneId === getValues('legalOneId'))?.folderCode || '—'}</strong>. Confirme antes de salvar.
                                            </Text>
                                        </VStack>
                                    </Alert.Description>
                                </Alert.Content>
                            </Alert.Root>
                        )}

                        <Field.Root invalid={!!errors.originalCreditor} required>
                            <Field.Label>Credor Original (Cliente)</Field.Label>
                            <Input borderColor={'gray.700'} disabled bgColor={'gray.700'} {...register("originalCreditor", { required: true })} readOnly />
                        </Field.Root>
                        
                        <Field.Root required>
                            <Field.Label>Parte Contrária</Field.Label>
                            <Input borderColor={'gray.700'} disabled bgColor={'gray.700'} {...register("otherParty", { required: "Obrigatório" })} readOnly />
                        </Field.Root>

                        <Field.Root invalid={!!errors.origemProcesso} required>
                            <Field.Label>Origem</Field.Label>
                            <Input borderColor={'gray.700'} {...register("origemProcesso", { required: true })} disabled readOnly bgColor="gray.700" />
                        </Field.Root>
                        
                        <Field.Root>
                            <Field.Label>Apelido Interno (Opcional)</Field.Label>
                            <Input borderColor={'gray.700'} bgColor={'gray.700'} {...register("nickname")} placeholder="Ex: Caso da Fazenda" />
                        </Field.Root>

                         <Heading as="h2" size="md" borderBottomWidth="1px" borderColor="gray.700" pb={2} pt={4}>2. Negociação</Heading>
                         
                         <VStack gap={4} align="stretch" p={4} borderColor="gray.700" borderWidth={1} borderRadius="md" bg="gray.800">
                            <HStack align="center">
                                <Heading size="sm" color="brand.400">Participação (Clientes / Associados)</Heading>
                                <Tooltip content="Associados que desejam acompanhar este processo devem ser cadastrados aqui como Clientes." showArrow>
                                    <Icon as={PiInfo} color="gray.400" cursor="help" />
                                </Tooltip>
                            </HStack>
                            {fields.map((field, index) => (
                                <Box key={field.id} p={4} borderWidth={1} borderColor="gray.600" borderRadius="md" bg="gray.900">
                                    <Stack direction={{ base: 'column', lg: 'row' }} gap={4} alignItems="flex-end">
                                        
                                        <Box flex={2} w="100%">
                                            <InvestorCombobox control={control} index={index} allInvestors={investors || []} />
                                        </Box>
                                        
                                        <Box flex={1} w="100%">
                                            <Field.Root>
                                                <Field.Label>Data da Aquisição</Field.Label>
                                                <Input type="date" bgColor={'gray.700'} borderColor="gray.600" {...register(`investors.${index}.acquisitionDate`)} />
                                            </Field.Root>
                                        </Box>

                                        <Field.Root w={{ base: '100%', lg: 'auto' }}>
                                            {fields.length > 1 && (
                                                <IconButton aria-label="Remover" colorScheme="red" variant="outline" w={{ base: '100%', lg: 'auto' }} onClick={() => remove(index)} > <Icon as={PiTrash} /> </IconButton>
                                            )}
                                        </Field.Root>

                                    </Stack>
                                </Box>
                            ))}
                            <Button size="sm" variant="outline" colorScheme="blue" onClick={() => append({ userId: "", share: 0 })} alignSelf="flex-start"> 
                                <Icon as={PiPlusCircle} /> Adicionar Cliente
                            </Button>
                        </VStack>

                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
                            <Field.Root invalid={!!errors.acquisitionValue} required>
                                <Field.Label>Custo Aquisição Total (R$)</Field.Label>
                                <Input bgColor={'gray.700'} borderColor={'gray.700'} type="number" step="0.01" {...register("acquisitionValue", { required: true, valueAsNumber: true })} />
                            </Field.Root>
                            <Field.Root invalid={!!errors.originalValue} required>
                                <Field.Label>Valor Original do Processo (R$)</Field.Label>
                                <Input bgColor={'gray.700'} borderColor={'gray.700'} type="number" step="0.01" {...register("originalValue", { required: true, valueAsNumber: true })} />
                            </Field.Root>
                            <Field.Root invalid={!!errors.acquisitionDate} required>
                                <Field.Label>Data Cessão (Mazzotini)</Field.Label>
                                <Input bgColor={'gray.700'} borderColor={'gray.700'} type="date" {...register("acquisitionDate", { required: true })} />
                            </Field.Root>
                        </SimpleGrid>

                         <Heading as="h2" size="md" borderBottomWidth="1px" borderColor="gray.700" pb={2} pt={4}>3. Correção</Heading>
                         <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                            <Controller name="updateIndexType" control={control} rules={{ required: "Selecione um índice" }} render={({ field }) => (
                                <Field.Root invalid={!!errors.updateIndexType} required>
                                    <Field.Label>Índice</Field.Label>
                                    <Select.Root collection={indexTypesCollection} value={field.value ? [field.value] : []} onValueChange={(d) => field.onChange(d.value[0])}>
                                        <Select.Control><Select.Trigger ref={field.ref} color={'white'} cursor={'pointer'} bgColor={'gray.700'} borderColor={'gray.600'}><Select.ValueText placeholder="Selecione..." /><PiCaretDownDuotone /></Select.Trigger></Select.Control>
                                        <Portal><Select.Positioner><Select.Content>{indexTypesCollection.items.map((i) => (<Select.Item key={i.value} item={i}>{i.label}</Select.Item>))}</Select.Content></Select.Positioner></Portal>
                                    </Select.Root>
                                </Field.Root>
                            )} />
                            <Field.Root>
                                <Field.Label>Taxa Adicional (% a.m.)</Field.Label>
                                <Input bgColor={'gray.700'} borderColor={'gray.700'} type="number" step="0.01" {...register("contractualIndexRate", { valueAsNumber: true })} />
                            </Field.Root>
                        </SimpleGrid>

                        <Button type="submit" color={'white'} bgColor={'brand.700'} size="lg" w={{ base: '100%', md: 'auto' }} alignSelf="flex-end" loading={isSubmitting} gap={2} mt={4}>
                            <Icon as={PiPlusCircle} /> Registrar Processo
                        </Button>
                    </Flex>
                </Flex>
            </VStack>
            <Toaster />
        </MotionFlex>
    );
}