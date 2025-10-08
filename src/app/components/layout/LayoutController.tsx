// /src/app/components/layout/LayoutController.tsx
'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { AppLayout, HeaderNav } from './AppLayout';
import { useApi } from '@/hooks/useApi';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Flex, Spinner, Text, useBreakpointValue, VStack } from '@chakra-ui/react';

// Tipagem para os dados do nosso próprio utilizador
interface MazzotiniUser {
    profileCompleted: boolean;
}

export function LayoutController({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth0();
    const router = useRouter();
    const pathname = usePathname();
    const isMobile = useBreakpointValue({ base: true, md: false });

    // Só busca o perfil do nosso DB se o utilizador estiver autenticado no Auth0
    const { data: userProfile, isLoading: isProfileLoading } = useApi<MazzotiniUser>(
        isAuthenticated ? '/api/users/me' : null
    );

    // Efeito de redirecionamento, agora centralizado aqui
    useEffect(() => {
        const needsRedirect = !isAuthLoading && !isProfileLoading && isAuthenticated && userProfile && !userProfile.profileCompleted;
        const isOnOnboardingPage = pathname === '/perfil/completar';

        if (needsRedirect && !isOnOnboardingPage) {
            router.push('/perfil/completar');
        }
    }, [isAuthLoading, isProfileLoading, userProfile, pathname, router, isAuthenticated]);

    // Mostra um spinner global enquanto a autenticação ou o perfil estão a ser carregados
    const isLoading = isAuthLoading || (isAuthenticated && isProfileLoading);
    if (isLoading) {
        return (
            <Flex w="100%" minH="100vh" justify="center" align="center">
                <VStack>
                    <Spinner size="xl" />
                    <Text>Verificando seu perfil...</Text>
                </VStack>
            </Flex>
        );
    }

    // --- O CÉREBRO DAS DECISÕES DE LAYOUT ---

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

    // 2. Se ESTIVER autenticado, mas o perfil não estiver completo...
    if (userProfile && !userProfile.profileCompleted) {
        // ...e o utilizador estiver na página de onboarding, mostra SÓ a página (ecrã inteiro).
        if (pathname === '/perfil/completar') {
            return (
                <Flex direction="column" w="100%" minH="100vh">
                    {isMobile ?
                        <HeaderNav onOpen={() => { }} /> // Mobile Header 
                    :
                    // Desktop Header
                    <Flex bgColor={'gray.900'}>
                        <Header />
                    </Flex>
                    }
                    <Flex justify="center" align="center" bgColor={'bodyBg'} flex={1}>
                        {children}
                    </Flex>
                </Flex>
            )
        }
        // Se estiver noutra página, o useEffect acima irá redirecioná-lo, então mostramos um spinner.
        return (
            <Flex w="100%" minH="100vh" justify="center" align="center">
                <Spinner size="xl" />
            </Flex>
        );
    }

    // 3. Se estiver autenticado E o perfil estiver completo, mostra o AppLayout normal.
    if (userProfile && userProfile.profileCompleted) {
        return (
            <AppLayout>
                {children}
            </AppLayout>
        );
    }

    // Estado de fallback enquanto tudo carrega
    return (
        <Flex w="100%" minH="100vh" justify="center" align="center">
            <Spinner size="xl" />
        </Flex>
    );
}
