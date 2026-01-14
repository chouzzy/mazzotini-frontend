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
    Dialog,
    Button
} from "@chakra-ui/react";
import { PiBell, PiCheckCircle, PiInfo, PiWarning, PiStar, PiX } from "react-icons/pi";
import { useApi } from "@/hooks/useApi";
import { useState, useEffect } from "react";

interface SystemNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'new';
    createdAt: string;
    link?: string;
}

export function NotificationsMenu() {
    const { data: notifications, isLoading } = useApi<SystemNotification[]>('/api/notifications');
    const [hasUnread, setHasUnread] = useState(false);

    // Estado para controlar o Dialog
    const [selectedNotif, setSelectedNotif] = useState<SystemNotification | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Verifica notificações não lidas
    useEffect(() => {
        if (notifications && notifications.length > 0) {
            const lastRead = localStorage.getItem('mazzotini_last_read_notif');
            const latestNotifDate = new Date(notifications[0].createdAt).getTime();

            if (!lastRead || latestNotifDate > parseInt(lastRead)) {
                setHasUnread(true);
            } else {
                setHasUnread(false);
            }
        }
    }, [notifications]);

    const handleOpenMenu = () => {
        // Marca como lido apenas ao abrir o menu (visualização rápida)
        if (notifications && notifications.length > 0) {
            const latestNotifDate = new Date(notifications[0].createdAt).getTime();
            localStorage.setItem('mazzotini_last_read_notif', latestNotifDate.toString());
            setHasUnread(false);
        }
    };

    const handleItemClick = (notif: SystemNotification) => {
        setSelectedNotif(notif);
        setIsDialogOpen(true);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <Icon as={PiCheckCircle} color="green.400" mt={1} />;
            case 'warning': return <Icon as={PiWarning} color="orange.400" mt={1} />;
            case 'new': return <Icon as={PiStar} color="yellow.400" mt={1} />;
            default: return <Icon as={PiInfo} color="blue.400" mt={1} />;
        }
    };

    return (
        <>
            {/* --- MENU (O SININHO) --- */}
            <Menu.Root onOpenChange={(e) => e.open && handleOpenMenu()}>
                <Menu.Trigger asChild>
                    <Box position="relative">
                        <IconButton
                            aria-label="Notificações"
                            variant="ghost"
                            color="gray.400"
                            _hover={{ color: "white", bg: "whiteAlpha.200" }}
                            borderRadius="full"
                        >
                            <PiBell size={20} />
                        </IconButton>
                        {hasUnread && (
                            <Box
                                position="absolute"
                                top="2px"
                                right="2px"
                                w="8px"
                                h="8px"
                                bg="red.500"
                                borderRadius="full"
                                border="2px solid"
                                borderColor="gray.900"
                            />
                        )}
                    </Box>
                </Menu.Trigger>
                <Portal>
                    <Menu.Positioner>
                        <Menu.Content minW={'xl'} maxW="2xl" maxH="400px" overflowY="auto" borderRadius="md" bg="gray.800" borderColor="gray.700">
                            <Box p={3} borderBottom="1px solid" borderColor="gray.700">
                                <Text fontWeight="bold" fontSize="sm" color="gray.300">Novidades e Atualizações</Text>
                            </Box>

                            {isLoading ? (
                                <Flex p={4} justify="center"><Spinner size="sm" /></Flex>
                            ) : notifications && notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <Menu.Item
                                        key={notif.id}
                                        value={notif.id}
                                        _hover={{ bg: "gray.700" }}
                                        p={3}
                                        cursor="pointer"
                                        onClick={() => handleItemClick(notif)}
                                    >
                                        <Flex gap={3} align="start" w='100%'>
                                            <Flex align="center" my={'auto'} fontSize={'xl'}>
                                                {getIcon(notif.type)}
                                            </Flex>
                                            <VStack align="start" gap={2} flex={1} w='100%'>
                                                <Flex justify="space-between" w="100%" align="center" gap={2}>
                                                    <Text fontWeight="semibold" fontSize="sm" color="white">{notif.title}</Text>
                                                    <Text fontSize="xs" color="gray.500">
                                                        {new Date(notif.createdAt).toLocaleDateString('pt-BR')}
                                                    </Text>
                                                </Flex>
                                                <Text fontSize="xs" color="gray.400" lineHeight="1.4" lineClamp={2}>
                                                    {notif.message}
                                                </Text>
                                            </VStack>
                                        </Flex>
                                    </Menu.Item>
                                ))
                            ) : (
                                <Box p={4} textAlign="center">
                                    <Text fontSize="sm" color="gray.500">Nenhuma novidade por enquanto.</Text>
                                </Box>
                            )}
                        </Menu.Content>
                    </Menu.Positioner>
                </Portal>
            </Menu.Root>

            {/* --- DIALOG (DETALHES DA NOTIFICAÇÃO) --- */}
            <Dialog.Root
                open={isDialogOpen}
                onOpenChange={(e) => setIsDialogOpen(e.open)}
                size="lg"
            >
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content bg="gray.800" color="white">
                        <Dialog.CloseTrigger asChild>
                            <IconButton aria-label="Close" variant="ghost" size="sm" position="absolute" top="2" right="2">
                                <PiX />
                            </IconButton>
                        </Dialog.CloseTrigger>

                        <Dialog.Header gap={0} flexDir={'column'} >
                            <Flex align="center" gap={3} alignItems={'center'}>
                                <Dialog.Title fontSize="xl">{selectedNotif?.title}</Dialog.Title>
                            </Flex>
                            {selectedNotif && (
                                <Text fontSize="sm" color="gray.500" mt={1}>
                                    Publicado em: {new Date(selectedNotif.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            )}
                        </Dialog.Header>

                        <Dialog.Body>
                            <Box
                                whiteSpace="pre-wrap"
                                color="gray.300"
                                lineHeight="1.8"
                                fontSize="md"
                            >
                                {selectedNotif?.message}
                            </Box>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Button variant="solid" colorPalette="red" onClick={() => setIsDialogOpen(false)}>
                                Fechar
                            </Button>
                            {selectedNotif?.link && (
                                <Button
                                    colorScheme="blue"
                                    onClick={() => window.open(selectedNotif.link, '_blank')}
                                >
                                    Saiba Mais
                                </Button>
                            )}
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>
        </>
    );
}