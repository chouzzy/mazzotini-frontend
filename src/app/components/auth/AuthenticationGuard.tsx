// src/components/auth/AuthenticationGuard.tsx
'use client';

import { Toaster, toaster } from '@/components/ui/toaster';
import { useAuth0 } from '@auth0/auth0-react';
import { Flex, Spinner, Heading, Text, VStack, Icon, Button } from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { PiEnvelope, PiPaperPlaneTilt, PiSignIn } from 'react-icons/pi';

// ============================================================================
//   SUB-COMPONENTE: Ecrã de Carregamento
// ============================================================================
function LoadingScreen() {
    return (
        <Flex w="100%" flex={1} justify="center" align="center">
            <Spinner size="xl" color="#9E905A" />
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
                <Text>Por favor, faça login para acessar a esta área.</Text>
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
//  SUB-COMPONENTE: Ecrã de Verificação de E-mail (AGORA INTELIGENTE)
// ============================================================================
function VerifyEmailScreen() {
    const { getAccessTokenSilently, user } = useAuth0();
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (cooldown > 0) {
            timer = setTimeout(() => {
                setCooldown(cooldown - 1);
            }, 1000);
        } else if (cooldown === 0) {
            // Recarrega a página quando o cooldown chega a zero
            window.location.reload();
        }
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleResendEmail = async () => {
        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently({
                authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! },
            });

            await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/resend-verification`,
                {}, // Corpo vazio
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toaster.create({
                title: "E-mail Reenviado!",
                description: `Enviamos um novo link de verificação para ${user?.email}.`,
                type: "success",
            });
            // Inicia o cooldown de 30 segundos
            setCooldown(30);

        } catch (error) {
            console.error("Erro ao reenviar e-mail:", error);
            toaster.create({
                title: "Erro",
                description: "Não foi possível reenviar o e-mail. Tente novamente mais tarde.",
                type: "error",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Flex w="100%" flex={1} justify="center" align="center" color="white" p={4}>
            <Toaster />
            <VStack gap={6} p={10} bg="gray.800" borderRadius="lg" boxShadow="lg" textAlign="center">
                <Icon as={PiEnvelope} boxSize={16} color="brand.500" />
                <Heading size="lg">Verifique o seu E-mail</Heading>
                <Text maxW="md">
                    Enviámos um link de verificação para o seu endereço de e-mail. Por favor, clique no link para ativar a sua conta.
                </Text>
                <Text fontSize="sm" color="gray.400" pt={2}>
                    Não recebeu o e-mail? Verifique a sua pasta de spam ou clique abaixo.
                </Text>
                <Button
                    mt={4}
                    color='white'
                    onClick={handleResendEmail}
                    loading={isLoading}
                    disabled={cooldown > 0} // Desativa o botão durante o cooldown
                    loadingText="A enviar..."
                    gap={2}
                    border={'1px solid'}
                    borderColor={'brand.600'}
                    bgColor={'gray.900'}
                    _hover={{ bgColor: 'brand.600' }}
                >
                    <Icon as={PiPaperPlaneTilt} />
                    {cooldown > 0 ? `Aguarde (${cooldown}s)` : 'Enviar Novamente'}
                </Button>
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
