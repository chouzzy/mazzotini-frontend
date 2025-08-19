// src/components/layout/Header.tsx
'use client';

// ============================================================================
//   IMPORTS
// ============================================================================

// --- React e Frameworks ---
import {
    Flex,
    Image,
    Link as ChakraLink,
    Button,
    Text,
    Icon,
    Spinner, // Adicionado para feedback de carregamento
} from "@chakra-ui/react";
import { motion, Variants } from "framer-motion";
import { useAuth0 } from '@auth0/auth0-react';

// --- Componentes e Dados Locais ---
import { CustomText } from "../ui/CustomText";
import { HeaderMobileMenu } from "./HeaderMobileMenu";
import { UserAvatar } from "./UserAvatar";
import { headerData } from "@/app/data/header";

// ============================================================================
//   VARIANTES DE ANIMAÇÃO (Framer Motion)
// ============================================================================
const headerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.6,
            ease: "easeInOut",
        }
    }
};

// ============================================================================
//   COMPONENTE PRINCIPAL: Header
// ============================================================================
export function Header() {

    // --- Hooks e Estado ---
    const MotionFlex = motion(Flex);
    const { isAuthenticated, loginWithRedirect } = useAuth0();
    // 2. Obtém os dados do perfil do nosso contexto

    // --- Renderização do Componente ---
    return (
        <MotionFlex
            as="header"
            initial="hidden"
            animate="visible"
            variants={headerVariants}
            justifyContent={'space-between'}
            alignItems="center"
            py={4}
            px={{ base: 4, md: 0 }}
            w='100%'
            color={'headerColor'}
            maxW={{ base: '100%', md: '1920px' }} 
        >
            {/* Seção Esquerda: Logo */}
            <Flex alignItems={'center'} gap={{ base: 2, md: 8 }}>
                <ChakraLink href="/" _focus={{ boxShadow: 'none' }}>
                    <Image
                        src={headerData.logoSrc}
                        alt="Logo da Mazzotini"
                        objectFit={'contain'}
                        maxW={{ base: 32, md: 32 }}
                    />
                </ChakraLink>
            </Flex>

            {/* Seção Direita: Navegação */}
            <Flex alignItems={'center'} gap={{ base: 2, sm: 3, md: 4 }}>

                {/* Navegação para Desktop */}
                <Flex
                    gap={8}
                    fontSize={'sm'}
                    display={{ base: 'none', md: 'flex' }}
                    alignItems="center"
                >
                    {/* Links de Navegação Padrão */}
                    {headerData.menu.map((item, index) => (
                        <ChakraLink
                            key={index}
                            href={item.href}
                            _hover={{ cursor: 'pointer', color: 'brand.500', textDecoration: 'none' }}
                        >
                            <CustomText
                                color={'headerColor'}
                                text={item.title}
                                letterSpacing={1.8}
                                textTransform={'uppercase'}
                            />
                        </ChakraLink>
                    ))}
                    

                    {/* Lógica para mostrar o Avatar ou o botão de "Entrar" */}
                    {isAuthenticated ? (
                        <UserAvatar />
                    ) : (
                        <Button
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
                </Flex>

                {/* Menu Mobile (Hamburger) */}
                <HeaderMobileMenu 
                    isAuthenticated={isAuthenticated} 
                />

            </Flex>
        </MotionFlex>
    );
}
