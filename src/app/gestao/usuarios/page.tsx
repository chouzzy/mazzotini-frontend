// /src/app/gestao/usuários/page.tsx
'use client';

import {
    Box,
    Heading,
    VStack,
    Text,
    Flex,
    Icon,
    Spinner,
    Table,
    Tag,
    Avatar,
    Button,
    useDisclosure,
    Toast
} from '@chakra-ui/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '@/hooks/useApi';
import { PiWarningCircle, PiPencilSimple, PiUserPlus, PiMagnifyingGlassDuotone, PiUserCircleCheck } from 'react-icons/pi';
import { EmptyState } from '@/app/components/dashboard/EmptyState';
import { AuthenticationGuard } from '@/app/components/auth/AuthenticationGuard';
import { useState } from 'react';
import { EditUserModal } from '@/app/components/management/EditUserModal';
import { InviteUserDialog } from '@/app/components/management/InviteUserDialog';
import Link from 'next/link';
import { getRoleColorScheme, translateRole } from '@/utils/masks';

// Tipagem para os dados do usuário (ATUALIZADA)
interface UserManagementInfo {
    auth0UserId: string;
    email: string;
    name: string;
    picture: string; // Foto do Auth0 (fallback)
    profilePictureUrl?: string | null; // Foto do nosso DB (prioridade)
    lastLogin?: string;
    roles: string[];
}

// Componente de Verificação de Role
const RoleGuard = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth0();
    const roles = user?.['https://mazzotini.awer.co/roles'] || [];

    if (!roles.includes('ADMIN')) {
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

    return <>{children}</>;
}


export default function UserManagementPage() {
    // A API /api/management/users já foi atualizada (no UseCase) para enviar os novos campos
    const { data: users, isLoading, error, mutate } = useApi<UserManagementInfo[]>('/api/management/users');
    console.log('UserManagementPage: users = ', users);

    // Controles para os dois dialogs
    const { open: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { open: isInviteOpen, onOpen: onInviteOpen, onClose: onInviteClose } = useDisclosure();

    const [selectedUser, setSelectedUser] = useState<UserManagementInfo | null>(null);

    const handleEditClick = (user: UserManagementInfo) => {
        setSelectedUser(user);
        onEditOpen();
    };

    if (isLoading) {
        return (
            <Flex w="100%" flex={1} justify="center" align="center">
                <VStack gap={4}>
                    <Spinner size="xl" color="blue.500" />
                    <Text>A carregar a lista de usuários...</Text>
                </VStack>
            </Flex>
        );
    }

    if (error) {
        return (
            <Flex w="100%" flex={1} justify="center" align="center" p={4}>
                <VStack gap={4} bg="red.900" p={8} borderRadius="md">
                    <Icon as={PiWarningCircle} boxSize={10} color="red.300" />
                    <Heading size="md">Ocorreu um Erro</Heading>
                    <Text>Não foi possível carregar os usuários. Verifique as suas permissões.</Text>
                </VStack>
            </Flex>
        );
    }

    const tableBgColor = 'gray.900';

    return (
        <AuthenticationGuard>
            <RoleGuard>
                <VStack gap={8} align="stretch" w="100%">
                    <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'row' }} gap={4}>
                        <Box>
                            <Heading as="h1" size="xl">Gestão de Usuários</Heading>
                            <Text color="gray.400" mt={2}>
                                Convide novos usuários e gira as suas permissões.
                            </Text>
                        </Box>
                        <Flex flexDir={'column'} gap={4} w={{ base: '100%', md: 'auto' }}>

                            <Button colorPalette={'cyan'} gap={2} onClick={onInviteOpen}>
                                <Icon as={PiUserPlus} boxSize={5} />
                                Novo usuário
                            </Button>

                            <Link href='/gestao/aprovacoes' style={{ textDecoration: 'none' }}>
                                <Button colorPalette={'yellow'} gap={2}>
                                    <Icon as={PiUserCircleCheck} boxSize={5} />
                                    Verificar cadastros
                                </Button>
                            </Link>
                        </Flex>
                    </Flex>

                    {!users || users.length === 0 ? (
                        <EmptyState title="Nenhum usuário Encontrado" description="Não há outros usuários no sistema para gerir." buttonHref='#' />
                    ) : (
                        <Table.Root variant={'line'} size={'md'} bgColor={'bodyBg'}>
                            <Table.Header border={'1px solid transparent'}>
                                <Table.Row fontSize={'xl'} borderBottom={'1px solid'} borderColor={'gray.700'} bgColor={tableBgColor}>
                                    <Table.ColumnHeader color={'white'} borderColor={'bodyBg'} bgColor={tableBgColor} p={8} borderTopLeftRadius={8}>Usuários</Table.ColumnHeader>
                                    <Table.ColumnHeader color={'white'} borderColor={'bodyBg'} bgColor={tableBgColor} p={8} >Permissões</Table.ColumnHeader>
                                    <Table.ColumnHeader color={'white'} borderColor={'bodyBg'} bgColor={tableBgColor} p={8} >Último Login</Table.ColumnHeader>
                                    <Table.ColumnHeader color={'white'} borderColor={'bodyBg'} bgColor={tableBgColor} p={8} borderTopRightRadius={8}>Ações</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body alignItems={'center'} justifyContent={'center'} border={'1px solid'} borderColor={'bodyBg'} bgColor={tableBgColor} >
                                {users.map((user) => (
                                    <Table.Row key={user.auth0UserId} bgColor={tableBgColor}>
                                        <Table.Cell px={8} py={4} border={'1px solid'} borderColor={tableBgColor}>
                                            <Flex align="center" gap={3}>
                                                <Avatar.Root size="sm" key={user.auth0UserId}>
                                                    <Avatar.Fallback name={user.name} />
                                                    {/* CORREÇÃO AQUI: Dá prioridade à foto do nosso DB */}
                                                    <Avatar.Image src={user.profilePictureUrl || user.picture} />
                                                </Avatar.Root>
                                                <VStack align="start" gap={0}>
                                                    <Text fontWeight="medium">{user.name}</Text>
                                                    <Text fontSize="sm" color="gray.400">{user.email}</Text>
                                                </VStack>
                                            </Flex>
                                        </Table.Cell>
                                        <Table.Cell border={'1px solid'} borderColor={tableBgColor}>
                                            <Flex gap={2}>
                                                {user.roles.map(role => (
                                                    <Tag.Root key={role} variant="surface" colorPalette={getRoleColorScheme(role)}>
                                                        <Tag.Label>{translateRole(role)}</Tag.Label>
                                                    </Tag.Root>
                                                ))}
                                            </Flex>
                                        </Table.Cell>
                                        <Table.Cell border={'1px solid'} borderColor={tableBgColor}>
                                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-BR') : 'Nunca'}
                                        </Table.Cell>
                                        <Table.Cell border={'1px solid'} borderColor={tableBgColor}>
                                            <Button size="sm" variant="solid" bgColor='brand.700' color='white' _hover={{ bgColor: 'brand.800' }} gap={2} onClick={() => handleEditClick(user)}>
                                                <Icon as={PiPencilSimple} />
                                                Editar permissões
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    )}
                </VStack>

                <EditUserModal
                    user={selectedUser}
                    isOpen={isEditOpen}
                    onClose={onEditClose}
                    onUpdateSuccess={mutate}
                />
                <InviteUserDialog
                    isOpen={isInviteOpen}
                    onClose={onInviteClose}
                    onInviteSuccess={mutate}
                />
            </RoleGuard>
        </AuthenticationGuard>
    );
}

