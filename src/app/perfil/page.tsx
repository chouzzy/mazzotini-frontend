// /src/app/perfil/page.tsx
'use client';

import {
    Box,
    Heading,
    VStack,
    Text,
    Flex,
    Icon,
    Spinner,
    Button,
    Link,
    SimpleGrid,
    Card,
    CardTitle,
    Avatar
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '@/hooks/useApi';
import { PiWarningCircle, PiPencilSimple, PiUser, PiPhone, PiMapPin, PiIdentificationCard, PiGlobe, PiHeart } from 'react-icons/pi';
import { AuthenticationGuard } from '../components/auth/AuthenticationGuard';

// Tipagem para os dados do perfil que vêm do nosso backend
interface UserProfile {
    name: string;
    email: string;
    picture?: string; // Do Auth0
    cpfOrCnpj?: string;
    phone?: string;
    cellPhone?: string;
    address?: string;
    nationality?: string;
    maritalStatus?: string;
}

// Componente para exibir um campo de informação
const ProfileField = ({ label, value, icon }: { label: string, value?: string | null, icon?: React.ElementType }) => {
    if (!value) return null;
    return (
        <Flex align="center" gap={3}>
            {icon && <Icon as={icon} color="gray.400" />}
            <Text>
                <strong style={{ color: '#a8a8a8' }}>{label}:</strong> {value}
            </Text>
        </Flex>
    );
};

export default function ProfilePage() {
    const { user: auth0User } = useAuth0();
    const { data: userProfile, isLoading, error } = useApi<UserProfile>('/api/users/me');

    if (isLoading) {
        return (
            <Flex w="100%" flex={1} justify="center" align="center">
                <Spinner size="xl" />
            </Flex>
        );
    }

    if (error || !userProfile) {
        return (
            <Flex w="100%" flex={1} justify="center" align="center" p={4}>
                <VStack gap={4} bg="red.900" p={8} borderRadius="md">
                    <Icon as={PiWarningCircle} boxSize={10} color="red.300" />
                    <Heading size="md">Ocorreu um Erro</Heading>
                    <Text>Não foi possível carregar os dados do seu perfil.</Text>
                </VStack>
            </Flex>
        );
    }

    return (
        <AuthenticationGuard>
            <VStack gap={8} align="stretch" w="100%">
                <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'row' }} gap={4}>
                    <Flex align="center" gap={4}>
                        <Avatar.Root
                            size="md"
                            cursor="pointer"
                            border={'1px solid'}
                            borderColor={'brand.600'}
                            bgColor={'bodyBg'}
                            color={'textPrimary'}
                        >
                            <Avatar.Fallback name={userProfile.name} />
                            <Avatar.Image src={userProfile.picture} alt={userProfile.name} />
                        </Avatar.Root>
                        <Box>
                            <Heading as="h1" size="xl">{userProfile.name}</Heading>
                            <Text color="gray.400">{userProfile.email}</Text>
                        </Box>
                    </Flex>
                    <Link as={NextLink} href="/perfil/completar" _hover={{ textDecoration: 'none' }}>
                        <Button colorPalette="blue" gap={2}>
                            <Icon as={PiPencilSimple} />
                            Editar Perfil
                        </Button>
                    </Link>
                </Flex>

                <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6} pt={4} >
                    <Card.Root variant="subtle" bg="gray.900">
                        <Card.Body>
                            <Card.Title color={'brand.600'}>Dados Pessoais</Card.Title>
                            <VStack align="stretch" mt={4} gap={3} color={'white'}>
                                <ProfileField label="CPF/CNPJ" value={userProfile.cpfOrCnpj} icon={PiIdentificationCard}/>
                                <ProfileField label="Nacionalidade" value={userProfile.nationality} icon={PiGlobe} />
                                <ProfileField label="Estado Civil" value={userProfile.maritalStatus} icon={PiHeart} />
                            </VStack>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root variant="subtle" bg="gray.900">
                        <Card.Body>
                            <Card.Title color={'brand.600'}>Informações de Contato</Card.Title>
                            <VStack align="stretch" mt={4} gap={3} color={'white'}>
                                <ProfileField label="Celular" value={userProfile.cellPhone} icon={PiPhone} />
                                <ProfileField label="Telefone Fixo" value={userProfile.phone} icon={PiPhone} />
                            </VStack>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root variant="subtle" bg="gray.900" gridColumn={{ lg: 'span 2' }}>
                        <Card.Body>
                            <Card.Title color={'brand.600'}>Endereço</Card.Title>
                            <VStack align="stretch" mt={4} gap={3} color={'white'}>
                                <ProfileField label="Endereço Completo" value={userProfile.address} icon={PiMapPin} />
                            </VStack>
                        </Card.Body>
                    </Card.Root>
                </SimpleGrid>
            </VStack>
        </AuthenticationGuard>
    );
}
