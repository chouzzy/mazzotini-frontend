'use client';

import { Box, Heading } from '@chakra-ui/react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { InvestorCreditAsset } from './CreditAssetCard';
import { useMemo } from 'react';

const COLORS = {
  'Ativo': '#38A169', // green
  'Em Negociação': '#D69E2E', // yellow
  'Liquidado': '#718096', // gray
};

interface PortfolioChartProps {
    assets: InvestorCreditAsset[];
}

export function PortfolioChart({ assets }: PortfolioChartProps) {
    const chartData = useMemo(() => {
        if (!assets || assets.length === 0) return [];
        
        const portfolioByStatus = assets.reduce((acc, asset) => {
            const status = asset.status;
            if (!acc[status]) {
                acc[status] = { name: status, value: 0 };
            }
            acc[status].value += asset.currentValue;
            return acc;
        }, {} as Record<string, { name: string, value: number }>);

        return Object.values(portfolioByStatus);
    }, [assets]);

    if (chartData.length === 0) return null;

    return (
        <Box>
            <Heading as="h2" size="lg" mb={6}>Composição do Portfólio</Heading>
            <Box p={6} bg="gray.900" borderRadius="lg" h="300px">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }}
                            formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number)}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
}
