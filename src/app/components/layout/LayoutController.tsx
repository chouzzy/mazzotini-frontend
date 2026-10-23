'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { AppLayout, HeaderNav } from './AppLayout';
import { useApi } from '@/hooks/useApi';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button, Flex, Heading, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import axios from 'axios'; // Import necessário para o POST
import { useSWRConfig } from 'swr'; // Para atualizar o cache após o sync
import { VerifyEmailScreen } from '@/app/components/auth/AuthenticationGuard';

// Tipagem para os dados do nosso próprio utilizador
interface MazzotiniUser {
    status: string;
    cpfOrCnpj: string | null;
}

// Lista de rotas que podem ser acessadas mesmo sem perfil
const PUBLIC_ROUTES = ['/politica-privacidade', '/termos-de-uso'];

// Tela mostrada quando o sync falha e o perfil não carrega. Sem ela, o usuário
// ficaria parado no spinner, sem saber o que fazer.
// `message` é o motivo que o servidor deu, quando deu (ex.: conta sem e-mail no Auth0).
function SyncErrorScreen({ onRetry, message }: { onRetry: () => Promise<void>; message: string | null }) {
    const { logout } = useAuth0();
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = async () => {
        setIsRetrying(true);
        await onRetry();
        setIsRetrying(false);
    };

    return (
        <Flex w="100%" flex={1} justify="center" align="center" color="white" p={4}>
            <VStack gap={6} p={10} bg="gray.800" borderRadius="lg" boxShadow="lg" textAlign="center">
                <Heading size="lg">Não foi possível carregar sua conta</Heading>
                <Text maxW="md">
                    Tivemos um problema ao preparar o seu acesso. Tente novamente em alguns instantes.
                </Text>
                {message && <Text maxW="md" fontSize="sm" color="gray.400">{message}</Text>}
                <HStack gap={3}>
                    <Button
                        color='white'
                        onClick={handleRetry}
                        loading={isRetrying}
                        loadingText="Tentando..."
                        border={'1px solid'}
                        borderColor={'brand.600'}
                        bgColor={'gray.900'}
                        _hover={{ bgColor: 'brand.600' }}
                    >
                        Tentar novamente
                    </Button>
                    <Button
                        variant="ghost"
                        color="gray.300"
                        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                    >
                        Sair
                    </Button>
                </HStack>
            </VStack>
        </Flex>
    );
}

