// /src/components/layout/Header.tsx
'use client';

// ============================================================================
//  IMPORTS
// ============================================================================

import {
    Flex,
    Link as ChakraLink,
    Avatar,
    Menu,
    Portal,
    Button,
    Text,
    Icon,
    SkeletonCircle,
    Tag, 
} from "@chakra-ui/react";
import { useAuth0 } from '@auth0/auth0-react';
import { whatsappLink } from "@/utils";
import { PiSignOut } from "react-icons/pi";
import { MotionButton } from "../ui/MotionButton";
import { useApi } from "@/hooks/useApi"; 
// CORREÇÃO: Importando as duas funções de 'masks'
import { translateRole, getRoleColorScheme } from "@/utils/masks";

// Tipagem para os dados do perfil que vêm do nosso endpoint /api/users/me
// CORREÇÃO: Removido o campo 'role', que não vem daqui.
interface MazzotiniUser {
    name: string;
    email: string;
    profilePictureUrl?: string;
}

export function UserAvatar() {
    const { isAuthenticated, user: auth0User, logout } = useAuth0();

    // Abordagem Sénior: Buscamos o perfil do *nosso* backend para ter a foto atualizada
    const { data: userProfile, isLoading: isProfileLoading } = useApi<MazzotiniUser>(
        isAuthenticated ? '/api/users/me' : null
    );

    // 1. Enquanto o perfil está a ser carregado, mostramos um Skeleton
    if (isProfileLoading) {
        return <SkeletonCircle size="10" />; // "10" é o tamanho 'md' do Avatar
    }

    // 2. Determina qual foto de perfil e nome usar
    const profilePicture = userProfile?.profilePictureUrl || auth0User?.picture;
    const profileName = userProfile?.name || auth0User?.name;

    // ============================================================================
    //  A CORREÇÃO (Pegando o Role do Auth0)
    // ============================================================================
    // O 'role' vem do token do Auth0, não do nosso banco /api/users/me.
    // O Auth0 armazena-os num array de strings.
    const roles = auth0User?.['https://mazzotini.awer.co/roles'] || [];
    const primaryRole = roles[0]; // Pega o primeiro (principal) role
    // ============================================================================

    return (
        <>
            {
                isAuthenticated ? (
                    <Flex gap={4} alignItems="center"> {/* Trocado para Flex e alignItems center */}
                        
                        {/* TAG DE ROLE (Atualizada) */}
                        {primaryRole && (
                            <Tag.Root 
                                size="lg" // Tamanho maior
                                variant="subtle" 
                                // Aplica a cor baseada na role
                                colorPalette={getRoleColorScheme(primaryRole)}
                            >
                                {/* Traduz o nome da role */}
                                <Tag.Label>{translateRole(primaryRole)}</Tag.Label>
                            </Tag.Root>
                        )}
                        
                        {/* MENU DO AVATAR */}
                        <Menu.Root >
                            <Menu.Trigger asChild>
                                <Button h="auto" p="0" borderRadius="full" border="2px solid"
                                    borderColor="brand.500"
                                >
                                    <Avatar.Root
                                        size="md"
                                        cursor="pointer"
                                    >
                                        <Avatar.Fallback name={profileName} />
                                        <Avatar.Image src={profilePicture} alt={profileName} />
                                    </Avatar.Root>
                                </Button>
                            </Menu.Trigger>
                            <Portal>
                                <Menu.Positioner>
                                    <Menu.Content>
                                        <Menu.Item value="profile" onClick={() => { window.location.href = '/perfil' }} cursor='pointer'>
                                            <Flex direction="column">
                                                <Text fontWeight="bold">{profileName}</Text>
                                                <Text fontSize="sm" color="gray.500">{auth0User?.email}</Text>
                                            </Flex>
                                        </Menu.Item>
                                        <Menu.Separator />
                                        <Menu.Item
                                            cursor='pointer'
                                            value="logout"
                                            onClick={() => logout({ logoutParams: { returnTo: typeof window !== 'undefined' ? window.location.origin : undefined } })}
                                        >
                                            <Flex align="center" gap={2}>
                                                <Icon as={PiSignOut} />
                                                <Text>Sair</Text>
                                            </Flex>
                                        </Menu.Item>
                                    </Menu.Content>
                                </Menu.Positioner>
                            </Portal>
                        </Menu.Root >
                    </Flex>
                ) : (
                    <ChakraLink href={whatsappLink()} _hover={{ textDecoration: 'none' }} target="_blank">
                        <MotionButton />
                    </ChakraLink>
                )
            }
        </>
    )
}