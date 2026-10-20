'use client';

import {
    VStack, HStack, Flex, Box, Text, Heading, Button, Icon, Badge,
    Card, Input, Field, Select, Portal, createListCollection,
    Spinner, Table, Accordion, Textarea,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { useForm, Controller, useFieldArray, useController } from 'react-hook-form';
import {
    PiCalculator, PiPlus, PiTrash, PiPlay, PiClockClockwise,
    PiCaretDownBold, PiCheckCircle, PiRows, PiClipboardText, PiArrowCounterClockwise,
} from 'react-icons/pi';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { Toaster, toaster } from '@/components/ui/toaster';
import { useApi } from '@/hooks/useApi';
import { CALCULATOR_INDEXES } from '@/utils/indexOptions';
import {
    CalcDraft, DeductionPoint, EMPTY_INSTALLMENT, parseDisplayDate, toDisplayDate, toDrafts, toPayload,
} from '@/utils/calculationForm';
import { DetailedCreditAsset } from '@/app/processos/[legalOneId]/page';

// ── constantes ────────────────────────────────────────────────────────────────

const INDEX_OPTIONS = createListCollection({ items: CALCULATOR_INDEXES });

const TYPE_OPTIONS = createListCollection({ items: [
    { label: 'Simples',  value: 'SIMPLES'  },
    { label: 'Composto', value: 'COMPOSTO' },
]});

const PERIOD_OPTIONS = createListCollection({ items: [
    { label: 'Mensal',      value: 'MENSAL'      },
    { label: 'Bimestral',   value: 'BIMESTRAL'   },
    { label: 'Trimestral',  value: 'TRIMESTRAL'  },
    { label: 'Semestral',   value: 'SEMESTRAL'   },
    { label: 'Anual',       value: 'ANUAL'       },
]});

const PERIOD_MONTHS: Record<string, number> = {
    MENSAL: 1, BIMESTRAL: 2, TRIMESTRAL: 3, SEMESTRAL: 6, ANUAL: 12,
};

const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const formatPct = (v: number) =>
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(v) + '%';

// ── helpers de data ───────────────────────────────────────────────────────────

// Máscara DD/MM/AAAA — aplica barras automaticamente
const applyDateMask = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MaskedDateInput = ({ fieldName, control, ...inputProps }: { fieldName: any; control: any; [k: string]: any }) => {
    const { field } = useController({ name: fieldName, control });
    return (
        <Input
            value={field.value || ''}
            onChange={e => field.onChange(applyDateMask(e.target.value))}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
            type="text"
            placeholder="DD/MM/AAAA"
            autoComplete="off"
            {...inputProps}
        />
    );
};

// Adiciona N meses a uma data ISO
const addMonths = (isoDate: string, n: number): string => {
    const [y, m, d] = isoDate.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1 + n, d));
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
};

// ── tipos ─────────────────────────────────────────────────────────────────────

const DEDUCTION_POINT_OPTIONS = createListCollection({ items: [
    { label: 'Do valor corrigido (antes dos honorários)', value: 'DO_VALOR_CORRIGIDO' },
    { label: 'Após os honorários advocatícios',           value: 'APOS_HONORARIOS'   },
    { label: 'Após a multa Art. 523',                     value: 'APOS_MULTA'        },
    { label: 'Após tudo (total final)',                   value: 'APOS_TUDO'         },
]});

// O formulário edita um dos cálculos do processo; o mês de referência vale para todos
type FormValues = CalcDraft & { referenceMonth: string };

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
    paramsSnapshot?: any;
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
    multaValue:           number;
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
    calculations?:        { label: string; baseTotal: number; correctedValue: number; totalValue: number }[];
}

// ── componente principal ──────────────────────────────────────────────────────

interface TabProps { asset: DetailedCreditAsset; onRefresh: () => void; }

