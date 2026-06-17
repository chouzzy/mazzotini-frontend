'use client';

import { useState } from 'react';
import { Tabs, Box } from '@chakra-ui/react';
import { DetailedCreditAsset } from '@/app/processos/[legalOneId]/page';
import { OverviewTab } from './tabs/OverviewTab';
import { UpdatesTab } from './tabs/UpdatesTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { StrategyTab } from './tabs/StrategyTab';
import { CalculatorTab } from './tabs/CalculatorTab';

interface AssetTabsProps {
  asset: DetailedCreditAsset;
  hideDocuments?: boolean;
  hideCalculator?: boolean;
  onRefresh?: () => void;
}

export function AssetTabs({ asset, hideDocuments = false, hideCalculator = false, onRefresh = () => {} }: AssetTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { value: 'overview', label: 'Visão Geral' },
    { value: 'strategy', label: 'Estratégia' },
    { value: 'updates', label: 'Histórico Processual' },
    ...(!hideDocuments ? [{ value: 'documents', label: 'Documentos' }] : []),
    ...(!hideCalculator ? [{ value: 'calculator', label: 'Cálculo Judicial' }] : []),
  ];

  return (
    <Tabs.Root value={activeTab} onValueChange={(d) => setActiveTab(d.value)} variant="enclosed" w="100%" minW={0}>

      {/* Mobile: select nativo */}
      <Box display={{ base: 'block', md: 'none' }} mb={4}>
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#1A1A1A',
            color: '#E2E8F0',
            border: '1px solid #B8A76E',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23B8A76E'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '36px',
          }}
        >
          {tabs.map(tab => (
            <option key={tab.value} value={tab.value} style={{ backgroundColor: '#1A202C' }}>
              {tab.label}
            </option>
          ))}
        </select>
      </Box>

      {/* Desktop: tab list */}
      <Tabs.List display={{ base: 'none', md: 'flex' }}>
        {tabs.map(tab => (
          <Tabs.Trigger key={tab.value} value={tab.value} _selected={{ bgColor: 'brand.800', color: 'white' }}>
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <Tabs.Content value="overview" pt={{ base: 4, md: 6 }} overflow="hidden">
        <OverviewTab asset={asset} />
      </Tabs.Content>
      <Tabs.Content value="strategy" pt={{ base: 4, md: 6 }} overflow="hidden">
        <StrategyTab asset={asset} />
      </Tabs.Content>
      <Tabs.Content value="updates" pt={{ base: 4, md: 6 }} overflow="hidden">
        <UpdatesTab asset={asset} />
      </Tabs.Content>
      {!hideDocuments && (
        <Tabs.Content value="documents" pt={{ base: 4, md: 6 }} overflow="hidden">
          <DocumentsTab asset={asset} onRefresh={onRefresh} />
        </Tabs.Content>
      )}
      {!hideCalculator && (
        <Tabs.Content value="calculator" pt={{ base: 4, md: 6 }} overflow="hidden">
          <CalculatorTab asset={asset} onRefresh={onRefresh} />
        </Tabs.Content>
      )}
    </Tabs.Root>
  );
}
