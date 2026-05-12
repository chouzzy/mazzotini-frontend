'use client';

import {
    Flex, Heading, Text, VStack, HStack, Box, Icon, Spinner,
    Switch, Separator, Badge,
} from '@chakra-ui/react';
import { PiGear, PiRobot, PiScales, PiWarning } from 'react-icons/pi';
import { useApi } from '@/hooks/useApi';
import { useAuth0 } from '@auth0/auth0-react';
import { AuthenticationGuard } from '@/app/components/auth/AuthenticationGuard';
import { Toaster, toaster } from '@/components/ui/toaster';
import axios from 'axios';
import { useState, useEffect } from 'react';

interface SystemSettings {
    autoImportAppeals: boolean;
    autoImportProceduralIssues: boolean;
    updatedAt: string;
    updatedBy: string | null;
}

function SettingRow({
    label,
    description,
    checked,
    onChange,
    loading,
    warning,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    loading: boolean;
    warning?: string;
}) {
    return (
        <HStack justify="space-between" align="start" gap={6} py={4}>
            <VStack align="start" gap={1} flex={1}>
                <HStack gap={2}>
                    <Text fontWeight="medium">{label}</Text>
                    <Badge
                        colorPalette={checked ? 'green' : 'red'}
                        variant="solid"
                        fontSize="2xs"
                        px={2}
                    >
                        {checked ? 'Ativo' : 'Desativado'}
                    </Badge>
                </HStack>
                <Text fontSize="sm" color="gray.400">{description}</Text>
                {!checked && warning && (
                    <HStack gap={1} mt={1}>
                        <Icon as={PiWarning} color="yellow.400" boxSize={3.5} />
                        <Text fontSize="xs" color="yellow.400">{warning}</Text>
                    </HStack>
                )}
            </VStack>
            <Switch.Root
                checked={checked}
                onCheckedChange={(e) => onChange(e.checked)}
                disabled={loading}
                colorPalette="green"
                size="lg"
            >
                <Switch.HiddenInput />
                <Switch.Control>
                    <Switch.Thumb />
                </Switch.Control>
            </Switch.Root>
        </HStack>
    );
}

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

            <VStack align="start" gap={1}>
                <HStack gap={2}>
                    <Icon as={PiGear} boxSize={6} color="brand.400" />
                    <Heading size="lg">Configurações do Sistema</Heading>
                </HStack>
                <Text color="gray.400" fontSize="sm">
                    Controles operacionais — apenas administradores
                </Text>
            </VStack>

            {/* Seção: Importação Automática */}
            <Box bg="gray.900" borderRadius="lg" border="1px solid" borderColor="gray.700" overflow="hidden">
                <HStack px={6} py={4} bg="gray.800" borderBottom="1px solid" borderColor="gray.700" gap={3}>
                    <Icon as={PiRobot} color="brand.400" boxSize={5} />
                    <VStack align="start" gap={0}>
                        <Text fontWeight="semibold">Importação Automática — Malha Fina</Text>
                        <Text fontSize="xs" color="gray.400">
                            Controla a criação automática de processos filhos (recursos e incidentes) durante a sincronização com o Legal One
                        </Text>
                    </VStack>
                </HStack>

                <VStack align="stretch" px={6} divideY="1px" gap={0}>
                    <SettingRow
                        label="Importar Recursos (Appeals)"
                        description="Quando ativo, a sincronização com o Legal One cria automaticamente processos do tipo Recurso vinculados ao processo pai."
                        checked={data?.autoImportAppeals ?? true}
                        onChange={(v) => handleChange('autoImportAppeals', v)}
                        loading={saving}
                        warning="Novos recursos do Legal One não serão importados automaticamente."
                    />

                    <Separator borderColor="gray.700" />

                    <SettingRow
                        label="Importar Incidentes (ProceduralIssues)"
                        description="Quando ativo, a sincronização com o Legal One cria automaticamente processos do tipo Incidente Processual vinculados ao processo pai."
                        checked={data?.autoImportProceduralIssues ?? true}
                        onChange={(v) => handleChange('autoImportProceduralIssues', v)}
                        loading={saving}
                        warning="Novos incidentes do Legal One não serão importados automaticamente."
                    />
                </VStack>
            </Box>

            {/* Última atualização */}
            {data?.updatedAt && (
                <Text fontSize="xs" color="gray.600">
                    Última alteração: {new Date(data.updatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    {data.updatedBy && ` · por ${data.updatedBy}`}
                </Text>
            )}
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
