'use client';

import {
  Heading,
  Text,
  Spinner,
  Flex,
  VStack,
  Icon,
} from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import { PiWarningCircle } from 'react-icons/pi';
import { useApi } from '@/hooks/useApi';
import { AssetTabs } from '@/app/components/assets/AssetTabs';
import { AssetHeader } from '@/app/components/assets/AssetsHeader';


// Tipagem para os dados detalhados do processo que a API vai retornar
export interface DetailedCreditAsset { 
  id: string; 
  processNumber: string;
  originalCreditor: string;
  status: string;
  origemProcesso: string; 
  lawsuitType?: string; 
  lawyerResponsible?: string; 
  strategyText?: string; // <--- NOVO CAMPO ADICIONADO AQUI
  acquisitionDate: string;
  currentValue: number;
  acquisitionValue: number;
  originalValue: number;
  updateIndexType?: string;
  associate?: { name: string };
  contractualIndexRate?: number;
  legalOneId?: number;
  legalOneType?: string;
  associateId?: string;
  nickname?: string;
  otherParty?: string; 
  investors: { user: { id: string, name: string }; investorShare: number }[];
  updates: { id: string; date: string; updatedValue: number; description?: string, type?: string, read?: boolean, fullDescription?: string }[];
  documents: { id: string; legalOneDocumentId: number; name: string; url: string; category: string }[];
}

// Componente principal da página
export default function AssetDetailsPage() {
  const params = useParams();
  const processNumber = params.processNumber as string;

  const { data: asset, isLoading, error } = useApi<DetailedCreditAsset>(
    processNumber ? `/api/assets/${processNumber}` : null
  );

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="80vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error) {
    return (
      <VStack bg="red.900" p={8} borderRadius="md" borderWidth="1px" borderColor="red.400">
        <Icon as={PiWarningCircle} boxSize={10} color="red.300" />
        <Heading size="md">Processo Não Encontrado</Heading>
        <Text>Não foi possível carregar os detalhes para este processo.</Text>
      </VStack>
    );
  }

  if (!asset) {
    return <Text>Nenhum dado de processo para exibir.</Text>;
  }

  return (
    <VStack w="100%" align="stretch" gap={8}>
      <AssetHeader asset={asset} />
      <AssetTabs asset={asset} />
    </VStack>
  );
}