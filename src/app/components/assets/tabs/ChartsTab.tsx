// /src/app/components/assets/tabs/ChartsTab.tsx
'use client';

import { Box, Heading, VStack, Text } from '@chakra-ui/react';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DetailedCreditAsset } from '@/app/ativos/[processNumber]/page';

interface TabProps {
    asset: DetailedCreditAsset;
}

export function ChartsTab({ asset }: TabProps) {
    
    // Lógica para criar o array de dados do gráfico de linha
    const lineChartData = useMemo(() => {
        if (!asset) return [];

        // O primeiro ponto é sempre o valor de aquisição
        const dataPoints = [{
            name: new Date(asset.acquisitionDate).toLocaleDateString('pt-BR'),
            valor: asset.acquisitionValue,
            label: 'Aquisição'
        }];

        // Adiciona cada atualização, ordenada da mais antiga para a mais nova
        const sortedUpdates = [...asset.updates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sortedUpdates.forEach(update => {
            // Apenas adiciona pontos ao gráfico se o valor for válido
            if (update.updatedValue && update.updatedValue > 0) {
                 dataPoints.push({
                    name: new Date(update.date).toLocaleDateString('pt-BR'),
                    valor: update.updatedValue,
                    label: update.description || 'Atualização'
                });
            }
        });

        return dataPoints;
    }, [asset]);

    // Lógica para criar o array de dados do gráfico de barras
    const barChartData = useMemo(() => {
        if (!asset) return [];
        const rendimento = asset.currentValue - asset.acquisitionValue;
        const rendimentoArredondado = parseFloat(rendimento.toFixed(2));
        return [
            { name: 'Composição', "Valor Investido": asset.acquisitionValue, "Rendimento": rendimentoArredondado > 0 ? rendimentoArredondado : 0 },
        ]
    }, [asset]);


  return (
    <VStack gap={8} align="stretch">
        <Box p={6} bg="gray.900" borderRadius="lg">
            <Heading size="md" mb={6}>Evolução do Valor do Ativo</Heading>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="name" stroke="#A0AEC0" />
                    <YAxis stroke="#A0AEC0" tickFormatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value as number)} />
                    <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                    <Legend />
                    <Line type="monotone" dataKey="valor" name="Valor do Ativo" stroke="#3182CE" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </Box>
        <Box p={6} bg="gray.900" borderRadius="lg">
            <Heading size="md" mb={6}>Composição do Valor Atual</Heading>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis type="number" stroke="#A0AEC0" tickFormatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value as number)} />
                    <YAxis type="category" dataKey="name" stroke="#A0AEC0" width={120} />
                    <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                    <Legend />
                    <Bar dataKey="Valor Investido" stackId="a" fill="#3182CE" />
                    <Bar dataKey="Rendimento" stackId="a" fill="#38A169" />
                </BarChart>
            </ResponsiveContainer>
        </Box>
    </VStack>
  );
}
