// /src/app/components/auth/ProfileCompletionGuard.tsx
'use client';

import { useApi } from "@/hooks/useApi";
import { Flex, Spinner } from "@chakra-ui/react";
import { useAuth0 } from "@auth0/auth0-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Tipagem para os dados do nosso próprio utilizador
interface MazzotiniUser {
    id: string;
    profileCompleted: boolean;
    // ... outros campos do nosso utilizador
}

/**
 * Este componente "guardião" verifica se o perfil do utilizador está completo.
 * Se não estiver, redireciona-o para a página de onboarding.
 */
export const ProfileCompletionGuard = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth0();
    const router = useRouter();

    // Precisamos de um novo endpoint no backend para buscar o perfil do utilizador logado
    const { data: userProfile, isLoading, error } = useApi<MazzotiniUser>('/api/users/me');

    useEffect(() => {
        // Se já carregou, não há erro, e o perfil não está completo...
        if (!isLoading && !error && userProfile && !userProfile.profileCompleted) {
            // ...redireciona para a página de onboarding.
            router.push('/perfil/completar');
        }
    }, [isLoading, error, userProfile, router]);
    
    // Enquanto carrega, mostra um spinner
    if (isLoading || !userProfile) {
        return (
            <Flex w="100%" h="100vh" justify="center" align="center">
                <Spinner size="xl" />
            </Flex>
        );
    }
    
    // Se o perfil estiver completo, mostra o conteúdo protegido (o nosso AppLayout)
    if (userProfile.profileCompleted) {
        return <>{children}</>;
    }

    // Se estiver a redirecionar, não mostra nada para evitar um flash de conteúdo
    return null;
}
