// src/components/layout/Header.tsx
'use client';

// ============================================================================
//   IMPORTS
// ============================================================================

// --- React e Frameworks ---
import {
    Flex,
    Link as ChakraLink,
    // Componentes para o Menu do Usuário
    Avatar,
    Menu,
    Portal,
    Button,
    Text, // Adicionado para o menu
    Icon, // Adicionado para o menu
} from "@chakra-ui/react";
import { useAuth0 } from '@auth0/auth0-react'; // Hook do Auth0

// --- Componentes e Dados Locais ---
import { whatsappLink } from "@/utils";
import { PiSignOut } from "react-icons/pi";
import { MotionButton } from "../ui/MotionButton";


export function UserAvatar() {
    const { isAuthenticated, user, logout } = useAuth0();

    return (
        <>
            {
                isAuthenticated ? (
                    <Menu.Root >
                        <Menu.Trigger asChild>
                            <Button h="auto" p="0" borderRadius="full" border="2px solid"
                                borderColor="brand.500"
                            >
                                {/* A MUDANÇA: Usando a nova sintaxe do Avatar do Chakra UI v3 */}
                                <Avatar.Root
                                    size="md"
                                    cursor="pointer"
                                >
                                    <Avatar.Fallback name={user?.name} />
                                    <Avatar.Image src={user?.picture} alt={user?.name} />
                                </Avatar.Root>
                            </Button>
                        </Menu.Trigger>
                        <Portal>
                            <Menu.Positioner>
                                <Menu.Content>
                                    <Menu.Item value="profile" onClick={() => { window.location.href = '/minha-conta' }} cursor='pointer'>
                                        <Flex direction="column">
                                            <Text fontWeight="bold">{user?.name}</Text>
                                            <Text fontSize="sm" color="gray.500">{user?.email}</Text>
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
                )}
        </>
    )
}