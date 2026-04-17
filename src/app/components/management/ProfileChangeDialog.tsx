'use client';

import {
    Dialog, Button, VStack, Spinner, Text, Heading, Flex, Box,
    SimpleGrid, Icon, Avatar, Badge,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { PiCheckCircle, PiXCircle, PiX, PiArrowRight } from 'react-icons/pi';
import { maskCEP, maskCPFOrCNPJ, maskPhone } from '@/utils/masks';
import { toaster } from '@/components/ui/toaster';

interface ProfileChangeRequest {
    id: string;
    userId: string;
    proposedData: Record<string, any>;
    status: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        profilePictureUrl?: string;
        cpfOrCnpj?: string;
        cellPhone?: string;
        residentialCity?: string;
        residentialState?: string;
    };
}

interface ProfileChangeDialogProps {
    request: ProfileChangeRequest | null;
    currentData: Record<string, any> | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateSuccess: () => void;
}

// Campo com diff: mostra valor atual → proposto quando diferentes
function DiffField({ label, current, proposed, mask }: {
    label: string;
    current?: string | null;
    proposed?: string | null;
    mask?: (v: string) => string;
}) {
    const fmt = (v?: string | null) => {
        if (!v) return '—';
        return mask ? mask(v) : v;
    };

    const currentFmt = fmt(current);
    const proposedFmt = fmt(proposed);
    const changed = currentFmt !== proposedFmt;

    return (
        <Box>
            <Text fontSize="xs" color="gray.500" mb={0.5}>{label}</Text>
            {changed ? (
                <Flex align="center" gap={2} wrap="wrap">
                    <Text fontSize="sm" color="red.300" textDecoration="line-through">{currentFmt}</Text>
                    <Icon as={PiArrowRight} color="gray.500" boxSize={3} />
                    <Text fontSize="sm" color="green.300" fontWeight="semibold">{proposedFmt}</Text>
                    <Badge colorPalette="yellow" size="sm" variant="subtle">alterado</Badge>
                </Flex>
            ) : (
                <Text fontSize="sm" fontWeight="medium">{proposedFmt}</Text>
            )}
        </Box>
    );
}

