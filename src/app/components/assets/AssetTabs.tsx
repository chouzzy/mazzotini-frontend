'use client';

import { Tabs } from '@chakra-ui/react';
import { DetailedCreditAsset } from '@/app/processos/[legalOneId]/page';
import { OverviewTab } from './tabs/OverviewTab';
import { UpdatesTab } from './tabs/UpdatesTab';
import { ChartsTab } from './tabs/ChartsTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { StrategyTab } from './tabs/StrategyTab';
import { CalculatorTab } from './tabs/CalculatorTab';

interface AssetTabsProps {
  asset: DetailedCreditAsset;
  hideDocuments?: boolean;
  onRefresh?: () => void;
}

export function AssetTabs({ asset, hideDocuments = false, onRefresh = () => {} }: AssetTabsProps) {
  return (
    <Tabs.Root defaultValue="overview" variant={'enclosed'}>
      <Tabs.List overflowX="auto" whiteSpace="nowrap">
        <Tabs.Trigger _selected={{ bgColor: 'brand.800', color: 'white' }} value="overview">Visão Geral</Tabs.Trigger>
        <Tabs.Trigger _selected={{ bgColor: 'brand.800', color: 'white' }} value="charts">Análise Gráfica</Tabs.Trigger>
        <Tabs.Trigger _selected={{ bgColor: 'brand.800', color: 'white' }} value="strategy">Estratégia</Tabs.Trigger>
        <Tabs.Trigger _selected={{ bgColor: 'brand.800', color: 'white' }} value="updates">Histórico Processual</Tabs.Trigger>
        {!hideDocuments && (
          <Tabs.Trigger _selected={{ bgColor: 'brand.800', color: 'white' }} value="documents">Documentos</Tabs.Trigger>
        )}
        <Tabs.Trigger _selected={{ bgColor: 'brand.800', color: 'white' }} value="calculator">Cálculo Judicial</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="overview" pt={6}>
        <OverviewTab asset={asset} />
      </Tabs.Content>
      <Tabs.Content value="charts" pt={6}>
        <ChartsTab asset={asset} />
      </Tabs.Content>
      <Tabs.Content value="strategy" pt={6}>
        <StrategyTab asset={asset} />
      </Tabs.Content>
      <Tabs.Content borderColor={'red'} value="updates" pt={6}>
        <UpdatesTab asset={asset} />
      </Tabs.Content>
      {!hideDocuments && (
        <Tabs.Content value="documents" pt={6}>
          <DocumentsTab asset={asset} onRefresh={onRefresh} />
        </Tabs.Content>
      )}
      <Tabs.Content value="calculator" pt={6}>
        <CalculatorTab asset={asset} onRefresh={onRefresh} />
      </Tabs.Content>
    </Tabs.Root>
  );
}
