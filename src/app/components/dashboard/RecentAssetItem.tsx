'use client';

import { Flex, VStack, Text, Button, Icon, Link } from '@chakra-ui/react';
import { PiArrowRight } from 'react-icons/pi';
import NextLink from 'next/link';
import { InvestorCreditAsset } from './CreditAssetCard';

export function RecentAssetItem({ asset }: { asset: InvestorCreditAsset }) {
    return (
        <Flex
            justify="space-between"
            align="center"
            w="100%"
            p={4}
            bg="gray.900"
            borderRadius="md"
            _hover={{ bg: 'gray.700' }}
        >
            <VStack align="start" gap={0}>
                <Text fontWeight="bold">{asset.processNumber}</Text>
                <Text fontSize="sm" color="gray.400">
                    Data da Contratação: {new Date(asset.acquisitionDate).toLocaleDateString('pt-BR')}
                </Text>
            </VStack>
            <Link as={NextLink} href={`/processos/${asset.processNumber}`} _hover={{ textDecoration: 'none' }}>
                <Button size="sm" _hover={{ bg: 'brand.600' }} bgColor="gray.500" color="white">
                    Ver Detalhes <Icon as={PiArrowRight} ml={2} />
                </Button>
            </Link>
        </Flex>
    );
}
