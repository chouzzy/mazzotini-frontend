'use client';

import {
    Box,
    Container,
    Flex,
    Heading,
    Icon,
    SimpleGrid,
    Text,
    VStack,
} from '@chakra-ui/react';
import { motion, Variants } from 'framer-motion';
import { PiShieldCheck, PiHandshake, PiTrendUp } from 'react-icons/pi';

// ============================================================================
//  DADOS PARA OS CARDS DE VANTAGENS
// ============================================================================
const advantagesData = [
    {
        icon: PiTrendUp,
        title: 'Rentabilidade Atrativa',
        description:
            'Invista em processos com rentabilidade superior, frequentemente atrelada ao IPCA, protegendo seu capital da inflação e garantindo um crescimento real e seguro.',
    },
    {
        icon: PiShieldCheck,
        title: 'Transparência e Controle',
        description:
            'Acesse sua carteira de investimentos a qualquer momento através da nossa plataforma. Acompanhe o status, a valorização e o rendimento de cada processo em tempo real.',
    },
    {
        icon: PiHandshake,
        title: 'Liquidez e Oportunidade',
        description:
            'Nosso sistema conecta quem precisa de liquidez imediata a investidores, transformando direitos judiciais em oportunidades de investimento sólidas e com propósito.',
    },
];

// ============================================================================
//  VARIANTES DE ANIMAÇÃO (Framer Motion)
// ============================================================================
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
};

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: 'easeOut' },
    },
};

// ============================================================================
//  COMPONENTE PRINCIPAL: AdvantagesSection
// ============================================================================
export function AdvantagesSection() {
    const MotionBox = motion(Box);
    const MotionVStack = motion(VStack);

    return (
        <Flex flexDir={'column'} py={{ base: 16, md: 20 }} bgColor={'black'} w='100%' alignItems={'center'} justifyContent={'center'}>
            <MotionBox
                as="section"
                w="100%"
                py={{ base: 16, md: 24 }}
                px={{ base: 4, md: 8 }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={containerVariants}
            >
                <Container maxW="container.xl">
                    <VStack gap={{ base: 10, md: 16 }}>
                        <VStack gap={4} textAlign="center">
                            <Heading as="h2" size="2xl" fontWeight="bold">
                                Por que investir com a Mazzotini?
                            </Heading>
                            <Text color="gray.400" fontSize="lg" maxW="2xl">
                                Combinamos segurança jurídica com tecnologia para criar as melhores
                                oportunidades de investimento em créditos judiciais.
                            </Text>
                        </VStack>

                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={{ base: 8, md: 10 }}>
                            {advantagesData.map((advantage) => (
                                <MotionVStack
                                    key={advantage.title}
                                    p={8}
                                    bg="gray.800"
                                    borderRadius="2xl"
                                    borderWidth="1px"
                                    borderColor="transparent"
                                    gap={5}
                                    align="flex-start"
                                    variants={cardVariants}
                                    transition={{ duration: 0.3 }}
                                    _hover={{
                                        transform: 'translateY(-8px)',
                                        borderColor: 'brand.500', // Use a cor da sua marca aqui
                                        shadow: 'xl',
                                    }}
                                >
                                    <Flex
                                        w={16}
                                        h={16}
                                        align={'center'}
                                        justify={'center'}
                                        color={'brand.400'} // Use a cor da sua marca aqui
                                        bg={'gray.700'}
                                        borderRadius={'xl'}
                                    >
                                        <Icon as={advantage.icon} boxSize={8} />
                                    </Flex>
                                    <Heading as="h3" size="lg">
                                        {advantage.title}
                                    </Heading>
                                    <Text color="gray.300" fontSize="md">
                                        {advantage.description}
                                    </Text>
                                </MotionVStack>
                            ))}
                        </SimpleGrid>
                    </VStack>
                </Container>
            </MotionBox>
        </Flex>
    );
}
