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
import { Hero } from "./layout/Home/Hero";
import homepageData from "../data/homepage";
import { FaqSection } from "./layout/Home/FAQ";
import { AdvantagesSection } from "./layout/Home/AdvantagesSection";
import { FeedbacksCarousel } from "./layout/Feedbacks/FeedbacksCarousel";



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
        <Flex flexDir={'column'} w='100%' alignItems={'center'} justifyContent={'center'}>
            <Flex as="main" flex={1}
            w='100%'
                flexDir={'column'}
            >
                {isAuthenticated ? (
                    <LoggedInWelcome />
                ) : (
                    <>
                        <Hero pageData={homepageData} />
                        <AdvantagesSection />
                        <FeedbacksCarousel/>
                    </>
                )}
            </Flex>
            <FaqSection />
        </Flex>
    )
}