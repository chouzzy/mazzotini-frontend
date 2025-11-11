// /src/app/components/auth/RoleGuard.tsx
'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { Flex, VStack, Icon, Heading, Text } from '@chakra-ui/react';
import { PiWarningCircle } from 'react-icons/pi';

// Lê a role de ADMIN das variáveis de ambiente
const ROLE_ADMIN = process.env.NEXT_PUBLIC_ROLE_ADMIN || 'ADMIN';

/**
 * @component RoleGuard
 * @description Um "guardião" que protege uma página ou componente, 
 * garantindo que apenas utilizadores com a role 'ADMIN' possam vê-lo.
 */
export const RoleGuard = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth0();
    // A nossa "namespace" customizada
    const roles = user?.['https://mazzotini.awer.co/roles'] || [];

    if (!roles.includes(ROLE_ADMIN)) {
        return (
            <Flex w="100%" justify="center" align="center" p={4}>
                <VStack gap={4} bg="red.900" p={8} borderRadius="md">
                    <Icon as={PiWarningCircle} boxSize={10} color="red.300" />
                    <Heading size="md">Acesso Negado</Heading>
                    <Text>Apenas administradores podem acessar a esta página.</Text>
                </VStack>
            </Flex>
        );
    }

    // Se for ADMIN, renderiza o conteúdo protegido
    return <>{children}</>;
}
