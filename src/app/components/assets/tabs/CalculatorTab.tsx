'use client';

import {
    VStack, HStack, Flex, Box, Text, Heading, Button, Icon, Badge,
    Card, Input, Field, Select, Portal, createListCollection,
    Spinner, Table, Accordion,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import {
    PiCalculator, PiPlus, PiTrash, PiPlay, PiClockClockwise,
    PiCaretDownBold, PiCheckCircle, PiWarningCircle,
} from 'react-icons/pi';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { Toaster, toaster } from '@/components/ui/toaster';
import { useApi } from '@/hooks/useApi';
import { DetailedCreditAsset } from '@/app/processos/[legalOneId]/page';

// ── constantes ────────────────────────────────────────────────────────────────

const INDEX_OPTIONS = createListCollection({ items: [
    { label: 'TJSP — Lei 14.905 (INPC/IPCA-15)', value: 'TJSP_LEI14905' },
    { label: 'IPCA-E', value: 'IPCA_E' },
    { label: 'INPC',   value: 'INPC'   },
    { label: 'IPCA',   value: 'IPCA'   },
]});

const TYPE_OPTIONS = createListCollection({ items: [
    { label: 'Simples', value: 'SIMPLES' },
    { label: 'Composto', value: 'COMPOSTO' },
]});

const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const formatPct = (v: number) =>
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(v) + '%';

// ── tipos ─────────────────────────────────────────────────────────────────────

type DeductionPoint = 'DO_VALOR_CORRIGIDO' | 'APOS_HONORARIOS' | 'APOS_MULTA' | 'APOS_TUDO';

interface Installment {
    baseValue:      string;
    baseDate:       string;
    description:    string;
    type:           'DEBITO' | 'ABATIMENTO';
    deductionPoint: DeductionPoint;
}

const DEDUCTION_POINT_OPTIONS = createListCollection({ items: [
    { label: 'Do valor corrigido (antes dos honorários)', value: 'DO_VALOR_CORRIGIDO' },
    { label: 'Após os honorários advocatícios',           value: 'APOS_HONORARIOS'   },
    { label: 'Após a multa Art. 523',                     value: 'APOS_MULTA'        },
    { label: 'Após tudo (total final)',                   value: 'APOS_TUDO'         },
]});

interface FormValues {
    correctionIndex:        string;
    moratoryMode:           string;
    moratoryRate:           string;
    moratoryType:           string;
    moratoryStartDate:      string;
    compensatoryRate:       string;
    compensatoryType:       string;
    compensatoryStartDate:  string;
    feesPercentage:         string;
    penaltyPercentage:      string;
    penaltyStartDate:       string;
    feesOnPenalty:          boolean;
    installments:           Installment[];
    referenceMonth:         string;
}

interface CalcLog {
    id: string;
    calculatedAt: string;
    calculatedBy: string;
    referenceMonth: number;
    referenceYear: number;
    baseTotal: number;
    correctedValue: number;
    moratoryInterest: number;
    compensatoryInterest: number;
    feesValue: number;
    penaltyValue: number;
    totalValue: number;
    breakdown: any[];
}

interface AbatimentoResult {
    description:      string;
    baseDate:         string;
    baseValue:        number;
    correctionFactor: number;
    correctedValue:   number;
    deductionPoint:   DeductionPoint;
}

interface CalcResult {
    totalValue:           number;
    correctedValue:       number;
    moratoryInterest:     number;
    compensatoryInterest: number;
    subtotalA:            number;
    feesValue:            number;
    subtotalB:            number;
    penaltyValue:         number;
    grossTotal:           number;
    abatimentoResults:    AbatimentoResult[];
    abatimentoTotal:      number;
    baseTotal:            number;
    referenceMonth:       number;
    referenceYear:        number;
    installmentResults:   any[];
}

// ── componente principal ──────────────────────────────────────────────────────

interface TabProps { asset: DetailedCreditAsset; onRefresh: () => void; }

export function CalculatorTab({ asset, onRefresh }: TabProps) {
    const { getAccessTokenSilently } = useAuth0();
    const [calcResult, setCalcResult] = useState<CalcResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const { data: savedParams, mutate: mutateParams } = useApi<any>(
        `/api/calculator/${asset.legalOneId}/params`
    );
    const { data: logs, mutate: mutateLogs } = useApi<CalcLog[]>(
        `/api/calculator/${asset.legalOneId}/log?limit=5`
    );

    const { register, control, handleSubmit, reset, watch } = useForm<FormValues>({
        defaultValues: {
            correctionIndex:   savedParams?.correctionIndex   ?? 'TJSP_LEI14905',
            moratoryMode:      (savedParams as any)?.moratoryMode ?? 'TAXA_LEGAL',
            moratoryRate:      String(savedParams?.moratoryRate      ?? 1),
            moratoryType:      savedParams?.moratoryType      ?? 'SIMPLES',
            moratoryStartDate:      savedParams?.moratoryStartDate      ? savedParams.moratoryStartDate.substring(0, 10)      : '',
            compensatoryRate:       String(savedParams?.compensatoryRate  ?? 0),
            compensatoryType:       savedParams?.compensatoryType  ?? 'SIMPLES',
            compensatoryStartDate:  (savedParams as any)?.compensatoryStartDate ? (savedParams as any).compensatoryStartDate.substring(0, 10) : '',
            feesPercentage:         String(savedParams?.feesPercentage    ?? 10),
            penaltyPercentage:      String(savedParams?.penaltyPercentage ?? 10),
            penaltyStartDate:       (savedParams as any)?.penaltyStartDate ? (savedParams as any).penaltyStartDate.substring(0, 10) : '',
            feesOnPenalty:     savedParams?.feesOnPenalty     ?? false,
            referenceMonth:    '',
            installments: savedParams?.installments?.length
                ? savedParams.installments.map((i: any) => ({
                    baseValue:      String(i.baseValue),
                    baseDate:       i.baseDate?.substring(0, 10) ?? '',
                    description:    i.description ?? '',
                    type:           i.type ?? 'DEBITO',
                    deductionPoint: i.deductionPoint ?? 'APOS_TUDO',
                }))
                : [{ baseValue: '', baseDate: '', description: '', type: 'DEBITO', deductionPoint: 'APOS_TUDO' }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'installments' });
    const moratoryMode        = watch('moratoryMode');
    const watchedInstallments = watch('installments');

    const getToken = () => getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });

    const onSaveAndCalculate = async (data: FormValues) => {
        const parseBR = (s: string) => s.includes(',') ? parseFloat(s.replace(/\./g, '').replace(',', '.')) : parseFloat(s);

        const installments = data.installments
            .filter(i => i.baseValue && i.baseDate)
            .map(i => ({
                baseValue:      parseBR(i.baseValue),
                baseDate:       new Date(i.baseDate + 'T00:00:00Z').toISOString(),
                description:    i.description || undefined,
                type:           i.type,
                deductionPoint: i.type === 'ABATIMENTO' ? i.deductionPoint : undefined,
            }));

        if (installments.length === 0) {
            toaster.create({ title: 'Informe ao menos uma parcela com valor e data.', type: 'warning' });
            return;
        }

        const payload = {
            correctionIndex:   data.correctionIndex,
            moratoryMode:      data.moratoryMode,
            moratoryRate:      parseFloat(data.moratoryRate   || '0'),
            moratoryType:      data.moratoryType,
            moratoryStartDate:     data.moratoryStartDate     || null,
            compensatoryRate:      parseFloat(data.compensatoryRate || '0'),
            compensatoryType:      data.compensatoryType   || 'SIMPLES',
            compensatoryStartDate: data.compensatoryStartDate || null,
            feesPercentage:        parseFloat(data.feesPercentage || '0'),
            penaltyPercentage:     parseFloat(data.penaltyPercentage || '0'),
            penaltyStartDate:      data.penaltyStartDate || null,
            feesOnPenalty:     data.feesOnPenalty,
            installments,
        };

        setIsSaving(true);
        try {
            const token = await getToken();
            await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/calculator/${asset.legalOneId}/params`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            mutateParams();
            toaster.create({ title: 'Parâmetros salvos.', type: 'success' });
        } catch (e: any) {
            toaster.create({ title: e?.response?.data?.error || 'Erro ao salvar parâmetros.', type: 'error' });
            setIsSaving(false); return;
        } finally { setIsSaving(false); }

        setIsCalculating(true);
        try {
            const token = await getToken();
            const refBody: Record<string, number> = {};
            if (data.referenceMonth) {
                const [ry, rm] = data.referenceMonth.split('-').map(Number);
                refBody.referenceYear  = ry;
                refBody.referenceMonth = rm;
            }
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/calculator/${asset.legalOneId}/calculate`, refBody, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCalcResult(res.data);
            mutateLogs();
            onRefresh();
            toaster.create({ title: 'Cálculo realizado com sucesso!', type: 'success' });
        } catch (e: any) {
            toaster.create({ title: e?.response?.data?.error || 'Erro ao calcular.', type: 'error' });
        } finally { setIsCalculating(false); }
    };

    return (
        <VStack gap={6} align="stretch" w="100%">
            <Toaster />

            {/* ── FORMULÁRIO DE PARÂMETROS ── */}
            <Card.Root bg="gray.900" border="1px solid" borderColor="gray.700">
                <Card.Body>
                    <Flex align="center" gap={2} mb={4}>
                        <Icon as={PiCalculator} color="brand.400" boxSize={5} />
                        <Heading size="sm" color="brand.300" textTransform="uppercase" letterSpacing="wider">
                            Parâmetros do Cálculo
                        </Heading>
                        {savedParams?.lastCalculatedAt && (
                            <Badge colorPalette="green" size="sm" ml="auto" gap={1}>
                                <Icon as={PiCheckCircle} boxSize={3} />
                                Último cálculo: {new Date(savedParams.lastCalculatedAt).toLocaleDateString('pt-BR')}
                                {' — '}{formatBRL(savedParams.lastCalculatedValue ?? 0)}
                            </Badge>
                        )}
                    </Flex>

                    <form onSubmit={handleSubmit(onSaveAndCalculate)}>
                        <VStack align="stretch" gap={5}>
                            {/* Índice de Correção */}
                            <Field.Root>
                                <Field.Label fontSize="sm">Índice de Correção Monetária</Field.Label>
                                <Controller name="correctionIndex" control={control} render={({ field }) => (
                                    <Select.Root
                                        collection={INDEX_OPTIONS}
                                        value={field.value ? [field.value] : []}
                                        onValueChange={e => field.onChange(e.value[0])}
                                        size="sm"
                                    >
                                        <Select.HiddenSelect />
                                        <Select.Control>
                                            <Select.Trigger bg="gray.800" borderColor="gray.600">
                                                <Select.ValueText placeholder="Selecione o índice" />
                                            </Select.Trigger>
                                        </Select.Control>
                                        <Portal>
                                            <Select.Positioner>
                                                <Select.Content bg="gray.800" borderColor="gray.600">
                                                    {INDEX_OPTIONS.items.map(i => (
                                                        <Select.Item key={i.value} item={i}>
                                                            <Select.ItemText>{i.label}</Select.ItemText>
                                                            <Select.ItemIndicator />
                                                        </Select.Item>
                                                    ))}
                                                </Select.Content>
                                            </Select.Positioner>
                                        </Portal>
                                    </Select.Root>
                                )} />
                            </Field.Root>

                            {/* Juros Moratórios */}
                            <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
                                <Text fontSize="xs" fontWeight="semibold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={3}>
                                    Juros Moratórios
                                </Text>
                                <Controller name="moratoryMode" control={control} render={({ field }) => (
                                    <HStack gap={1} mb={3}>
                                        <Button size="sm" type="button"
                                            variant={field.value === 'TAXA_LEGAL' ? 'solid' : 'ghost'}
                                            colorPalette="brand"
                                            onClick={() => field.onChange('TAXA_LEGAL')}
                                        >
                                            Taxa Legal (art. 406/CC)
                                        </Button>
                                        <Button size="sm" type="button"
                                            variant={field.value === 'PERSONALIZADO' ? 'solid' : 'ghost'}
                                            colorPalette="gray"
                                            onClick={() => field.onChange('PERSONALIZADO')}
                                        >
                                            Personalizado
                                        </Button>
                                    </HStack>
                                )} />
                                {moratoryMode === 'TAXA_LEGAL' ? (
                                    <Box p={3} bg="gray.900" borderRadius="md" border="1px dashed" borderColor="brand.700/50" mb={3}>
                                        <Text fontSize="xs" color="brand.300" fontWeight="medium" mb={1}>Aplicação automática por período (art. 406 CC):</Text>
                                        <Text fontSize="xs" color="gray.400">• Até jan/2003 — 6% a.a. (0,5%/mês)</Text>
                                        <Text fontSize="xs" color="gray.400">• Fev/2003 a ago/2024 — 12% a.a. (1%/mês)</Text>
                                        <Text fontSize="xs" color="gray.400">• Set/2024 em diante — SELIC − IPCA mensal (Lei 14.905)</Text>
                                    </Box>
                                ) : (
                                    <HStack gap={4} wrap="wrap" mb={3}>
                                        <Field.Root flex={1} minW="160px">
                                            <Field.Label fontSize="sm">Taxa (% a.m.)</Field.Label>
                                            <Input {...register('moratoryRate')} type="number" step="0.01" size="sm" bg="gray.900" borderColor="gray.600" />
                                        </Field.Root>
                                        <Field.Root flex={1} minW="140px">
                                            <Field.Label fontSize="sm">Tipo</Field.Label>
                                            <Controller name="moratoryType" control={control} render={({ field }) => (
                                                <Select.Root collection={TYPE_OPTIONS} value={[field.value]} onValueChange={e => field.onChange(e.value[0])} size="sm">
                                                    <Select.HiddenSelect />
                                                    <Select.Control><Select.Trigger bg="gray.900" borderColor="gray.600"><Select.ValueText /></Select.Trigger></Select.Control>
                                                    <Portal><Select.Positioner><Select.Content bg="gray.800" borderColor="gray.600">
                                                        {TYPE_OPTIONS.items.map(i => (<Select.Item key={i.value} item={i} _hover={{ bg: 'gray.600' }} _highlighted={{ bg: 'gray.600' }}><Select.ItemText>{i.label}</Select.ItemText><Select.ItemIndicator /></Select.Item>))}
                                                    </Select.Content></Select.Positioner></Portal>
                                                </Select.Root>
                                            )} />
                                        </Field.Root>
                                    </HStack>
                                )}
                                <Field.Root>
                                    <Field.Label fontSize="sm" color="gray.400">
                                        Calcular juros a partir de <Text as="span" color="gray.500" fontSize="xs">(vazio = data base de cada parcela)</Text>
                                    </Field.Label>
                                    <Input {...register('moratoryStartDate')} type="date" size="sm" bg="gray.900" borderColor="gray.600"
                                        max={new Date().toISOString().substring(0, 10)} />
                                </Field.Root>
                            </Box>

                            {/* Juros Remuneratórios */}
                            <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
                                <Text fontSize="xs" fontWeight="semibold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={3}>
                                    Juros Remuneratórios
                                </Text>
                                <HStack gap={4} wrap="wrap" mb={3}>
                                    <Field.Root flex={1} minW="160px">
                                        <Field.Label fontSize="sm">Taxa (% a.m.) — 0 = não aplicar</Field.Label>
                                        <Input {...register('compensatoryRate')} type="number" step="0.01" size="sm" bg="gray.900" borderColor="gray.600" placeholder="0" />
                                    </Field.Root>
                                    <Field.Root flex={1} minW="140px">
                                        <Field.Label fontSize="sm">Tipo</Field.Label>
                                        <Controller name="compensatoryType" control={control} render={({ field }) => (
                                            <Select.Root collection={TYPE_OPTIONS} value={field.value ? [field.value] : ['SIMPLES']} onValueChange={e => field.onChange(e.value[0])} size="sm">
                                                <Select.HiddenSelect />
                                                <Select.Control><Select.Trigger bg="gray.900" borderColor="gray.600"><Select.ValueText /></Select.Trigger></Select.Control>
                                                <Portal><Select.Positioner><Select.Content bg="gray.800" borderColor="gray.600">
                                                    {TYPE_OPTIONS.items.map(i => (<Select.Item key={i.value} item={i} _hover={{ bg: 'gray.600' }} _highlighted={{ bg: 'gray.600' }}><Select.ItemText>{i.label}</Select.ItemText><Select.ItemIndicator /></Select.Item>))}
                                                </Select.Content></Select.Positioner></Portal>
                                            </Select.Root>
                                        )} />
                                    </Field.Root>
                                </HStack>
                                <Field.Root>
                                    <Field.Label fontSize="sm" color="gray.400">
                                        Calcular a partir de <Text as="span" color="gray.500" fontSize="xs">(vazio = data base de cada parcela)</Text>
                                    </Field.Label>
                                    <Input {...register('compensatoryStartDate')} type="date" size="sm" bg="gray.900" borderColor="gray.600"
                                        max={new Date().toISOString().substring(0, 10)} />
                                </Field.Root>
                            </Box>

                            {/* Honorários e Multa */}
                            <HStack gap={4} wrap="wrap">
                                <Field.Root flex={1} minW="160px">
                                    <Field.Label fontSize="sm">Honorários Advocatícios (%)</Field.Label>
                                    <Input {...register('feesPercentage')} type="number" step="0.01" size="sm" bg="gray.800" borderColor="gray.600" />
                                </Field.Root>
                                <Field.Root flex={1} minW="160px">
                                    <Field.Label fontSize="sm">HO e multa Art. 523 (%)</Field.Label>
                                    <Input {...register('penaltyPercentage')} type="number" step="0.01" size="sm" bg="gray.800" borderColor="gray.600" />
                                </Field.Root>
                                <Field.Root flex={1} minW="160px">
                                    <Field.Label fontSize="sm" color="gray.400">
                                        Art. 523 vigente a partir de <Text as="span" color="gray.500" fontSize="xs">(vazio = sempre)</Text>
                                    </Field.Label>
                                    <Input {...register('penaltyStartDate')} type="date" size="sm" bg="gray.800" borderColor="gray.600"
                                        max={new Date().toISOString().substring(0, 10)} />
                                </Field.Root>
                            </HStack>

                            {/* Parcelas */}
                            <Box>
                                <Flex justify="space-between" align="center" mb={3}>
                                    <Text fontSize="sm" fontWeight="semibold" color="gray.300">
                                        Parcelas do Valor Base
                                    </Text>
                                    <Button size="xs" variant="outline" colorPalette="brand" gap={1}
                                        type="button"
                                        onClick={() => append({ baseValue: '', baseDate: '', description: '', type: 'DEBITO', deductionPoint: 'APOS_TUDO' })}>
                                        <Icon as={PiPlus} /> Adicionar Parcela
                                    </Button>
                                </Flex>
                                <VStack align="stretch" gap={2}>
                                    {fields.map((field, idx) => {
                                        const isAbatimento = watchedInstallments[idx]?.type === 'ABATIMENTO';
                                        return (
                                            <Box
                                                key={field.id}
                                                borderRadius="md"
                                                border="1px solid"
                                                borderColor={isAbatimento ? 'orange.700' : 'gray.700'}
                                                overflow="hidden"
                                            >
                                                {/* Header com toggle e botão remover */}
                                                <Flex
                                                    align="center" justify="space-between"
                                                    px={3} py={2}
                                                    bg={isAbatimento ? 'orange.900' : 'gray.750'}
                                                    borderBottom="1px solid"
                                                    borderColor={isAbatimento ? 'orange.700' : 'gray.700'}
                                                >
                                                    <Controller name={`installments.${idx}.type`} control={control} render={({ field: f }) => (
                                                        <HStack gap={1}>
                                                            <Button
                                                                size="xs" type="button"
                                                                variant={f.value === 'DEBITO' ? 'solid' : 'ghost'}
                                                                colorPalette="gray"
                                                                onClick={() => f.onChange('DEBITO')}
                                                            >
                                                                Débito
                                                            </Button>
                                                            <Button
                                                                size="xs" type="button"
                                                                variant={f.value === 'ABATIMENTO' ? 'solid' : 'ghost'}
                                                                colorPalette={f.value === 'ABATIMENTO' ? 'orange' : 'gray'}
                                                                onClick={() => f.onChange('ABATIMENTO')}
                                                            >
                                                                Abatimento
                                                            </Button>
                                                        </HStack>
                                                    )} />
                                                    {fields.length > 1 && (
                                                        <Button size="xs" variant="ghost" colorPalette="red" type="button" onClick={() => remove(idx)}>
                                                            <Icon as={PiTrash} />
                                                        </Button>
                                                    )}
                                                </Flex>

                                                {/* Campos */}
                                                <Flex gap={2} align="flex-end" wrap="wrap" p={3}
                                                    bg={isAbatimento ? 'orange.950' : 'gray.800'}>
                                                    <Field.Root flex={2} minW="140px">
                                                        <Field.Label fontSize="xs" color={isAbatimento ? 'orange.300' : 'gray.400'}>
                                                            {isAbatimento ? 'Valor (R$)' : 'Valor Base (R$)'}
                                                        </Field.Label>
                                                        <Input {...register(`installments.${idx}.baseValue`)} size="sm"
                                                            bg="gray.900" borderColor={isAbatimento ? 'orange.800' : 'gray.600'}
                                                            placeholder="1.150.972,30" />
                                                    </Field.Root>
                                                    <Field.Root flex={1} minW="130px">
                                                        <Field.Label fontSize="xs" color={isAbatimento ? 'orange.300' : 'gray.400'}>
                                                            {isAbatimento ? 'Data' : 'Data Base'}
                                                        </Field.Label>
                                                        <Input {...register(`installments.${idx}.baseDate`)} type="date" size="sm"
                                                            bg="gray.900" borderColor={isAbatimento ? 'orange.800' : 'gray.600'} />
                                                    </Field.Root>
                                                    <Field.Root flex={2} minW="140px">
                                                        <Field.Label fontSize="xs" color="gray.400">Descrição (opcional)</Field.Label>
                                                        <Input {...register(`installments.${idx}.description`)} size="sm"
                                                            bg="gray.900" borderColor={isAbatimento ? 'orange.800' : 'gray.600'}
                                                            placeholder={isAbatimento ? 'Ex: Depósito em cartório' : 'Ex: Condenação principal'} />
                                                    </Field.Root>
                                                    {isAbatimento && (
                                                        <Field.Root flex={2} minW="180px">
                                                            <Field.Label fontSize="xs" color="orange.300">Ponto de Dedução</Field.Label>
                                                            <Controller name={`installments.${idx}.deductionPoint`} control={control} render={({ field: f }) => (
                                                                <Select.Root
                                                                    collection={DEDUCTION_POINT_OPTIONS}
                                                                    value={f.value ? [f.value] : ['APOS_TUDO']}
                                                                    onValueChange={e => f.onChange(e.value[0])}
                                                                    size="sm"
                                                                >
                                                                    <Select.HiddenSelect />
                                                                    <Select.Control>
                                                                        <Select.Trigger bg="gray.900" borderColor="orange.800">
                                                                            <Select.ValueText />
                                                                        </Select.Trigger>
                                                                    </Select.Control>
                                                                    <Portal>
                                                                        <Select.Positioner>
                                                                            <Select.Content bg="gray.800" borderColor="gray.600">
                                                                                {DEDUCTION_POINT_OPTIONS.items.map(i => (
                                                                                    <Select.Item key={i.value} item={i} _hover={{ bg: 'gray.600' }} _highlighted={{ bg: 'gray.600' }}>
                                                                                        <Select.ItemText>{i.label}</Select.ItemText>
                                                                                        <Select.ItemIndicator />
                                                                                    </Select.Item>
                                                                                ))}
                                                                            </Select.Content>
                                                                        </Select.Positioner>
                                                                    </Portal>
                                                                </Select.Root>
                                                            )} />
                                                        </Field.Root>
                                                    )}
                                                </Flex>
                                            </Box>
                                        );
                                    })}
                                </VStack>
                            </Box>

                            {/* Mês de referência */}
                            <HStack gap={3} align="flex-end" p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
                                <Field.Root flex={1}>
                                    <Field.Label fontSize="sm">Mês de Referência</Field.Label>
                                    <Input
                                        {...register('referenceMonth')}
                                        type="month"
                                        size="sm"
                                        bg="gray.900"
                                        borderColor="gray.600"
                                        max={new Date().toISOString().substring(0, 7)}
                                    />
                                </Field.Root>
                                <Text fontSize="xs" color="gray.500" pb={1}>
                                    Vazio = mês atual. Use o último mês fechado para máxima precisão.
                                </Text>
                            </HStack>

                            <Button type="submit" colorPalette="brand" size="md" loading={isSaving || isCalculating} gap={2}>
                                <Icon as={PiPlay} />
                                {isSaving ? 'Salvando parâmetros...' : isCalculating ? 'Calculando...' : 'Salvar e Calcular'}
                            </Button>
                        </VStack>
                    </form>
                </Card.Body>
            </Card.Root>

            {/* ── RESULTADO DO ÚLTIMO CÁLCULO ── */}
            {calcResult && (
                <Card.Root bg="gray.900" border="1px solid" borderColor="brand.700">
                    <Card.Body>
                        <HStack mb={4} justify="space-between" align="center">
                            <Heading size="sm" color="brand.300" textTransform="uppercase" letterSpacing="wider">
                                Resultado do Cálculo
                            </Heading>
                            {calcResult.referenceMonth && calcResult.referenceYear && (
                                <Badge colorPalette="brand" variant="outline" fontSize="xs">
                                    Referência: {String(calcResult.referenceMonth).padStart(2, '0')}/{calcResult.referenceYear}
                                </Badge>
                            )}
                        </HStack>
                        <Flex gap={4} wrap="wrap" mb={4}>
                            {[
                                { label: 'Valor Base',             value: calcResult.baseTotal },
                                { label: 'Valor Corrigido',        value: calcResult.correctedValue },
                                { label: 'Juros Moratórios',       value: calcResult.moratoryInterest },
                                ...(calcResult.compensatoryInterest > 0
                                    ? [{ label: 'Juros Remuneratórios', value: calcResult.compensatoryInterest }]
                                    : []),
                                { label: 'Honorários',             value: calcResult.feesValue },
                                { label: 'Multa Art. 523',         value: calcResult.penaltyValue },
                            ].map(item => (
                                <Box key={item.label} flex={1} minW="140px" p={3} bg="gray.800" borderRadius="md">
                                    <Text fontSize="xs" color="gray.500" mb={1}>{item.label}</Text>
                                    <Text fontWeight="bold" fontSize="sm">{formatBRL(item.value)}</Text>
                                </Box>
                            ))}
                        </Flex>

                        {/* Abatimentos */}
                        {calcResult.abatimentoResults?.length > 0 && (
                            <Box mb={4} p={3} bg="orange.950" borderRadius="md" border="1px solid" borderColor="orange.700">
                                <Text fontSize="xs" fontWeight="semibold" color="orange.300" textTransform="uppercase" letterSpacing="wider" mb={2}>
                                    Abatimentos / Descontos
                                </Text>
                                <VStack align="stretch" gap={1} mb={2}>
                                    {calcResult.abatimentoResults.map((ab, i) => (
                                        <Flex key={i} justify="space-between" align="center" py={1}
                                            borderBottom="1px solid" borderColor="orange.900/60">
                                            <Box>
                                                <Text fontSize="sm" color="orange.100">{ab.description}</Text>
                                                <Text fontSize="xs" color="orange.400">
                                                    Base: {formatBRL(ab.baseValue)} — {new Date(ab.baseDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                    {' · '}×{ab.correctionFactor.toFixed(6)}
                                                    {' · '}{DEDUCTION_POINT_OPTIONS.items.find(o => o.value === ab.deductionPoint)?.label}
                                                </Text>
                                            </Box>
                                            <Text fontSize="sm" fontWeight="bold" color="orange.300">
                                                − {formatBRL(ab.correctedValue)}
                                            </Text>
                                        </Flex>
                                    ))}
                                </VStack>
                                <Flex justify="space-between">
                                    <Text fontSize="xs" color="orange.400">Total deduzido (atualizado)</Text>
                                    <Text fontSize="sm" fontWeight="bold" color="orange.300">− {formatBRL(calcResult.abatimentoTotal)}</Text>
                                </Flex>
                            </Box>
                        )}

                        {calcResult.abatimentoResults?.length > 0 && (
                            <Flex gap={4} mb={4} wrap="wrap">
                                <Box flex={1} minW="160px" p={3} bg="gray.800" borderRadius="md">
                                    <Text fontSize="xs" color="gray.500" mb={1}>Subtotal bruto (antes deduções)</Text>
                                    <Text fontWeight="bold" fontSize="sm">{formatBRL(calcResult.grossTotal)}</Text>
                                </Box>
                                <Box flex={1} minW="160px" p={3} bg="orange.950" borderRadius="md" border="1px solid" borderColor="orange.700">
                                    <Text fontSize="xs" color="orange.400" mb={1}>Total abatimentos (atualizado)</Text>
                                    <Text fontWeight="bold" fontSize="sm" color="orange.300">− {formatBRL(calcResult.abatimentoTotal)}</Text>
                                </Box>
                            </Flex>
                        )}

                        <Box p={4} bg="brand.900/30" borderRadius="md" border="1px solid" borderColor="brand.700">
                            <Text fontSize="xs" color="brand.400" mb={1}>TOTAL GERAL</Text>
                            <Text fontSize="2xl" fontWeight="black" color="brand.300">{formatBRL(calcResult.totalValue)}</Text>
                        </Box>

                        {/* Detalhamento por parcela */}
                        {calcResult.installmentResults?.length > 0 && (
                            <Box mt={4}>
                                <Text fontSize="sm" fontWeight="semibold" color="gray.400" mb={2}>Detalhamento por Parcela</Text>
                                <Accordion.Root multiple collapsible variant="plain" spaceY={1}>
                                    {calcResult.installmentResults.map((inst: any) => (
                                        <Accordion.Item key={inst.installmentIndex} value={String(inst.installmentIndex)}
                                            border="1px solid" borderColor="gray.700" borderRadius="md" overflow="hidden">
                                            <Accordion.ItemTrigger px={4} py={2} bg="gray.800" _hover={{ bg: 'gray.750' }}>
                                                <Flex justify="space-between" w="100%" align="center">
                                                    <Text fontSize="sm">{inst.description} — Base: {formatBRL(inst.baseValue)}</Text>
                                                    <HStack gap={3}>
                                                        <Text fontSize="sm" fontWeight="bold" color="brand.300">{formatBRL(inst.subtotal)}</Text>
                                                        <Accordion.ItemIndicator><Icon as={PiCaretDownBold} boxSize={3} color="gray.500" /></Accordion.ItemIndicator>
                                                    </HStack>
                                                </Flex>
                                            </Accordion.ItemTrigger>
                                            <Accordion.ItemContent px={4} py={3} bg="blackAlpha.400">
                                                <Flex gap={3} wrap="wrap" mb={3}>
                                                    {[
                                                        { l: 'Fator de Correção', v: `×${inst.correctionFactor.toFixed(6)}` },
                                                        { l: 'Valor Corrigido', v: formatBRL(inst.correctedValue) },
                                                        { l: `Juros (${inst.moratoryMonths} meses)`, v: formatBRL(inst.moratoryInterest) },
                                                        { l: 'Honorários', v: formatBRL(inst.feesValue) },
                                                        { l: 'Multa', v: formatBRL(inst.penaltyValue) },
                                                    ].map(item => (
                                                        <Box key={item.l} p={2} bg="gray.800" borderRadius="sm" minW="120px">
                                                            <Text fontSize="xs" color="gray.500">{item.l}</Text>
                                                            <Text fontSize="sm" fontWeight="semibold">{item.v}</Text>
                                                        </Box>
                                                    ))}
                                                </Flex>
                                                {/* Tabela de índices mês a mês */}
                                                {inst.monthBreakdown?.length > 0 && (
                                                    <Box maxH="200px" overflowY="auto">
                                                        <Table.Root size="sm" variant="line">
                                                            <Table.Header>
                                                                <Table.Row bg="gray.800" borderColor="gray.700">
                                                                    <Table.ColumnHeader color="brand.400" px={3}>Mês/Ano</Table.ColumnHeader>
                                                                    <Table.ColumnHeader color="brand.400" px={3} textAlign="right">Taxa Mensal</Table.ColumnHeader>
                                                                    <Table.ColumnHeader color="brand.400" px={3} textAlign="right">Fator Acumulado</Table.ColumnHeader>
                                                                </Table.Row>
                                                            </Table.Header>
                                                            <Table.Body>
                                                                {inst.monthBreakdown.map((row: any) => (
                                                                    <Table.Row key={`${row.year}-${row.month}`} borderColor="gray.700" _hover={{ bg: 'whiteAlpha.50' }}>
                                                                        <Table.Cell px={3} py={1} fontSize="xs">
                                                                            {String(row.month).padStart(2, '0')}/{row.year}
                                                                        </Table.Cell>
                                                                        <Table.Cell px={3} py={1} fontSize="xs" textAlign="right" color={row.monthlyRate === 0 ? 'gray.600' : 'white'}>
                                                                            {row.monthlyRate === 0 ? '—' : formatPct(row.monthlyRate)}
                                                                        </Table.Cell>
                                                                        <Table.Cell px={3} py={1} fontSize="xs" textAlign="right" fontFamily="mono">
                                                                            {row.accumulated.toFixed(6)}
                                                                        </Table.Cell>
                                                                    </Table.Row>
                                                                ))}
                                                            </Table.Body>
                                                        </Table.Root>
                                                    </Box>
                                                )}
                                            </Accordion.ItemContent>
                                        </Accordion.Item>
                                    ))}
                                </Accordion.Root>
                            </Box>
                        )}
                    </Card.Body>
                </Card.Root>
            )}

            {/* ── HISTÓRICO DE CÁLCULOS ── */}
            {logs && logs.length > 0 && (
                <Card.Root bg="gray.900" border="1px solid" borderColor="gray.700">
                    <Card.Body>
                        <Flex align="center" gap={2} mb={4}>
                            <Icon as={PiClockClockwise} color="gray.400" boxSize={4} />
                            <Text fontSize="sm" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">
                                Histórico de Cálculos
                            </Text>
                        </Flex>
                        <Box overflowX="auto">
                            <Table.Root size="sm" variant="line">
                                <Table.Header>
                                    <Table.Row bg="gray.800" borderColor="gray.700">
                                        <Table.ColumnHeader color="brand.400" px={4}>Referência</Table.ColumnHeader>
                                        <Table.ColumnHeader color="brand.400" px={4}>Calculado em</Table.ColumnHeader>
                                        <Table.ColumnHeader color="brand.400" px={4}>Por</Table.ColumnHeader>
                                        <Table.ColumnHeader color="brand.400" px={4} textAlign="right">Valor Corrigido</Table.ColumnHeader>
                                        <Table.ColumnHeader color="brand.400" px={4} textAlign="right">Total Geral</Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {logs.map(log => (
                                        <Table.Row key={log.id} borderColor="gray.700" _hover={{ bg: 'whiteAlpha.50' }}>
                                            <Table.Cell px={4} py={3} fontSize="sm" fontWeight="semibold">
                                                {String(log.referenceMonth).padStart(2, '0')}/{log.referenceYear}
                                            </Table.Cell>
                                            <Table.Cell px={4} py={3} fontSize="sm" color="gray.400">
                                                {new Date(log.calculatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                                            </Table.Cell>
                                            <Table.Cell px={4} py={3}>
                                                <Badge colorPalette={log.calculatedBy === 'cron' ? 'gray' : 'blue'} variant="outline" size="xs">
                                                    {log.calculatedBy === 'cron' ? 'Automático' : 'Manual'}
                                                </Badge>
                                            </Table.Cell>
                                            <Table.Cell px={4} py={3} fontSize="sm" textAlign="right">{formatBRL(log.correctedValue)}</Table.Cell>
                                            <Table.Cell px={4} py={3} textAlign="right">
                                                <Text fontSize="sm" fontWeight="bold" color="brand.300">{formatBRL(log.totalValue)}</Text>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        </Box>
                    </Card.Body>
                </Card.Root>
            )}
        </VStack>
    );
}
