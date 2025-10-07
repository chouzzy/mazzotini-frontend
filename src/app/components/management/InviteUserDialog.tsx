// /src/app/components/management/InviteUserDialog.tsx
'use client';

import {
    Dialog,
    Button,
    VStack,
    Stack,
    Spinner,
    Text,
    RadioGroup,
    Field,
    Input,
    Flex,
    Icon,
} from '@chakra-ui/react';
import { useApi } from '@/hooks/useApi';
import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { Toaster, toaster } from "@/components/ui/toaster";
import { useForm, SubmitHandler } from "react-hook-form";
import { PiCopy } from 'react-icons/pi';

// Tipagem para a lista de roles
interface RoleInfo {
    id: string;
    name: string;
    description: string;
}

interface InviteUserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onInviteSuccess: () => void;
}

// Tipagem para os dados do formulário
interface InviteFormData {
    name: string;
    email: string;
    initialRole: string;
}

export function InviteUserDialog({ isOpen, onClose, onInviteSuccess }: InviteUserDialogProps) {
    const { data: allRoles, isLoading: isLoadingRoles } = useApi<RoleInfo[]>(isOpen ? '/api/management/roles' : null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const { getAccessTokenSilently } = useAuth0();
    const { register, handleSubmit, formState: { errors }, reset } = useForm<InviteFormData>();

    // Limpa o formulário e o estado do link quando o modal é fechado
    useEffect(() => {
        if (!isOpen) {
            reset();
            setGeneratedLink(null);
        }
    }, [isOpen, reset]);

    const onSubmit: SubmitHandler<InviteFormData> = async (data) => {
        setIsSubmitting(true);
        try {
            const token = await getAccessTokenSilently({
                authorizationParams: { audience: process.env.NEXT_PUBLIC_API_AUDIENCE! },
            });

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/management/invites`,
                data,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Guarda o link recebido no estado para exibir a tela de sucesso
            console.log("Link de convite gerado:", response.data);
            setGeneratedLink(response.data.ticketUrl.ticketUrl);
            onInviteSuccess(); // Atualiza a lista de utilizadores em segundo plano

        } catch (error: any) {
            console.error("Erro ao enviar convite:", error);
            toaster.create({
                title: "Erro ao Enviar Convite.",
                description: error.response?.data?.error || "Não foi possível enviar o convite. Tente novamente.",
                type: "error",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Função para copiar o link para a área de transferência
    const handleCopy = () => {
        if (!generatedLink) return;
        navigator.clipboard.writeText(generatedLink).then(() => {
            toaster.create({
                title: "Link Copiado!",
                description: "O link de convite foi copiado para a sua área de transferência.",
                type: "success",
            });
        });
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(details) => !details.open && onClose()}>
            <Toaster/>
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content bg="gray.800">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Dialog.Header>
                            <Dialog.Title>{generatedLink ? "Convite Gerado com Sucesso!" : "Convidar Novo Utilizador"}</Dialog.Title>
                            <Dialog.CloseTrigger asChild>
                                <Button variant="ghost" size="sm">&times;</Button>
                            </Dialog.CloseTrigger>
                        </Dialog.Header>

                        {/* RENDERIZAÇÃO CONDICIONAL: Mostra o formulário ou a tela de sucesso */}
                        {generatedLink ? (
                            <Dialog.Body>
                                <VStack gap={4} align="stretch">
                                    <Text>Partilhe o link abaixo com o novo utilizador. Ele é único e seguro para a criação da conta.</Text>
                                    <Input value={generatedLink} readOnly bgColor="gray.700" />
                                    <Button colorPalette="blue" gap={2} onClick={handleCopy}>
                                        <Icon as={PiCopy} />
                                        Copiar Link
                                    </Button>
                                </VStack>
                            </Dialog.Body>
                        ) : (
                            <Dialog.Body>
                                <VStack align="stretch" gap={4}>
                                    <Field.Root invalid={!!errors.name} required>
                                        <Field.Label>Nome Completo</Field.Label>
                                        <Input bgColor={'gray.600'} {...register("name", { required: "O nome é obrigatório" })} />
                                        <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
                                    </Field.Root>

                                    <Field.Root invalid={!!errors.email} required>
                                        <Field.Label>E-mail</Field.Label>
                                        <Input bgColor={'gray.600'} type="email" {...register("email", { required: "O e-mail é obrigatório" })} />
                                        <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
                                    </Field.Root>

                                    <Field.Root invalid={!!errors.initialRole} required>
                                        <Field.Label>Permissão Inicial</Field.Label>
                                        {isLoadingRoles ? (
                                            <Spinner />
                                        ) : (
                                            <RadioGroup.Root {...register("initialRole", { required: "Selecione uma permissão" })}>
                                                <Stack gap={4} direction="column" py={2}>
                                                    {allRoles?.filter(r => r.name !== 'ADMIN').map(role => ( // Impede de criar novos Admins pela interface
                                                        <RadioGroup.Item key={role.id} value={role.name!}>
                                                            <RadioGroup.ItemHiddenInput />
                                                            <RadioGroup.ItemIndicator bgColor={'none'} borderColor={'white'} cursor={'pointer'} />
                                                            <RadioGroup.ItemText>{role.name}</RadioGroup.ItemText>
                                                        </RadioGroup.Item>
                                                    ))}
                                                </Stack>
                                            </RadioGroup.Root>
                                        )}
                                        <Field.ErrorText>{errors.initialRole?.message}</Field.ErrorText>
                                    </Field.Root>
                                </VStack>
                            </Dialog.Body>
                        )}
                        
                        <Dialog.Footer>
                            {generatedLink ? (
                                <Button bgColor='brand.700' color='white' _hover={{ bgColor:'brand.800'}} onClick={onClose}>Fechar</Button>
                            ) : (
                                <>
                                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                                    <Button colorPalette="blue" ml={3} type="submit" loading={isSubmitting}>
                                        Gerar Link de Convite
                                    </Button>
                                </>
                            )}
                        </Dialog.Footer>
                    </form>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}

