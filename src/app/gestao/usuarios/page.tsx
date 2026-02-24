// src/app/gestao/usuarios/page.tsx

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
    Input,
    createListCollection,
    Select,
    Portal,
    Badge,
    Field
} from '@chakra-ui/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '@/hooks/useApi';
import { PiWarningCircle, PiPencilSimple, PiUserPlus, PiUserCircleCheck, PiArrowRight } from 'react-icons/pi';
import { EmptyState } from '@/app/components/dashboard/EmptyState';
import { AuthenticationGuard } from '@/app/components/auth/AuthenticationGuard';
import { useState, useMemo } from 'react';
import { EditUserModal } from '@/app/components/management/EditUserModal';
import { InviteUserDialog } from '@/app/components/management/InviteUserDialog';
import Link from 'next/link';
import { translateRole, getRoleColorScheme } from '@/utils/masks';
import { Tooltip } from '@/components/ui/tooltip';
import { UserProfile } from '@/types';

// Tipagem para os dados do usuário (ATUALIZADA com 'id' e 'status')
interface UserManagementInfo {
    id: string; // <-- Necessário para o link
    auth0UserId: string;
    email: string;
    name: string;
    picture: string;
    profilePictureUrl?: string | null;
    lastLogin?: string;
    roles: string[];
    status?: string; // Adicionado para suportar o filtro
}

const roleOptions = createListCollection({
    items: [
        { label: "Todos os Cargos", value: "ALL" },
        { label: "Investidor", value: "INVESTOR" },
        { label: "Associado", value: "ASSOCIATE" },
        { label: "Operador", value: "OPERATOR" },
        { label: "Administrador", value: "ADMIN" },
    ]
});

