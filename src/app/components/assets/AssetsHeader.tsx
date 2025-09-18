'use client';

import {
  Flex,
  Heading,
  Text,
  VStack,
  Tag,
  SimpleGrid,
  Stat,
  Icon,
} from '@chakra-ui/react';
import { PiWallet, PiScales, PiChartLineUp } from 'react-icons/pi';
import { DetailedCreditAsset } from '@/app/ativos/[processNumber]/page'; // Reutilizando a tipagem

// Funções auxiliares movidas para cá ou para um ficheiro de utils
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getStatusColorScheme = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativo': return 'green';
      case 'liquidado': return 'gray';
      case 'em negociação': return 'yellow';
      default: return 'blue';
    }
};

interface AssetHeaderProps {
  asset: DetailedCreditAsset;
}

export function AssetHeader({ asset }: AssetHeaderProps) {
  return (
    <VStack w="100%" align="stretch" gap={8}>
      {/* Cabeçalho */}
      <Flex justify="space-between" align="center" pl={1}>
        <VStack align="start" gap={0}>
          <Text color="gray.400">Processo N°</Text>
          <Heading as="h1" size="lg">
            {asset.processNumber}
          </Heading>
        </VStack>
        <Tag.Root size="lg" variant="solid" colorScheme={getStatusColorScheme(asset.status)}>
          <Tag.Label>{asset.status}</Tag.Label>
        </Tag.Root>
      </Flex>

      {/* Métricas Principais */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
        <Stat.Root bg="gray.900" p={5} borderRadius="md">
          <Stat.Label display="flex" alignItems="center" gap={2}><Icon as={PiWallet} /> Valor Atual</Stat.Label>
          <Stat.ValueText fontSize="2xl">{formatCurrency(asset.currentValue)}</Stat.ValueText>
        </Stat.Root>
        <Stat.Root bg="gray.900" p={5} borderRadius="md">
          <Stat.Label display="flex" alignItems="center" gap={2}><Icon as={PiScales} /> Valor de Aquisição</Stat.Label>
          <Stat.ValueText fontSize="2xl">{formatCurrency(asset.acquisitionValue)}</Stat.ValueText>
        </Stat.Root>
        <Stat.Root bg="gray.900" p={5} borderRadius="md">
          <Stat.Label display="flex" alignItems="center" gap={2}><Icon as={PiChartLineUp} /> Valor Original</Stat.Label>
          <Stat.ValueText fontSize="2xl">{formatCurrency(asset.originalValue)}</Stat.ValueText>
        </Stat.Root>
      </SimpleGrid>
    </VStack>
  );
}
