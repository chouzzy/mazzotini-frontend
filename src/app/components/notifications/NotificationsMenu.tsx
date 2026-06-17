'use client';

import {
    Menu,
    Portal,
    IconButton,
    Box,
    Text,
    VStack,
    Icon,
    Flex,
    Spinner,
    Button,
    Badge,
} from "@chakra-ui/react";
import {
    PiBell,
    PiBellFill,
    PiCheckCircle,
    PiInfo,
    PiWarning,
    PiXCircle,
    PiUploadSimple,
    PiUserCircle,
    PiPencilSimple,
    PiRobotDuotone,
    PiArrowRight,
} from "react-icons/pi";
import { useApi } from "@/hooks/useApi";
import { useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

interface AdminNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    notificationType: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
    relatedEntityName?: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationsResponse {
    items: AdminNotification[];
    meta: { total: number; page: number; limit: number; totalPages: number };
}

interface UnreadCountResponse {
    count: number;
}

function getTypeIcon(notificationType: string, type: string) {
    switch (notificationType) {
        case 'STAGING_DOCUMENT_UPLOADED': return <Icon as={PiUploadSimple} color="orange.400" />;
        case 'NEW_USER_PENDING_REVIEW':   return <Icon as={PiUserCircle} color="blue.400" />;
        case 'PROFILE_CHANGE_REQUESTED': return <Icon as={PiPencilSimple} color="purple.400" />;
        case 'FAILED_ENRICHMENT':        return <Icon as={PiXCircle} color="red.400" />;
        case 'ASSET_IMPORTED':           return <Icon as={PiRobotDuotone} color="green.400" />;
        default:
            if (type === 'success') return <Icon as={PiCheckCircle} color="green.400" />;
            if (type === 'warning') return <Icon as={PiWarning} color="orange.400" />;
            if (type === 'error')   return <Icon as={PiXCircle} color="red.400" />;
            return <Icon as={PiInfo} color="blue.400" />;
    }
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'agora';
    if (m < 60) return `${m}m atrás`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h atrás`;
    const d = Math.floor(h / 24);
    return `${d}d atrás`;
}

export function NotificationsMenu() {
    const { getAccessTokenSilently, isAuthenticated } = useAuth0();
    const { data: profile } = useApi<{ role: string }>('/api/users/me');
    const isAdmin = profile?.role === 'ADMIN';

    const { data: unreadData, mutate: mutateCount } = useApi<UnreadCountResponse>(
        isAdmin ? '/api/notifications/unread-count' : null
    );
    const { data: notifData, mutate: mutateList } = useApi<NotificationsResponse>(
        isAdmin ? '/api/notifications?limit=10' : null
    );

    const unreadCount = unreadData?.count ?? 0;
    const notifications = notifData?.items ?? [];

    const markAsRead = useCallback(async (id: string) => {
        try {
            const token = await getAccessTokenSilently();
            const base = process.env.NEXT_PUBLIC_API_BASE_URL;
            await axios.patch(`${base}/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            mutateList();
            mutateCount();
        } catch {}
    }, [getAccessTokenSilently, mutateList, mutateCount]);

    const markAllAsRead = useCallback(async () => {
        try {
            const token = await getAccessTokenSilently();
            const base = process.env.NEXT_PUBLIC_API_BASE_URL;
            await axios.patch(`${base}/api/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            mutateList();
            mutateCount();
        } catch {}
    }, [getAccessTokenSilently, mutateList, mutateCount]);

    if (!isAuthenticated || !isAdmin) return null;

    return (
        <Menu.Root>
            <Menu.Trigger asChild>
                <Box position="relative" cursor="pointer">
                    <IconButton
                        aria-label="Notificações"
                        variant="ghost"
                        color={unreadCount > 0 ? "#d3b53d" : "gray.400"}
                        _hover={{ color: "white", bg: "whiteAlpha.200" }}
                        borderRadius="full"
                    >
                        {unreadCount > 0 ? <PiBellFill size={20} /> : <PiBell size={20} />}
                    </IconButton>
                    {unreadCount > 0 && (
                        <Box
                            position="absolute"
                            top="2px"
                            right="2px"
                            minW="16px"
                            h="16px"
                            bg="red.500"
                            borderRadius="full"
                            border="2px solid"
                            borderColor="gray.900"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Text fontSize="9px" fontWeight="bold" color="white" lineHeight="1" px="2px">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </Box>
                    )}
                </Box>
            </Menu.Trigger>
            <Portal>
                <Menu.Positioner>
                    <Menu.Content
                        minW={{ base: '90vw', md: '380px' }}
                        maxW={{ base: '95vw', md: '420px' }}
                        maxH="480px"
                        overflowY="auto"
                        borderRadius="md"
                        bg="gray.800"
                        borderColor="gray.700"
                        p={0}
                    >
                        {/* Header */}
                        <Flex
                            px={4} py={3}
                            borderBottom="1px solid"
                            borderColor="gray.700"
                            justify="space-between"
                            align="center"
                        >
                            <Text fontWeight="bold" fontSize="sm" color="white">
                                Notificações
                                {unreadCount > 0 && (
                                    <Badge ml={2} colorPalette="red" size="sm">{unreadCount} novas</Badge>
                                )}
                            </Text>
                            {unreadCount > 0 && (
                                <Button
                                    size="xs"
                                    variant="ghost"
                                    color="brand.400"
                                    _hover={{ color: 'brand.300' }}
                                    onClick={markAllAsRead}
                                >
                                    Marcar todas como lidas
                                </Button>
                            )}
                        </Flex>

                        {/* Lista */}
                        {notifications.length === 0 ? (
                            <Box p={6} textAlign="center">
                                <Text fontSize="sm" color="gray.500">Nenhuma notificação por enquanto.</Text>
                            </Box>
                        ) : (
                            notifications.map(notif => (
                                <Menu.Item
                                    key={notif.id}
                                    value={notif.id}
                                    p={0}
                                    cursor="pointer"
                                    _hover={{ bg: 'gray.750' }}
                                    bg={notif.isRead ? 'transparent' : 'gray.750'}
                                    onClick={() => {
                                        if (!notif.isRead) markAsRead(notif.id);
                                    }}
                                >
                                    <Flex
                                        px={4} py={3}
                                        gap={3}
                                        align="start"
                                        w="100%"
                                        borderBottom="1px solid"
                                        borderColor="gray.700"
                                        position="relative"
                                    >
                                        {!notif.isRead && (
                                            <Box
                                                position="absolute"
                                                left="8px"
                                                top="50%"
                                                transform="translateY(-50%)"
                                                w="6px"
                                                h="6px"
                                                bg="brand.400"
                                                borderRadius="full"
                                            />
                                        )}
                                        <Box mt="2px" fontSize="lg" flexShrink={0} pl={notif.isRead ? 0 : '10px'}>
                                            {getTypeIcon(notif.notificationType, notif.type)}
                                        </Box>
                                        <VStack align="start" gap={1} flex={1} minW={0}>
                                            <Flex justify="space-between" w="100%" align="center" gap={2}>
                                                <Text
                                                    fontWeight={notif.isRead ? 'normal' : 'semibold'}
                                                    fontSize="sm"
                                                    color={notif.isRead ? 'gray.300' : 'white'}
                                                    overflow="hidden"
                                                    textOverflow="ellipsis"
                                                    whiteSpace="nowrap"
                                                >
                                                    {notif.title}
                                                </Text>
                                                <Text fontSize="xs" color="gray.500" flexShrink={0}>
                                                    {timeAgo(notif.createdAt)}
                                                </Text>
                                            </Flex>
                                            <Text fontSize="xs" color="gray.400" lineHeight="1.4" lineClamp={2}>
                                                {notif.message}
                                            </Text>
                                        </VStack>
                                    </Flex>
                                </Menu.Item>
                            ))
                        )}

                        {/* Footer link */}
                        <Menu.Item
                            value="ver-todas"
                            px={4} py={3}
                            borderTop="1px solid"
                            borderColor="gray.700"
                            cursor="pointer"
                            _hover={{ bg: 'gray.750' }}
                            onClick={() => window.location.href = '/gestao/notificacoes'}
                        >
                            <Flex align="center" justify="center" gap={1} w="100%" color="brand.400" fontSize="sm" fontWeight="medium">
                                Ver todas as notificações <Icon as={PiArrowRight} boxSize={4} />
                            </Flex>
                        </Menu.Item>
                    </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
    );
}
