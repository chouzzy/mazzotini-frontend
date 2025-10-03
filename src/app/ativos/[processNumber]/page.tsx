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


// Tipagem para os dados detalhados do ativo que a API vai retornar
export interface DetailedCreditAsset { // Exportado para ser usado pelos sub-componentes
  id: string; // Adicionado para a navegação
  processNumber: string;
  originalCreditor: string;
  status: string;
  origemProcesso: string; // Campo que será preenchido pelo enrich
  lawsuitType?: string; // NOVO CAMPO (opcional)
  lawyerResponsible?: string; // NOVO CAMPO (opcional)
  acquisitionDate: string;
  currentValue: number;
  acquisitionValue: number;
  originalValue: number;
  updateIndexType?: string;
  associate?: { name: string };
  investors: { user: { name: string }; investorShare: number }[];
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
        <Heading size="md">Ativo Não Encontrado</Heading>
        <Text>Não foi possível carregar os detalhes para este ativo.</Text>
      </VStack>
    );
  }
  
  if (!asset) {
    return <Text>Nenhum dado de ativo para exibir.</Text>;
  }

  return (
    <VStack w="100%" align="stretch" gap={8}>
      {/* O Header e as Métricas agora vivem em seu próprio componente */}
      <AssetHeader asset={asset} />

      {/* O conteúdo em abas agora vive em seu próprio componente */}
      <AssetTabs asset={asset} />
    </VStack>
  );
}
