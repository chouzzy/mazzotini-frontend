'use client';

import { Flex, VStack, Icon, Heading, Text } from '@chakra-ui/react';
import { PiChartLine } from 'react-icons/pi';

export function ChartsTab() {
    return (
        <Flex
            p={{ base: 4, md: 8 }}
            border="2px dashed"
            borderColor="gray.700"
            borderRadius="lg"
            justify="center"
            align="center"
            minH="300px"
            bg="gray.900"
        >
            <VStack gap={4} textAlign="center">
                <Icon as={PiChartLine} boxSize={12} color="gray.500" />
                <Heading size="md" color="gray.300">Em Breve: Análise Gráfica</Heading>
                <Text color="gray.400" maxW="md">
                    Estamos a preparar uma visualização detalhada da performance e evolução do valor do seu ativo. Volte em breve para acompanhar os seus investimentos de forma ainda mais clara.
                </Text>
            </VStack>
        </Flex>
    );
}

