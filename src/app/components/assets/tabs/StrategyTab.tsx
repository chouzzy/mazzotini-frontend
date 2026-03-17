'use client';

import { useState } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  Button, 
  Textarea, 
  Flex,
  Icon
} from '@chakra-ui/react';
import { PiTargetDuotone, PiPencilSimple, PiX, PiCheck } from 'react-icons/pi';
import { DetailedCreditAsset } from '@/app/processos/[processNumber]/page';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useSWRConfig } from 'swr';
import { toaster } from '@/components/ui/toaster';
import { useApi } from '@/hooks/useApi'; // 1. Adicione o import do useApi

interface StrategyTabProps {
  asset: DetailedCreditAsset;
}

export function StrategyTab({ asset }: StrategyTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [strategyInput, setStrategyInput] = useState(asset.strategyText || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const { getAccessTokenSilently } = useAuth0();
  const { mutate } = useSWRConfig();

  // 2. Busca o perfil do utilizador atual
  const { data: myProfile } = useApi<any>('/api/users/me');
  const isAdminOrOperator = myProfile?.role === 'ADMIN' || myProfile?.role === 'OPERATOR';

  const handleEdit = () => {
    setStrategyInput(asset.strategyText || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setStrategyInput(asset.strategyText || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_API_AUDIENCE,
        },
      });

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/${asset.id}/strategy`,
        { strategyText: strategyInput },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Atualiza o SWR globalmente para esta rota, forçando o recarregamento dos dados na tela
      mutate(`/api/assets/${asset.processNumber}`);
      
      setIsEditing(false);
      
      toaster.create({
        title: "Estratégia atualizada",
        type: "success",
        duration: 3000
      });
    } catch (error) {
      console.error("Erro ao salvar estratégia", error);
      toaster.create({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar a estratégia. Tente novamente.",
        type: "error",
        duration: 3000
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box p={6} bg="gray.800" borderRadius="lg" borderWidth="1px" borderColor="gray.700">
      <HStack justify="space-between" mb={6}>
        <HStack color="brand.400">
          <Icon as={PiTargetDuotone} boxSize={6} />
          <Heading size="md" color="white">Estratégia de Atuação</Heading>
        </HStack>
        
        {/* 3. Adicione isAdminOrOperator na condicional do botão */}
        {!isEditing && isAdminOrOperator && (
          <Button size="sm" colorPalette="blue" variant="surface" onClick={handleEdit}>
            <Icon as={PiPencilSimple} mr={2} />
            {asset.strategyText ? 'Editar' : 'Definir Estratégia'}
          </Button>
        )}
      </HStack>

      {isEditing ? (
        <VStack align="stretch" gap={4}>
          <Textarea
            value={strategyInput}
            onChange={(e) => setStrategyInput(e.target.value)}
            placeholder="Descreva a estratégia detalhada para a condução deste processo. Esta informação é fixa e orienta a equipa..."
            rows={12}
            bg="gray.900"
            color="white"
            borderColor="gray.600"
            _hover={{ borderColor: "brand.500" }}
            _focus={{ borderColor: "brand.500", boxShadow: "outline" }}
            p={4}
          />
          <HStack justify="flex-end" pt={2}>
            <Button variant="ghost" color="gray.400" onClick={handleCancel} disabled={isSaving}>
              <Icon as={PiX} mr={2} /> Cancelar
            </Button>
            <Button
              colorPalette="blue"
              loading={isSaving}
              onClick={handleSave}
            >
              <Icon as={PiCheck} mr={2} /> Salvar Estratégia
            </Button>
          </HStack>
        </VStack>
      ) : (
        <Box>
          {asset.strategyText ? (
            <Text 
              whiteSpace="pre-wrap" 
              color="gray.300" 
              lineHeight="tall"
              p={4}
              bg="whiteAlpha.50"
              borderRadius="md"
            >
              {asset.strategyText}
            </Text>
          ) : (
            <Flex align="center" justify="center" p={10} borderStyle="dashed" borderWidth="1px" borderColor="gray.700" borderRadius="md">
              <VStack color="gray.500">
                <Icon as={PiTargetDuotone} boxSize={8} opacity={0.5} mb={2} />
                <Text>Nenhuma estratégia definida para este processo ainda.</Text>
                <Text fontSize="sm">Clique em "Definir Estratégia" para adicionar.</Text>
              </VStack>
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
}