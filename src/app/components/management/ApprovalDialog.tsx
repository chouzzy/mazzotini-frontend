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
import { PiCheckCircle, PiXCircle, PiDownloadDuotone, PiX, PiScalesDuotone } from 'react-icons/pi';
import { maskCEP, maskCPFOrCNPJ, maskPhone } from '@/utils/masks';
import { toaster } from '@/components/ui/toaster';

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

                            {/* Destaque do Perfil (Foto e Nome) */}
                            <Flex align="center" gap={3} flexDir="column" w="100%" pb={4} borderBottom="1px solid" borderColor="gray.700">
                                <Avatar.Root size="2xl" boxSize={28}>
                                    <Avatar.Fallback name={user.name} />
                                    {/* Usa a foto de perfil ou gera um avatar profissional */}
                                    <Avatar.Image src={user.profilePictureUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundColor=4f46e5&textColor=ffffff`} />
                                </Avatar.Root>
                                <VStack gap={0} align="center">
                                    <Heading size="md">{user.name}</Heading>
                                    <Text color="gray.400" fontSize="sm">{user.email}</Text>
                                </VStack>
                            </Flex>

                            {/* Bloco de Dados Pessoais */}
                            <Box>
                                <Heading size="sm" mb={4} color="brand.500">Dados Pessoais</Heading>
                                <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} p={4} bg="gray.900" borderRadius="md" w='100%'>
                                    <ProfileField label="Nome Completo" value={user.name} />
                                    <ProfileField label="CPF/CNPJ" value={maskCPFOrCNPJ(user.cpfOrCnpj || '')} />
                                    <ProfileField label="RG" value={user.rg} />
                                    <ProfileField label="Data Nasc." value={birthDate} />
                                    <ProfileField label="Profissão" value={user.profession} />
                                    <ProfileField label="Nacionalidade" value={user.nationality} />
                                    <ProfileField label="Estado Civil" value={user.maritalStatus} />
                                </SimpleGrid>
                            </Box>

                            {/* Bloco de Contato */}
                            <Box>
                                <Heading size="sm" mb={4} color="brand.500">Contato</Heading>
                                <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} p={4} bg="gray.900" borderRadius="md">
                                    <ProfileField label="Celular" value={contact} />
                                    <ProfileField label="Tel. Fixo" value={maskPhone(user.phone || '')} />
                                    <ProfileField label="E-mail Secundário" value={user.infoEmail} />
                                </SimpleGrid>
                            </Box>

                            {/* Bloco de Endereços */}
                            <Box>
                                <Heading size="sm" mb={4} color="brand.500">Endereços</Heading>
                                <Stack direction={{ base: 'column', md: 'row' }} gap={4} p={4} bg="gray.900" borderRadius="md">
                                    <VStack align="stretch" flex={1}>
                                        <Text fontWeight="bold" fontSize="sm" color="gray.300">Residencial</Text>
                                        <ProfileField label="Endereço" value={`${user.residentialStreet}, ${user.residentialNumber}`} />
                                        <ProfileField label="Bairro" value={user.residentialNeighborhood} />
                                        <ProfileField label="Cidade/Estado" value={`${user.residentialCity}/${user.residentialState}`} />
                                        <ProfileField label="CEP" value={maskCEP(user.residentialCep || '')} />
                                    </VStack>
                                    {user.commercialCep && (
                                        <VStack align="stretch" flex={1}>
                                            <Text fontWeight="bold" fontSize="sm" color="gray.300">Comercial</Text>
                                            <ProfileField label="Endereço" value={`${user.commercialStreet}, ${user.commercialNumber}`} />
                                            <ProfileField label="Bairro" value={user.commercialNeighborhood} />
                                            <ProfileField label="Cidade/Estado" value={`${user.commercialCity}/${user.commercialState}`} />
                                            <ProfileField label="CEP" value={maskCEP(user.commercialCep)} />
                                        </VStack>
                                    )}
                                </Stack>
                            </Box>

                            {/* NOVO: Processos Pré-Cadastrados */}
                            {user.investments && user.investments.length > 0 && (
                                <Box>
                                    <Heading size="sm" mb={4} color="brand.500">Processos Vinculados (Pré-Cadastrados)</Heading>
                                    <VStack align="stretch" gap={3}>
                                        {user.investments.map((inv: any, idx: number) => (
                                            <Flex key={idx} p={3} bg="gray.900" borderRadius="md" align="center" gap={4} border="1px solid" borderColor="gray.700">
                                                <Flex boxSize={10} bg="brand.900" borderRadius="md" align="center" justify="center">
                                                    <Icon as={PiScalesDuotone} color="brand.400" boxSize={6} />
                                                </Flex>
                                                <Box>
                                                    <Text fontWeight="bold" fontSize="sm">{inv.asset?.processNumber}</Text>
                                                    {inv.asset?.nickname && <Text fontSize="xs" color="gray.400">{inv.asset.nickname}</Text>}
                                                    {!inv.asset?.nickname && inv.asset?.origemProcesso && <Text fontSize="xs" color="gray.400">{inv.asset.origemProcesso}</Text>}
                                                </Box>
                                            </Flex>
                                        ))}
                                    </VStack>
                                </Box>
                            )}

                            {/* Bloco de Documentos */}
                            <Box>
                                <Heading size="sm" mb={4} color="brand.500">Documentos Anexados</Heading>
                                {(!user.personalDocumentUrls || user.personalDocumentUrls.length === 0) ? (
                                    <Box p={4} bg="gray.900" borderRadius="md" border="1px dashed" borderColor="gray.600">
                                        <Text color="gray.500" fontSize="sm" textAlign="center">Nenhum documento anexado. (Usuário isentou-se do envio)</Text>
                                    </Box>
                                ) : (
                                    <Flex gap={2} flexWrap="wrap" p={4} bg="gray.900" borderRadius="md">
                                        {user.personalDocumentUrls.map((url, index) => (
                                            <Link key={index} href={url} target='_blank' color="brand.600">
                                                <Button size="sm" bgColor={'brand.700'} color={'white'} _hover={{ bgColor: 'brand.900' }} gap={2}>
                                                    <Icon as={PiDownloadDuotone} />
                                                    {decodeURIComponent(url.split('/').pop()?.split('-').pop() || `Documento ${index + 1}`)}
                                                </Button>
                                            </Link>
                                        ))}
                                    </Flex>
                                )}
                            </Box>

                        </VStack>
                    </Dialog.Body>
                    <Dialog.Footer mt={4} pt={4} borderTop="1px solid" borderColor="gray.700">
                        {isLoading ? (
                            <Flex align="center" gap={2}>
                                <Spinner size="sm" />
                                Processando...
                            </Flex>
                        ) :
                            <>
                                <Button colorPalette="red" onClick={handleReject} variant="solid">
                                    <Icon as={PiXCircle} /> Rejeitar Perfil
                                </Button>
                                <Button colorPalette="green" ml={3} onClick={handleApprove} >
                                    <Icon as={PiCheckCircle} /> Aprovar e Ativar Acesso
                                </Button>
                            </>
                        }
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}