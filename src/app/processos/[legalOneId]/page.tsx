'use client';

import {
  Heading, Text, Spinner, Flex, VStack, Icon,
  HStack, Button, Box, Avatar, createListCollection,
  Select, Portal,
} from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import { PiWarningCircle, PiUserMinus, PiUserPlus } from 'react-icons/pi';
import { useApi } from '@/hooks/useApi';
import { useAuth0 } from '@auth0/auth0-react';
import { AssetTabs } from '@/app/components/assets/AssetTabs';
import { AssetHeader } from '@/app/components/assets/AssetsHeader';
import { Toaster, toaster } from '@/components/ui/toaster';
import axios from 'axios';
import { useState, useMemo } from 'react';

// ============================================================================
//  TYPES
// ============================================================================
export interface DetailedCreditAsset {
  id: string;
  processNumber: string;
  originalCreditor: string;
  status: string;
  origemProcesso: string;
  lawsuitType?: string;
  lawyerResponsible?: string;
  strategyText?: string;
  acquisitionDate: string;
  currentValue: number;
  acquisitionValue: number;
  originalValue: number;
  updateIndexType?: string;
  associate?: { id: string; name: string };
  contractualIndexRate?: number;
  legalOneId?: number;
  legalOneType?: string;
  associateId?: string;
  nickname?: string;
  otherParty?: string;
  investors: {
    id: string;
    user: { id: string; name: string };
    investorShare: number;
    acquisitionDate?: string | null;
    associateId?: string | null;
    associate?: { id: string; name: string; email: string } | null;
  }[];
  updates: { id: string; date: string; updatedValue: number; description?: string; type?: string; read?: boolean; fullDescription?: string }[];
  documents: { id: string; legalOneDocumentId: number; name: string; url: string; category: string }[];
}

interface Associate { value: string; label: string; }

// ============================================================================
//  SEÇÃO DE ASSOCIADO (visível apenas para INVESTOR)
// ============================================================================
function AssociateSection({
  asset,
  myUserId,
  onUpdate,
}: {
  asset: DetailedCreditAsset;
  myUserId: string;
  onUpdate: () => void;
}) {
  const { getAccessTokenSilently } = useAuth0();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAssociate, setSelectedAssociate] = useState<string>('');

  const { data: associates } = useApi<Associate[]>('/api/users/associates');
  const associatesCollection = createListCollection({ items: associates || [] });

  const myInvestment = asset.investors.find(inv => inv.user?.id === myUserId);
  if (!myInvestment) return null;

  const currentAssociate = myInvestment.associate;

  const handleRemove = async () => {
    setIsSaving(true);
    try {
      const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/investments/${myInvestment.id}/associate`,
        { associateId: null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toaster.create({ title: 'Associado removido.', type: 'success' });
      onUpdate();
    } catch {
      toaster.create({ title: 'Erro ao remover associado.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedAssociate) return;
    setIsSaving(true);
    try {
      const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/investments/${myInvestment.id}/associate`,
        { associateId: selectedAssociate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toaster.create({ title: 'Associado vinculado!', type: 'success' });
      setSelectedAssociate('');
      onUpdate();
    } catch (err: any) {
      toaster.create({ title: err.response?.data?.error || 'Erro ao vincular associado.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box p={4} bg="gray.900" borderRadius="md" border="1px solid" borderColor="gray.700">
      <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={3}>
        Associado neste processo
      </Text>

      {currentAssociate ? (
        <HStack justify="space-between">
          <HStack gap={3}>
            <Avatar.Root size="sm">
              <Avatar.Fallback name={currentAssociate.name} />
            </Avatar.Root>
            <Text fontWeight="medium">{currentAssociate.name}</Text>
          </HStack>
          <Button
            size="sm"
            colorPalette="red"
            variant="solid"
            loading={isSaving}
            onClick={handleRemove}
            gap={1}
          >
            <Icon as={PiUserMinus} />
            Remover
          </Button>
        </HStack>
      ) : (
        <HStack gap={3}>
          <Box flex={1}>
            <Select.Root
              collection={associatesCollection}
              value={selectedAssociate ? [selectedAssociate] : []}
              onValueChange={(d) => setSelectedAssociate(d.value[0] || '')}
              size="sm"
            >
              <Select.Control>
                <Select.Trigger bgColor="gray.800" borderColor="gray.600">
                  <Select.ValueText placeholder="Selecionar associado..." />
                </Select.Trigger>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content bg="gray.800">
                    {associatesCollection.items.map(i => (
                      <Select.Item key={i.value} item={i}>{i.label}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Box>
          <Button
            size="sm"
            colorPalette="brand"
            variant="solid"
            loading={isSaving}
            disabled={!selectedAssociate}
            onClick={handleAdd}
            gap={1}
          >
            <Icon as={PiUserPlus} />
            Vincular
          </Button>
        </HStack>
      )}
    </Box>
  );
}

// ============================================================================
//  PÁGINA PRINCIPAL
// ============================================================================
export default function AssetDetailsPage() {
  const params = useParams();
  const legalOneId = params.legalOneId as string;
  const { user } = useAuth0();

  const roles: string[] = user?.['https://mazzotini.awer.co/roles'] || [];
  const isAssociate = roles.includes('ASSOCIATE');
  const isInvestor = roles.includes('INVESTOR');

  const { data: myProfile } = useApi<{ id: string }>('/api/users/me');

  const { data: asset, isLoading, error, mutate } = useApi<DetailedCreditAsset>(
    legalOneId ? `/api/assets/${legalOneId}` : null
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

  if (!asset) return <Text>Nenhum dado de processo para exibir.</Text>;

  return (
    <VStack w="100%" align="stretch" gap={8}>
      <Toaster />
      <AssetHeader asset={asset} />
      {isInvestor && myProfile?.id && (
        <AssociateSection asset={asset} myUserId={myProfile.id} onUpdate={mutate} />
      )}
      <AssetTabs asset={asset} hideDocuments={isAssociate} />
    </VStack>
  );
}
