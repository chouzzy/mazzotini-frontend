'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { AppLayout, HeaderNav } from './AppLayout'; 
import { useApi } from '@/hooks/useApi';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Flex, Spinner, Text, VStack } from '@chakra-ui/react';

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
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth0();
    const router = useRouter();
    const pathname = usePathname();

    // Verifica se a página atual é pública
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname || '');

    // 1. Busca o perfil do nosso DB (incluindo 'status' e 'cpfOrCnpj')
    const { data: userProfile, isLoading: isProfileLoading, error } = useApi<MazzotiniUser>(
        isAuthenticated ? '/api/users/me' : null
    );

    const isLoading = isAuthLoading || (isAuthenticated && isProfileLoading);

    // Efeito de redirecionamento, agora centralizado aqui
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
        const profileIsFilled = !!userProfile.cpfOrCnpj; // A nossa "proxy"
        
        const isOnOnboardingPage = pathname === '/perfil/completar';
        const isOnPendingPage = pathname === '/perfil/pendente';

        // 2. LÓGICA DE REDIRECIONAMENTO
        switch (status) {
            case 'ACTIVE':
                // Se está ativo mas "preso" nas páginas de onboarding/pendente, manda para o dashboard.
                if (isOnOnboardingPage || isOnPendingPage) {
                    router.push('/dashboard');
                }
                break;
            case 'PENDING_REVIEW':
                // Se está pendente de revisão, temos que saber se ele já preencheu o formulário.
                if (profileIsFilled) {
                    // Já preencheu -> Fica na página de "pendente"
                    if (!isOnPendingPage) router.push('/perfil/pendente');
                } else {
                    // Não preencheu -> Fica na página de "completar"
                    if (!isOnOnboardingPage) router.push('/perfil/completar');
                }
                break;
            case 'REJECTED':
                // Por agora, manda para a página de pendente com uma mensagem.
                if (!isOnPendingPage) router.push('/perfil/pendente');
                break;
            default:
                // Estado desconhecido, manda para o login.
                router.push('/'); 
        }

    }, [isLoading, isProfileLoading, userProfile, pathname, router, isAuthenticated, isPublicRoute]);


    // --- SPINNER GLOBAL ---
    if (isLoading) {
        return (
            <Flex w="100%" minH="100vh" justify="center" align="center">
                <VStack>
                    <Spinner size="xl" />
                    <Text>A verificar o seu perfil...</Text>
                </VStack>
            </Flex>
        );
    }

    // --- DECISÕES DE LAYOUT ---

    // 1. Se NÃO estiver autenticado, mostra o layout da landing page.
    if (!isAuthenticated) {
        return (
            <>
                <Header />
                {children}
                <Footer />
            </>
        );
    }

    // 2. Se ESTIVER autenticado (e os dados carregados)...
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

    // Estado de fallback (enquanto o useEffect redireciona)
    return (
        <Flex w="100%" minH="100vh" justify="center" align="center">
            <Spinner size="xl" />
        </Flex>
    );
}
