// /src/app/gestao/aprovacoes/page.tsx
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
    Avatar,
    Button,
    useDisclosure
} from '@chakra-ui/react';
import { useApi } from '@/hooks/useApi';
import { PiWarningCircle, PiEye } from 'react-icons/pi';
import { EmptyState } from '@/app/components/dashboard/EmptyState';
import { AuthenticationGuard } from '@/app/components/auth/AuthenticationGuard';
import { useState } from 'react';
import { UserProfile } from '@/types'; // Importa a nossa tipagem de perfil completa
import { ApprovalDialog } from '@/app/components/management/ApprovalDialog';
import { RoleGuard } from '@/app/components/auth/RoleGuard';
import { useAuth0 } from '@auth0/auth0-react';

export default function ApprovalQueuePage() {
    // 1. Busca os perfis que estão a aguardar revisão
    const { data: pendingUsers, isLoading, error, mutate } = useApi<UserProfile[]>('/api/management/pending-users');

    const {user: auth0user} = useAuth0()

    const { open, onOpen, onClose } = useDisclosure();
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    const handleReviewClick = (user: UserProfile) => {
        setSelectedUser(user);
        onOpen();
    };

    if (isLoading) {
        return (
            <Flex w="100%" flex={1} justify="center" align="center">
                <Spinner size="xl" />
            </Flex>
        );
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
            {/* Protege a página apenas para ADMINs */}
            <RoleGuard>
                <VStack gap={8} align="stretch" w="100%">
                    <Box>
                        <Heading as="h1" size="xl">Aprovações Pendentes</Heading>
                        <Text color="gray.400" mt={2}>
                            Reveja e aprove os novos perfis de utilizadores.
                        </Text>
                    </Box>

                    {!pendingUsers || pendingUsers.length === 0 ? (
                        <EmptyState
                            title="Nenhuma Pendência"
                            description="Não há novos perfis a aguardar aprovação no momento."
                            buttonHref='/gestao/utilizadores'
                            buttonLabel='Voltar à Gestão'
                        />
                    ) : (
                        <Table.Root variant={'none'} size={'md'}>
                            <Table.Header border={'1px solid transparent'}>
                                <Table.Row fontSize={'xl'} borderBottom={'1px solid'} borderColor={'gray.700'}>
                                    <Table.ColumnHeader color={'white'} borderColor={'bodyBg'} bgColor={tableBgColor} p={8} borderTopLeftRadius={8}>Usuário</Table.ColumnHeader>
                                    <Table.ColumnHeader color={'white'} borderColor={'bodyBg'} bgColor={tableBgColor} py={8}>Data do cadastro</Table.ColumnHeader>
                                    <Table.ColumnHeader color={'white'} borderColor={'bodyBg'} bgColor={tableBgColor} py={8} borderTopRightRadius={8}>Ações</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body alignItems={'center'} justifyContent={'center'} border={'1px solid transparent'} bgColor={tableBgColor} >
                                {pendingUsers.map((user) => (
                                    <Table.Row key={user.id}>
                                        <Table.Cell px={8} py={4} >
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
                                            {new Date(user.updatedAt).toLocaleDateString('pt-BR')}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Button size="sm" variant="solid" bgColor='brand.700' color='white' _hover={{ bgColor: 'brand.800' }} gap={2} onClick={() => handleReviewClick(user)}>
                                                <Icon as={PiEye} />
                                                Rever Perfil
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    )}
                </VStack>

                {/* 2. O Dialog de Aprovação */}
                <ApprovalDialog
                    user={selectedUser}
                    isOpen={open}
                    onClose={onClose}
                    onUpdateSuccess={() => {
                        mutate(); // Atualiza a lista de pendentes
                        onClose(); // Fecha o modal
                    }}
                />
            </RoleGuard>
        </AuthenticationGuard>
    );
}
