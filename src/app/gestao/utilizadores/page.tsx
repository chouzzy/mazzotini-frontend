// /src/app/gestao/utilizadores/page.tsx
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
    useDisclosure
} from '@chakra-ui/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '@/hooks/useApi';
import { PiWarningCircle, PiPencilSimple } from 'react-icons/pi';
import { EmptyState } from '@/app/components/dashboard/EmptyState';
import { AuthenticationGuard } from '@/app/components/auth/AuthenticationGuard';
import { useState } from 'react';
import { EditUserModal } from '@/app/components/management/EditUserModal'; // 1. IMPORTE O NOVO MODAL

// Tipagem para os dados que o endpoint de gestão de utilizadores retorna
interface UserManagementInfo {
    auth0UserId: string;
    email: string;
    name: string;
    picture: string;
    lastLogin?: string;
    roles: string[];
}

// Componente de Verificação de Role (para o frontend)
const RoleGuard = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth0();
    const roles = user?.['https://mazzotini.awer.co/roles'] || [];

    if (!roles.includes('ADMIN')) {
        return (
            <Flex w="100%" justify="center" align="center" p={4}>
                <VStack gap={4} bg="red.900" p={8} borderRadius="md">
                    <Icon as={PiWarningCircle} boxSize={10} color="red.300" />
                    <Heading size="md">Acesso Negado</Heading>
                    <Text>Apenas administradores podem aceder a esta página.</Text>
                </VStack>
            </Flex>
        );
    }

    return <>{children}</>;
}


export default function UserManagementPage() {
    // O 'mutate' do SWR é a nossa ferramenta para forçar a atualização dos dados
    const { data: users, isLoading, error, mutate } = useApi<UserManagementInfo[]>('/api/management/users');

    // 2. ESTADO PARA CONTROLAR O MODAL
    const { open, onOpen, onClose } = useDisclosure();
    const [selectedUser, setSelectedUser] = useState<UserManagementInfo | null>(null);

    const handleEditClick = (user: UserManagementInfo) => {
        setSelectedUser(user);
        onOpen();
    };

    if (isLoading) {
        return (
            <Flex w="100%" flex={1} justify="center" align="center">
                <VStack gap={4}>
                    <Spinner size="xl" color="blue.500" />
                    <Text>A carregar a lista de utilizadores...</Text>
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
                    <Text>Não foi possível carregar os utilizadores. Verifique as suas permissões.</Text>
                </VStack>
            </Flex>
        );
    }

    return (
        <AuthenticationGuard>
            <RoleGuard>
                <VStack gap={8} align="stretch" w="100%">
                    <Box>
                        <Heading as="h1" size="xl">Gestão de Utilizadores</Heading>
                        <Text color="gray.400" mt={2}>
                            Visualize e gira as permissões dos utilizadores da plataforma.
                        </Text>
                    </Box>

                    {!users || users.length === 0 ? (
                        <EmptyState title="Nenhum Utilizador Encontrado" description="Não há outros utilizadores no sistema para gerir." buttonHref='#' />
                    ) : (
                        <Table.Root variant="outline">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader>Utilizador</Table.ColumnHeader>
                                    <Table.ColumnHeader>Roles</Table.ColumnHeader>
                                    <Table.ColumnHeader>Último Login</Table.ColumnHeader>
                                    <Table.ColumnHeader>Ações</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {users.map((user) => (
                                    <Table.Row key={user.auth0UserId}>
                                        <Table.Cell>
                                            <Flex align="center" gap={3}>
                                                <Avatar.Root size="sm" key={user.auth0UserId}>
                                                    <Avatar.Fallback name={user.name} />
                                                    <Avatar.Image src={user.picture} />
                                                </Avatar.Root>
                                                <VStack align="start" gap={0}>
                                                    <Text fontWeight="medium">{user.name}</Text>
                                                    <Text fontSize="sm" color="gray.400">{user.email}</Text>
                                                </VStack>
                                            </Flex>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Flex gap={2}>
                                                {user.roles.map(role => (
                                                    <Tag.Root key={role} variant="solid" colorScheme="blue">
                                                        <Tag.Label>{role}</Tag.Label>
                                                    </Tag.Root>
                                                ))}
                                            </Flex>
                                        </Table.Cell>
                                        <Table.Cell>
                                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-BR') : 'Nunca'}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {/* 3. LIGAÇÃO DO BOTÃO AO MODAL */}
                                            <Button size="sm" variant="solid" gap={2} onClick={() => handleEditClick(user)}>
                                                <Icon as={PiPencilSimple} />
                                                Editar Roles
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    )}
                </VStack>

                {/* 4. RENDERIZAÇÃO DO MODAL */}
                <EditUserModal
                    user={selectedUser}
                    isOpen={open}
                    onClose={onClose}
                    onUpdateSuccess={mutate} // Passa a função 'mutate' para o modal poder atualizar a lista
                />
            </RoleGuard>
        </AuthenticationGuard>
    );
}

