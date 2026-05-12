'use client';

import {
  SimpleGrid,
  Card,
  Text,
  Icon,
  VStack,
  Flex,
  Badge,
  HStack,
  Box
} from '@chakra-ui/react';
// IMPORTAMOS NOVOS ÍCONES AQUI:
import { PiClockClockwise, PiFilePdf, PiFileText, PiImage, PiFile } from 'react-icons/pi';
import { DetailedCreditAsset } from '@/app/processos/[legalOneId]/page';
import { extractFreeText } from '@/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { useApi } from '@/hooks/useApi';

// FUNÇÃO PARA ÍCONE DINÂMICO
const getFileIcon = (filename: string) => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return { icon: PiFilePdf, color: 'red.400' };
    if (['doc', 'docx'].includes(ext)) return { icon: PiFileText, color: 'blue.400' };
    if (['jpg', 'jpeg', 'png'].includes(ext)) return { icon: PiImage, color: 'purple.400' };
    return { icon: PiFile, color: 'gray.400' };
};

interface TabProps {
    asset: DetailedCreditAsset;
}

export function OverviewTab({ asset }: TabProps) {
    const { data: myProfile } = useApi<any>('/api/users/me');

    // Investimento do usuário logado neste processo (se existir)
    const myInvestment = asset.investors?.find(inv => inv.user?.id === myProfile?.id);
    const myAcquisitionDate = myInvestment?.acquisitionDate
        ? new Date(myInvestment.acquisitionDate).toLocaleDateString('pt-BR')
        : null;

    // Usa dados reais se existirem
    const updates = asset.updates && asset.updates.length > 0 ? asset.updates : [];
    const documents = asset.documents && asset.documents.length > 0 ? asset.documents : [];

    const lastUpdate = updates.length > 0 ? updates[0] : null;
    const documentCount = documents.length;
    
    // Pega o último documento para exibição e define seu ícone dinâmico
    const mostRecentDoc = documentCount > 0 ? documents[0] : null;
    const { icon: DocIcon, color: docColor } = mostRecentDoc ? getFileIcon(mostRecentDoc.name) : { icon: PiFilePdf, color: 'red.400' };

    const titleText = lastUpdate ? extractFreeText(lastUpdate.description) : "";

    return (
        <SimpleGrid columns={{ base: 1, lg: 3 }} gap={8}>
            
            {/* Card de Detalhes da Aquisição */}
            <Card.Root bg="gray.900">
                <Card.Body>
                    <Card.Title color={'brand.600'} mb={4}>Detalhes do Processo</Card.Title>
                    <VStack align="stretch" gap={3}>
                        <Flex justify="space-between" borderBottom="1px solid" borderColor="whiteAlpha.100" pb={2}>
                            <Text color="gray.400" fontSize="sm">Cliente Principal</Text>
                            <Text fontWeight="medium" textAlign="right">{myProfile?.name || asset.originalCreditor}</Text>
                        </Flex>
                        <Flex justify="space-between" borderBottom="1px solid" borderColor="whiteAlpha.100" pb={2}>
                            <Text color="gray.400" fontSize="sm">Parte Contrária / Apelido</Text>
                            <Text fontWeight="medium" textAlign="right">{asset.nickname || 'N/A'}</Text>
                        </Flex>
                        <Flex justify="space-between" borderBottom="1px solid" borderColor="whiteAlpha.100" pb={2}>
                            <Tooltip
                                content="Data em que a Mazzotini adquiriu este crédito judicial. Pode ser diferente da data em que você individualmente entrou na operação."
                                showArrow
                            >
                                <Text color="gray.400" fontSize="sm" cursor="help" textDecoration="underline dotted">Data da Cessão</Text>
                            </Tooltip>
                            <Text fontWeight="medium" textAlign="right">
                                {new Date(asset.acquisitionDate).toLocaleDateString('pt-BR')}
                            </Text>
                        </Flex>
                        {myAcquisitionDate && (
                            <Flex justify="space-between" borderBottom="1px solid" borderColor="whiteAlpha.100" pb={2}>
                                <Tooltip
                                    content="Data em que você adquiriu sua participação neste processo. Pode ser diferente da data de cessão geral do crédito."
                                    showArrow
                                >
                                    <Text color="gray.400" fontSize="sm" cursor="help" textDecoration="underline dotted">Data da sua Aquisição</Text>
                                </Tooltip>
                                <Text fontWeight="medium" textAlign="right">{myAcquisitionDate}</Text>
                            </Flex>
                        )}
                        <Flex justify="space-between" pb={2}>
                            <Text color="gray.400" fontSize="sm">Índice de Correção</Text>
                            <Text fontWeight="medium" textAlign="right">
                                {asset.updateIndexType} 
                                {asset.contractualIndexRate ? ` + ${asset.contractualIndexRate}%` : ''}
                            </Text>
                        </Flex>
                    </VStack>
                </Card.Body>
            </Card.Root>
            
            {/* Card de Resumo do Histórico */}
            <Card.Root bg="gray.900">
                <Card.Body>
                    <Card.Title color={'brand.600'}>Última Atualização Processual</Card.Title>
                    {lastUpdate ? (
                        <VStack align="stretch" mt={4} gap={2}>
                            <Flex justify="space-between" align="start" gap={2}>
                                <Flex align="start" gap={2}>
                                    <Icon as={PiClockClockwise} mt={1} color="brand.400" />
                                    <Text lineClamp={2} fontWeight="medium" fontSize="sm">
                                        {titleText}
                                    </Text>
                                </Flex>
                                {!lastUpdate.read && <Badge colorPalette="blue" size="sm">Novo</Badge>}
                            </Flex>
                            <Text fontSize="xs" color="gray.500" ml={6}>
                                Em: {new Date(lastUpdate.date).toLocaleDateString('pt-BR')}
                            </Text>
                             <Text fontSize="xs" color="gray.400" mt={4}>
                                Acesse a aba <strong style={{color:'#d2be82'}}>Histórico Processual</strong> para ver todos os detalhes.
                            </Text>
                        </VStack>
                    ) : (
                        <Text color="gray.500" mt={4}>Nenhuma atualização encontrada ainda.</Text>
                    )}
                </Card.Body>
            </Card.Root>
            
            {/* Card de Resumo dos Documentos */}
            <Card.Root bg="gray.900">
                <Card.Body>
                    <Card.Title color={'brand.600'}>Documentos Anexados</Card.Title>
                    
                     {documentCount > 0 && mostRecentDoc ? (
                        <VStack align="stretch" mt={4} gap={4}>
                             <Flex align="center" justify="space-between">
                                <HStack>
                                    <Icon as={DocIcon} color={docColor} boxSize={6}/>
                                    <VStack align="start" gap={0}>
                                        <Text fontWeight="bold" fontSize="lg">{documentCount}</Text>
                                        <Text fontSize="xs" color="gray.400">Documento(s) Disponível(is)</Text>
                                    </VStack>
                                </HStack>
                            </Flex>

                             <Box p={3} bg="whiteAlpha.50" borderRadius="md">
                                <Text fontSize="xs" color="gray.400" mb={1}>Arquivo mais recente:</Text>
                                <Text fontSize="sm" fontWeight="medium" truncate>
                                    {mostRecentDoc.name}
                                </Text>
                             </Box>

                            <Text fontSize="xs" color="gray.400">
                                Acesse a aba <strong style={{color:'#d2be82'}}>Documentos</strong> para visualizar e baixar.
                            </Text>
                        </VStack>
                    ) : (
                        <Text color="gray.500" mt={4}>Nenhum documento anexado.</Text>
                    )}
                </Card.Body>
            </Card.Root>

        </SimpleGrid>
    );
}