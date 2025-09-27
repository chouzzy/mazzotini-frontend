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
  Button,
} from '@chakra-ui/react';
import { PiWallet, PiScales, PiChartLineUp, PiArrowsClockwise } from 'react-icons/pi';
import { DetailedCreditAsset } from '@/app/ativos/[processNumber]/page';
import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { Toaster, toaster } from '@/components/ui/toaster';

// Funções auxiliares
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getStatusColorScheme = (status: string) => {
  switch (status.toLowerCase()) {
    case 'ativo': return 'green';
    case 'liquidado': return 'gray';
    case 'em negociação': return 'yellow';
    case 'pending_enrichment': return 'purple';
    case 'failed_enrichment': return 'red';
    default: return 'blue';
  }
};

// As props foram atualizadas para receber a função 'mutate'
interface AssetHeaderProps {
  asset: DetailedCreditAsset;
}

export function AssetHeader({ asset }: AssetHeaderProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { getAccessTokenSilently } = useAuth0();

  const handleSync = async () => {
    setIsSyncing(true);
    toaster.create({
      title: 'Sincronização Iniciada',
      description: "A buscar novos andamentos no Legal One...",
      type: 'info',
      duration: 9000,
      closable: true,
    });

    try {
      const token = await getAccessTokenSilently();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      // Chama o novo endpoint de sincronização manual
      await axios.post(
        `${apiBaseUrl}/api/assets/${asset.processNumber}/sync`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Aguarda um momento para o backend processar e depois atualiza os dados
      setTimeout(() => {
        toaster.create({
          title: 'Sincronização Concluída!',
          description: "Os dados do ativo foram atualizados.",
          type: 'success',
          duration: 5000,
          closable: true,
        });
      }, 3000); // Um delay para dar tempo ao backend

    } catch (error) {
      toaster.create({
        title: 'Erro na Sincronização',
        description: 'Não foi possível buscar as atualizações. Tente novamente.',
        type: 'error',
        duration: 5000,
        closable: true,
      });
    } finally {
      // Garante que o botão de loading pare mesmo após o delay
      setTimeout(() => setIsSyncing(false), 3000);
    }
  };

  return (
    <VStack w="100%" align="stretch" gap={8}>
      <Toaster />
      <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'row' }} gap={4}>
        <VStack align="start" gap={0}>
          <Text color="gray.400">{asset.origemProcesso || "Processo N°"}</Text>
          <Heading as="h1" size="lg">
            {asset.processNumber}
          </Heading>
        </VStack>
        <Flex gap={4} align="center">
          {/* O NOVO BOTÃO DE SINCRONIZAÇÃO */}
          <Button
            onClick={handleSync}
            loading={isSyncing}
            loadingText="A Sincronizar"
            colorScheme="blue"
            variant="outline"
          >
            <PiArrowsClockwise />
            Sincronizar Andamentos
          </Button>
          <Tag.Root size="lg" variant="solid" colorScheme={getStatusColorScheme(asset.status)}>
            <Tag.Label>{asset.status}</Tag.Label>
          </Tag.Root>
        </Flex>
      </Flex>

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
