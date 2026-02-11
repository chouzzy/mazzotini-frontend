'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { AppLayout, HeaderNav } from './AppLayout'; 
import { useApi } from '@/hooks/useApi';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import axios from 'axios'; // Import necessário para o POST
import { useSWRConfig } from 'swr'; // Para atualizar o cache após o sync

// Tipagem para os dados do nosso próprio utilizador
interface MazzotiniUser {
    status: string;
    cpfOrCnpj: string | null;
}

// ============================================================================
//  A CORREÇÃO: Lista de rotas que podem ser acessadas mesmo sem perfil
// ============================================================================
const PUBLIC_ROUTES = ['/politica-privacidade', '/termos-de-uso'];

export function LayoutController({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading: isAuthLoading, getAccessTokenSilently, user } = useAuth0();
    const router = useRouter();
    const pathname = usePathname();
    const { mutate } = useSWRConfig(); // Função para recarregar dados

    // Verifica se a página atual é pública
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname || '');

    // Verifica se a página atual é pública
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname || '');

    // 1. Busca o perfil do nosso DB (incluindo 'status' e 'cpfOrCnpj')
    const { data: userProfile, isLoading: isProfileLoading, error } = useApi<MazzotiniUser>(
        isAuthenticated ? '/api/users/me' : null
    );

    const isLoading = isAuthLoading || (isAuthenticated && isProfileLoading);

    // =================================================================
    //  ETAPA 4: SINCRONIZAÇÃO (MERGE) AO LOGAR
    // =================================================================
    
    useEffect(() => {
        const syncUser = async () => {
            if (isAuthenticated && user) {
                try {
                    const token = await getAccessTokenSilently();
                    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

                    // CORREÇÃO: Enviando os dados do usuário no corpo da requisição
                    await axios.post(`${apiBaseUrl}/api/users/sync`, {
                        email: user.email,
                        name: user.name,
                        picture: user.picture
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    mutate('/api/users/me');

                } catch (error) {
                    console.error("[LayoutController] Erro na sincronização silenciosa:", error);
                }
            }
        };

        syncUser();
    }, [isAuthenticated, user, getAccessTokenSilently, mutate]);

    // =================================================================


    // Efeito de redirecionamento (Lógica de Proteção de Rotas)
    useEffect(() => {
        // Se estiver carregando, não autenticado, ou sem perfil, espera.
        if (isLoading || !isAuthenticated || !userProfile) {
            return; 
        }

        // =================================================================
        //  A CORREÇÃO: Se for uma rota pública (Termos/Privacidade),
        //  PULA a lógica de redirecionamento. Deixa o usuário ler.
        // =================================================================
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
                // Por agora, manda para a página de pendente com uma mensagem.
                if (!isOnPendingPage) router.push('/perfil/pendente');
                break;
            case 'PENDING_ONBOARDING': // Caso o sync tenha acabado de criar o user
                if (!isOnOnboardingPage) router.push('/perfil/completar');
                break;
            default:
                router.push('/');
        }

    }, [isLoading, isProfileLoading, userProfile, pathname, router, isAuthenticated, isPublicRoute]);


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

    // 2. Se ESTIVER autenticado
    if (userProfile) {
        const status = userProfile.status;
        const isOnOnboardingPage = pathname === '/perfil/completar';
        const isOnPendingPage = pathname === '/perfil/pendente';

        // Se estiver ATIVO (e não estiver numa rota pública), mostra o AppLayout completo.
        // Se estiver numa rota pública, queremos mostrar o layout simples abaixo para focar na leitura.
        if (status === 'ACTIVE' && !isPublicRoute) {
            return (
                <AppLayout>
                    {children}
                </AppLayout>
            );
        }

        // Se estiver na página de Onboarding, Pendente, OU numa Rota Pública (sendo usuário novo)
        // mostra um layout simples (apenas o HeaderNav, sem a sidebar)
        if (isOnOnboardingPage || isOnPendingPage || isPublicRoute) {
             return (
                <Flex direction="column" w="100%" minH="100vh">
                    <HeaderNav onOpen={() => {}} /> {/* Header sem menu mobile */}
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