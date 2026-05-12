'use client';

import {
    Flex, Heading, Text, VStack, HStack, Box, Icon, Spinner, Switch, Badge,
} from '@chakra-ui/react';
import {
    PiGear, PiRobot, PiCheckCircle, PiProhibit,
} from 'react-icons/pi';
import { useApi } from '@/hooks/useApi';
import { useAuth0 } from '@auth0/auth0-react';
import { AuthenticationGuard } from '@/app/components/auth/AuthenticationGuard';
import { Toaster, toaster } from '@/components/ui/toaster';
import axios from 'axios';
import { useState } from 'react';

interface SystemSettings {
    autoImportAppeals: boolean;
    autoImportProceduralIssues: boolean;
    updatedAt: string;
    updatedBy: string | null;
}

// ─── Toggle Card ────────────────────────────────────────────────────────────
function ToggleCard({
    label,
    description,
    checked,
    onChange,
    loading,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    loading: boolean;
}) {
    return (
        <HStack
            justify="space-between"
            align="center"
            gap={6}
            p={5}
            bg={checked ? 'green.900/20' : 'gray.800'}
            borderRadius="lg"
            border="1px solid"
            borderColor={checked ? 'green.700/50' : 'gray.700'}
            transition="all 0.2s"
        >
            <HStack gap={4} flex={1}>
                <Flex
                    w={9}
                    h={9}
                    borderRadius="md"
                    bg={checked ? 'green.900' : 'gray.700'}
                    align="center"
                    justify="center"
                    flexShrink={0}
                    transition="background 0.2s"
                >
                    <Icon
                        as={checked ? PiCheckCircle : PiProhibit}
                        boxSize={5}
                        color={checked ? 'green.400' : 'gray.500'}
                        transition="color 0.2s"
                    />
                </Flex>
                <VStack align="start" gap={0.5}>
                    <Text fontWeight="semibold" fontSize="sm">{label}</Text>
                    <Text fontSize="xs" color="gray.400" maxW="460px">{description}</Text>
                </VStack>
            </HStack>

            <HStack gap={3} flexShrink={0}>
                <Text
                    fontSize="xs"
                    fontWeight="medium"
                    color={checked ? 'green.400' : 'gray.500'}
                >
                    {checked ? 'Ativo' : 'Desativado'}
                </Text>
                <Switch.Root
                    checked={checked}
                    onCheckedChange={(e) => onChange(e.checked)}
                    disabled={loading}
                    colorPalette="green"
                    size="md"
                >
                    <Switch.HiddenInput />
                    <Switch.Control>
                        <Switch.Thumb />
                    </Switch.Control>
                </Switch.Root>
            </HStack>
        </HStack>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────
function ConfiguracoesContent() {
    const { getAccessTokenSilently } = useAuth0();
    const { data, isLoading, mutate } = useApi<SystemSettings>('/api/admin/settings');
    const [saving, setSaving] = useState(false);

    const handleChange = async (field: keyof SystemSettings, value: boolean) => {
        setSaving(true);
        try {
            const token = await getAccessTokenSilently({
                authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! },
            });
            await axios.patch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/settings`,
                { [field]: value },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toaster.create({
                title: value ? 'Importação ativada.' : 'Importação desativada.',
                type: value ? 'success' : 'warning',
            });
            await mutate();
        } catch {
            toaster.create({ title: 'Erro ao salvar configuração.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return <Flex justify="center" align="center" h="40vh"><Spinner size="xl" /></Flex>;
    }

    return (
        <Flex w="100%" p={8} flexDir="column" gap={8} maxW="760px">
            <Toaster />

            {/* Header */}
            <HStack gap={3}>
                <Flex
                    w={10} h={10} borderRadius="lg"
                    bg="brand.900" align="center" justify="center"
                    border="1px solid" borderColor="brand.700"
                >
                    <Icon as={PiGear} boxSize={5} color="brand.400" />
                </Flex>
                <VStack align="start" gap={0}>
                    <Heading size="lg">Configurações</Heading>
                    <Text color="gray.500" fontSize="sm">Controles operacionais — apenas administradores</Text>
                </VStack>
            </HStack>

            {/* Seção Malha Fina */}
            <VStack align="stretch" gap={3}>
                {/* Cabeçalho da seção */}
                <HStack gap={2} mb={1}>
                    <Icon as={PiRobot} color="gray.400" boxSize={4} />
                    <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">
                        Importação Automática · Malha Fina
                    </Text>
                </HStack>

                <Box
                    bg="gray.900"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="gray.700"
                    overflow="hidden"
                >
                    {/* Descrição da seção */}
                    <Box px={5} py={4} borderBottom="1px solid" borderColor="gray.700/60">
                        <Text fontSize="sm" color="gray.400">
                            Durante a sincronização com o Legal One, o sistema pode descobrir e importar automaticamente
                            processos filhos vinculados ao processo pai. Use os controles abaixo para definir quais tipos
                            devem ser importados.
                        </Text>
                    </Box>

                    {/* Toggles */}
                    <VStack align="stretch" gap={3} p={4}>
                        <ToggleCard
                            label="Recursos (Appeals)"
                            description="Importa automaticamente processos do tipo Recurso vinculados ao processo pai durante a sincronização."
                            checked={data?.autoImportAppeals ?? true}
                            onChange={(v) => handleChange('autoImportAppeals', v)}
                            loading={saving}
                        />
                        <ToggleCard
                            label="Incidentes Processuais (ProceduralIssues)"
                            description="Importa automaticamente processos do tipo Incidente Processual vinculados ao processo pai durante a sincronização."
                            checked={data?.autoImportProceduralIssues ?? true}
                            onChange={(v) => handleChange('autoImportProceduralIssues', v)}
                            loading={saving}
                        />
                    </VStack>
                </Box>

                {/* Última atualização */}
                {data?.updatedAt && (
                    <Text fontSize="xs" color="gray.600" px={1}>
                        Última alteração em {new Date(data.updatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                        {data.updatedBy && data.updatedBy !== 'setup-inicial' ? ` · por ${data.updatedBy}` : ''}
                    </Text>
                )}
            </VStack>
        </Flex>
    );
}

export default function ConfiguracoesPage() {
    return (
        <AuthenticationGuard>
            <ConfiguracoesContent />
        </AuthenticationGuard>
    );
}
