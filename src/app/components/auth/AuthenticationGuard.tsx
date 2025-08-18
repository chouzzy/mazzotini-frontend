// src/components/auth/AuthenticationGuard.tsx
'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { Flex, Spinner, Heading, Text, VStack, Icon, Button } from '@chakra-ui/react';
import { PiEnvelope, PiSignIn } from 'react-icons/pi';

// ============================================================================
//   SUB-COMPONENTE: Ecrã de Carregamento
// ============================================================================
function LoadingScreen() {
    return (
        <Flex w="100%" flex={1} justify="center" align="center">
            <Spinner size="xl" color="blue.500" />
        </Flex>
    );
}

// ============================================================================
//   SUB-COMPONENTE: Ecrã de Login
// ============================================================================
function LoginScreen() {
    const { loginWithRedirect } = useAuth0();
    return (
        <Flex w="100%" flex={1} justify="center" align="center" color="white">
            <VStack gap={6}>
                <Heading size="lg">Acesso Restrito</Heading>
                <Text>Por favor, faça login para aceder a esta área.</Text>
                <Button
                    colorScheme="blue"
                    onClick={() => loginWithRedirect()}
                >
                    <Icon as={PiSignIn} />
                    Entrar
                </Button>
            </VStack>
        </Flex>
    );
}

// ============================================================================
//   SUB-COMPONENTE: Ecrã de Verificação de E-mail
// ============================================================================
function VerifyEmailScreen() {
    return (
        <Flex w="100%" flex={1} justify="center" align="center" color="white" p={4}>
            <VStack gap={6} p={10} bg="gray.800" borderRadius="lg" boxShadow="lg" textAlign="center">
                <Icon as={PiEnvelope} boxSize={16} color="blue.400" />
                <Heading size="lg">Verifique o seu E-mail</Heading>
                <Text maxW="md">
                    Enviámos um link de verificação para o seu endereço de e-mail. Por favor, clique no link para ativar a sua conta e poder aceder ao sistema.
                </Text>
                <Text fontSize="sm" color="gray.400" pt={4}>
                    Não recebeu o e-mail? Verifique a sua pasta de spam.
                </Text>
            </VStack>
        </Flex>
    );
}

// ============================================================================
//   COMPONENTE PRINCIPAL: AuthenticationGuard
// ============================================================================
export function AuthenticationGuard({ children }: { children: React.ReactNode }) {
    const {
        isAuthenticated,
        isLoading,
        user, // Precisamos do objeto 'user' para verificar o e-mail
    } = useAuth0();

    // 1. Enquanto o Auth0 está a verificar a sessão, mostramos um spinner.
    if (isLoading) {
        return <LoadingScreen />;
    }

    // 2. Se o utilizador não está autenticado, mostramos o ecrã de login.
    if (!isAuthenticated) {
        return <LoginScreen />;
    }

    // 3. Se está autenticado, mas o e-mail NÃO foi verificado, mostramos o ecrã de verificação.
    // O login com Google já vem com 'email_verified: true'.
    if (isAuthenticated && !user?.email_verified) {
        return <VerifyEmailScreen />;
    }

    // 4. Se passou por todas as verificações, mostra o conteúdo protegido.
    return <>{children}</>;
}