export function ProfileChangeDialog({ request, currentData, isOpen, onClose, onUpdateSuccess }: ProfileChangeDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { getAccessTokenSilently } = useAuth0();

    const handleApprove = async () => {
        if (!request) return;
        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
            await axios.patch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/management/profile-changes/${request.id}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toaster.create({ title: "Alteração aprovada!", description: `Perfil de ${request.user.name} atualizado.`, type: "success" });
            onUpdateSuccess();
        } catch (error: any) {
            toaster.create({ title: "Erro ao aprovar", description: error.response?.data?.error || "Tente novamente.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        if (!request) return;
        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
            await axios.patch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/management/profile-changes/${request.id}/reject`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toaster.create({ title: "Alteração rejeitada.", description: `As alterações de ${request.user.name} foram descartadas.`, type: "info" });
            onUpdateSuccess();
        } catch (error: any) {
            toaster.create({ title: "Erro ao rejeitar", description: error.response?.data?.error || "Tente novamente.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    if (!request) return null;

    const p = request.proposedData;
    const c = currentData || {};

    return (
        <Dialog.Root open={isOpen} onOpenChange={(details) => !details.open && onClose()} size="xl">
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content bg="gray.800">
                    <Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="solid" colorPalette="gray" size="sm"><PiX /></Button>
                        </Dialog.CloseTrigger>
                    </Dialog.Header>
                    <Dialog.Body>
                        <VStack gap={6} align="stretch">

                            {/* Cabeçalho */}
                            <Flex align="center" gap={3} flexDir="column" w="100%" pb={4} borderBottom="1px solid" borderColor="gray.700">
                                <Avatar.Root size="2xl" boxSize={28}>
                                    <Avatar.Fallback name={request.user.name} />
                                    <Avatar.Image src={request.user.profilePictureUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${request.user.name}&backgroundColor=4f46e5&textColor=ffffff`} />
                                </Avatar.Root>
                                <VStack gap={0} align="center">
                                    <Heading size="md">{request.user.name}</Heading>
                                    <Text color="gray.400" fontSize="sm">{request.user.email}</Text>
                                    <Text color="gray.500" fontSize="xs" mt={1}>
                                        Solicitado em {new Date(request.createdAt).toLocaleString('pt-BR')}
                                    </Text>
                                </VStack>
                                <Badge colorPalette="yellow" variant="solid">Campos em vermelho → verde indicam alteração</Badge>
                            </Flex>

                            {/* Dados Pessoais */}
                            <Box>
                                <Heading size="sm" mb={4} color="brand.500">Dados Pessoais</Heading>
                                <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} p={4} bg="gray.900" borderRadius="md">
                                    <DiffField label="Nome Completo" current={c.name} proposed={p.name} />
                                    <DiffField label="CPF/CNPJ" current={c.cpfOrCnpj} proposed={p.cpfOrCnpj} mask={maskCPFOrCNPJ} />
                                    <DiffField label="RG" current={c.rg} proposed={p.rg} />
                                    <DiffField label="Data Nasc." current={c.birthDate ? new Date(c.birthDate).toLocaleDateString('pt-BR') : null} proposed={p.birthDate ? new Date(p.birthDate).toLocaleDateString('pt-BR') : null} />
                                    <DiffField label="Profissão" current={c.profession} proposed={p.profession} />
                                    <DiffField label="Nacionalidade" current={c.nationality} proposed={p.nationality} />
                                    <DiffField label="Estado Civil" current={c.maritalStatus} proposed={p.maritalStatus} />
                                    <DiffField label="Gênero" current={c.gender} proposed={p.gender} />
                                </SimpleGrid>
                            </Box>

                            {/* Contato */}
                            <Box>
                                <Heading size="sm" mb={4} color="brand.500">Contato</Heading>
                                <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} p={4} bg="gray.900" borderRadius="md">
                                    <DiffField label="Celular" current={c.cellPhone} proposed={p.cellPhone} mask={maskPhone} />
                                    <DiffField label="Tel. Fixo" current={c.phone} proposed={p.phone} mask={maskPhone} />
                                    <DiffField label="E-mail Informativo" current={c.infoEmail} proposed={p.infoEmail} />
                                    <DiffField label="Preferência de Contato" current={c.contactPreference} proposed={p.contactPreference} />
                                </SimpleGrid>
                            </Box>

                            {/* Endereço Residencial */}
                            <Box>
                                <Heading size="sm" mb={4} color="brand.500">Endereço Residencial</Heading>
                                <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} p={4} bg="gray.900" borderRadius="md">
                                    <DiffField label="CEP" current={c.residentialCep} proposed={p.residentialCep} mask={maskCEP} />
                                    <DiffField label="Rua" current={c.residentialStreet} proposed={p.residentialStreet} />
                                    <DiffField label="Número" current={c.residentialNumber} proposed={p.residentialNumber} />
                                    <DiffField label="Complemento" current={c.residentialComplement} proposed={p.residentialComplement} />
                                    <DiffField label="Bairro" current={c.residentialNeighborhood} proposed={p.residentialNeighborhood} />
                                    <DiffField label="Cidade" current={c.residentialCity} proposed={p.residentialCity} />
                                    <DiffField label="Estado" current={c.residentialState} proposed={p.residentialState} />
                                </SimpleGrid>
                            </Box>

                            {/* Endereço Comercial (se houver proposta) */}
                            {p.commercialCep && (
                                <Box>
                                    <Heading size="sm" mb={4} color="brand.500">Endereço Comercial</Heading>
                                    <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} p={4} bg="gray.900" borderRadius="md">
                                        <DiffField label="CEP" current={c.commercialCep} proposed={p.commercialCep} mask={maskCEP} />
                                        <DiffField label="Rua" current={c.commercialStreet} proposed={p.commercialStreet} />
                                        <DiffField label="Número" current={c.commercialNumber} proposed={p.commercialNumber} />
                                        <DiffField label="Bairro" current={c.commercialNeighborhood} proposed={p.commercialNeighborhood} />
                                        <DiffField label="Cidade" current={c.commercialCity} proposed={p.commercialCity} />
                                        <DiffField label="Estado" current={c.commercialState} proposed={p.commercialState} />
                                    </SimpleGrid>
                                </Box>
                            )}

                        </VStack>
                    </Dialog.Body>
                    <Dialog.Footer mt={4} pt={4} borderTop="1px solid" borderColor="gray.700">
                        {isLoading ? (
                            <Flex align="center" gap={2}><Spinner size="sm" /> Processando...</Flex>
                        ) : (
                            <>
                                <Button colorPalette="red" onClick={handleReject} variant="solid">
                                    <Icon as={PiXCircle} /> Rejeitar Alteração
                                </Button>
                                <Button colorPalette="green" ml={3} onClick={handleApprove}>
                                    <Icon as={PiCheckCircle} /> Aprovar Alteração
                                </Button>
                            </>
                        )}
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}