export function CalculatorTab({ asset, onRefresh }: TabProps) {
    const { getAccessTokenSilently } = useAuth0();
    const [calcResult, setCalcResult]     = useState<CalcResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isSaving, setIsSaving]         = useState(false);
    const hasInitialized                  = useRef(false);

    // Vários cálculos no mesmo processo: o formulário edita o cálculo aberto (activeIdx), e
    // `drafts` guarda todos. O cálculo aberto em `drafts` só é atualizado ao trocar ou salvar.
    const [drafts, setDrafts]       = useState<CalcDraft[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);

    // ── reabrir cálculo do histórico ──────────────────────────────────────────
    const reopenFromLog = (snapshot: any) => {
        if (!snapshot) return;
        hasInitialized.current = true; // impede o useEffect de sobrescrever
        const all = toDrafts(snapshot);
        setDrafts(all);
        setActiveIdx(0);
        reset({ ...all[0], referenceMonth: '' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toaster.create({ title: 'Parâmetros carregados. Ajuste o que precisar e salve.', type: 'info' });
    };

    // ── bulk generator state ──────────────────────────────────────────────────
    const [bulkOpen,      setBulkOpen]      = useState(false);
    const [bulkStartDate, setBulkStartDate] = useState('');
    const [bulkPeriod,    setBulkPeriod]    = useState('MENSAL');
    const [bulkCount,     setBulkCount]     = useState('12');
    const [bulkValue,     setBulkValue]     = useState('');
    const [bulkDesc,      setBulkDesc]      = useState('');
    const [pasteText,     setPasteText]     = useState('');
    const [pasteOpen,     setPasteOpen]     = useState(false);

    const PERIOD_COLLECTION = PERIOD_OPTIONS;

    const { data: savedParams, mutate: mutateParams } = useApi<any>(
        `/api/calculator/${asset.legalOneId}/params`
    );
    const { data: logs, mutate: mutateLogs } = useApi<CalcLog[]>(
        `/api/calculator/${asset.legalOneId}/log?limit=5`
    );

    const { register, control, handleSubmit, reset, watch, getValues } = useForm<FormValues>({
        defaultValues: {
            label:                'Cálculo 1',
            correctionIndex:      'TJSP_LEI14905',
            moratoryMode:         'TAXA_LEGAL',
            moratoryRate:         '1',
            moratoryRateUnit:     'AM',
            moratoryType:         'SIMPLES',
            moratoryStartDate:    '',
            compensatoryRate:     '0',
            compensatoryRateUnit: 'AM',
            compensatoryType:     'SIMPLES',
            compensatoryStartDate: '',
            multaPercentage:      '0',
            feesMode:             'PERCENTUAL',
            feesPercentage:       '10',
            feesFixedValue:       '0',
            penaltyPercentage:    '10',
            feesOnPenalty:        false,
            referenceMonth:       '',
            installments: [{ baseValue: '', baseDate: '', description: '', type: 'DEBITO', deductionPoint: 'APOS_TUDO' }],
        },
    });

    // ── Feature 6: popula form quando savedParams carrega ─────────────────────
    useEffect(() => {
        if (!savedParams || hasInitialized.current) return;
        hasInitialized.current = true;
        const all = toDrafts(savedParams);
        setDrafts(all);
        setActiveIdx(0);
        reset({ ...all[0], referenceMonth: '' });
    }, [savedParams, reset]);

    const { fields, append, remove } = useFieldArray({ control, name: 'installments' });
    const moratoryMode        = watch('moratoryMode');
    const feesMode            = watch('feesMode');
    const moratoryRateUnit    = watch('moratoryRateUnit');
    const compensatoryRateUnit = watch('compensatoryRateUnit');
    const watchedInstallments = watch('installments');
    const activeLabel         = watch('label');

    // ── vários cálculos no mesmo processo ─────────────────────────────────────
    /** Todos os cálculos, com o que está no formulário no lugar do cálculo aberto. */
    const currentDrafts = (): CalcDraft[] => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { referenceMonth, ...draft } = getValues();
        const list = drafts.length > 0 ? [...drafts] : [draft];
        list[activeIdx] = draft;
        return list;
    };

    const switchTo = (idx: number, list: CalcDraft[] = currentDrafts()) => {
        const referenceMonth = getValues('referenceMonth');
        setDrafts(list);
        setActiveIdx(idx);
        reset({ ...list[idx], referenceMonth });
    };

    // O cálculo novo copia os parâmetros do cálculo aberto, sem as parcelas
    const addCalculation = () => {
        const list = currentDrafts();
        list.push({ ...list[activeIdx], label: `Cálculo ${list.length + 1}`, installments: [{ ...EMPTY_INSTALLMENT }] });
        switchTo(list.length - 1, list);
    };

    // A remoção só vale quando o cálculo é salvo
    const removeCalculation = () => {
        const list = currentDrafts();
        if (list.length < 2) return;
        list.splice(activeIdx, 1);
        switchTo(Math.max(0, activeIdx - 1), list);
    };

    const calcLabels = (drafts.length > 0 ? drafts : [{ label: activeLabel }])
        .map((d, i) => (i === activeIdx ? activeLabel : d.label) || `Cálculo ${i + 1}`);

    const getToken = () => getAccessTokenSilently({
        authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! },
    });

    // ── Feature 5: gerador de parcelas periódicas ─────────────────────────────
    const handleBulkGenerate = () => {
        const isoStart = parseDisplayDate(bulkStartDate);
        if (!isoStart || !bulkValue) {
            toaster.create({ title: 'Informe data de início e valor.', type: 'warning' });
            return;
        }
        const step  = PERIOD_MONTHS[bulkPeriod] ?? 1;
        const count = Math.max(1, Math.min(120, parseInt(bulkCount) || 1));
        for (let i = 0; i < count; i++) {
            append({
                baseValue:      bulkValue,
                baseDate:       toDisplayDate(addMonths(isoStart, i * step)),
                description:    bulkDesc ? `${bulkDesc} ${i + 1}` : '',
                type:           'DEBITO',
                deductionPoint: 'APOS_TUDO',
            });
        }
        toaster.create({ title: `${count} parcela(s) adicionada(s).`, type: 'success' });
        setBulkStartDate(''); setBulkValue(''); setBulkDesc('');
    };

    // ── Feature 5: importação por colagem ─────────────────────────────────────
    const handlePasteImport = () => {
        const lines = pasteText.trim().split('\n').filter(Boolean);
        let count = 0;
        for (const line of lines) {
            const parts = line.split(/[;\t]/);
            if (parts.length < 2) continue;
            const dateStr  = parts[0].trim();
            const valueStr = parts[1].trim().replace(/[^\d,.-]/g, '');
            const desc     = parts[2]?.trim() || '';
            const value    = valueStr.includes(',')
                ? parseFloat(valueStr.replace(/\./g, '').replace(',', '.'))
                : parseFloat(valueStr);
            if (!dateStr || isNaN(value)) continue;
            const iso = parseDisplayDate(dateStr);
            if (!iso) continue;
            append({
                baseValue:      value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                baseDate:       toDisplayDate(iso),
                description:    desc,
                type:           'DEBITO',
                deductionPoint: 'APOS_TUDO',
            });
            count++;
        }
        if (count > 0) {
            toaster.create({ title: `${count} parcela(s) importada(s).`, type: 'success' });
            setPasteText(''); setPasteOpen(false);
        } else {
            toaster.create({ title: 'Nenhuma linha válida. Formato: DD/MM/AAAA;valor;descrição', type: 'warning' });
        }
    };

    // ── submit principal ──────────────────────────────────────────────────────
    const onSaveAndCalculate = async (data: FormValues) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { referenceMonth, ...activeDraft } = data;
        const list = drafts.length > 0 ? [...drafts] : [activeDraft];
        list[activeIdx] = activeDraft;
        setDrafts(list);

        const payloads = list.map(toPayload);
        const invalidIdx = payloads.findIndex(p => p === null);
        if (invalidIdx >= 0) {
            const label = list[invalidIdx].label || `Cálculo ${invalidIdx + 1}`;
            toaster.create({
                title: list.length > 1
                    ? `Em "${label}", informe ao menos uma parcela com valor e data válida (DD/MM/AAAA).`
                    : 'Informe ao menos uma parcela com valor e data válida (DD/MM/AAAA).',
                type: 'warning',
            });
            if (invalidIdx !== activeIdx) switchTo(invalidIdx, list);
            return;
        }

        const [main, ...extras] = payloads as NonNullable<ReturnType<typeof toPayload>>[];
        const payload = {
            ...main,
            // Com um cálculo só, os campos vazios apagam cálculos extras salvos antes
            calculationLabel:  list.length > 1 ? (list[0].label || 'Cálculo 1') : null,
            extraCalculations: extras.map((p, i) => ({ label: list[i + 1].label || `Cálculo ${i + 2}`, ...p })),
        };

        setIsSaving(true);
        try {
            const token = await getToken();
            await axios.put(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/calculator/${asset.legalOneId}/params`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } },
            );
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
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/calculator/${asset.legalOneId}/calculate`,
                refBody,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            setCalcResult(res.data);
            mutateLogs();
            onRefresh();
            toaster.create({ title: 'Cálculo realizado com sucesso!', type: 'success' });
        } catch (e: any) {
            toaster.create({ title: e?.response?.data?.error || 'Erro ao calcular.', type: 'error' });
        } finally { setIsCalculating(false); }
    };

    // ── JSX helper: select simples ────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SmSelect = ({ name, collection, bg = 'gray.900' }: {
        name: keyof FormValues;
        collection: any;
        bg?: string;
    }) => (
        <Controller name={name} control={control} render={({ field }) => (
            <Select.Root
                collection={collection}
                value={field.value ? [String(field.value)] : []}
                onValueChange={e => field.onChange(e.value[0])}
                size="sm"
            >
                <Select.HiddenSelect />
                <Select.Control>
                    <Select.Trigger bg={bg} borderColor="gray.600">
                        <Select.ValueText />
                    </Select.Trigger>
                </Select.Control>
                <Portal>
                    <Select.Positioner>
                        <Select.Content bg="gray.800" borderColor="gray.600">
                            {collection.items.map((i: any) => (
                                <Select.Item key={i.value} item={i}
                                    _highlighted={{ bg: 'gray.700', cursor: 'pointer' }}>
                                    <Select.ItemText>{i.label}</Select.ItemText>
                                    <Select.ItemIndicator />
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select.Positioner>
                </Portal>
            </Select.Root>
        )} />
    );

    // ── toggle a.m. / a.a. / a.d. ────────────────────────────────────────────
    const RATE_UNITS: { value: string; label: string }[] = [
        { value: 'AM', label: '% a.m.' },
        { value: 'AA', label: '% a.a.' },
        { value: 'AD', label: '% a.d.' },
    ];

    const RateUnitToggle = ({ name }: { name: 'moratoryRateUnit' | 'compensatoryRateUnit' }) => (
        <Controller name={name} control={control} render={({ field }) => (
            <HStack gap={0} border="1px solid" borderColor="gray.600" borderRadius="md" overflow="hidden">
                {RATE_UNITS.map(({ value, label }) => (
                    <Button key={value} size="xs" type="button" borderRadius="none"
                        variant={field.value === value ? 'solid' : 'ghost'}
                        colorPalette={field.value === value ? 'brand' : 'gray'}
                        onClick={() => field.onChange(value)}
                        px={3}
                    >
                        {label}
                    </Button>
                ))}
            </HStack>
        )} />
    );

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

                            {/* Vários cálculos no mesmo processo */}
                            <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
                                <Flex justify="space-between" align="center" gap={3} wrap="wrap">
                                    {calcLabels.length > 1 ? (
                                        <HStack gap={1} wrap="wrap">
                                            {calcLabels.map((label, idx) => (
                                                <Button key={idx} size="xs" type="button"
                                                    variant={idx === activeIdx ? 'solid' : 'ghost'}
                                                    colorPalette={idx === activeIdx ? 'brand' : 'gray'}
                                                    onClick={() => { if (idx !== activeIdx) switchTo(idx); }}>
                                                    {label}
                                                </Button>
                                            ))}
                                        </HStack>
                                    ) : (
                                        <Text fontSize="xs" color="gray.500" flex={1} minW="200px">
                                            Processo com contratos de índices ou juros diferentes? Use um cálculo para cada um. O valor do processo é a soma.
                                        </Text>
                                    )}
                                    <Button size="xs" variant="outline" colorPalette="brand" gap={1} type="button" onClick={addCalculation}>
                                        <Icon as={PiPlus} /> Adicionar cálculo
                                    </Button>
                                </Flex>
                                {calcLabels.length > 1 && (
                                    <Flex gap={3} align="flex-end" wrap="wrap" mt={3}>
                                        <Field.Root flex={1} minW="200px">
                                            <Field.Label fontSize="xs" color="gray.400">Nome deste cálculo</Field.Label>
                                            <Input {...register('label')} size="sm" bg="gray.900" borderColor="gray.600" placeholder="Ex: Contrato 1" />
                                        </Field.Root>
                                        <Button size="xs" variant="ghost" colorPalette="red" gap={1} type="button" onClick={removeCalculation}>
                                            <Icon as={PiTrash} /> Remover este cálculo
                                        </Button>
                                    </Flex>
                                )}
                            </Box>

                            {/* Índice de Correção */}
                            <Field.Root>
                                <Field.Label fontSize="sm">Índice de Correção Monetária</Field.Label>
                                <SmSelect name="correctionIndex" collection={INDEX_OPTIONS} bg="gray.800" />
                            </Field.Root>

                            {/* Juros Moratórios */}
                            <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
                                <Text fontSize="xs" fontWeight="semibold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={3}>
                                    Juros Moratórios
                                </Text>
                                <Controller name="moratoryMode" control={control} render={({ field }) => (
                                    <HStack gap={1} mb={3}>
                                        {[
                                            { v: 'TAXA_LEGAL',   l: 'Taxa Legal (art. 406/CC)' },
                                            { v: 'PERSONALIZADO', l: 'Personalizado' },
                                        ].map(opt => (
                                            <Button key={opt.v} size="sm" type="button"
                                                variant={field.value === opt.v ? 'solid' : 'ghost'}
                                                colorPalette={field.value === opt.v ? 'brand' : 'gray'}
                                                onClick={() => field.onChange(opt.v)}
                                            >
                                                {opt.l}
                                            </Button>
                                        ))}
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
                                    <HStack gap={4} wrap="wrap" mb={3} align="flex-end">
                                        <Field.Root flex={1} minW="160px">
                                            <Field.Label fontSize="sm">
                                                Taxa ({RATE_UNITS.find(u => u.value === moratoryRateUnit)?.label ?? '% a.m.'})
                                            </Field.Label>
                                            <Input {...register('moratoryRate')} type="number" step="0.0001" size="sm" bg="gray.900" borderColor="gray.600" />
                                        </Field.Root>
                                        <Field.Root flex="none">
                                            <Field.Label fontSize="sm">Unidade</Field.Label>
                                            <RateUnitToggle name="moratoryRateUnit" />
                                        </Field.Root>
                                        <Field.Root flex={1} minW="140px">
                                            <Field.Label fontSize="sm">Tipo</Field.Label>
                                            <SmSelect name="moratoryType" collection={TYPE_OPTIONS} />
                                        </Field.Root>
                                    </HStack>
                                )}
                                <Field.Root>
                                    <Field.Label fontSize="sm" color="gray.400">
                                        Calcular juros a partir de{' '}
                                        <Text as="span" color="gray.500" fontSize="xs">(vazio = data base de cada parcela)</Text>
                                    </Field.Label>
                                    {/* Feature 1: input de texto livre */}
                                    <MaskedDateInput fieldName="moratoryStartDate" control={control} size="sm" bg="gray.900" borderColor="gray.600" />
                                </Field.Root>
                            </Box>

                            {/* Juros Remuneratórios */}
                            <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
                                <Text fontSize="xs" fontWeight="semibold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={3}>
                                    Juros Remuneratórios
                                </Text>
                                <HStack gap={4} wrap="wrap" mb={3} align="flex-end">
                                    <Field.Root flex={1} minW="160px">
                                        <Field.Label fontSize="sm">
                                            Taxa ({RATE_UNITS.find(u => u.value === compensatoryRateUnit)?.label ?? '% a.m.'}) — 0 = não aplicar
                                        </Field.Label>
                                        <Input {...register('compensatoryRate')} type="number" step="0.0001" size="sm" bg="gray.900" borderColor="gray.600" placeholder="0" />
                                    </Field.Root>
                                    <Field.Root flex="none">
                                        <Field.Label fontSize="sm">Unidade</Field.Label>
                                        <RateUnitToggle name="compensatoryRateUnit" />
                                    </Field.Root>
                                    <Field.Root flex={1} minW="140px">
                                        <Field.Label fontSize="sm">Tipo</Field.Label>
                                        <SmSelect name="compensatoryType" collection={TYPE_OPTIONS} />
                                    </Field.Root>
                                </HStack>
                                <Field.Root>
                                    <Field.Label fontSize="sm" color="gray.400">
                                        Calcular a partir de{' '}
                                        <Text as="span" color="gray.500" fontSize="xs">(vazio = data base de cada parcela)</Text>
                                    </Field.Label>
                                    <MaskedDateInput fieldName="compensatoryStartDate" control={control} size="sm" bg="gray.900" borderColor="gray.600" />
                                </Field.Root>
                            </Box>

                            {/* Honorários e Multa — Feature 3: valor fixo */}
                            <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
                                <Text fontSize="xs" fontWeight="semibold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={3}>
                                    Honorários e Multas
                                </Text>
                                <HStack gap={4} wrap="wrap" align="flex-end">
                                    {/* Honorários — toggle percentual/fixo */}
                                    <Field.Root flex={1} minW="180px">
                                        <Flex justify="space-between" align="center" gap={3} mb={1}>
                                            <Field.Label fontSize="sm" mb={0}>Honorários Advocatícios</Field.Label>
                                            <Controller name="feesMode" control={control} render={({ field }) => (
                                                <HStack gap={0} border="1px solid" borderColor="gray.600" borderRadius="md" overflow="hidden">
                                                    {[{ v: 'PERCENTUAL', l: '%' }, { v: 'FIXO', l: 'R$' }].map(opt => (
                                                        <Button key={opt.v} size="xs" type="button" borderRadius="none" px={3}
                                                            variant={field.value === opt.v ? 'solid' : 'ghost'}
                                                            colorPalette={field.value === opt.v ? 'brand' : 'gray'}
                                                            onClick={() => field.onChange(opt.v)}
                                                        >
                                                            {opt.l}
                                                        </Button>
                                                    ))}
                                                </HStack>
                                            )} />
                                        </Flex>
                                        {feesMode === 'FIXO' ? (
                                            <Controller name="feesFixedValue" control={control} render={({ field }) => (
                                                <Flex align="center" border="1px solid" borderColor="gray.600" borderRadius="md" overflow="hidden" bg="gray.900">
                                                    <Box px={2} bg="gray.700" borderRight="1px solid" borderColor="gray.600" alignSelf="stretch" display="flex" alignItems="center">
                                                        <Text fontSize="xs" color="gray.300" fontWeight="semibold" whiteSpace="nowrap">R$</Text>
                                                    </Box>
                                                    <Input
                                                        value={field.value || ''}
                                                        onChange={e => {
                                                            const digits = e.target.value.replace(/\D/g, '');
                                                            if (!digits) { field.onChange(''); return; }
                                                            const num = parseInt(digits, 10);
                                                            field.onChange((num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
                                                        }}
                                                        onBlur={field.onBlur}
                                                        name={field.name}
                                                        ref={field.ref}
                                                        type="text"
                                                        placeholder="0,00"
                                                        autoComplete="off"
                                                        size="sm"
                                                        bg="gray.900"
                                                        border="none"
                                                        _focus={{ boxShadow: 'none', outline: 'none' }}
                                                    />
                                                </Flex>
                                            )} />
                                        ) : (
                                            <Flex align="center" border="1px solid" borderColor="gray.600" borderRadius="md" overflow="hidden" bg="gray.900">
                                                <Input {...register('feesPercentage')} type="number" step="0.01" size="sm" bg="gray.900" border="none" pr={3} _focus={{ boxShadow: 'none' }} placeholder="10" />
                                                <Box px={2} bg="gray.700" borderLeft="1px solid" borderColor="gray.600" alignSelf="stretch" display="flex" alignItems="center">
                                                    <Text fontSize="xs" color="gray.300" fontWeight="semibold">%</Text>
                                                </Box>
                                            </Flex>
                                        )}
                                    </Field.Root>
                                    <Field.Root flex={1} minW="160px">
                                        <Field.Label fontSize="sm">HO e multa Art. 523 (%)</Field.Label>
                                        <Input {...register('penaltyPercentage')} type="number" step="0.01" size="sm" bg="gray.900" borderColor="gray.600" />
                                    </Field.Root>
                                    <Field.Root flex={1} minW="160px">
                                        <Field.Label fontSize="sm">Multa <Text as="span" color="gray.500" fontSize="xs">(% sobre valor corrigido)</Text></Field.Label>
                                        <Input {...register('multaPercentage')} type="number" step="0.01" size="sm" bg="gray.900" borderColor="gray.600" placeholder="0" />
                                    </Field.Root>
                                </HStack>
                            </Box>

                            {/* Parcelas */}
                            <Box>
                                <Flex justify="space-between" align="center" mb={3}>
                                    <Text fontSize="sm" fontWeight="semibold" color="gray.300">
                                        Parcelas do Valor Base
                                    </Text>
                                    <HStack gap={2}>
                                        {/* Feature 5: botões de adição em massa */}
                                        <Button size="xs" variant="outline" colorPalette="gray" gap={1} type="button"
                                            onClick={() => { setBulkOpen(v => !v); setPasteOpen(false); }}>
                                            <Icon as={PiRows} /> Gerar em Massa
                                        </Button>
                                        <Button size="xs" variant="outline" colorPalette="gray" gap={1} type="button"
                                            onClick={() => { setPasteOpen(v => !v); setBulkOpen(false); }}>
                                            <Icon as={PiClipboardText} /> Colar
                                        </Button>
                                        <Button size="xs" variant="outline" colorPalette="brand" gap={1} type="button"
                                            onClick={() => append({ baseValue: '', baseDate: '', description: '', type: 'DEBITO', deductionPoint: 'APOS_TUDO' })}>
                                            <Icon as={PiPlus} /> Adicionar Parcela
                                        </Button>
                                    </HStack>
                                </Flex>

                                {/* Feature 5a: gerador periódico */}
                                {bulkOpen && (
                                    <Box mb={3} p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="brand.700">
                                        <Text fontSize="xs" fontWeight="semibold" color="brand.300" textTransform="uppercase" letterSpacing="wider" mb={3}>
                                            Gerador de Parcelas Periódicas
                                        </Text>
                                        <Flex gap={3} wrap="wrap" align="flex-end">
                                            <Field.Root flex={1} minW="140px">
                                                <Field.Label fontSize="xs" color="gray.400">Data de Início</Field.Label>
                                                <Input type="text" placeholder="DD/MM/AAAA" autoComplete="off" size="sm" bg="gray.900" borderColor="gray.600"
                                                    value={bulkStartDate} onChange={e => setBulkStartDate(applyDateMask(e.target.value))} />
                                            </Field.Root>
                                            <Field.Root flex={1} minW="140px">
                                                <Field.Label fontSize="xs" color="gray.400">Periodicidade</Field.Label>
                                                <Select.Root collection={PERIOD_COLLECTION} value={[bulkPeriod]}
                                                    onValueChange={e => setBulkPeriod(e.value[0])} size="sm">
                                                    <Select.HiddenSelect />
                                                    <Select.Control>
                                                        <Select.Trigger bg="gray.900" borderColor="gray.600"><Select.ValueText /></Select.Trigger>
                                                    </Select.Control>
                                                    <Portal>
                                                        <Select.Positioner>
                                                            <Select.Content bg="gray.800" borderColor="gray.600">
                                                                {PERIOD_COLLECTION.items.map((i: any) => (
                                                                    <Select.Item key={i.value} item={i} _highlighted={{ bg: 'gray.700' }}>
                                                                        <Select.ItemText>{i.label}</Select.ItemText>
                                                                        <Select.ItemIndicator />
                                                                    </Select.Item>
                                                                ))}
                                                            </Select.Content>
                                                        </Select.Positioner>
                                                    </Portal>
                                                </Select.Root>
                                            </Field.Root>
                                            <Field.Root flex="none" minW="80px">
                                                <Field.Label fontSize="xs" color="gray.400">Qtd.</Field.Label>
                                                <Input type="number" min={1} max={120} size="sm" bg="gray.900" borderColor="gray.600"
                                                    value={bulkCount} onChange={e => setBulkCount(e.target.value)} />
                                            </Field.Root>
                                            <Field.Root flex={1} minW="140px">
                                                <Field.Label fontSize="xs" color="gray.400">Valor (R$)</Field.Label>
                                                <Input type="text" placeholder="0,00" size="sm" bg="gray.900" borderColor="gray.600"
                                                    value={bulkValue} onChange={e => setBulkValue(e.target.value)} />
                                            </Field.Root>
                                            <Field.Root flex={2} minW="160px">
                                                <Field.Label fontSize="xs" color="gray.400">Descrição (opcional)</Field.Label>
                                                <Input type="text" placeholder="Ex: Parcela" size="sm" bg="gray.900" borderColor="gray.600"
                                                    value={bulkDesc} onChange={e => setBulkDesc(e.target.value)} />
                                            </Field.Root>
                                            <Button size="sm" colorPalette="brand" type="button" onClick={handleBulkGenerate} gap={1} flexShrink={0}>
                                                <Icon as={PiRows} /> Gerar
                                            </Button>
                                        </Flex>
                                    </Box>
                                )}

                                {/* Feature 5b: colar lote */}
                                {pasteOpen && (
                                    <Box mb={3} p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.600">
                                        <Text fontSize="xs" fontWeight="semibold" color="gray.300" textTransform="uppercase" letterSpacing="wider" mb={2}>
                                            Importar por Colagem
                                        </Text>
                                        <Text fontSize="xs" color="gray.500" mb={2}>
                                            Uma parcela por linha — formato: <Text as="span" fontFamily="mono" color="gray.400">DD/MM/AAAA;valor;descrição</Text>
                                        </Text>
                                        <Textarea
                                            placeholder={'01/01/2020;150000\n01/02/2020;150000;Parcela 2'}
                                            size="sm" bg="gray.900" borderColor="gray.600" rows={4}
                                            value={pasteText} onChange={e => setPasteText(e.target.value)}
                                            mb={2} fontFamily="mono" fontSize="xs"
                                        />
                                        <Button size="sm" colorPalette="brand" type="button" onClick={handlePasteImport} gap={1}>
                                            <Icon as={PiClipboardText} /> Importar
                                        </Button>
                                    </Box>
                                )}

                                {/* Lista de parcelas */}
                                <VStack align="stretch" gap={2}>
                                    {fields.map((field, idx) => {
                                        const isAbatimento = watchedInstallments[idx]?.type === 'ABATIMENTO';
                                        return (
                                            <Box key={field.id} borderRadius="md" border="1px solid"
                                                borderColor={isAbatimento ? 'orange.700' : 'gray.700'} overflow="hidden">
                                                {/* Header */}
                                                <Flex align="center" justify="space-between" px={3} py={2}
                                                    bg={isAbatimento ? 'orange.900' : 'gray.750'}
                                                    borderBottom="1px solid" borderColor={isAbatimento ? 'orange.700' : 'gray.700'}>
                                                    <Controller name={`installments.${idx}.type`} control={control} render={({ field: f }) => (
                                                        <HStack gap={1}>
                                                            {[
                                                                { v: 'DEBITO',     l: 'Débito'     },
                                                                { v: 'ABATIMENTO', l: 'Abatimento' },
                                                            ].map(opt => (
                                                                <Button key={opt.v} size="xs" type="button"
                                                                    variant={f.value === opt.v ? 'solid' : 'ghost'}
                                                                    colorPalette={f.value === opt.v && opt.v === 'ABATIMENTO' ? 'orange' : 'gray'}
                                                                    onClick={() => f.onChange(opt.v)}>
                                                                    {opt.l}
                                                                </Button>
                                                            ))}
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
                                                    {/* Feature 1: input de data livre */}
                                                    <Field.Root flex={1} minW="130px">
                                                        <Field.Label fontSize="xs" color={isAbatimento ? 'orange.300' : 'gray.400'}>
                                                            {isAbatimento ? 'Data' : 'Data Base'}
                                                        </Field.Label>
                                                        <MaskedDateInput fieldName={`installments.${idx}.baseDate`}
                                                            control={control} size="sm" bg="gray.900" borderColor={isAbatimento ? 'orange.800' : 'gray.600'} />
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
                                                                <Select.Root collection={DEDUCTION_POINT_OPTIONS}
                                                                    value={f.value ? [f.value] : ['APOS_TUDO']}
                                                                    onValueChange={e => f.onChange(e.value[0])} size="sm">
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
                                                                                    <Select.Item key={i.value} item={i}
                                                                                        _highlighted={{ bg: 'gray.700', cursor: 'pointer' }}>
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
                                    <Input {...register('referenceMonth')} type="month" size="sm" bg="gray.900" borderColor="gray.600"
                                        max={new Date().toISOString().substring(0, 7)} />
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
                                ...(calcResult.multaValue > 0
                                    ? [{ label: 'Multa s/ valor corrigido', value: calcResult.multaValue }]
                                    : []),
                                { label: 'Honorários',             value: calcResult.feesValue },
                                { label: 'HO e Multa Art. 523',    value: calcResult.penaltyValue },
                            ].map(item => (
                                <Box key={item.label} flex={1} minW={{ base: '120px', md: '140px' }} maxW={{ base: '50%', md: 'none' }} p={3} bg="gray.800" borderRadius="md">
                                    <Text fontSize="xs" color="gray.500" mb={1}>{item.label}</Text>
                                    <Text fontWeight="bold" fontSize="sm">{formatBRL(item.value)}</Text>
                                </Box>
                            ))}
                        </Flex>

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

                        {calcResult.calculations && calcResult.calculations.length > 1 && (
                            <VStack align="stretch" gap={1} mb={4} p={3} bg="gray.800" borderRadius="md">
                                <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>
                                    Por cálculo
                                </Text>
                                {calcResult.calculations.map((calc, i) => (
                                    <Flex key={i} justify="space-between" align="center" gap={3}>
                                        <Text fontSize="sm">{calc.label}</Text>
                                        <Text fontSize="sm" fontWeight="bold" fontVariantNumeric="tabular-nums">{formatBRL(calc.totalValue)}</Text>
                                    </Flex>
                                ))}
                            </VStack>
                        )}

                        <Box p={4} bg="brand.900/30" borderRadius="md" border="1px solid" borderColor="brand.700">
                            <Text fontSize="xs" color="brand.400" mb={1}>TOTAL GERAL</Text>
                            <Text fontSize="2xl" fontWeight="black" color="brand.300">{formatBRL(calcResult.totalValue)}</Text>
                        </Box>

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
                                                {inst.monthBreakdown?.length > 0 && (
                                                    <Box maxH="200px" overflowY="auto" overflowX="auto">
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
                                        <Table.ColumnHeader px={2} />
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
                                            <Table.Cell px={2} py={3} textAlign="center">
                                                {log.paramsSnapshot && (
                                                    <Button size="xs" variant="ghost" colorPalette="brand" gap={1}
                                                        title="Reabrir este cálculo para edição"
                                                        onClick={() => reopenFromLog(log.paramsSnapshot)}>
                                                        <Icon as={PiArrowCounterClockwise} />
                                                        Reabrir
                                                    </Button>
                                                )}
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
