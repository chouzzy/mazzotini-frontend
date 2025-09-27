'use client';

import {
  SimpleGrid,
  Card,
  CardTitle,
  Text,
  Icon,
  VStack,
  Flex,
  Badge
} from '@chakra-ui/react';
import { PiUser, PiClockClockwise, PiFilePdf } from 'react-icons/pi';
import { DetailedCreditAsset } from '@/app/ativos/[processNumber]/page';

// DADOS MOCKADOS (importados ou definidos para fallback)
const mockUpdates = [
    {
      id: 'mock1',
      date: '2025-09-15T10:00:00Z',
      updatedValue: 55250,
      description: 'Sentença favorável em segunda instância',
      read: false,
    },
];

const mockDocuments = [
    {
        name: 'Contrato de Cessão de Crédito.pdf',
        url: '#',
        category: 'Contrato'
    },
];

interface TabProps {
    asset: DetailedCreditAsset;
}

export function OverviewTab({ asset }: TabProps) {
    // Lógica inteligente: usa os dados reais se existirem, senão, usa os mocks.
    const updates = asset.updates && asset.updates.length > 0 ? asset.updates : mockUpdates;
    const documents = asset.documents && asset.documents.length > 0 ? asset.documents : mockDocuments;

    const lastUpdate = updates[0];
    const documentCount = documents.length;

    return (
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8}>
            {/* Card de Detalhes da Aquisição */}
            <Card.Root variant="outline" bg="gray.900">
                <Card.Body>
                    <Card.Title color={'brand.600'}>Detalhes da Aquisição</Card.Title>
                    <Text><strong style={{color:'#a8a8a8', fontStyle:'italic'}}>Credor Original:</strong> {asset.originalCreditor}</Text>
                    <Text><strong style={{color:'#a8a8a8', fontStyle:'italic'}}>Data de Aquisição:</strong> {new Date(asset.acquisitionDate).toLocaleDateString('pt-BR')}</Text>
                    <Text><strong style={{color:'#a8a8a8', fontStyle:'italic'}}>Índice de Correção:</strong> {asset.updateIndexType || 'N/A'}</Text>
                </Card.Body>
            </Card.Root>
            
            {/* Card de Envolvidos */}
            <Card.Root variant="outline" bg="gray.900">
                <Card.Body>
                    <Card.Title color={'brand.600'}>Envolvidos</Card.Title>
                    {asset.investors.map(inv => (
                        <Text key={inv.user.name}><Icon as={PiUser} mr={2} /> <strong style={{color:'#a8a8a8', fontStyle:'italic'}}>Investidor:</strong> {inv.user.name} ({inv.investorShare}%)</Text>
                    ))}
                    {asset.associate && <Text mt={2}><Icon as={PiUser} mr={2} /> <strong style={{color:'#a8a8a8', fontStyle:'italic'}}>Associado:</strong> {asset.associate.name}</Text>}
                </Card.Body>
            </Card.Root>

            {/* Card de Resumo do Histórico */}
            <Card.Root variant="outline" bg="gray.900">
                <Card.Body>
                    <Card.Title color={'brand.600'}>Última Atualização Processual</Card.Title>
                    {lastUpdate ? (
                        <VStack align="stretch" mt={4} gap={2}>
                            <Flex justify="space-between" align="center">
                                <Text maxLines={1}><Icon as={PiClockClockwise} mr={2} />{lastUpdate.description || 'Atualização de Valor'}</Text>
                                {!lastUpdate.read && <Badge colorScheme="blue">Novo</Badge>}
                            </Flex>
                            <Text fontSize="sm" color="gray.400">
                                Em: {new Date(lastUpdate.date).toLocaleDateString('pt-BR')}
                            </Text>
                             <Text fontSize="sm" color="gray.300" mt={2}>
                                Acesse a aba <strong style={{color:'#a8a8a8', fontStyle:'italic'}}>Histórico Processual</strong> para ver todos os detalhes.
                            </Text>
                        </VStack>
                    ) : (
                        <Text color="gray.500" mt={4}>Nenhuma atualização encontrada.</Text>
                    )}
                </Card.Body>
            </Card.Root>
            
            {/* Card de Resumo dos Documentos */}
            <Card.Root variant="outline" bg="gray.900">
                <Card.Body>
                    <Card.Title color={'brand.600'}>Documentos Anexados</Card.Title>
                     {documentCount > 0 ? (
                        <VStack align="stretch" mt={4} gap={2}>
                             <Flex align="center">
                                <Icon as={PiFilePdf} mr={2} boxSize={5}/>
                                <Text>
                                    <strong style={{color:'#a8a8a8', fontStyle:'italic'}}>{documentCount}</strong> documento{documentCount > 1 ? 's' : ''} na plataforma.
                                </Text>
                            </Flex>
                             <Text fontSize="sm" color="gray.400" maxLines={4}>
                                O mais recente é "{documents[0].name}".
                            </Text>
                            <Text fontSize="sm" color="gray.300" mt={2}>
                                Acesse a aba <strong style={{color:'#a8a8a8', fontStyle:'italic'}}>Documentos</strong> para visualizá-los.
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

