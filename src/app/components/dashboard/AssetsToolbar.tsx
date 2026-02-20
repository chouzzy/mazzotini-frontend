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
import { useMemo } from 'react';
import { AssetSummary } from '@/types/api';

// Props atualizadas para receber os processos para o Combobox
interface AssetsToolbarProps {
    assets: AssetSummary[];
    viewMode: 'grid' | 'list';
    onViewChange: (mode: 'grid' | 'list') => void;
    onFilterChange: (status: string) => void;
    onSearch: (query: string) => void;
}

// Opções para o filtro de status
const statusOptions = createListCollection({
    items: [
        { label: "Ativo", value: "Ativo" },
        { label: "Em Negociação", value: "Em Negociação" },
        { label: "Liquidado", value: "Liquidado" },
    ]
});


export function AssetsToolbar({ assets, viewMode, onViewChange, onFilterChange, onSearch }: AssetsToolbarProps) {
    // Lógica para o Combobox de pesquisa
    const { contains } = useFilter({ sensitivity: "base" });

    const searchItems = useMemo(() => assets.map(asset => ({
        label: `${asset.processNumber}`,
        value: asset.processNumber,
    })), [assets]);

    const { collection, filter } = useListCollection({
        initialItems: searchItems,
        filter: contains,
    });
    
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
                    filter(e.inputValue);
                    onSearch(e.inputValue); // Atualiza a busca em tempo real
                }}
                onValueChange={(e) => {
                    // Quando um item é selecionado, busca por ele
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
                    <Combobox.Input placeholder="Buscar por nº do processo"  border={'1px solid'} borderColor="gray.600" bgColor={'gray.950'} cursor={'pointer'}/>
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

            <Flex gap={4}>
                {/* Select com a sintaxe V3 */}
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

                {/* <ButtonGroup attached>
                    <IconButton
                        aria-label="Ver em Grade"
                        onClick={() => onViewChange('grid')}
                        _hover={{ bg: 'brand.600' }}
                    >
                        <PiSquaresFour/>
                    </IconButton>
                    <IconButton
                        aria-label="Ver em Lista"
                        onClick={() => onViewChange('list')}
                        bgColor={'gray.600'}
                        _hover={{ bg: 'brand.600' }}
                    >
                        <PiFunction />
                    </IconButton>
                </ButtonGroup> */}
            </Flex>
        </Flex>
    );
}

