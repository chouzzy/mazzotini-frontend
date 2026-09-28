'use client';

import {
    Flex,
    Select,
    ButtonGroup,
    IconButton,
    Combobox,
    Portal,
    useFilter,
    useListCollection,
    createListCollection
} from '@chakra-ui/react';
import { PiArrowDownDuotone, PiCaretDoubleDownDuotone, PiFunction, PiSquaresFour } from 'react-icons/pi';
import { useMemo, useState, useEffect } from 'react';
import { AssetSummary } from '@/types/api';

interface AssetsToolbarProps {
    assets: AssetSummary[];
    viewMode: 'grid' | 'list';
    onViewChange: (mode: 'grid' | 'list') => void;
    onFilterChange: (status: string) => void;
    onSearch: (query: string) => void;
    onTypeChange?: (type: string) => void;
    /**
     * Habilita o filtro pelos status internos da integração com o Legal One.
     * Só deve ser ligado em telas de admin/operador: esta toolbar também é usada
     * no dashboard do investidor, onde esse jargão não pode aparecer.
     */
    showInternalStatuses?: boolean;
}

const BASE_STATUS_ITEMS = [
    { label: "Todos os Status", value: "" },
    { label: "Ativo", value: "Ativo" },
    { label: "Em Negociação", value: "Em Negociação" },
    { label: "Liquidado", value: "Liquidado" },
];

// Status da nossa integração, não do processo do cliente. Ficam atrás da flag
// porque é por eles que a operação precisa filtrar para achar o que quebrou.
const INTERNAL_STATUS_ITEMS = [
    { label: "Falha no Legal One", value: "FAILED_ENRICHMENT" },
    { label: "Aguardando Legal One", value: "PENDING_ENRICHMENT" },
];

const publicStatusOptions = createListCollection({ items: BASE_STATUS_ITEMS });
const internalStatusOptions = createListCollection({
    items: [...BASE_STATUS_ITEMS, ...INTERNAL_STATUS_ITEMS],
});

const typeOptions = createListCollection({
    items: [
        { label: "Todos os Tipos", value: "ALL" },
        { label: "Processo Principal", value: "LAWSUIT" },
        { label: "Recurso", value: "APPEAL" },
        { label: "Incidente", value: "INCIDENT" },
    ]
});

export function AssetsToolbar({ assets, viewMode, onViewChange, onFilterChange, onSearch, onTypeChange, showInternalStatuses = false }: AssetsToolbarProps) {
    const { contains } = useFilter({ sensitivity: "base" });
    const [inputValue, setInputValue] = useState('');
    const statusOptions = showInternalStatuses ? internalStatusOptions : publicStatusOptions;

    const searchItems = useMemo(() => assets.map(asset => ({
        label: `${asset.processNumber}`,
        value: asset.processNumber,
    })), [assets]);

    const { collection, filter } = useListCollection({
        initialItems: searchItems,
        filter: contains,
    });

    // Re-aplica o filtro quando os dados da API chegam (ex: após paste + busca assíncrona)
    useEffect(() => {
        if (inputValue) filter(inputValue);
    }, [searchItems]); // eslint-disable-line react-hooks/exhaustive-deps
    
    return (
        <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            gap={4}
            mb={8}
        >
            {/* Combobox para pesquisa */}
            <Combobox.Root
                collection={collection}
                onInputValueChange={(e) => {
                    setInputValue(e.inputValue);
                    filter(e.inputValue);
                    onSearch(e.inputValue);
                }}
                onValueChange={(e) => {
                    if (e.value.length > 0) {
                        const selectedItem = collection.items.find(item => item.value === e.value[0]);
                        onSearch(selectedItem?.value || '');
                    } else {
                        onSearch('');
                    }
                }}
                width={{ base: '100%', md: '320px' }}
            >
                <Combobox.Control>
                    <Combobox.Input
                        placeholder="Buscar por nº do processo"
                        border={'1px solid'}
                        borderColor="gray.600"
                        bgColor={'gray.950'}
                        cursor={'pointer'}
                        onPaste={(e) => {
                            const text = e.clipboardData.getData('text/plain').trim();
                            setTimeout(() => {
                                setInputValue(text);
                                filter(text);
                                onSearch(text);
                            }, 0);
                        }}
                    />
                    <Combobox.IndicatorGroup>
                        <Combobox.ClearTrigger />
                        <Combobox.Trigger />
                    </Combobox.IndicatorGroup>
                </Combobox.Control>
                <Portal>
                    <Combobox.Positioner>
                        <Combobox.Content>
                            <Combobox.Empty>Nenhum processo encontrado</Combobox.Empty>
                            {collection.items.map((item) => (
                                <Combobox.Item item={item} key={item.value}>
                                    {item.label}
                                </Combobox.Item>
                            ))}
                        </Combobox.Content>
                    </Combobox.Positioner>
                </Portal>
            </Combobox.Root>

            <Flex gap={4} wrap="wrap">
                {onTypeChange && (
                    <Select.Root
                        collection={typeOptions}
                        onValueChange={(details) => onTypeChange(details.value[0] || 'ALL')}
                        width={{ base: '100%', md: '200px' }}
                        defaultValue={["ALL"]}
                    >
                        <Select.Control>
                            <Select.Trigger border={'1px solid'} borderColor="gray.600" bgColor={'gray.950'} cursor={'pointer'}>
                                <Select.ValueText color={'gray.200'} placeholder="Tipo de Processo" />
                                <PiCaretDoubleDownDuotone color={'#B8A76E'}/>
                            </Select.Trigger>
                        </Select.Control>
                        <Portal>
                            <Select.Positioner>
                                <Select.Content>
                                    {typeOptions.items.map((option) => (
                                        <Select.Item item={option} key={option.value} >
                                            {option.label}
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Positioner>
                        </Portal>
                    </Select.Root>
                )}

                <Select.Root
                    collection={statusOptions}
                    onValueChange={(details) => onFilterChange(details.value[0] || '')}
                    width={{ base: '100%', md: '200px' }}
                >
                    <Select.Control>
                        <Select.Trigger border={'1px solid'} borderColor="gray.600" bgColor={'gray.950'} cursor={'pointer'}>
                            <Select.ValueText color={'gray.200'} placeholder="Filtrar por status" />
                            <PiCaretDoubleDownDuotone color={'#B8A76E'}/>
                        </Select.Trigger>
                    </Select.Control>
                    <Portal>
                        <Select.Positioner>
                            <Select.Content>
                                {statusOptions.items.map((option) => (
                                    <Select.Item item={option} key={option.value} >
                                        {option.label}
                                    </Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Positioner>
                    </Portal>
                </Select.Root>
            </Flex>
        </Flex>
    );
}