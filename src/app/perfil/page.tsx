'use client';

import {
    Box,
    Heading,
    VStack,
    Text,
    Flex,
    Icon,
    Spinner,
    Button,
    Link,
    SimpleGrid,
    Card,
    Avatar,
    HStack,
    Separator,
    Badge
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRef, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useApi } from '@/hooks/useApi';
import {
    PiWarningCircle,
    PiPencilSimple,
    PiPhone,
    PiMapPin,
    PiIdentificationCard,
    PiIdentificationBadge,
    PiCalendarBlank,
    PiGlobe,
    PiHeart,
    PiBriefcase,
    PiEnvelopeSimple,
    PiChats,
    PiHouse,
    PiBuilding,
    PiFile,
    PiDownloadDuotone,
    PiFilePdf,
    PiFolderOpen,
    PiUploadSimple,
    PiTrash,
    PiClock,
    PiCheckCircle,
    PiCurrencyCircleDollar,
    PiArrowRight,
    PiCaretDown,
    PiCaretUp,
} from 'react-icons/pi';
import { Toaster, toaster } from '@/components/ui/toaster';
import { UserStagingDocument } from '@/types/api';
import { AuthenticationGuard } from '../components/auth/AuthenticationGuard';
import { maskCPFOrCNPJ, maskPhone } from '@/utils/masks';
import { UserProfile } from '@/types';

interface ExtendedUserProfile extends UserProfile {
    investments: {
        id: string;
        investorShare: number;
        mazzotiniShare: number;
        userId: string;
        creditAssetId: string;
        asset: {
            id: string;
            processNumber: string;
            nickname?: string;
            [key: string]: any;
        };
        documents: string[];
    }[];
}

const ProfileField = ({ label, value, icon }: { label: string, value?: string | null, icon?: React.ElementType }) => {
    if (!value) return null;
    return (
        <Flex align="center" gap={2}>
            {icon && <Icon as={icon} color="gray.500" boxSize={4} flexShrink={0} />}
            <Text fontSize="sm">
                <strong style={{ color: '#a8a8a8' }}>{label}:</strong> {value}
            </Text>
        </Flex>
    );
};

const DOCS_PREVIEW = 3;

const DocumentButton = ({ url, index, prefix = "Documento" }: { url: string, index: number, prefix?: string }) => {
    const fileName = decodeURIComponent(url.split('/').pop()?.split('-').pop() || `${prefix} ${index + 1}`);
    return (
        <Link href={url} target='_blank' _hover={{ textDecoration: 'none' }} w="100%">
            <Flex
                w="100%"
                align="center"
                gap={3}
                px={4}
                py={3}
                bg="gray.800"
                border="1px solid"
                borderColor="gray.700"
                borderRadius="md"
                _hover={{ borderColor: 'brand.500', bg: 'gray.750' }}
                transition="all 0.15s"
            >
                <Icon as={PiFilePdf} color="red.400" boxSize={5} flexShrink={0} />
                <Text fontSize="sm" color="gray.100" flex={1} truncate>{fileName}</Text>
                <Icon as={PiDownloadDuotone} color="gray.400" boxSize={4} flexShrink={0} />
            </Flex>
        </Link>
    );
};

const DocList = ({ urls, prefix }: { urls: string[], prefix: string }) => {
    const [expanded, setExpanded] = useState(false);
    const visible = expanded ? urls : urls.slice(0, DOCS_PREVIEW);
    const hidden = urls.length - DOCS_PREVIEW;
    return (
        <VStack align="stretch" gap={2}>
            {visible.map((url, index) => (
                <DocumentButton key={index} url={url} index={index} prefix={prefix} />
            ))}
            {urls.length > DOCS_PREVIEW && (
                <Button
                    variant="ghost"
                    size="sm"
                    color="brand.400"
                    _hover={{ color: 'brand.300', bg: 'transparent' }}
                    alignSelf="flex-start"
                    px={1}
                    gap={1}
                    onClick={() => setExpanded(e => !e)}
                >
                    <Icon as={expanded ? PiCaretUp : PiCaretDown} boxSize={3} />
                    {expanded ? 'Ver menos' : `Ver mais (${hidden} restantes)`}
                </Button>
            )}
        </VStack>
    );
};


