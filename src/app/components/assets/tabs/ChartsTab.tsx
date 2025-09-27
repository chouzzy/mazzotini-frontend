'use client';

import { Flex, VStack, Icon, Heading, Text, Box } from '@chakra-ui/react';
import { PiChartLine } from 'react-icons/pi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock de dados para o gráfico, consistentes com uma história de valorização
const chartData = [
  { name: 'Aquisição', valor: 43000 },
  { name: 'Decisão 1', valor: 39500 }, // Valor diminuiu
  { name: 'Ajuste IPCA', valor: 41000 },
  { name: 'Decisão 2', valor: 52000 }, // Valor aumentou significativamente
  { name: 'Valor Atual', valor: 55250 },
];

const barChartData = [
    { name: 'Composição do Valor', "Valor Original": 50000, "Rendimento": 5250 },
]

export function ChartsTab() {
  return (
    <VStack gap={8} align="stretch">
        <Box p={6} bg="gray.900" borderRadius="lg">
            <Heading size="md" mb={6}>Evolução do Valor do Ativo</Heading>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="name" stroke="#A0AEC0" />
                <YAxis stroke="#A0AEC0" tickFormatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value as number)} />
                <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                <Legend />
                <Line type="monotone" dataKey="valor" stroke="#3182CE" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </Box>
        <Box p={6} bg="gray.900" borderRadius="lg">
            <Heading size="md" mb={6}>Composição do Valor Atual</Heading>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis type="number" stroke="#A0AEC0" tickFormatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value as number)} />
                    <YAxis type="category" dataKey="name" stroke="#A0AEC0" width={150} />
                    <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                    <Legend />
                    <Bar dataKey="Valor Original" stackId="a" fill="#3182CE" />
                    <Bar dataKey="Rendimento" stackId="a" fill="#38A169" />
                </BarChart>
            </ResponsiveContainer>
        </Box>
    </VStack>
  );
}
