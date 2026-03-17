'use client';

import {
    Box, Heading, VStack, Text, Flex, Icon, Spinner, Table, Tag, Avatar, Button, useDisclosure, Input, createListCollection, Select, Portal, Badge, Field, HStack
} from '@chakra-ui/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useApi } from '@/hooks/useApi';
import { 
    PiWarningCircle, PiPencilSimple, PiUserPlus, PiUserCircleCheck, PiArrowRight, 
    PiCaretLeftBold, PiCaretRightBold 
} from 'react-icons/pi';
import { EmptyState } from '@/app/components/dashboard/EmptyState';
import { AuthenticationGuard } from '@/app/components/auth/AuthenticationGuard';
import { useState, useEffect } from 'react';
import { EditUserModal } from '@/app/components/management/EditUserModal';
import { InviteUserDialog } from '@/app/components/management/InviteUserDialog';
import Link from 'next/link';
import { translateRole, getRoleColorScheme } from '@/utils/masks';
import { UserProfile } from '@/types';

interface UserManagementInfo {
    id: string;
    auth0UserId: string;
    email: string;
    name: string;
    picture: string;
    profilePictureUrl?: string | null;
    lastLogin?: string;
    roles: string[];
    status?: string;
}

interface PaginatedUsersResponse {
    items: UserManagementInfo[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
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

const RoleGuard = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth0();
    const roles = user?.['https://mazzotini.awer.co/roles'] || [];
    if (!roles.includes('ADMIN')) {
        return (
            <Flex w="100%" justify="center" align="center" p={4}>
                <VStack gap={4} bg="red.900/20" p={8} borderRadius="md" border="1px solid" borderColor="red.500">
                    <Icon as={PiWarningCircle} boxSize={10} color="red.300" /><Heading size="md">Acesso Negado</Heading><Text>Apenas administradores podem acessar esta página.</Text>
                </VStack>
            </Flex>
        );
    }
    return <>{children}</>;
}

export default function UserManagementPage() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterRole, setFilterRole] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const limit = 10;

    // EFEITO DE DEBOUNCE: Atualiza a busca real apenas 300ms após o utilizador parar de digitar
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Volta para a pág 1 ao pesquisar
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const { data, isLoading, error, mutate } = useApi<PaginatedUsersResponse>(
        `/api/management/users?page=${page}&limit=${limit}&search=${debouncedSearch}&role=${filterRole}&status=${filterStatus}`
    );
    const { data: pendingUsers, isLoading: isLoadingPending } = useApi<UserProfile[]>('/api/management/pending-users');

    const { open: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { open: isInviteOpen, onOpen: onInviteOpen, onClose: onInviteClose } = useDisclosure();
    const [selectedUser, setSelectedUser] = useState<UserManagementInfo | null>(null);

    const handleEditClick = (user: UserManagementInfo) => {
        setSelectedUser(user);
        onEditOpen();
    };

    const users = data?.items || [];
    const meta = data?.meta;
    const tableBgColor = 'gray.900';

    return (
        <AuthenticationGuard>
            <RoleGuard>
                <VStack gap={8} align="stretch" w="100%">
                    {/* Header sempre visível */}
                    <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'row' }} gap={4}>
                        <Box><Heading as="h1" size="xl">Gestão de Usuários</Heading><Text color="gray.400" mt={2}>Convide novos usuários e gira permissões.</Text></Box>
                        <Flex flexDir={'column'} gap={4} w={{ base: '100%', md: 'auto' }}>
                            <Button colorPalette={'blue'} variant={'solid'} gap={2} onClick={onInviteOpen}><Icon as={PiUserPlus} boxSize={5} />Novo usuário</Button>
                            <Link href='/gestao/aprovacoes' style={{ textDecoration: 'none' }}>
                                <Button bgColor={(pendingUsers?.length ?? 0) > 0 ? 'brand.800' : 'gray.700'} color={'white'} gap={2}>
                                    <Icon as={PiUserCircleCheck} boxSize={5} />Aprovar cadastros ({isLoadingPending ? <Spinner size="xs" /> : pendingUsers?.length || 0})
                                </Button>
                            </Link>
                        </Flex>
                    </Flex>

                    {/* Filtros sempre visíveis */}
                    <Flex gap={4} p={4} bg={tableBgColor} borderRadius="md" border="1px solid" borderColor="gray.700" wrap="wrap">
                        <Box flex={1} minW="200px">
                            <Field.Root>
                                <Field.Label fontSize="sm" color="gray.400">Busca por Nome ou E-mail</Field.Label>
                                <Input 
                                    placeholder="Comece a digitar para pesquisar..." 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                    bgColor="gray.800" 
                                    borderColor="gray.700" 
                                />
                            </Field.Root>
                        </Box>
                        <Box w={{ base: "100%", md: "200px" }}>
                            <Field.Root><Field.Label fontSize="sm" color="gray.400">Cargo</Field.Label>
                                <Select.Root collection={roleOptions} value={[filterRole]} onValueChange={(d) => { setFilterRole(d.value[0]); setPage(1); }}>
                                    <Select.Control><Select.Trigger bgColor="gray.800"><Select.ValueText /></Select.Trigger></Select.Control>
                                    <Portal><Select.Positioner><Select.Content bg="gray.800">{roleOptions.items.map(i => <Select.Item key={i.value} item={i}>{i.label}</Select.Item>)}</Select.Content></Select.Positioner></Portal>
                                </Select.Root>
                            </Field.Root>
                        </Box>
                        <Box w={{ base: "100%", md: "200px" }}>
                            <Field.Root><Field.Label fontSize="sm" color="gray.400">Status</Field.Label>
                                <Select.Root collection={statusOptions} value={[filterStatus]} onValueChange={(d) => { setFilterStatus(d.value[0]); setPage(1); }}>
                                    <Select.Control><Select.Trigger bgColor="gray.800"><Select.ValueText /></Select.Trigger></Select.Control>
                                    <Portal><Select.Positioner><Select.Content bg="gray.800">{statusOptions.items.map(i => <Select.Item key={i.value} item={i}>{i.label}</Select.Item>)}</Select.Content></Select.Positioner></Portal>
                                </Select.Root>
                            </Field.Root>
                        </Box>
                    </Flex>

                    {/* Área de Dados com Loading isolado */}
                    <Box position="relative">
                        {isLoading && (
                            <Flex position="absolute" top={0} left={0} right={0} bottom={0} bg="blackAlpha.600" zIndex={2} justify="center" align="center" borderRadius="md">
                                <Spinner size="xl" color="brand.500" />
                            </Flex>
                        )}

                        {users.length === 0 && !isLoading ? (
                            <EmptyState title="Nenhum usuário encontrado" description="Refine a sua busca ou filtros." buttonHref='#' />
                        ) : (
                            <Box opacity={isLoading ? 0.5 : 1} transition="opacity 0.2s">
                                <Table.Root variant={'line'} size={'md'} bgColor={'bodyBg'}>
                                    <Table.Header>
                                        <Table.Row borderBottom={'1px solid'} borderColor={'gray.700'} bgColor={tableBgColor}>
                                            <Table.ColumnHeader color={'white'} p={8}>Usuários</Table.ColumnHeader>
                                            <Table.ColumnHeader color={'white'} p={8}>Permissões</Table.ColumnHeader>
                                            <Table.ColumnHeader color={'white'} p={8}>Status</Table.ColumnHeader>
                                            <Table.ColumnHeader color={'white'} p={8}>Último Login</Table.ColumnHeader>
                                            <Table.ColumnHeader color={'white'} p={8}>Ações</Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {users.map((u) => (
                                            <Table.Row key={u.id} bgColor={tableBgColor} _hover={{ bg: 'whiteAlpha.50' }}>
                                                <Table.Cell px={8} py={4}>
                                                    <Flex align="center" gap={3}>
                                                        <Avatar.Root size="sm"><Avatar.Fallback name={u.name} /><Avatar.Image src={u.picture} /></Avatar.Root>
                                                        <VStack align="start" gap={0}>
                                                            <Link href={`/gestao/usuarios/${u.id}`}><Text fontWeight="medium" _hover={{ color: 'brand.400' }}>{u.name}</Text></Link>
                                                            <Text fontSize="sm" color="gray.400">{u.email}</Text>
                                                        </VStack>
                                                    </Flex>
                                                </Table.Cell>
                                                <Table.Cell px={8} py={4}><Flex gap={2}>{u.roles.map(r => <Tag.Root key={r} colorPalette={getRoleColorScheme(r)} color="white"><Tag.Label>{translateRole(r)}</Tag.Label></Tag.Root>)}</Flex></Table.Cell>
                                                <Table.Cell px={8} py={4}><Badge colorPalette={u.status === 'ACTIVE' ? 'green' : 'yellow'}>{u.status === 'ACTIVE' ? 'Ativo' : 'Pendente'}</Badge></Table.Cell>
                                                <Table.Cell px={8} py={4}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}</Table.Cell>
                                                <Table.Cell px={8} py={4}><HStack gap={2}><Link href={`/gestao/usuarios/${u.id}`}><Button size="sm" bgColor="brand.700" color="white"><Icon as={PiArrowRight} /></Button></Link><Button size="sm" colorPalette="blue" onClick={() => handleEditClick(u)}><Icon as={PiPencilSimple} /></Button></HStack></Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table.Root>

                                {meta && meta.totalPages > 1 && (
                                    <Flex justify="space-between" align="center" mt={6} px={4} pb={10}>
                                        <Text fontSize="sm" color="gray.400">Mostrando <b>{users.length}</b> de <b>{meta.total}</b> usuários</Text>
                                        <HStack gap={2}>
                                            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><Icon as={PiCaretLeftBold} /> Anterior</Button>
                                            <HStack gap={1}>
                                                {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                                                    .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                                                    .map((p, i, arr) => (
                                                        <Box key={p}>
                                                            {i > 0 && arr[i-1] !== p - 1 && <Text color="gray.600">...</Text>}
                                                            <Button size="sm" variant={page === p ? "solid" : "ghost"} bg={page === p ? "brand.600" : "transparent"} color={page === p ? "white" : "gray.300"} onClick={() => setPage(p)}>{p}</Button>
                                                        </Box>
                                                    ))
                                                }
                                            </HStack>
                                            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>Próximo <Icon as={PiCaretRightBold} /></Button>
                                        </HStack>
                                    </Flex>
                                )}
                            </Box>
                        )}
                    </Box>
                </VStack>

                <EditUserModal user={selectedUser} isOpen={isEditOpen} onClose={onEditClose} onUpdateSuccess={mutate} />
                <InviteUserDialog isOpen={isInviteOpen} onClose={onInviteClose} onInviteSuccess={mutate} />
            </RoleGuard>
        </AuthenticationGuard>
    );
}