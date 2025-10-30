// /src/app/components/management/ApprovalDialog.tsx
'use client';

import {
    Dialog,
    Button,
    VStack,
    Spinner,
    Text,
    Stack,
    Heading,
    Flex,
    Box,
    SimpleGrid,
    Icon,
    Link,
    Avatar,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { UserProfile } from '@/types';
import { PiCheckCircle, PiXCircle, PiDownloadDuotone, PiX, PiMagnifyingGlassDuotone } from 'react-icons/pi';
import { maskCEP, maskCPFOrCNPJ, maskPhone } from '@/utils/masks';
import { Toaster, toaster } from '@/components/ui/toaster';

interface ApprovalDialogProps {
    user: UserProfile | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateSuccess: () => void;
}

// Componente para exibir um campo de informação
const ProfileField = ({ label, value }: { label: string, value?: string | null }) => {
    if (!value) return null;
    return (
        <Box>
            <Text fontSize="sm" color="gray.400">{label}</Text>
            <Text fontWeight="medium">{value}</Text>
        </Box>
    );
};

export function ApprovalDialog({ user, isOpen, onClose, onUpdateSuccess }: ApprovalDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { getAccessTokenSilently } = useAuth0();

    const handleApprove = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
            await axios.patch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/management/users/${user.id}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toaster.create({ title: "Perfil Aprovado!", description: `${user.name} agora tem acesso à plataforma.`, type: "success" });
            onUpdateSuccess();
        } catch (error: any) {
            console.error("Erro ao aprovar perfil:", error);
            toaster.create({ title: "Erro ao Aprovar", description: error.response?.data?.error || "Tente novamente.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        if (!user) return;
        setIsLoading(true);
        // TODO: Adicionar um campo de motivo da rejeição
        try {
            const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! } });
            await axios.patch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/management/users/${user.id}/reject`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toaster.create({ title: "Perfil Rejeitado", description: `O perfil de ${user.name} foi rejeitado.`, type: "success" });
            onUpdateSuccess();
        } catch (error: any) {
            console.error("Erro ao rejeitar perfil:", error);
            toaster.create({ title: "Erro ao Rejeitar", description: error.response?.data?.error || "Tente novamente.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    // Formata os dados para exibição
    const birthDate = user.birthDate ? new Date(user.birthDate).toLocaleDateString('pt-BR') : 'N/A';
    const contact = `${maskPhone(user.cellPhone || '')} (${user.contactPreference})`;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(details) => !details.open && onClose()} size="xl">
            <Toaster />
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content bg="gray.800">
                    <Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="ghost" size="sm"><PiX /></Button>
                        </Dialog.CloseTrigger>
                    </Dialog.Header>
                    <Dialog.Body>
                        <VStack gap={6} align="stretch">
                            {/* Bloco de Dados Pessoais */}
                            <Flex gap={8} w='100%' flexDir={'column'} alignItems={'center'} justifyContent={'center'}>
                                {user.profilePictureUrl && (

                                    <Flex align="center" gap={3} flexDir={'column'}>
                                        <Avatar.Root size="lg" boxSize={32}>
                                            <Avatar.Fallback name={user.name} />
                                            <Avatar.Image src={user.profilePictureUrl} />
                                        </Avatar.Root>
                                        <Text>{user.name}</Text>
                                    </Flex>)
                                }
                                <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} p={4} bg="gray.900" borderRadius="md" w='100%'>
                                    <ProfileField label="Nome Completo" value={user.name} />
                                    <ProfileField label="CPF/CNPJ" value={maskCPFOrCNPJ(user.cpfOrCnpj || '')} />
                                    <ProfileField label="RG" value={user.rg} />
                                    <ProfileField label="Data Nasc." value={birthDate} />
                                    <ProfileField label="Profissão" value={user.profession} />
                                    <ProfileField label="Nacionalidade" value={user.nationality} />
                                    <ProfileField label="Estado Civil" value={user.maritalStatus} />
                                </SimpleGrid>
                            </Flex>

                            {/* Bloco de Contato */}
                            <Box>
                                <Heading size="sm" mb={4}>Contato</Heading>
                                <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} p={4} bg="gray.900" borderRadius="md">
                                    <ProfileField label="E-mail" value={user.email} />
                                    <ProfileField label="Celular" value={contact} />
                                    <ProfileField label="Tel. Fixo" value={maskPhone(user.phone || '')} />
                                </SimpleGrid>
                            </Box>

                            {/* Bloco de Endereços */}
                            <Box>
                                <Heading size="sm" mb={4}>Endereços</Heading>
                                <Stack direction={{ base: 'column', md: 'row' }} gap={4} p={4} bg="gray.900" borderRadius="md">
                                    <VStack align="stretch" flex={1}>
                                        <Text fontWeight="bold">Residencial</Text>
                                        <ProfileField label="Endereço" value={`${user.residentialStreet}, ${user.residentialNumber}`} />
                                        <ProfileField label="Bairro" value={user.residentialNeighborhood} />
                                        <ProfileField label="Cidade/Estado" value={`${user.residentialCity}/${user.residentialState}`} />
                                        <ProfileField label="CEP" value={maskCEP(user.residentialCep || '')} />
                                    </VStack>
                                    {user.commercialCep && (
                                        <VStack align="stretch" flex={1}>
                                            <Text fontWeight="bold">Comercial</Text>
                                            <ProfileField label="Endereço" value={`${user.commercialStreet}, ${user.commercialNumber}`} />
                                            <ProfileField label="Bairro" value={user.commercialNeighborhood} />
                                            <ProfileField label="Cidade/Estado" value={`${user.commercialCity}/${user.commercialState}`} />
                                            <ProfileField label="CEP" value={maskCEP(user.commercialCep)} />
                                        </VStack>
                                    )}
                                </Stack>
                            </Box>

                            {/* Bloco de Documentos */}
                            <Box>
                                <Heading size="sm" mb={4}>Documentos Anexados</Heading>
                                <Flex gap={2} flexWrap="wrap" p={4} bg="gray.900" borderRadius="md">
                                    {user.personalDocumentUrls?.map((url, index) => (
                                        <Link key={index} href={url} target='_blank' color="brand.600">
                                            <Button size="sm" bgColor={'brand.700'} color={'white'} _hover={{ bgColor: 'brand.900' }} gap={2}>
                                                <Icon as={PiDownloadDuotone} />
                                                {decodeURIComponent(url.split('/').pop()?.split('-').pop() || `Documento ${index + 1}`)}
                                            </Button>
                                        </Link>
                                    ))}
                                </Flex>
                            </Box>
                        </VStack>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button colorPalette="red" onClick={handleReject} loading={isLoading}>
                            <Icon as={PiXCircle} /> Rejeitar Perfil
                        </Button>
                        <Button colorPalette="green" ml={3} onClick={handleApprove} loading={isLoading}>
                            <Icon as={PiCheckCircle} /> Aprovar e Ativar
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}
