// // /src/app/components/auth/ProfileCompletionGuard.tsx
// 'use client';

// import { useApi } from "@/hooks/useApi";
// import { Flex, Spinner, Text, VStack } from "@chakra-ui/react";
// import { useAuth0 } from "@auth0/auth0-react";
// import { useRouter, usePathname } from "next/navigation";
// import { useEffect } from "react";

// // Tipagem para os dados do nosso próprio utilizador que vêm da API /api/users/me
// interface MazzotiniUser {
//     profileCompleted: boolean;
//     // ... outros campos do nosso utilizador que a API possa retornar
// }

// /**
//  * Este componente "guardião" envolve a área logada da aplicação.
//  * A sua única responsabilidade é verificar se o perfil do utilizador está completo.
//  * Se não estiver, redireciona-o para a página de onboarding.
//  */
// export const ProfileCompletionGuard = ({ children }: { children: React.ReactNode }) => {
//     const { isAuthenticated, isLoading: isAuthLoading } = useAuth0();
//     const router = useRouter();
//     const pathname = usePathname();

//     // Só busca o perfil do nosso DB se o utilizador estiver autenticado no Auth0
//     const { data: userProfile, isLoading: isProfileLoading, error } = useApi<MazzotiniUser>(
//         isAuthenticated ? '/api/users/me' : null
//     );

//     // Efeito de redirecionamento, que é o cérebro do guardião
//     useEffect(() => {
//         // Condições para o redirecionamento:
//         const needsRedirect = !isAuthLoading && !isProfileLoading && isAuthenticated && userProfile && !userProfile.profileCompleted;
//         const isOnOnboardingPage = pathname === '/perfil/completar';

//         // Se precisa de ser redirecionado E não está já na página de onboarding...
//         if (needsRedirect && !isOnOnboardingPage) {
//             console.log("[ProfileGuard] Perfil incompleto. A redirecionar para /perfil/completar...");
//             router.push('/perfil/completar');
//         }
//     }, [isAuthLoading, isProfileLoading, userProfile, pathname, router, isAuthenticated]);

//     // Enquanto o Auth0 ou o nosso perfil estão a carregar, mostra um spinner.
//     // Isto acontece antes de sabermos se o redirecionamento é necessário.
//     const isLoading = isAuthLoading || (isAuthenticated && isProfileLoading);
//     if (isLoading) {
//         return (
//             <Flex w="100%" minH="80vh" justify="center" align="center">
//                 <VStack>
//                     <Spinner size="xl" />
//                     <Text>Verificando dados de seu perfil...</Text>
//                 </VStack>
//             </Flex>
//         );
//     }
    
//     // Se o perfil ESTIVER completo, mostra o conteúdo da página que o utilizador tentou aceder.
//     if (userProfile?.profileCompleted) {
//         return <>{children}</>;
//     }

//     // Se o perfil NÃO estiver completo, mas o utilizador já estiver na página de onboarding,
//     // permite que a página seja renderizada.
//     if (pathname === '/perfil/completar') {
//         return <>{children}</>;
//     }
    
//     // Se não se encaixar em nenhuma das condições acima (ex: está a redirecionar),
//     // mostra um spinner para evitar um "flash" de conteúdo indesejado.
//     return (
//         <Flex w="100%" minH="80vh" justify="center" align="center">
//             <Spinner size="xl" />
//         </Flex>
//     );
// }
