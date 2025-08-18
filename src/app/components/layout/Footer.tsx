import { Box, Container, Text } from "@chakra-ui/react";

export function Footer() {
    return (
        <Box as="footer" py={6} borderTopWidth="1px" borderColor="gray.700">
            <Container maxW="container.lg">
                <Text textAlign="center" fontSize="sm" color="gray.500">
                    &copy; {new Date().getFullYear()} Sistema Mazzotini. Todos os direitos reservados.
                </Text>
            </Container>
        </Box>
    );
}
