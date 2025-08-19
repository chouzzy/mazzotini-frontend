'use client';

import {
    Box,
    Flex,
    Drawer,
    useDisclosure,
    BoxProps,
    FlexProps,
    Icon,
    Text,
    IconButton,
    Link,
    Button,
    VStack,
    Image,
} from '@chakra-ui/react';
import {
    PiChartPieSlice,
    PiUser,
    PiGear,
    PiList,
    PiScales,
    PiHouseDuotone,
    PiX,
} from 'react-icons/pi';
import { IconType } from 'react-icons';
import NextLink from 'next/link';
import { useAuth0 } from '@auth0/auth0-react';
import { usePathname } from 'next/navigation';
import { UserAvatar } from './UserAvatar';
import { headerData } from '@/app/data/header';
import { SideBarItems } from '@/app/data/sideBar';
import { on } from 'events';

// ============================================================================
//  DEFINIÇÃO DOS ITENS DA SIDEBAR
// ============================================================================
interface NavItemProps {
    icon: IconType;
    children: React.ReactNode;
    href: string;
}



// ============================================================================
//  COMPONENTE: Sidebar
// ============================================================================
const SidebarContent = ({ onClose, ...rest }: { onClose: () => void } & BoxProps) => (
    <Flex
        as="nav"
        transition="3s ease"
        bg="gray.900"
        borderRight="1px solid"
        borderRightColor="gray.600"
        w={{ base: 'full', md: 60 }}
        minH="100vh"
        flexDir={'column'}
    >
        <IconButton
            display={{ base: 'flex', md: 'none' }}
            aria-label="Close Menu"
            borderRadius="full"
            variant="ghost"
            onClick={onClose}
            alignSelf="flex-end"
            m={2}
        >
            <PiX />
        </IconButton>
        <Flex alignItems={'center'} gap={{ base: 2, md: 8 }} p={8}>
            <Link href="/" _focus={{ boxShadow: 'none' }}>
                <Image
                    src={headerData.logoSrc}
                    alt="Logo da Mazzotini"
                    objectFit={'contain'}
                    maxW={{ base: 32, md: 40 }}
                />
            </Link>
        </Flex>
        <VStack as="nav" gap={1} align="stretch" px={2} py={4}>
            {SideBarItems.map((link) => (
                <NavItem key={link.name} icon={link.icon} href={link.href} onClick={onClose}>
                    {link.name}
                </NavItem>
            ))}
        </VStack>
    </Flex>
);

// ============================================================================
//  COMPONENTE: Item de Navegação
// ============================================================================
const NavItem = ({ icon, children, href, onClick }: NavItemProps & { onClick?: () => void }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link as={NextLink} href={href} style={{ textDecoration: 'none' }} onClick={onClick}>
            <Flex
                align="center"
                p="3"
                w='100%'
                borderRadius={2}
                cursor="pointer"
                bg={isActive ? 'brand.900' : 'transparent'}
                color={isActive ? 'white' : 'gray.400'}
                _hover={{ bg: 'brand.800', color: 'white' }}
            >
                {icon && <Icon mr="4" fontSize="18" as={icon} />}
                {children}
            </Flex>
        </Link>
    );
};

// ============================================================================
//  COMPONENTE: Barra de Navegação Superior (Header)
// ============================================================================
const HeaderNav = ({ onOpen, ...rest }: { onOpen: () => void } & FlexProps) => {
    const { isAuthenticated, loginWithRedirect } = useAuth0();
    return (
        <Flex
            px={{ base: 4, md: 8 }}
            height="20"
            alignItems="center"
            bg="gray.900"
            justifyContent={{ base: 'space-between', md: 'flex-end' }}
            borderBottom={'1px solid'}
            borderColor={'gray.600'}
            {...rest}
        >
            <IconButton
                display={{ base: 'flex', md: 'none' }}
                onClick={onOpen}
                variant="outline"
                aria-label="Abrir menu"
            >
                <PiList />
            </IconButton>
            <Text display={{ base: 'flex', md: 'none' }} fontSize="2xl" fontWeight="bold">
                Mazzotini
            </Text>

            {isAuthenticated ? (
                <UserAvatar />
            ) : (
                <Button onClick={() => loginWithRedirect()} colorScheme="blue">
                    Entrar
                </Button>
            )}
        </Flex>
    );
};

// ============================================================================
//  COMPONENTE PRINCIPAL: AppLayout (Estrutura Final Corrigida)
// ============================================================================
export function AppLayout({ children }: { children: React.ReactNode }) {
    const { open, onOpen, onClose } = useDisclosure();

    return (
        <Flex w="100%" minH="100vh" bg="gray.800">
            {/* Coluna da Esquerda: Sidebar visível apenas no desktop */}
            <SidebarContent onClose={onClose} display={{ base: 'none', md: 'flex' }} />

            {/* Drawer para a sidebar no mobile */}
            <Drawer.Root open={open} placement="start">
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content bg="gray.900">
                        <SidebarContent onClose={onClose} />
                    </Drawer.Content>
                </Drawer.Positioner>
            </Drawer.Root>

            {/* Coluna da Direita: Header + Conteúdo da Página */}
            <Flex flexDir="column" flex="1">
                <HeaderNav onOpen={onOpen} />
                <Flex as="main" flexDir={'column'} p={{ base: 4, md: 6 }} flex="1">
                    {children}
                </Flex>
            </Flex>
        </Flex>
    );
}