export default function ProfilePage() {
    const { user: auth0User } = useAuth0();
    const { data: userProfile, isLoading, error } = useApi<ExtendedUserProfile>('/api/users/me');

    if (isLoading) {
        return (
            <Flex w="100%" flex={1} justify="center" align="center" minH="50vh">
                <Spinner size="xl" />
            </Flex>
        );
    }

    if (error || !userProfile) {
        return (
            <Flex w="100%" flex={1} justify="center" align="center" p={4}>
                <VStack gap={4} bg="red.900" p={{ base: 4, md: 8 }} borderRadius="md">
                    <Icon as={PiWarningCircle} boxSize={10} color="red.300" />
                    <Heading size="md">Ocorreu um Erro</Heading>
                    <Text>Não foi possível carregar os dados do seu perfil.</Text>
                </VStack>
            </Flex>
        );
    }

    const residentialAddress = userProfile.residentialCep ?
        `${userProfile.residentialStreet}, ${userProfile.residentialNumber}${userProfile.residentialComplement ? `, ${userProfile.residentialComplement}` : ''} - ${userProfile.residentialNeighborhood}, ${userProfile.residentialCity}/${userProfile.residentialState}`
        : null;

    const commercialAddress = userProfile.commercialCep ?
        `${userProfile.commercialStreet}, ${userProfile.commercialNumber}${userProfile.commercialComplement ? `, ${userProfile.commercialComplement}` : ''} - ${userProfile.commercialNeighborhood}, ${userProfile.commercialCity}/${userProfile.commercialState}`
        : null;

    const correspondenceAddress = userProfile.correspondenceAddress === 'commercial' ? 'Endereço Comercial' : 'Endereço Residencial';

    const investmentsWithDocs = userProfile.investments?.filter(inv => inv.documents && inv.documents.length > 0) || [];

    return (
        <AuthenticationGuard>
            <Toaster />
            <VStack gap={8} align="stretch">
                <VStack align="stretch" gap={4}>
                    <Flex gap={5} align="center">
                        <Avatar.Root size="xl" border={'2px solid'} borderColor={'brand.600'} bgColor={'bodyBg'} flexShrink={0}>
                            <Avatar.Image src={userProfile.profilePictureUrl || auth0User?.picture} alt={userProfile.name} />
                            <Avatar.Fallback name={userProfile.name} />
                        </Avatar.Root>
                        <VStack align="start" gap={1} minW={0} flex={1}>
                            <Heading as="h1" size="md" lineHeight="tight">{userProfile.name}</Heading>
                            <Text fontSize="sm" color="gray.400" truncate>{userProfile.email}</Text>
                            {userProfile.cpfOrCnpj && (
                                <Text fontSize="xs" color="gray.500">
                                    CPF/CNPJ: {maskCPFOrCNPJ(userProfile.cpfOrCnpj)}
                                </Text>
                            )}
                        </VStack>
                    </Flex>
                    <Link as={NextLink} href="/perfil/editar" _hover={{ textDecoration: 'none' }}>
                        <Button
                            variant="outline"
                            size="sm"
                            w="100%"
                            borderColor="gray.600"
                            color="gray.200"
                            _hover={{ bg: 'gray.800', borderColor: 'gray.400' }}
                            gap={2}
                        >
                            <Icon as={PiPencilSimple} />
                            Editar Perfil
                        </Button>
                    </Link>
                </VStack>

                <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6} pt={4}>
                    <Card.Root variant="outline" bg="transparent" borderColor="gray.800">
                        <Card.Body p={4}>
                            <Card.Title color={'brand.600'} fontSize="sm">Dados Pessoais</Card.Title>
                            <VStack align="stretch" mt={3} gap={2} color={'white'}>
                                <ProfileField label="CPF/CNPJ" value={userProfile.cpfOrCnpj ? maskCPFOrCNPJ(userProfile.cpfOrCnpj) : null} icon={PiIdentificationCard} />
                                <ProfileField label="RG" value={userProfile.rg} icon={PiIdentificationBadge} />
                                <ProfileField label="Data de Nascimento" value={userProfile.birthDate ? new Date(userProfile.birthDate).toLocaleDateString('pt-BR') : null} icon={PiCalendarBlank} />
                                <ProfileField label="Profissão" value={userProfile.profession} icon={PiBriefcase} />
                                <ProfileField label="Nacionalidade" value={userProfile.nationality} icon={PiGlobe} />
                                <ProfileField label="Estado Civil" value={userProfile.maritalStatus} icon={PiHeart} />
                            </VStack>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root variant="outline" bg="transparent" borderColor="gray.800">
                        <Card.Body p={4}>
                            <Card.Title color={'brand.600'} fontSize="sm">Informações de Contato</Card.Title>
                            <VStack align="stretch" mt={3} gap={2} color={'white'}>
                                <ProfileField label="Celular" value={userProfile.cellPhone ? maskPhone(userProfile.cellPhone) : null} icon={PiPhone} />
                                <ProfileField label="Telefone Fixo" value={userProfile.phone ? maskPhone(userProfile.phone) : null} icon={PiPhone} />
                                <ProfileField label="E-mail de Informações" value={userProfile.infoEmail} icon={PiEnvelopeSimple} />
                                <ProfileField label="Preferência de Contato" value={userProfile.contactPreference} icon={PiChats} />
                            </VStack>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root variant="outline" bg="transparent" borderColor="gray.800">
                        <Card.Body p={4}>
                            <Card.Title color={'brand.600'} fontSize="sm">Endereço Residencial</Card.Title>
                            <VStack align="stretch" mt={3} gap={2} color={'white'}>
                                <ProfileField label="Endereço" value={residentialAddress} icon={PiHouse} />
                            </VStack>
                        </Card.Body>
                    </Card.Root>

                    {commercialAddress && (
                        <Card.Root variant="outline" bg="transparent" borderColor="gray.800">
                            <Card.Body>
                                <Card.Title color={'brand.600'}>Endereço Comercial</Card.Title>
                                <VStack align="stretch" mt={3} gap={2} color={'white'}>
                                    <ProfileField label="Endereço" value={commercialAddress} icon={PiBuilding} />
                                </VStack>
                            </Card.Body>
                        </Card.Root>
                    )}

                    <Card.Root variant="outline" bg="transparent" borderColor="gray.800" gridColumn={{ lg: 'span 2' }}>
                        <Card.Body p={4}>
                            <Card.Title color={'brand.600'} fontSize="sm">Outras Informações</Card.Title>
                            <VStack align="stretch" mt={4} gap={5} color={'white'}>
                                <ProfileField label="Endereço de Correspondência" value={correspondenceAddress} icon={PiMapPin} />
                            </VStack>
                        </Card.Body>
                    </Card.Root>
                </SimpleGrid>

                <Separator borderColor="gray.700" my={4} />

                <VStack align="stretch" gap={6}>
                    <Heading size="lg" color="white" display="flex" alignItems="center" gap={2}>
                        <Icon as={PiFolderOpen} color="brand.400" /> Meus Documentos
                    </Heading>

                    <Box>
                        <Heading size="md" color="gray.300" mb={3}>Documentos Pessoais</Heading>
                        {userProfile.personalDocumentUrls && userProfile.personalDocumentUrls.length > 0 ? (
                            <DocList urls={userProfile.personalDocumentUrls} prefix="Doc Pessoal" />
                        ) : (
                            <Text color="gray.500" fontSize="sm">Nenhum documento pessoal anexado.</Text>
                        )}
                    </Box>

                    {investmentsWithDocs.length > 0 && (
                        <Box>
                            <Heading size="md" color="gray.300" mb={3}>Documentos dos Processos</Heading>
                            <VStack align="stretch" gap={4}>
                                {investmentsWithDocs.map((inv) => (
                                    <Card.Root key={inv.id} variant="outline" bg="gray.800" borderColor="gray.700">
                                        <Card.Body>
                                            <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
                                                <HStack>
                                                    <Badge colorPalette="blue" variant="solid">Processo</Badge>
                                                    <Text fontWeight="bold" color="white">{inv.asset.processNumber}</Text>
                                                </HStack>
                                                {inv.asset.nickname && (
                                                    <Text fontSize="sm" color="gray.400">({inv.asset.nickname})</Text>
                                                )}
                                            </Flex>
                                            <DocList urls={inv.documents} prefix="Doc Processo" />
                                        </Card.Body>
                                    </Card.Root>
                                ))}
                            </VStack>
                        </Box>
                    )}

                    <Link as={NextLink} href="/meus-documentos" _hover={{ textDecoration: 'none' }}>
                        <Flex
                            w="100%" p={4} borderRadius="lg" gap={4} align="center"
                            bg="gray.900"
                            border="1px solid"
                            borderColor="brand.700"
                            _hover={{ borderColor: 'brand.500', bg: 'gray.800' }}
                            transition="all 0.15s"
                            cursor="pointer"
                        >
                            <Icon as={PiCurrencyCircleDollar} color="brand.400" boxSize={6} flexShrink={0} />
                            <Box flex={1}>
                                <Text fontWeight="bold" color="white" mb="2px">Documentos Financeiros Privados</Text>
                                <Text fontSize="sm" color="gray.400">
                                    Contratos de cessão, comprovantes e documentos financeiros
                                </Text>
                            </Box>
                            <Icon as={PiArrowRight} color="brand.400" boxSize={5} flexShrink={0} />
                        </Flex>
                    </Link>
                </VStack>

            </VStack>
        </AuthenticationGuard>
    );
}