export function LayoutController({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading: isAuthLoading, getAccessTokenSilently, logout, user } = useAuth0();
    const router = useRouter();
    const pathname = usePathname();
    const { mutate } = useSWRConfig();
    const hasSynced = useRef(false);
    // O backend só vincula o login a um cadastro existente se o e-mail estiver verificado
    const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
    // Falha do sync (ex.: Auth0 fora do ar). Sem perfil carregado, mostra a tela de erro
    const [syncFailed, setSyncFailed] = useState(false);
    const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

    // Verifica se a página atual é pública teste
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname || '');

    // 1. Busca o perfil do nosso DB
    const { data: userProfile, isLoading: isProfileLoading, mutate: mutateProfile } = useApi<MazzotiniUser>(
        isAuthenticated ? '/api/users/me' : null
    );

    // Polling de 30s quando pendente: revalidateOnFocus está desabilitado globalmente
    // (providers.tsx), então sem isso o status nunca atualizaria após aprovação admin.
    useEffect(() => {
        if (userProfile?.status !== 'PENDING_REVIEW') return;
        const id = setInterval(() => mutateProfile(), 30_000);
        return () => clearInterval(id);
    }, [userProfile?.status, mutateProfile]);

    const isLoading = isAuthLoading || (isAuthenticated && isProfileLoading);

    // =================================================================
    //  ETAPA 4: SINCRONIZAÇÃO (MERGE) AO LOGAR
    // =================================================================
    
    const syncUser = async () => {
        try {
            const token = await getAccessTokenSilently();
            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/sync`, {
                email: user?.email,
                name: user?.name,
                picture: user?.picture,
            }, { headers: { Authorization: `Bearer ${token}` } });
            setNeedsEmailVerification(false);
            setSyncFailed(false);
            mutate('/api/users/me');
        } catch (error: any) {
            if (error?.response?.status === 403 && error?.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
                setNeedsEmailVerification(true);
                setSyncFailed(false);
                return;
            }
            const msg = error?.error || error?.message || '';
            const isStaleToken = msg.includes('Missing Refresh Token') || msg.includes('missing_refresh_token') || msg.includes('login_required');
            if (isStaleToken) {
                console.warn('[LayoutController] Refresh token inválido — fazendo logout para limpar sessão corrompida.');
                logout({ logoutParams: { returnTo: window.location.origin } });
                return;
            }
            console.error('[LayoutController] Erro na sincronização silenciosa:', error);
            // Não reseta hasSynced — evita loop infinito. Sai da tela de verificação
            // (se estava nela) e deixa o usuário tentar de novo pela tela de erro.
            setNeedsEmailVerification(false);
            setSyncFailed(true);
            // Erro de regra (4xx) traz o motivo; erro de rede ou do servidor fica só com o texto genérico
            const status = error?.response?.status;
            setSyncErrorMessage(status >= 400 && status < 500 ? (error?.response?.data?.error ?? null) : null);
        }
    };

    useEffect(() => {
        if (!isAuthenticated || !user || hasSynced.current) return;
        hasSynced.current = true;
        syncUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    // A tela de verificação renova o token a cada 60 s. Quando o e-mail é confirmado,
    // o SDK atualiza `user.email_verified` e o sync é refeito.
    useEffect(() => {
        if (needsEmailVerification && user?.email_verified) syncUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [needsEmailVerification, user?.email_verified]);

    // =================================================================


    // Efeito de redirecionamento (Lógica de Proteção de Rotas)
    useEffect(() => {
        if (isLoading || !isAuthenticated || !userProfile) {
            return;
        }

        if (isPublicRoute) {
            return;
        }

        const status = userProfile.status;
        const profileIsFilled = !!userProfile.cpfOrCnpj;

        const isOnOnboardingPage = pathname === '/perfil/completar';
        const isOnPendingPage = pathname === '/perfil/pendente';

        switch (status) {
            case 'ACTIVE':
                if (isOnOnboardingPage || isOnPendingPage) {
                    router.push('/dashboard');
                }
                break;
            case 'PENDING_REVIEW':
                if (profileIsFilled) {
                    if (!isOnPendingPage) router.push('/perfil/pendente');
                } else {
                    if (!isOnOnboardingPage) router.push('/perfil/completar');
                }
                break;
            case 'REJECTED':
                if (!isOnPendingPage) router.push('/perfil/pendente');
                break;
            case 'PENDING_ONBOARDING': // Caso o sync tenha acabado de criar o user
                if (!isOnOnboardingPage) router.push('/perfil/completar');
                break;
            default:
                router.push('/');
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, userProfile, pathname, isAuthenticated]);


    // --- SPINNER GLOBAL ---
    if (isLoading) {
        return (
            <Flex w="100%" minH="100vh" justify="center" align="center">
                <VStack>
                    <Spinner size="xl" />
                    <Text>A iniciar a aplicação...</Text>
                </VStack>
            </Flex>
        );
    }

    // --- DECISÕES DE LAYOUT ---

    // 1. Se NÃO estiver autenticado
    if (!isAuthenticated) {
        return (
            <>
                <Header />
                {children}
                <Footer />
            </>
        );
    }

    // 2. Autenticado com o e-mail de um cadastro existente, mas ainda sem confirmar
    if (needsEmailVerification) {
        return (
            <Flex direction="column" w="100%" minH="100vh">
                <VerifyEmailScreen />
            </Flex>
        );
    }

    // 3. O sync falhou e o perfil não carregou: oferece tentar de novo
    if (syncFailed && !userProfile) {
        return (
            <Flex direction="column" w="100%" minH="100vh">
                <SyncErrorScreen onRetry={syncUser} message={syncErrorMessage} />
            </Flex>
        );
    }

    // 4. Se ESTIVER autenticado
    if (userProfile) {
        const status = userProfile.status;
        const isOnOnboardingPage = pathname === '/perfil/completar';
        const isOnPendingPage = pathname === '/perfil/pendente';

        // Usuário Ativo = Layout Completo
        if (status === 'ACTIVE' && !isPublicRoute) {
            return (
                <AppLayout>
                    {children}
                </AppLayout>
            );
        }

        // Usuário Pendente/Novo = Layout Simples, só no onboarding, na espera e nas páginas públicas.
        // Em outra página, fica o carregamento até o redirecionamento: a página pediria dados de
        // cliente, que a API recusa até a aprovação, e mostraria um erro por um instante
        if (isOnOnboardingPage || isOnPendingPage || isPublicRoute) {
            return (
                <Flex direction="column" w="100%" minH="100vh">
                    <HeaderNav onOpen={() => { }} />
                    <Flex justify="center" align="start" bg="bodyBg" flex={1} p={4}>
                        {children}
                    </Flex>
                </Flex>
            );
        }
    }

    // Estado de fallback
    return (
        <Flex w="100%" minH="100vh" justify="center" align="center">
            <Spinner size="xl" />
        </Flex>
    );
}