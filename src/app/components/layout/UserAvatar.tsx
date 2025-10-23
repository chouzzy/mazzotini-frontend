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
    SkeletonCircle, // Adicionado para o estado de carregamento
} from "@chakra-ui/react";
import { useAuth0 } from '@auth0/auth0-react';
import { whatsappLink } from "@/utils";
import { PiSignOut } from "react-icons/pi";
import { MotionButton } from "../ui/MotionButton";
import { useApi } from "@/hooks/useApi"; // Importa o nosso hook de API

// Tipagem para os dados do perfil que vêm do nosso endpoint /api/users/me
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

    // 2. Determina qual foto de perfil e nome usar, com prioridade para os dados do nosso DB
    const profilePicture = userProfile?.profilePictureUrl || auth0User?.picture;
    const profileName = userProfile?.name || auth0User?.name;
    
    return (
        <>
            {
                isAuthenticated ? (
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
                                    {/* 3. Usa a foto de perfil correta */}
                                    <Avatar.Image src={profilePicture} alt={profileName} />
                                </Avatar.Root>
                            </Button>
                        </Menu.Trigger>
                        <Portal>
                            <Menu.Positioner>
                                <Menu.Content>
                                    <Menu.Item value="profile" onClick={() => { window.location.href = '/perfil' }} cursor='pointer'>
                                        <Flex direction="column">
                                            {/* 4. Usa o nome correto */}
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
                ) : (
                    <ChakraLink href={whatsappLink()} _hover={{ textDecoration: 'none' }} target="_blank">
                        <MotionButton />
                    </ChakraLink>
                )
            }
        </>
    )
}