const statusOptions = createListCollection({
    items: [
        { label: "Todos os Status", value: "ALL" },
        { label: "Ativos", value: "ACTIVE" },
        { label: "Pendente Aprovação", value: "PENDING_REVIEW" },
        { label: "Pendente Cadastro", value: "PENDING_ONBOARDING" },
    ]
});

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
    const { data: users, isLoading, error, mutate } = useApi<UserManagementInfo[]>('/api/management/users');
    const { data: pendingUsers, isLoading: isLoadingPending, error: errorPending, mutate: mutatePending } = useApi<UserProfile[]>('/api/management/pending-users');


    // Controles para os dois dialogs
    const { open: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { open: isInviteOpen, onOpen: onInviteOpen, onClose: onInviteClose } = useDisclosure();

    const [selectedUser, setSelectedUser] = useState<UserManagementInfo | null>(null);

    // --- Estados de Filtro ---
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("ALL");

    // Lógica de filtragem em tempo real
    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesRole = filterRole === "ALL" || user.roles.includes(filterRole);
            const matchesStatus = filterStatus === "ALL" || user.status === filterStatus;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchQuery, filterRole, filterStatus]);

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

                            <Button colorPalette={'blue'} variant={'solid'} gap={2} onClick={onInviteOpen}>
                                <Icon as={PiUserPlus} boxSize={5} />
                                Novo usuário
                            </Button>

                            <Link href='/gestao/aprovacoes' style={{ textDecoration: 'none' }} >
                                {/* Injetamos o CSS globalmente para este componente */}
                                <style>{`
                                    @keyframes alert-shake {
                                        0%, 85%, 100% { transform: translateX(0) rotate(0); }
                                        87% { transform: translateX(-2px) rotate(-2deg); }
                                        89% { transform: translateX(2px) rotate(2deg); }
                                        91% { transform: translateX(-2px) rotate(-2deg); }
                                        93% { transform: translateX(2px) rotate(2deg); }
                                        95% { transform: translateX(-1px) rotate(-1deg); }
                                        97% { transform: translateX(1px) rotate(1deg); }
                                    }
                                    .btn-shake {
                                        animation: alert-shake 3s infinite cubic-bezier(.36,.07,.19,.97);
                                    }
                                `}</style>

                                <Button
                                    className={(pendingUsers?.length ?? 0) > 0 ? 'btn-shake' : ''}
                                    bgColor={(pendingUsers?.length ?? 0) > 0 ? 'brand.800' : 'gray.700'}
                                    _hover={{ bgColor: (pendingUsers?.length ?? 0) > 0 ? 'brand.700' : 'gray.700', transition: '400ms' }}
                                    gap={2}
                                    color={'white'}
                                >
                                    <Icon as={PiUserCircleCheck} boxSize={5} />
                                    Aprovar cadastros ({isLoadingPending ? <Spinner size="xs" /> : pendingUsers?.length || 0})
                                </Button>
                            </Link>
                        </Flex>
                    </Flex>

                    {/* --- BARRA DE FILTROS --- */}
                    {users && users.length > 0 && (
                        <Flex gap={4} p={4} bg={tableBgColor} borderRadius="md" border="1px solid" borderColor="gray.700" wrap="wrap">
                            <Box flex={1} minW="200px">
                                <Field.Root>
                                    <Field.Label fontSize="sm" color="gray.400">Busca por Nome ou E-mail</Field.Label>
                                    <Input
                                        placeholder="Pesquisar..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        bgColor="gray.800"
                                        borderColor="gray.700"
                                    />
                                </Field.Root>
                            </Box>
                            <Box w={{ base: "100%", md: "200px" }}>
                                <Field.Root>
                                    <Field.Label fontSize="sm" color="gray.400">Filtrar Cargo</Field.Label>
                                    <Select.Root collection={roleOptions} value={[filterRole]} onValueChange={(d) => setFilterRole(d.value[0])}>
                                        <Select.Control><Select.Trigger cursor={'pointer'} bgColor="gray.800" _hover={{ bgColor: 'brand.800', transition: '400ms' }}><Select.ValueText /></Select.Trigger></Select.Control>
                                        <Portal><Select.Positioner><Select.Content bg="gray.800">{roleOptions.items.map(i => <Select.Item cursor={'pointer'} _hover={{ bgColor: 'brand.800', transition: '400ms' }} key={i.value} item={i}>{i.label}</Select.Item>)}</Select.Content></Select.Positioner></Portal>
                                    </Select.Root>
                                </Field.Root>
                            </Box>
                            <Box w={{ base: "100%", md: "200px" }}>
                                <Field.Root>
                                    <Field.Label fontSize="sm" color="gray.400">Filtrar Status</Field.Label>
                                    <Select.Root collection={statusOptions} value={[filterStatus]} onValueChange={(d) => setFilterStatus(d.value[0])}>
                                        <Select.Control><Select.Trigger cursor={'pointer'} bgColor="gray.800" _hover={{ bgColor: 'brand.800', transition: '400ms' }}><Select.ValueText /></Select.Trigger></Select.Control>
                                        <Portal><Select.Positioner><Select.Content bg="gray.800">{statusOptions.items.map(i => <Select.Item cursor={'pointer'} _hover={{ bgColor: 'brand.800', transition: '400ms' }} key={i.value} item={i}>{i.label}</Select.Item>)}</Select.Content></Select.Positioner></Portal>
                                    </Select.Root>
                                </Field.Root>
                            </Box>
                        </Flex>
                    )}

                    {!users || users.length === 0 ? (
                        <EmptyState title="Nenhum usuário Encontrado" description="Não há outros usuários no sistema para gerir." buttonHref='#' />
                    ) : filteredUsers.length === 0 ? (
                        <Box p={10} textAlign="center" bg={tableBgColor} borderRadius="md" border="1px solid" borderColor="gray.700">
                            <Text color="gray.400">Nenhum usuário encontrado com os filtros aplicados.</Text>
                        </Box>
                    ) : (
                        <Table.Root variant={'line'} size={'md'} bgColor={'bodyBg'}>
                            <Table.Header border={'1px solid transparent'}>
                                <Table.Row fontSize={'xl'} borderBottom={'1px solid'} borderColor={'gray.700'} bgColor={tableBgColor}>
                                    <Table.ColumnHeader color={'white'} borderColor={'bodyBg'} bgColor={tableBgColor} p={8} borderTopLeftRadius={8}>Usuários</Table.ColumnHeader>
                                    <Table.ColumnHeader color={'white'} borderColor={'bodyBg'} bgColor={tableBgColor} p={8} >Permissões</Table.ColumnHeader>
                                    <Table.ColumnHeader color={'white'} borderColor={'bodyBg'} bgColor={tableBgColor} p={8} >Status</Table.ColumnHeader>
                                    <Table.ColumnHeader color={'white'} borderColor={'bodyBg'} bgColor={tableBgColor} p={8} >Último Login</Table.ColumnHeader>
                                    <Table.ColumnHeader color={'white'} borderColor={'bodyBg'} bgColor={tableBgColor} p={8} borderTopRightRadius={8}>Ações</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body alignItems={'center'} justifyContent={'center'} border={'1px solid'} borderColor={'bodyBg'} bgColor={tableBgColor} >
                                {filteredUsers.map((user, item) => (
                                    <Table.Row key={`user.id+${item}`} bgColor={tableBgColor} _hover={{ bg: 'gray.800' }}>
                                        <Table.Cell px={8} py={4} border={'1px solid'} borderColor={tableBgColor}>
                                            <Flex align="center" gap={3}>
                                                <Avatar.Root size="sm">
                                                    <Avatar.Fallback name={user.name} />
                                                    <Avatar.Image src={user.profilePictureUrl || user.picture} />
                                                </Avatar.Root>
                                                <VStack align="start" gap={0}>
                                                    {/* Link no Nome do Usuário */}
                                                    <Link href={`/gestao/usuarios/${user.id}`} passHref>
                                                        <Text fontWeight="medium" _hover={{ textDecoration: 'underline', color: 'brand.400', cursor: 'pointer' }}>
                                                            {user.name}
                                                        </Text>
                                                    </Link>
                                                    <Text fontSize="sm" color="gray.400">{user.email}</Text>
                                                </VStack>
                                            </Flex>
                                        </Table.Cell>
                                        <Table.Cell border={'1px solid'} borderColor={tableBgColor}>
                                            <Flex gap={2}>
                                                {user.roles.map(role => (
                                                    <Tag.Root key={role} variant="solid" colorPalette={getRoleColorScheme(role)} color='white'>
                                                        <Tag.Label>{translateRole(role)}</Tag.Label>
                                                    </Tag.Root>
                                                ))}
                                            </Flex>
                                        </Table.Cell>
                                        <Table.Cell border={'1px solid'} borderColor={tableBgColor}>
                                            <Badge variant="subtle" colorPalette={user.status === 'ACTIVE' ? 'green' : user.status === 'PENDING_REVIEW' ? 'yellow' : 'gray'}>
                                                {user.status === 'ACTIVE' ? 'Ativo' : user.status === 'PENDING_REVIEW' ? 'Pendente Revisão' : user.status === 'PENDING_ONBOARDING' ? 'Em Cadastro' : 'Desconhecido'}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell border={'1px solid'} borderColor={tableBgColor}>
                                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-BR') : 'Nunca'}
                                        </Table.Cell>
                                        <Table.Cell border={'1px solid'} borderColor={tableBgColor}>
                                            <Flex gap={2}>
                                                {/* Botão de Ver Detalhes / Editar Perfil */}
                                                <Link href={`/gestao/usuarios/${user.id}`} passHref>
                                                    <Tooltip content="Ver Detalhes do Perfil" >
                                                        <Button size="sm" bgColor={'brand.700'} _hover={{ bgColor: 'brand.800' }} color={'white'} title="Ver Detalhes do Perfil">
                                                            <Icon as={PiArrowRight} />
                                                        </Button>
                                                    </Tooltip>
                                                </Link>
                                                <Box h={5} w={0.5} bgColor="gray.700" my='auto' />
                                                <Tooltip content="Editar Permissões" >
                                                    <Button size="sm" variant="solid" colorPalette="blue" _hover={{ bgColor: 'gray.700' }} gap={2} onClick={() => handleEditClick(user)} title="Editar Permissões">
                                                        <Icon as={PiPencilSimple} />
                                                    </Button>
                                                </Tooltip>
                                            </Flex>
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