'use client'

import {
    Container,
    Stack,
    Accordion,
    AccordionItem,
    Heading,
    Text,
    Button,
    Flex,
    Icon,
    Box,
    VStack,
    SimpleGrid,
    Stat,
    StatLabel,
    Spinner,
    Span,
    Link,
} from "@chakra-ui/react";
import { useAuth0 } from "@auth0/auth0-react";
import { motion } from 'framer-motion';
import { Header } from "./layout/Header";
import { PiChartLineUp, PiSignIn, PiWallet } from "react-icons/pi";
import NextLink from 'next/link';
import { Footer } from "./layout/Footer";

// ============================================================================
//  SEÇÃO "HERO" PARA VISITANTES (NÃO LOGADOS)
// ============================================================================
function HeroSection() {
    const { loginWithRedirect } = useAuth0();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Container maxW="container.lg" py={{ base: 16, md: 24 }} textAlign="center">
                <VStack gap={6}>
                    <Heading as="h1" size={{ base: "xl", md: "3xl" }} fontWeight="extrabold">
                        Transforme Ativos Judiciais em Liquidez Imediata
                    </Heading>
                    <Text fontSize={{ base: "lg", md: "xl" }} color="gray.400" maxW="3xl" mx="auto">
                        A Mazzotini conecta investidores a oportunidades de crédito judicial, oferecendo rentabilidade superior com a segurança da taxa IPCA, enquanto proporciona liquidez para quem mais precisa.
                    </Text>
                    <Button
                        size="lg"
                        colorScheme="blue"
                        onClick={() => loginWithRedirect()}
                    >
                        Acessar Plataforma
                        <Icon as={PiSignIn} />
                    </Button>
                </VStack>
            </Container>
        </motion.div>
    );
}

// ============================================================================
//  SEÇÃO DE PERGUNTAS FREQUENTES (FAQ)
// ============================================================================
const faqData = [
    {
        question: "O que é um ativo de crédito judicial?",
        answer: "É um direito de receber um valor determinado em uma ação judicial, que pode ser vendido a um investidor. A pessoa que tem o direito vende por um valor menor para receber o dinheiro imediatamente (liquidez), e o investidor assume o direito de receber o valor total no futuro, lucrando com a valorização."
    },
    {
        question: "Qual a rentabilidade esperada?",
        answer: "A maioria dos nossos ativos é corrigida pela taxa do IPCA (Índice Nacional de Preços ao Consumidor Amplo), protegendo seu capital da inflação. Além disso, podem haver juros contratuais que aumentam a rentabilidade. É uma forma de investimento de baixo risco com retornos atrativos."
    },
    {
        question: "Como posso acompanhar meus investimentos?",
        answer: "Nossa plataforma SGI (Sistema de Gestão de Investimentos) permite que você, investidor, acesse sua carteira a qualquer momento, visualize o valor atualizado de cada ativo, o status do processo e a rentabilidade acumulada."
    }
];

function FaqSection() {
    return (
        <Container maxW="container.lg" py={{ base: 16, md: 20 }}>
            <VStack gap={8}>
                <Heading as="h2" size="xl">Dúvidas Frequentes</Heading>
                <Accordion.Root collapsible defaultValue={[]}>
                    {faqData.map((item, index) => (
                        <Accordion.Item key={index} value={String(index)}>
                            <Accordion.ItemTrigger>
                                <Span flex="1" textAlign="left" fontSize="lg" fontWeight="semibold">{item.question}</Span>
                                <Accordion.ItemIndicator />
                            </Accordion.ItemTrigger>
                            <Accordion.ItemContent>
                                <Accordion.ItemBody fontSize="md" color="gray.300">{item.answer}</Accordion.ItemBody>
                            </Accordion.ItemContent>
                        </Accordion.Item>
                    ))}
                </Accordion.Root>
            </VStack>
        </Container>
    );
}

// ============================================================================
//  PAINEL DE BOAS-VINDAS (USUÁRIO LOGADO)
// ============================================================================
function LoggedInWelcome() {
    const { user } = useAuth0();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Container maxW="container.lg" py={{ base: 16, md: 24 }}>
                <VStack gap={8} align="start">
                    <Heading as="h1" size={{ base: "xl", md: "2xl" }}>
                        Olá, {user?.given_name || user?.name}!
                    </Heading>
                    <Text fontSize={{ base: "lg", md: "xl" }} color="gray.400">
                        Bem-vindo(a) de volta à sua central de investimentos.
                    </Text>
                    <Link
                        href="/dashboard"
                        textDecoration="none"
                    >
                        <Button
                            size="lg"
                            colorScheme="blue"
                        >
                            Ver Meus Investimentos
                            <Icon as={PiChartLineUp} />
                        </Button>
                    </Link>

                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} w="100%" pt={10}>
                        <Stat.Root bg="gray.800" p={5} borderRadius="md">
                            <Stat.Label display="flex" alignItems="center" gap={2}><Icon as={PiWallet} /> Ativos na Carteira</Stat.Label>
                            <Stat.ValueText>Carregando...</Stat.ValueText>
                        </Stat.Root>
                        <Stat.Root bg="gray.800" p={5} borderRadius="md">
                            <Stat.Label display="flex" alignItems="center" gap={2}><Icon as={PiChartLineUp} /> Rendimento Acumulado</Stat.Label>
                            <Stat.ValueText>Carregando...</Stat.ValueText>
                        </Stat.Root>
                    </SimpleGrid>
                </VStack>
            </Container>
        </motion.div>
    );
}

// ============================================================================
//  COMPONENTE PRINCIPAL: Homepage
// ============================================================================
export function Homepage() {
    const { isAuthenticated, isLoading } = useAuth0();

    if (isLoading) {
        return (
            <Flex w="100%" h="100vh" justify="center" align="center">
                <Spinner size="xl" />
            </Flex>
        );
    }

    return (
        <Flex flexDir={'column'}>
            <Box as="main" flex={1}>
                {isAuthenticated ? (
                    <LoggedInWelcome />
                ) : (
                    <>
                        <HeroSection />
                        <FaqSection />
                    </>
                )}
            </Box>

            <Footer />
        </Flex>
    )
}