'use client';

import { Tabs } from '@chakra-ui/react';
import { DetailedCreditAsset } from '@/app/ativos/[processNumber]/page';
import { OverviewTab } from './tabs/OverviewTab';
import { HistoryTab } from './tabs/HistoryTab';
import { ChartsTab } from './tabs/ChartsTab';

interface AssetTabsProps {
    asset: DetailedCreditAsset;
}

export function AssetTabs({ asset }: AssetTabsProps) {
  return (
    <Tabs.Root variant="enclosed" colorScheme="blue" defaultValue="overview">
      <Tabs.List>
            <Tabs.Trigger value="overview">Visão Geral</Tabs.Trigger>
            <Tabs.Trigger value="charts">Análise Gráfica</Tabs.Trigger>
            <Tabs.Trigger value="history">Histórico & Documentos</Tabs.Trigger>
      </Tabs.List>
      
      <Tabs.Content value="overview" pt={6}>
        <OverviewTab asset={asset} />
      </Tabs.Content>
      
      <Tabs.Content value="history" pt={6}>
        <HistoryTab asset={asset} />
      </Tabs.Content>
      
      <Tabs.Content value="charts" pt={6}>
        <ChartsTab />
      </Tabs.Content>
    </Tabs.Root>
  )
}

