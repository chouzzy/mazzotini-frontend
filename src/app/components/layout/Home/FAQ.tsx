import { Flex, VStack, Heading, Accordion, Span } from "@chakra-ui/react";

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

export function FaqSection() {
    return (
        <Flex flexDir={'column'} py={{ base: 16, md: 20 }} bgColor={'black'} w='100%' alignItems={'center'} justifyContent={'center'}>
            <VStack gap={8} maxW={{ base: '100%', md: '1920px' }} w='100%'>
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
        </Flex>
    );
}