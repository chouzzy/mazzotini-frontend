// src\app\components\layout\AppLayout.tsx

'use client';

import {
    Box,
    Flex,
    Drawer,
    useDisclosure,
    FlexProps,
    Icon,
    Text,
    IconButton,
    Link,
    Button,
    VStack,
    Image,
    useBreakpointValue,
    HStack,
    Badge,
} from '@chakra-ui/react';
import {
    PiChartPieSlice,
    PiUser,
    PiGear,
    PiList,
    PiScales,
    PiHouseDuotone,
    PiX,
    PiArrowsLeftRight,
    PiUsersThree,
} from 'react-icons/pi';
import { IconType } from 'react-icons';
import NextLink from 'next/link';
import { useAuth0 } from '@auth0/auth0-react';
import { usePathname, useRouter } from 'next/navigation';
import { UserAvatar } from './UserAvatar';
import { headerData } from '@/app/data/header';
import { SideBarItems } from '@/app/data/sideBar';
import { translateRole } from '@/utils/masks';
import { NotificationsMenu } from '../notifications/NotificationsMenu';
import { useApi } from '@/hooks/useApi';
import { useViewMode, ViewMode } from '@/context/ViewModeContext';
import { useEffect } from 'react';

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
const SidebarContent = ({ onClose }: { onClose: () => void }) => {
    const { data: myProfile } = useApi<{ role: string }>('/api/users/me');
    const { viewMode } = useViewMode();
    const userRole = myProfile?.role;

    // Papel efetivo considera o view mode para usuários dual-role
    const effectiveRole = (userRole === 'ASSOCIATE' && viewMode === 'client') ? 'INVESTOR' : userRole;

    const visibleItems = SideBarItems.filter(link => {
        if (link.roles && (!effectiveRole || !link.roles.includes(effectiveRole))) return false;
        if (link.hideForRoles && effectiveRole && link.hideForRoles.includes(effectiveRole)) return false;
        return true;
    });

    return (
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
                variant="solid"
                colorPalette="gray"
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
                {visibleItems.map((link) => (
                    <NavItem key={link.name + link.href} icon={link.icon} href={link.href} onClick={onClose}>
                        {link.name}
                    </NavItem>
                ))}
            </VStack>
        </Flex>
    );
};

// ============================================================================
//  COMPONENTE: Item de Navegação
// ============================================================================
const NavItem = ({ icon, children, href, onClick }: NavItemProps & { onClick?: () => void }) => {
    const pathname = usePathname();

    let isActive = pathname === href;

    if (href === '/processos' && pathname.startsWith('/processos/')) {
        isActive = true;
    }
    if (pathname.startsWith('/processos/novo') && href === '/processos') {
        isActive = false;
    }
    if (pathname.startsWith('/perfil') && href.startsWith('/perfil')) {
        isActive = true;
    }
    if (href.startsWith('/gestao') && pathname.startsWith('/gestao')) {
        isActive = true;
    }
    // /associado (Meus Clientes) ativa também em /associado/clientes/...
    if (href === '/associado' && pathname.startsWith('/associado/clientes')) {
        isActive = true;
    }

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
//  COMPONENTE: Toggle de Área (dual-role)
// ============================================================================
function ViewModeToggle() {
    const { data: myProfile } = useApi<{ role: string }>('/api/users/me');
    const { data: myInvestments } = useApi<any[]>(
        myProfile?.role === 'ASSOCIATE' ? '/api/investments/me' : null
    );
    const { viewMode, toggleViewMode, isDualRole, markAsDualRole } = useViewMode();
    const router = useRouter();

    useEffect(() => {
        if (myProfile?.role === 'ASSOCIATE' && myInvestments && myInvestments.length > 0) {
            markAsDualRole();
        }
    }, [myProfile, myInvestments, markAsDualRole]);

    if (!isDualRole) return null;

    const isClientView = viewMode === 'client';

    const handleToggle = () => {
        toggleViewMode();
        // Redireciona para o início da área correspondente
        router.push(isClientView ? '/associado/dashboard' : '/dashboard');
    };

    return (
        <Button
            size="sm"
            variant="outline"
            borderColor="brand.600"
            color="brand.300"
            _hover={{ bg: 'brand.900', borderColor: 'brand.400' }}
            gap={2}
            onClick={handleToggle}
            title={isClientView ? 'Alternar para Área do Associado' : 'Alternar para Área do Cliente'}
        >
            <Icon as={PiArrowsLeftRight} />
            <HStack gap={1} display={{ base: 'none', md: 'flex' }}>
                <Text
                    fontSize="xs"
                    fontWeight={!isClientView ? 'bold' : 'normal'}
                    color={!isClientView ? 'brand.200' : 'gray.400'}
                >
                    Associado
                </Text>
                <Text fontSize="xs" color="gray.600">/</Text>
                <Text
                    fontSize="xs"
                    fontWeight={isClientView ? 'bold' : 'normal'}
                    color={isClientView ? 'brand.200' : 'gray.400'}
                >
                    Cliente
                </Text>
            </HStack>
        </Button>
    );
}

// ============================================================================
//  COMPONENTE: Barra de Navegação Superior (Header)
// ============================================================================
export const HeaderNav = ({ onOpen, ...rest }: { onOpen: () => void } & FlexProps) => {
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
            gap={3}
            {...rest}
        >
            <IconButton
                display={{ base: 'flex', md: 'none' }}
                onClick={onOpen}
                bgColor={'transparent'}
                border={'1px solid'}
                borderColor={'gray.600'}
                color={'brand.600'}
                aria-label="Abrir menu"
            >
                <PiList />
            </IconButton>
            <Text display={{ base: 'flex', md: 'none' }} fontSize="2xl" fontWeight="bold">
                Mazzotini
            </Text>

            {isAuthenticated ? (
                <>
                    <ViewModeToggle />
                    <NotificationsMenu />
                    <UserAvatar />
                </>
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

    const showSidebar = useBreakpointValue({ base: false, lg: true });
    const pathname = usePathname();
    const shouldShowSidebar = !(pathname && pathname.startsWith('/perfil/completar'));

    return (
        <Flex w="100%" minH="100vh" bg="gray.800">
            {showSidebar && shouldShowSidebar && <SidebarContent onClose={onClose} />}

            <Drawer.Root open={open} placement="start">
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content bg="gray.900">
                        <SidebarContent onClose={onClose} />
                    </Drawer.Content>
                </Drawer.Positioner>
            </Drawer.Root>

            <Flex flexDir="column" flex="1">
                <HeaderNav onOpen={onOpen} />
                <Flex as="main" flexDir={'column'} p={{ base: 4, md: 6 }} flex="1">
                    {children}
                </Flex>
            </Flex>
        </Flex>
    );
}
