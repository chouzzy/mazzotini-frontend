'use client';

import {
    Box,
    Flex,
    Heading,
    Text,
    VStack,
    HStack,
    Icon,
    Spinner,
    Button,
    Badge,
    Table,
    Select,
    Input,
    createListCollection,
} from '@chakra-ui/react';
import {
    PiBell,
    PiCheckCircle,
    PiInfo,
    PiWarning,
    PiXCircle,
    PiUploadSimple,
    PiUserCircle,
    PiPencilSimple,
    PiRobotDuotone,
    PiCaretLeftBold,
    PiCaretRightBold,
    PiCheckSquare,
} from 'react-icons/pi';
import { useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useApi } from '@/hooks/useApi';
import { RoleGuard } from '@/app/components/auth/RoleGuard';

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

const NOTIFICATION_TYPES = [
    { value: 'ALL',                       label: 'Todos os tipos' },
    { value: 'STAGING_DOCUMENT_UPLOADED', label: 'Documento enviado' },
    { value: 'NEW_USER_PENDING_REVIEW',   label: 'Novo usuário pendente' },
    { value: 'PROFILE_CHANGE_REQUESTED',  label: 'Alteração de perfil' },
    { value: 'FAILED_ENRICHMENT',         label: 'Falha no Legal One' },
    { value: 'ASSET_IMPORTED',            label: 'Processo importado' },
    { value: 'GENERAL',                   label: 'Geral' },
];

const STATUS_OPTIONS = [
    { value: 'ALL',    label: 'Todos' },
    { value: 'unread', label: 'Não lidas' },
    { value: 'read',   label: 'Lidas' },
];

function getTypeIcon(notificationType: string, type: string) {
    switch (notificationType) {
        case 'STAGING_DOCUMENT_UPLOADED': return <Icon as={PiUploadSimple} color="orange.400" boxSize={4} />;
        case 'NEW_USER_PENDING_REVIEW':   return <Icon as={PiUserCircle}   color="blue.400"   boxSize={4} />;
        case 'PROFILE_CHANGE_REQUESTED':  return <Icon as={PiPencilSimple} color="purple.400" boxSize={4} />;
        case 'FAILED_ENRICHMENT':         return <Icon as={PiXCircle}      color="red.400"    boxSize={4} />;
        case 'ASSET_IMPORTED':            return <Icon as={PiRobotDuotone} color="green.400"  boxSize={4} />;
        default:
            if (type === 'success') return <Icon as={PiCheckCircle} color="green.400"  boxSize={4} />;
            if (type === 'warning') return <Icon as={PiWarning}     color="orange.400" boxSize={4} />;
            if (type === 'error')   return <Icon as={PiXCircle}     color="red.400"    boxSize={4} />;
            return <Icon as={PiInfo} color="blue.400" boxSize={4} />;
    }
}

function getTypeBadge(notificationType: string) {
    const map: Record<string, { label: string; color: string }> = {
        STAGING_DOCUMENT_UPLOADED: { label: 'Documento',       color: 'orange' },
        NEW_USER_PENDING_REVIEW:   { label: 'Novo usuário',    color: 'blue'   },
        PROFILE_CHANGE_REQUESTED:  { label: 'Alt. perfil',     color: 'purple' },
        FAILED_ENRICHMENT:         { label: 'Falha Legal One', color: 'red'    },
        ASSET_IMPORTED:            { label: 'Importado',       color: 'green'  },
        GENERAL:                   { label: 'Geral',           color: 'gray'   },
    };
    const cfg = map[notificationType] ?? { label: notificationType, color: 'gray' };
    return <Badge colorPalette={cfg.color} size="sm" variant="subtle">{cfg.label}</Badge>;
}

