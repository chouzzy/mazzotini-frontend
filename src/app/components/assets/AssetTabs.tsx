'use client';

import { Tabs } from '@chakra-ui/react';
import { DetailedCreditAsset } from '@/app/ativos/[processNumber]/page';
import { OverviewTab } from './tabs/OverviewTab';
import { UpdatesTab } from './tabs/UpdatesTab';
import { ChartsTab } from './tabs/ChartsTab';
import { DocumentsTab } from './tabs/DocumentsTab';

interface AssetTabsProps {
    asset: DetailedCreditAsset;
}

export function AssetTabs({ asset }: AssetTabsProps) {
  return (
    <Tabs.Root variant="enclosed" colorPalette="white" defaultValue="overview">
      <Tabs.List>
            <Tabs.Trigger _selected={{bgColor:'brand.800', color:'white'}} value="overview">Visão Geral</Tabs.Trigger>
            <Tabs.Trigger _selected={{bgColor:'brand.800', color:'white'}} value="charts">Análise Gráfica</Tabs.Trigger>
            <Tabs.Trigger _selected={{bgColor:'brand.800', color:'white'}} value="updates">Histórico Processual</Tabs.Trigger>
            <Tabs.Trigger _selected={{bgColor:'brand.800', color:'white'}} value="documents">Documentos</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview" pt={6}>
        <OverviewTab asset={asset} />
      </Tabs.Content>
      <Tabs.Content value="updates" pt={6}>
        <UpdatesTab asset={asset} />
      </Tabs.Content>
      <Tabs.Content value="documents" pt={6}>
        <DocumentsTab asset={asset} />
      </Tabs.Content>
      <Tabs.Content value="charts" pt={6}>
        <ChartsTab asset={asset} />
      </Tabs.Content>
    </Tabs.Root>
  )
}
