// /src/app/perfil/pendente/page.tsx
'use client';

import { Flex, Heading, Text, VStack, Icon, Button, Box } from '@chakra-ui/react';
import { useAuth0 } from '@auth0/auth0-react';
import { PiHourglass, PiSignOut } from 'react-icons/pi';

export default function PendingReviewPage() {
    const { logout } = useAuth0();

    const handleLogout = () => {
        logout({ logoutParams: { returnTo: window.location.origin } });
    };

    return (
        <Flex w="100%" minH="100%" justify="center" align="center" p={4} bg="gray.800">
            <VStack 
                gap={6} 
                p={10} 
                bg="gray.900" 
                borderRadius="lg" 
                boxShadow="lg" 
                textAlign="center" 
                border="1px solid"
                borderColor="gray.700"
            >
                <Icon as={PiHourglass} boxSize={16} color="brand.500" />
                <Heading as="h1" size="lg">Perfil em Análise</Heading>
                <Text maxW="md" color="gray.300">
                    Obrigado por enviar os seus dados. Seu perfil está sob análise da equipe da Mazzotini.
                </Text>
                <Text fontSize="sm" color="gray.400" pt={2}>
                    Você receberá nosso contato assim que o seu acesso for aprovado.
                </Text>
                <Button
                    mt={4}
                    onClick={handleLogout}
                    gap={2}
                    bgColor={'brand.700'}
                    color={'white'}
                    _hover={{ bgColor: 'brand.900' }}
                >
                    <Icon as={PiSignOut} />
                    Sair
                </Button>
            </VStack>
        </Flex>
    );
}
