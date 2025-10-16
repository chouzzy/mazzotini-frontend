// /src/components/auth/AuthenticationGuard.tsx
'use client';

import { Toaster, toaster } from '@/components/ui/toaster';
import { useAuth0 } from '@auth0/auth0-react';
import { Flex, Spinner, Heading, Text, VStack, Icon, Button } from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { PiEnvelope, PiPaperPlaneTilt, PiSignIn } from 'react-icons/pi';

// ============================================================================
//  SUB-COMPONENTE: Ecrã de Carregamento
// ============================================================================
function LoadingScreen() {
    return (
        <Flex w="100%" flex={1} justify="center" align="center">
            <Spinner size="xl" color="#9E905A" />
        </Flex>
    );
}

// ============================================================================
//  SUB-COMPONENTE: Ecrã de Login
// ============================================================================
function LoginScreen() {
    const { loginWithRedirect } = useAuth0();
    return (
        <Flex w="100%" flex={1} justify="center" align="center" color="white">
            <VStack gap={6}>
                <Heading size="lg">Acesso Restrito</Heading>
                <Text>Por favor, faça login para aceder a esta área.</Text>
                <Button
                    colorScheme="blue" // Prop correta para Button
                    onClick={() => loginWithRedirect()}
                    gap={2}
                >
                    <Icon as={PiSignIn} />
                    Entrar
                </Button>
            </VStack>
        </Flex>
    );
}


// ============================================================================
//  SUB-COMPONENTE: Ecrã de Verificação de E-mail (LÓGICA CORRIGIDA)
// ============================================================================
function VerifyEmailScreen() {
    const { getAccessTokenSilently, user } = useAuth0();
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // NOVO EFEITO: Polling para verificar o status do e-mail
    useEffect(() => {
        const intervalId = setInterval(() => {
            console.log("[AuthGuard] A verificar o status do e-mail...");
            // Força a revalidação da sessão. Se o e-mail foi verificado,
            // o SDK atualizará o 'user' object, e o AuthenticationGuard irá reagir.
            getAccessTokenSilently({ cacheMode: 'off' }).catch(() => {
                // É seguro ignorar erros aqui, o polling continuará.
            });
        }, 60000); // Verifica a cada 60 segundos

        // Limpa o intervalo quando o componente é desmontado para evitar memory leaks
        return () => clearInterval(intervalId);
    }, [getAccessTokenSilently]);

    // Efeito para o temporizador do cooldown (sem alterações)
    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = setTimeout(() => {
            setCooldown(cooldown - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [cooldown]);

    // O useEffect de polling foi removido. A revalidação automática do SDK
    // ao focar na aba é a abordagem mais limpa e recomendada.

    const handleResendEmail = async () => {
        setIsResending(true);
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
            setCooldown(30);

        } catch (error) {
            console.error("Erro ao reenviar e-mail:", error);
            toaster.create({
                title: "Erro",
                description: "Não foi possível reenviar o e-mail. Tente novamente mais tarde.",
                type: "error",
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <Flex w="100%" flex={1} justify="center" align="center" color="white" p={4}>
            <Toaster />
            <VStack gap={6} p={10} bg="gray.800" borderRadius="lg" boxShadow="lg" textAlign="center">
                <Icon as={PiEnvelope} boxSize={16} color="brand.500" />
                <Heading size="lg">Verifique o seu E-mail</Heading>
                <Text maxW="md">
                    Enviamos um link de verificação para o seu endereço de e-mail. Por favor, clique no link para ativar a sua conta.
                </Text>
                <Text fontSize="sm" color="gray.400" pt={2}>
                    Não recebeu o e-mail? Verifique a sua pasta de spam ou clique abaixo.
                </Text>
                <Button
                    mt={4}
                    color='white'
                    onClick={handleResendEmail}
                    loading={isResending}
                    disabled={cooldown > 0}
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
//  COMPONENTE PRINCIPAL: AuthenticationGuard
// ============================================================================
export function AuthenticationGuard({ children }: { children: React.ReactNode }) {
    const {
        isAuthenticated,
        isLoading,
        user,
    } = useAuth0();

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <LoginScreen />;
    }

    if (isAuthenticated && !user?.email_verified) {
        return <VerifyEmailScreen />;
    }

    return <>{children}</>;
}

