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
    Badge,
} from '@chakra-ui/react';
// 1. Importar o novo ícone e o router
import { PiWallet, PiScales, PiChartLineUp, PiArrowsClockwise, PiPencilSimple, PiGavelDuotone, PiIdentificationCardDuotone } from 'react-icons/pi';
import { DetailedCreditAsset } from '@/app/processos/[legalOneId]/page';
import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { Toaster, toaster } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation'; 
import { Tooltip } from '@/components/ui/tooltip';
import { useApi } from '@/hooks/useApi'; // <-- Importar o hook da API

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

interface AssetHeaderProps {
    asset: DetailedCreditAsset;
}

export function AssetHeader({ asset }: AssetHeaderProps) {
    const [isSyncing, setIsSyncing] = useState(false);
    const { getAccessTokenSilently } = useAuth0();
    const router = useRouter(); 

    // Busca o perfil para saber se é Admin ou Operador
    const { data: myProfile } = useApi<any>('/api/users/me');
    const isAdminOrOperator = myProfile?.role === 'ADMIN' || myProfile?.role === 'OPERATOR';

    console.log('AssetHeader asset:', asset);

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

            await axios.post(
                `${apiBaseUrl}/api/assets/${asset.legalOneId}/sync`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setTimeout(() => {
                toaster.create({
                    title: 'Sincronização Concluída!',
                    description: "Os dados do processo foram atualizados.",
                    type: 'success',
                    duration: 5000,
                    closable: true,
                });
                window.location.reload();
            }, 3000);

        } catch (error) {
            toaster.create({
                title: 'Erro na Sincronização',
                description: 'Não foi possível buscar as atualizações. Tente novamente.',
                type: 'error',
                duration: 5000,
                closable: true,
            });
        } finally {
            setTimeout(() => setIsSyncing(false), 3000);
        }
    };

    const handleEdit = () => {
        router.push(`/processos/${asset.legalOneId}/editar`);
    };

    return (
        <VStack w="100%" align="stretch" gap={8}>

            <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'row' }} gap={4}>
                <VStack align="start" gap={2}>
                        <Flex>
                            {asset.legalOneType == 'Lawsuit' && (<Badge colorPalette="blue" color={'white'} variant={'solid'} borderRadius={2} mt={0.5} textTransform="uppercase">Processo Principal</Badge>)}
                            {asset.legalOneType == 'Appeal' && (<Badge colorPalette="orange" color={'white'} variant={'solid'} borderRadius={2} mt={0.5} textTransform="uppercase">Recurso</Badge>)}
                            {asset.legalOneType == 'ProceduralIssue' && (<Badge colorPalette="purple" color={'white'} variant={'solid'} borderRadius={2} mt={0.5} textTransform="uppercase">Incidente</Badge>)}
                        </Flex>
                    <Flex align="center" gap={2}>
                        <PiGavelDuotone color='#B8A76E' size={24} />
                        <Heading as="h1" color="white">{asset.processNumber}</Heading>
                    </Flex>
                    <Flex align="center" gap={2}>
                        <PiScales color='#B8A76E' size={24} />
                        <Text color="gray.400">{asset.origemProcesso || "Processo N°"}</Text>
                    </Flex>
                    {asset.nickname && (
                        <Flex align="center" gap={2}>
                            <PiIdentificationCardDuotone color='#B8A76E' size={24} />
                            <Text color="gray.400">{asset.nickname}</Text>
                        </Flex>
                    )}
                </VStack>
                <Flex gap={4} align="center" wrap="wrap">

                    {/* TRAVA VISUAL: Só mostra Editar e Sincronizar se for Admin/Operador */}
                    {isAdminOrOperator && (
                        <>
                            <Button
                                onClick={handleEdit}
                                colorScheme="black" 
                                gap={2}
                            >
                                <Icon as={PiPencilSimple} />
                                Editar
                            </Button>

                            <Button
                                onClick={handleSync}
                                loading={isSyncing}
                                loadingText="A Sincronizar"
                                bgColor="brand.500"
                                gap={2} 
                            >
                                <Icon as={PiArrowsClockwise} /> 
                                Sincronizar Andamentos
                            </Button>
                        </>
                    )}
                    
                    <Tag.Root size="lg" variant="solid" colorScheme={getStatusColorScheme(asset.status)}>
                        <Tag.Label>{asset.status}</Tag.Label>
                    </Tag.Root>
                </Flex>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
                <Tooltip
                    showArrow
                    contentProps={{ css: { "--tooltip-bg": "#B8A76E", padding: "8px", fontSize: "14px", fontStyle: "italic", fontWeight: 'normal' } }}
                    content="Este é o valor total estimado do crédito no processo. Não representa um valor exato de valorização nem a sua participação específica, mas sim o montante total do processo."
                >
                    <Stat.Root bg="gray.900" p={5} borderRadius="md" cursor="pointer">
                        <Stat.Label color={'gray.200'} display="flex" alignItems="center" gap={2}><Icon as={PiWallet} color={'brand.600'} /> Estimativa Atual do Valor Total do Crédito</Stat.Label>
                        <Stat.ValueText fontSize="2xl">{formatCurrency(asset.currentValue)}</Stat.ValueText>
                    </Stat.Root>
                </Tooltip>
            </SimpleGrid>
        </VStack>
    );
}