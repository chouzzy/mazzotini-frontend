// /src/app/components/management/EditUserModal.tsx
'use client';

import {
    Dialog,
    Button,
    VStack,
    Stack,
    Spinner,
    Text,
    RadioGroup,
} from '@chakra-ui/react';
import { useApi } from '@/hooks/useApi';
import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { Toaster, toaster } from "@/components/ui/toaster";

// Tipagem para os dados do utilizador
interface UserManagementInfo {
    auth0UserId: string;
    email: string;
    name: string;
    roles: string[];
}

// Tipagem para a lista de roles
interface RoleInfo {
    id: string;
    name: string;
    description: string;
}

interface EditUserModalProps {
    user: UserManagementInfo | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateSuccess: () => void;
}

export function EditUserModal({ user, isOpen, onClose, onUpdateSuccess }: EditUserModalProps) {
    const { data: allRoles, isLoading: isLoadingRoles } = useApi<RoleInfo[]>(isOpen ? '/api/management/roles' : null);

    // Simplificado: Usamos useState para controlar a role selecionada
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { getAccessTokenSilently } = useAuth0();

    // Quando o modal abre, define a role atual do utilizador
    useEffect(() => {
        if (user && user.roles.length > 0) {
            setSelectedRole(user.roles[0]);
        }
    }, [user, isOpen]);

    const handleSave = async () => {
        if (!user || !selectedRole) return;
        setIsSubmitting(true);
        try {
            const token = await getAccessTokenSilently({
                authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! },
            });

            // O backend ainda espera um array, então enviamos a role única dentro de um array
            await axios.patch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/management/users/${user.auth0UserId}/roles`,
                { roles: [selectedRole] },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toaster.create({
                title: "Sucesso!",
                description: `As permissões de ${user.name} foram atualizadas para ${selectedRole}.`,
                type: "success",
            });
            onUpdateSuccess();
            onClose();
        } catch (error) {
            console.error("Erro ao atualizar roles:", error);
            toaster.create({
                title: "Erro ao atualizar.",
                description: "Não foi possível salvar a nova permissão. Tente novamente.",
                type: "error",
            });
        } finally {
            onUpdateSuccess();
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(details) => !details.open && onClose()}>
            <Toaster/>
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content bg="gray.800">
                    <Dialog.Header>
                        <Dialog.Title>Editar Permissão de {user?.name}</Dialog.Title>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="ghost" size="sm">&times;</Button>
                        </Dialog.CloseTrigger>
                    </Dialog.Header>
                    <Dialog.Body>
                        <VStack align="start" gap={4}>
                            <Text>Selecione a permissão que este utilizador deve ter:</Text>
                            {isLoadingRoles ? (
                                <Spinner />
                            ) : (
                                <RadioGroup.Root
                                    value={selectedRole}
                                    onValueChange={(details) => details.value ? setSelectedRole(details.value) : null}
                                >
                                    <Stack gap={3} direction="column">
                                        {allRoles?.map(role => (

                                            <RadioGroup.Item key={role.id} value={role.name!} cursor={'pointer'}>
                                                <RadioGroup.ItemHiddenInput  />
                                                <RadioGroup.ItemIndicator bgColor={'brand.600'} cursor={'pointer'}/>
                                                <RadioGroup.ItemText>{role.name}</RadioGroup.ItemText>
                                            </RadioGroup.Item>
                                        ))}
                                    </Stack>
                                </RadioGroup.Root>
                            )}
                        </VStack>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button variant="solid" colorPalette={'red'} onClick={onClose}>Cancelar</Button>
                        <Button  bgColor= 'brand.700' color= 'white' _hover={{ bgColor:'brand.800'}} ml={3} onClick={handleSave} loading={isSubmitting}>
                            Salvar Alteração
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}

