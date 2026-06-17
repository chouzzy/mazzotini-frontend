'use client';

import {
    Flex,
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
import { PiSignOut } from "react-icons/pi";
import { MotionButton } from "../ui/MotionButton";
import { useApi } from "@/hooks/useApi";
import { translateRole, getRoleColorScheme } from "@/utils/masks";

interface MazzotiniUser {
    name: string;
    email: string;
    profilePictureUrl?: string;
}

export function UserAvatar() {
    const { isAuthenticated, user: auth0User, logout } = useAuth0();

    const { data: userProfile, isLoading: isProfileLoading } = useApi<MazzotiniUser>(
        isAuthenticated ? '/api/users/me' : null
    );

    if (isProfileLoading) {
        return <SkeletonCircle size="10" />;
    }

    const profilePicture = userProfile?.profilePictureUrl || auth0User?.picture;
    const profileName = userProfile?.name || auth0User?.name;

    const roles = auth0User?.['https://mazzotini.awer.co/roles'] || [];
    const primaryRole = roles[0];

    return (
        <>
            {
                isAuthenticated ? (
                    <Flex gap={{ base: 1, md: 4 }} alignItems="center" flexDir={{ base: 'column-reverse', md: 'row' }}>
                        {primaryRole && (
                            <Tag.Root
                                size={{ base: 'sm', md: 'lg' }}
                                variant="subtle"
                                colorPalette={getRoleColorScheme(primaryRole)}
                            >
                                <Tag.Label fontSize={{ base: '2xs', md: 'xs' }}>{translateRole(primaryRole)}</Tag.Label>
                            </Tag.Root>
                        )}
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
                    <MotionButton />
                )
            }
        </>
    )
}