export default function NotificacoesPage() {
    const { getAccessTokenSilently } = useAuth0();

    const [page, setPage]                 = useState(1);
    const [filterType, setFilterType]     = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterFrom, setFilterFrom]     = useState('');
    const [filterTo, setFilterTo]         = useState('');

    const buildQuery = () => {
        const params = new URLSearchParams();
        params.set('page',  String(page));
        params.set('limit', '20');
        if (filterType   !== 'ALL') params.set('notificationType', filterType);
        if (filterStatus !== 'ALL') params.set('status', filterStatus);
        if (filterFrom) params.set('from', filterFrom);
        if (filterTo)   params.set('to',   filterTo);
        return params.toString();
    };

    const { data, isLoading, mutate } = useApi<NotificationsResponse>(
        `/api/notifications?${buildQuery()}`
    );
    const { mutate: mutateCount } = useApi<{ count: number }>('/api/notifications/unread-count');

    const notifications = data?.items ?? [];
    const meta          = data?.meta;

    const callApi = useCallback(async (method: 'patch', url: string, body?: any) => {
        const token = await getAccessTokenSilently();
        const base  = process.env.NEXT_PUBLIC_API_BASE_URL;
        await axios[method](`${base}${url}`, body ?? {}, {
            headers: { Authorization: `Bearer ${token}` },
        });
        mutate();
        mutateCount();
    }, [getAccessTokenSilently, mutate, mutateCount]);

    const markRead   = (id: string) => callApi('patch', `/api/notifications/${id}/read`);
    const markUnread = (id: string) => callApi('patch', `/api/notifications/${id}/unread`);
    const markAllRead = () => callApi('patch', '/api/notifications/read-all');

    return (
        <RoleGuard>
            <Flex w="100%">
                <VStack gap={6} align="stretch" w="100%">
                    <Flex justify="space-between" align="start" direction={{ base: 'column', md: 'row' }} gap={4}>
                        <Box>
                            <Flex align="center" gap={2}>
                                <PiBell color="#B8A76E" size={24} />
                                <Heading as="h1" size="xl">NOTIFICAÇÕES</Heading>
                            </Flex>
                            <Text color="gray.400" mt={2}>
                                Gerencie todas as notificações automáticas da plataforma.
                            </Text>
                        </Box>
                        <Button
                            size="sm"
                            colorPalette="brand"
                            variant="outline"
                            gap={2}
                            onClick={markAllRead}
                        >
                            <Icon as={PiCheckSquare} /> Marcar todas como lidas
                        </Button>
                    </Flex>

                    <Flex gap={3} wrap="wrap" align="flex-end">
                        <Box minW={{ base: '100%', md: '180px' }}>
                            <Text fontSize="xs" color="gray.400" mb={1}>Tipo</Text>
                            <Select.Root
                                collection={createListCollection({ items: NOTIFICATION_TYPES })}
                                value={[filterType]}
                                onValueChange={({ value }) => { setFilterType(value[0] ?? 'ALL'); setPage(1); }}
                                size="sm"
                            >
                                <Select.Trigger bg="gray.800" borderColor="gray.600">
                                    <Select.ValueText />
                                </Select.Trigger>
                                <Select.Positioner>
                                    <Select.Content bg="gray.800">
                                        {NOTIFICATION_TYPES.map(opt => (
                                            <Select.Item key={opt.value} item={opt}>
                                                <Select.ItemText>{opt.label}</Select.ItemText>
                                            </Select.Item>
                                        ))}
                                    </Select.Content>
                                </Select.Positioner>
                            </Select.Root>
                        </Box>

                        <Box minW={{ base: '100%', md: '140px' }}>
                            <Text fontSize="xs" color="gray.400" mb={1}>Status</Text>
                            <Select.Root
                                collection={createListCollection({ items: STATUS_OPTIONS })}
                                value={[filterStatus]}
                                onValueChange={({ value }) => { setFilterStatus(value[0] ?? 'ALL'); setPage(1); }}
                                size="sm"
                            >
                                <Select.Trigger bg="gray.800" borderColor="gray.600">
                                    <Select.ValueText />
                                </Select.Trigger>
                                <Select.Positioner>
                                    <Select.Content bg="gray.800">
                                        {STATUS_OPTIONS.map(opt => (
                                            <Select.Item key={opt.value} item={opt}>
                                                <Select.ItemText>{opt.label}</Select.ItemText>
                                            </Select.Item>
                                        ))}
                                    </Select.Content>
                                </Select.Positioner>
                            </Select.Root>
                        </Box>

                        <Box>
                            <Text fontSize="xs" color="gray.400" mb={1}>De</Text>
                            <Input
                                type="date"
                                size="sm"
                                bg="gray.800"
                                borderColor="gray.600"
                                value={filterFrom}
                                onChange={e => { setFilterFrom(e.target.value); setPage(1); }}
                                w={{ base: '100%', md: '160px' }}
                            />
                        </Box>

                        <Box>
                            <Text fontSize="xs" color="gray.400" mb={1}>Até</Text>
                            <Input
                                type="date"
                                size="sm"
                                bg="gray.800"
                                borderColor="gray.600"
                                value={filterTo}
                                onChange={e => { setFilterTo(e.target.value); setPage(1); }}
                                w={{ base: '100%', md: '160px' }}
                            />
                        </Box>

                        {(filterType !== 'ALL' || filterStatus !== 'ALL' || filterFrom || filterTo) && (
                            <Button
                                size="sm"
                                variant="ghost"
                                color="gray.400"
                                onClick={() => {
                                    setFilterType('ALL');
                                    setFilterStatus('ALL');
                                    setFilterFrom('');
                                    setFilterTo('');
                                    setPage(1);
                                }}
                            >
                                Limpar filtros
                            </Button>
                        )}
                    </Flex>

                    <Box position="relative" minH="200px">
                        {isLoading && (
                            <Flex position="absolute" inset={0} bg="blackAlpha.500" zIndex={2} justify="center" align="center" borderRadius="md">
                                <Spinner size="xl" color="brand.500" />
                            </Flex>
                        )}

                        {!isLoading && notifications.length === 0 ? (
                            <Flex justify="center" align="center" p={12} bg="gray.900" borderRadius="md">
                                <VStack gap={3}>
                                    <Icon as={PiBell} boxSize={10} color="gray.600" />
                                    <Text color="gray.500">Nenhuma notificação encontrada.</Text>
                                </VStack>
                            </Flex>
                        ) : (
                            <Box opacity={isLoading ? 0.5 : 1} transition="opacity 0.2s">
                                <Box overflowX="auto">
                                <Table.Root variant="line" size="sm" bgColor="bodyBg">
                                    <Table.Header>
                                        <Table.Row borderBottom="1px solid" borderColor="gray.700" bg="gray.900">
                                            <Table.ColumnHeader color="brand.600" px={4} py={3} w="24px" />
                                            <Table.ColumnHeader color="brand.600" px={4} py={3}>Tipo</Table.ColumnHeader>
                                            <Table.ColumnHeader color="brand.600" px={4} py={3}>Título</Table.ColumnHeader>
                                            <Table.ColumnHeader color="brand.600" px={4} py={3}>Mensagem</Table.ColumnHeader>
                                            <Table.ColumnHeader color="brand.600" px={4} py={3}>Cliente / Entidade</Table.ColumnHeader>
                                            <Table.ColumnHeader color="brand.600" px={4} py={3}>Data</Table.ColumnHeader>
                                            <Table.ColumnHeader color="brand.600" px={4} py={3}>Status</Table.ColumnHeader>
                                            <Table.ColumnHeader color="brand.600" px={4} py={3} />
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {notifications.map(notif => (
                                            <Table.Row
                                                key={notif.id}
                                                bg={notif.isRead ? 'gray.900' : 'gray.850'}
                                                _hover={{ bg: 'whiteAlpha.50' }}
                                            >
                                                <Table.Cell px={4} py={3}>
                                                    {getTypeIcon(notif.notificationType, notif.type)}
                                                </Table.Cell>
                                                <Table.Cell px={4} py={3}>
                                                    {getTypeBadge(notif.notificationType)}
                                                </Table.Cell>
                                                <Table.Cell px={4} py={3}>
                                                    <Text
                                                        fontSize="sm"
                                                        fontWeight={notif.isRead ? 'normal' : 'semibold'}
                                                        color={notif.isRead ? 'gray.300' : 'white'}
                                                        maxW="200px"
                                                        overflow="hidden"
                                                        textOverflow="ellipsis"
                                                        whiteSpace="nowrap"
                                                    >
                                                        {notif.title}
                                                    </Text>
                                                </Table.Cell>
                                                <Table.Cell px={4} py={3}>
                                                    <Text fontSize="xs" color="gray.400" maxW="260px" lineClamp={2}>
                                                        {notif.message}
                                                    </Text>
                                                </Table.Cell>
                                                <Table.Cell px={4} py={3}>
                                                    <Text fontSize="sm" color="gray.300">
                                                        {notif.relatedEntityName ?? '—'}
                                                    </Text>
                                                </Table.Cell>
                                                <Table.Cell px={4} py={3}>
                                                    <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">
                                                        {new Date(notif.createdAt).toLocaleString('pt-BR', {
                                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit',
                                                        })}
                                                    </Text>
                                                </Table.Cell>
                                                <Table.Cell px={4} py={3}>
                                                    <Badge
                                                        colorPalette={notif.isRead ? 'gray' : 'brand'}
                                                        size="sm"
                                                        variant="subtle"
                                                    >
                                                        {notif.isRead ? 'Lida' : 'Nova'}
                                                    </Badge>
                                                </Table.Cell>
                                                <Table.Cell px={4} py={3}>
                                                    <HStack gap={1}>
                                                        {!notif.isRead ? (
                                                            <Button
                                                                size="xs"
                                                                variant="ghost"
                                                                color="green.400"
                                                                _hover={{ color: 'green.300', bg: 'green.900' }}
                                                                onClick={() => markRead(notif.id)}
                                                                title="Marcar como lida"
                                                            >
                                                                <Icon as={PiCheckCircle} />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="xs"
                                                                variant="ghost"
                                                                color="gray.500"
                                                                _hover={{ color: 'gray.300', bg: 'gray.700' }}
                                                                onClick={() => markUnread(notif.id)}
                                                                title="Marcar como não lida"
                                                            >
                                                                <Icon as={PiInfo} />
                                                            </Button>
                                                        )}
                                                    </HStack>
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table.Root>
                                </Box>

                                {meta && meta.totalPages > 1 && (
                                    <Flex justify="space-between" align="center" mt={4} px={2}>
                                        <Text fontSize="sm" color="gray.400" display={{ base: 'none', md: 'block' }}>
                                            Mostrando <b>{notifications.length}</b> de <b>{meta.total}</b> notificações
                                        </Text>
                                        <HStack gap={2} mx={{ base: 'auto', md: '0' }}>
                                            <Button
                                                size="sm"
                                                variant="solid"
                                                colorPalette="gray"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                            >
                                                <Icon as={PiCaretLeftBold} mr={1} /> Anterior
                                            </Button>
                                            <Text fontSize="sm" color="gray.400">
                                                {page} / {meta.totalPages}
                                            </Text>
                                            <Button
                                                size="sm"
                                                variant="solid"
                                                colorPalette="gray"
                                                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                                disabled={page === meta.totalPages}
                                            >
                                                Próximo <Icon as={PiCaretRightBold} ml={1} />
                                            </Button>
                                        </HStack>
                                    </Flex>
                                )}
                            </Box>
                        )}
                    </Box>
                </VStack>
            </Flex>
        </RoleGuard>
    );
}
