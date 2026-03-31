// /src/app/gestao/aprovacoes/page.tsx
'use client';

import {
    Box, Heading, VStack, Text, Flex, Icon, Spinner, Table, Avatar, Button, useDisclosure, Badge, Separator,
} from '@chakra-ui/react';
import { useApi } from '@/hooks/useApi';
import { PiWarningCircle, PiEye, PiPencilSimpleLine } from 'react-icons/pi';
import { EmptyState } from '@/app/components/dashboard/EmptyState';
import { AuthenticationGuard } from '@/app/components/auth/AuthenticationGuard';
import { useState } from 'react';
import { UserProfile } from '@/types';
import { ApprovalDialog } from '@/app/components/management/ApprovalDialog';
import { ProfileChangeDialog } from '@/app/components/management/ProfileChangeDialog';
import { RoleGuard } from '@/app/components/auth/RoleGuard';
import { useAuth0 } from '@auth0/auth0-react';

export default function ApprovalQueuePage() {
    const { data: pendingUsers, isLoading, error, mutate } = useApi<UserProfile[]>('/api/management/pending-users');
    const { data: profileChanges, isLoading: isLoadingChanges, mutate: mutateChanges } = useApi<any[]>('/api/management/profile-changes');

    const { user: auth0user } = useAuth0();

    // Novos cadastros
    const { open: openApproval, onOpen: onOpenApproval, onClose: onCloseApproval } = useDisclosure();
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    // Alterações de perfil
    const { open: openChange, onOpen: onOpenChange, onClose: onCloseChange } = useDisclosure();
    const [selectedChange, setSelectedChange] = useState<any>(null);
    const { data: selectedUserData } = useApi<any>(selectedChange ? `/api/management/users/${selectedChange.userId}` : null);

    const handleReviewClick = (user: UserProfile) => { setSelectedUser(user); onOpenApproval(); };
    const handleChangeClick = (change: any) => { setSelectedChange(change); onOpenChange(); };

    if (isLoading || isLoadingChanges) {
        return <Flex w="100%" flex={1} justify="center" align="center"><Spinner size="xl" /></Flex>;
    }

    if (error) {
        return (
            <Flex w="100%" flex={1} justify="center" align="center" p={4}>
                <VStack gap={4} bg="red.900" p={8} borderRadius="md">
                    <Icon as={PiWarningCircle} boxSize={10} color="red.300" />
                    <Heading size="md">Ocorreu um Erro</Heading>
                    <Text>Não foi possível carregar os perfis pendentes.</Text>
                </VStack>
            </Flex>
        );
    }

    const tableBgColor = 'gray.900';

    return (
        <AuthenticationGuard>
            <RoleGuard>
                <VStack gap={10} align="stretch" w="100%">

                    {/* ── SEÇÃO 1: NOVOS CADASTROS ── */}
                    <Box>
                        <Flex align="center" gap={3} mb={2}>
                            <Heading as="h1" size="xl">Novos Cadastros</Heading>
                            {pendingUsers && pendingUsers.length > 0 && (
                                <Badge colorPalette="red" variant="solid" borderRadius="full" px={2}>{pendingUsers.length}</Badge>
                            )}
                        </Flex>
                        <Text color="gray.400" mb={4}>Reveja e aprove os novos perfis de utilizadores.</Text>

                        {!pendingUsers || pendingUsers.length === 0 ? (
                            <Flex p={6} bg="gray.900" borderRadius="md" justify="center">
                                <Text color="gray.500">Nenhum novo cadastro pendente.</Text>
                            </Flex>
                        ) : (
                            <Table.Root variant="line" size="md" bgColor="bodyBg">
                                <Table.Header border="1px solid transparent">
                                    <Table.Row fontSize="xl" borderBottom="1px solid" borderColor="gray.700" bgColor={tableBgColor}>
                                        <Table.ColumnHeader color="white" bgColor={tableBgColor} p={8} borderTopLeftRadius={8}>Usuário</Table.ColumnHeader>
                                        <Table.ColumnHeader color="white" bgColor={tableBgColor} py={8}>Indicação</Table.ColumnHeader>
                                        <Table.ColumnHeader color="white" bgColor={tableBgColor} py={8}>Data do cadastro</Table.ColumnHeader>
                                        <Table.ColumnHeader color="white" bgColor={tableBgColor} py={8} borderTopRightRadius={8}>Ações</Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body bgColor={tableBgColor}>
                                    {pendingUsers.map((user) => (
                                        <Table.Row key={user.id} bgColor={tableBgColor}>
                                            <Table.Cell px={8} py={4}>
                                                <Flex align="center" gap={3}>
                                                    <Avatar.Root size="sm">
                                                        <Avatar.Fallback name={user.name} />
                                                        <Avatar.Image src={user.profilePictureUrl || auth0user?.picture} />
                                                    </Avatar.Root>
                                                    <VStack align="start" gap={0}>
                                                        <Text fontWeight="medium">{user.name}</Text>
                                                        <Text fontSize="sm" color="gray.400">{user.email}</Text>
                                                    </VStack>
                                                </Flex>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text fontSize="sm">{user.referredBy?.name || user.indication || <Text as="span" color="gray.500">—</Text>}</Text>
                                            </Table.Cell>
                                            <Table.Cell>{new Date(user.updatedAt).toLocaleDateString('pt-BR')}</Table.Cell>
                                            <Table.Cell>
                                                <Button size="sm" variant="solid" bgColor="brand.700" color="white" _hover={{ bgColor: 'brand.800' }} gap={2} onClick={() => handleReviewClick(user)}>
                                                    <Icon as={PiEye} /> Rever Perfil
                                                </Button>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        )}
                    </Box>

                    <Separator borderColor="gray.700" />

                    {/* ── SEÇÃO 2: ALTERAÇÕES DE PERFIL ── */}
                    <Box>
                        <Flex align="center" gap={3} mb={2}>
                            <Heading as="h2" size="xl">Alterações de Perfil</Heading>
                            {profileChanges && profileChanges.length > 0 && (
                                <Badge colorPalette="yellow" variant="solid" borderRadius="full" px={2}>{profileChanges.length}</Badge>
                            )}
                        </Flex>
                        <Text color="gray.400" mb={4}>Solicitações de edição de dados cadastrais aguardando revisão.</Text>

                        {!profileChanges || profileChanges.length === 0 ? (
                            <Flex p={6} bg="gray.900" borderRadius="md" justify="center">
                                <Text color="gray.500">Nenhuma alteração de perfil pendente.</Text>
                            </Flex>
                        ) : (
                            <Table.Root variant="line" size="md" bgColor="bodyBg">
                                <Table.Header border="1px solid transparent">
                                    <Table.Row fontSize="xl" borderBottom="1px solid" borderColor="gray.700" bgColor={tableBgColor}>
                                        <Table.ColumnHeader color="white" bgColor={tableBgColor} p={8} borderTopLeftRadius={8}>Usuário</Table.ColumnHeader>
                                        <Table.ColumnHeader color="white" bgColor={tableBgColor} py={8}>Localização atual</Table.ColumnHeader>
                                        <Table.ColumnHeader color="white" bgColor={tableBgColor} py={8}>Solicitado em</Table.ColumnHeader>
                                        <Table.ColumnHeader color="white" bgColor={tableBgColor} py={8} borderTopRightRadius={8}>Ações</Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body bgColor={tableBgColor}>
                                    {profileChanges.map((change) => (
                                        <Table.Row key={change.id} bgColor={tableBgColor}>
                                            <Table.Cell px={8} py={4}>
                                                <Flex align="center" gap={3}>
                                                    <Avatar.Root size="sm">
                                                        <Avatar.Fallback name={change.user.name} />
                                                        <Avatar.Image src={change.user.profilePictureUrl} />
                                                    </Avatar.Root>
                                                    <VStack align="start" gap={0}>
                                                        <Text fontWeight="medium">{change.user.name}</Text>
                                                        <Text fontSize="sm" color="gray.400">{change.user.email}</Text>
                                                    </VStack>
                                                </Flex>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text fontSize="sm" color="gray.400">
                                                    {change.user.residentialCity && change.user.residentialState
                                                        ? `${change.user.residentialCity}/${change.user.residentialState}`
                                                        : '—'}
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell>{new Date(change.createdAt).toLocaleDateString('pt-BR')}</Table.Cell>
                                            <Table.Cell>
                                                <Button size="sm" variant="solid" colorPalette="yellow" gap={2} onClick={() => handleChangeClick(change)}>
                                                    <Icon as={PiPencilSimpleLine} /> Revisar Alteração
                                                </Button>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        )}
                    </Box>

                </VStack>

                {/* Dialogs */}
                <ApprovalDialog
                    user={selectedUser}
                    isOpen={openApproval}
                    onClose={onCloseApproval}
                    onUpdateSuccess={() => { mutate(); onCloseApproval(); }}
                />

                <ProfileChangeDialog
                    request={selectedChange}
                    currentData={selectedUserData || null}
                    isOpen={openChange}
                    onClose={onCloseChange}
                    onUpdateSuccess={() => { mutateChanges(); onCloseChange(); setSelectedChange(null); }}
                />

            </RoleGuard>
        </AuthenticationGuard>
    );
}
