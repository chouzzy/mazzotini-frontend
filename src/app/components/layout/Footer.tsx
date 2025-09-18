import { Box, Container, Flex, Link, Text } from "@chakra-ui/react";

export function Footer() {
    return (
        <Flex flexDir={'column'} as="footer" py={6} borderTopWidth="1px" borderColor="gray.700" bgColor={'bodyBg'} w='100%' position={'relative'}>
            <Container maxW="container.lg">
                <Text textAlign="center" fontSize="sm" color="whiteGhost">
                    &copy; {new Date().getFullYear()} Sistema Mazzotini. Todos os direitos reservados.
                </Text>
            </Container>
            <Text position={'absolute'} textAlign="center" fontSize="xs" color="whiteGhost" right={4} bottom={2}>
                Desenvolvido por <Link href="https://awer.co" target="_blank" color="#FF5F5E">awer.co</Link>
            </Text>
        </Flex>
    );
}
