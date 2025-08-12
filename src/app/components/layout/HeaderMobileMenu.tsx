// src/components/layout/HeaderMobileMenu.tsx
'use client';

// ============================================================================
//   IMPORTS
// ============================================================================

// --- Componentes Chakra UI ---
// Usando o Menu do Ark UI, que é a base para o Chakra v3
import { Box, Menu, Button, Portal, Link as ChakraLink, Avatar, Flex, Icon, Text, Spinner } from "@chakra-ui/react";

// --- Ícones ---
import { PiList, PiSignOut } from "react-icons/pi";

// --- Dados Locais ---
import { useAuth0 } from "@auth0/auth0-react";
import { useProfile } from "@/app/contexts/ProfileContext";
import { headerData } from "@/app/data/header";
import { CustomText } from "../ui/CustomText";
import { UserAvatar } from "./UserAvatar";

// ============================================================================
//   COMPONENTE PRINCIPAL: HeaderMobileMenu
// ============================================================================
// Este componente cria o menu "hamburger" que é exibido apenas em telas pequenas.

interface HeaderMobileMenuProps {
    isAuthenticated: boolean;
    isAwerClient: boolean;
}

export function HeaderMobileMenu({ isAuthenticated, isAwerClient }: HeaderMobileMenuProps) {

    const { loginWithRedirect } = useAuth0();
    const { isLoading: isProfileLoading } = useProfile();

    return (
        // Container que só exibe este componente em telas pequenas ('base')
        // e o esconde em telas a partir de 'md' (medium).
        <Box display={{ base: 'block', md: 'none' }} gap={8}>
            {isAuthenticated && (
                isProfileLoading ? (
                    // Mostra um spinner enquanto o perfil está a ser carregado
                    <Spinner size="sm" />
                ) : (
                    // Se o perfil foi carregado e o utilizador é um cliente, mostra o link
                    isAwerClient && (
                        <ChakraLink
                            href="/dashboard" // A nova página do dashboard
                            _hover={{ cursor: 'pointer', color: 'brand.500', textDecoration: 'none' }}
                        >
                            <CustomText
                                borderRadius={'md'}
                                bgColor={'ghostWhite'}
                                py={1}
                                px={2}
                                mr={4}
                                color={'brand.500'} // Cor de destaque
                                _hover={{ bgColor: 'brand.600', color: 'white', transition: 'all 0.3s ease' }}
                                text="Painel"
                                letterSpacing={1.8}
                                textTransform={'uppercase'}
                            />
                        </ChakraLink>
                    )
                )
            )}

            {isAuthenticated ? (
                <UserAvatar />
            ) : (
                <Button
                    mr={4}
                    color={'ghostWhite'}
                    bgColor='transparent'
                    border='1px solid'
                    borderColor='whiteAlpha.300'
                    onClick={() => loginWithRedirect()}
                    _hover={{ bgColor: 'brand.600' }}
                >
                    Entrar
                </Button>
            )}

            {/* Menu Principal (Raiz) */}
            <Menu.Root>

                {/* O botão que aciona a abertura do menu (ícone de lista/hamburger) */}
                <Menu.Trigger asChild>
                    <Button variant="outline" size="sm">
                        <PiList />
                    </Button>
                </Menu.Trigger>

                {/* O Portal garante que o conteúdo do menu seja renderizado no topo da árvore DOM,
                    evitando problemas de sobreposição (z-index). */}
                <Portal>
                    <Menu.Positioner>
                        <Menu.Content>

                            {headerData.menu.map((item) => (
                                <Menu.Item key={item.title} value={item.title} asChild>
                                    <ChakraLink
                                        href={item.href}
                                        w="100%"
                                        display="block"
                                        px={3}
                                        py={2}
                                    >
                                        {item.title}
                                    </ChakraLink>
                                </Menu.Item>
                            ))}

                        </Menu.Content>
                    </Menu.Positioner>
                </Portal>
            </Menu.Root>
        </Box>
    );
}
