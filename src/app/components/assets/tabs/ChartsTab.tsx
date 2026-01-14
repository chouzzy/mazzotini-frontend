'use client';

import { Box, Heading, VStack, Spinner, Flex } from '@chakra-ui/react';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DetailedCreditAsset } from '@/app/processos/[processNumber]/page';
import { useApi } from '@/hooks/useApi'; // Importar o useApi

interface TabProps {
    asset: DetailedCreditAsset;
}

// Interface para a resposta da API de projeção
interface ProjectionResponse {
    currentEstimatedValue: number;
    timeline: { date: string; value: number }[];
}

// Funções de formatação
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatCurrencyCompact = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);

// Helper para formatar a data do eixo X (ex: Nov/25)
const formatChartDate = (dateString: string) => {
     // A data vem como YYYY-MM-DD
     // Adicionamos T00:00:00 para garantir que seja UTC e não haja problemas de fuso
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}


export function ChartsTab({ asset }: TabProps) {
    
    // 1. Buscar os dados da projeção futura (endpoint /estimate)
    const { data: projection, isLoading: isLoadingProjection } = useApi<ProjectionResponse>(
        asset ? `/api/assets/${asset.id}/estimate` : null
    );
    
    // ATUALIZADO: O gráfico de linha agora usa *APENAS* os dados da projeção
    const lineChartData = useMemo(() => {
        
        // Se a projeção (que vem do /estimate) não carregou, retorna array vazio.
        if (!projection?.timeline) {
            return [];
        }

        // Mapeia a timeline (que já inclui o ponto 'hoje' + 24 meses)
        const projectedPoints = projection.timeline.map(point => ({
            name: formatChartDate(point.date),
            date: new Date(point.date + 'T00:00:00'),
            "Projeção": point.value // O dataKey agora é só "Projeção"
        }));

        return projectedPoints;

    }, [projection]); // Depende SÓ da projeção

    // Gráfico de Barras (não precisa mudar)
    const barChartData = useMemo(() => {
        if (!asset) return [];
        const rendimento = asset.currentValue - asset.acquisitionValue;
        return [
            { name: 'Composição', "Valor Investido": asset.acquisitionValue, "Rendimento": rendimento > 0 ? rendimento : 0 },
        ]
    }, [asset]);


    return (
        <VStack gap={8} align="stretch">
            <Box p={6} bg="gray.900" borderRadius="lg">
                <Heading size="md" mb={6}>Projeção de Evolução dos Valores</Heading>
                <ResponsiveContainer width="100%" height={300}>
                    {/* Exibe um spinner enquanto a projeção carrega */}
                    {isLoadingProjection ? (
                        <Flex w="100%" h="100%" justify="center" align="center">
                            <Spinner size="xl" />
                        </Flex>
                    ) : (
                        <LineChart data={lineChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                            <XAxis dataKey="name" stroke="#A0AEC0" />
                            <YAxis stroke="#A0AEC0" tickFormatter={(value) => formatCurrencyCompact(value as number)} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }}
                                formatter={(value: any) => formatCurrency(value)}
                            />
                            <Legend />
                            {/* LINHA ÚNICA: PROJEÇÃO (baseada no /estimate) */}
                            <Line 
                                type="monotone" 
                                dataKey="Projeção" 
                                name="Projeção (Índice + Taxa)" 
                                stroke="#3182CE" // Cor principal
                                strokeWidth={3} 
                                activeDot={{ r: 8 }} 
                                connectNulls={false}
                            />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </Box>
            
            {/* Gráfico de Barras (sem alteração) */}
            <Box p={6} bg="gray.900" borderRadius="lg">
                <Heading size="md" mb={6}>Composição do Valor Atual</Heading>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                        <XAxis type="number" stroke="#A0AEC0" tickFormatter={(value) => formatCurrencyCompact(value as number)} />
                        <YAxis type="category" dataKey="name" stroke="#A0AEC0" width={120} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }}
                            formatter={(value: any) => formatCurrency(value)}
                        />
                        <Legend />
                        <Bar dataKey="Valor Investido" stackId="a" fill="#3182CE" />
                        <Bar dataKey="Rendimento" stackId="a" fill="#38A169" />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </VStack>
    );
}
