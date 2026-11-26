// /src/app/components/management/ShadowCandidatesSection.tsx
'use client';

import { Box, Checkbox, Flex, Heading, Spinner, Text, VStack } from '@chakra-ui/react';
import { useApi } from '@/hooks/useApi';
import { maskCPFOrCNPJ } from '@/utils/masks';

export interface ShadowCandidate {
    id: string;
    name: string;
    email: string;
    cpfOrCnpj: string | null;
    legalOneContactId: number | null;
    investmentsCount: number;
    createdAt: string | null;
}

export interface ShadowCandidatesResult {
    byDocument: ShadowCandidate[];
    byName: ShadowCandidate[];
}

interface ShadowCandidatesSectionProps {
    userId: string;
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    disabled?: boolean;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function CandidateLine({ c }: { c: ShadowCandidate }) {
    return (
        <Box>
            <Text fontWeight="medium" fontSize="sm">{c.name}</Text>
            <Text fontSize="xs" color="gray.400">
                {c.cpfOrCnpj ? `${maskCPFOrCNPJ(c.cpfOrCnpj)} · ` : 'Sem CPF/CNPJ · '}
                {c.legalOneContactId ? `contato ${c.legalOneContactId} no Legal One · ` : ''}
                {plural(c.investmentsCount, 'processo', 'processos')}
            </Text>
        </Box>
    );
}

/**
 * Cadastros importados do Legal One que podem ser da mesma pessoa. Os de mesmo CPF/CNPJ a
 * aprovação junta sozinha; os de nome parecido só entram se o admin marcar.
 */
export function ShadowCandidatesSection({ userId, selectedIds, onChange, disabled }: ShadowCandidatesSectionProps) {
    const { data, error, isLoading } = useApi<ShadowCandidatesResult>(
        `/api/management/users/${userId}/shadow-candidates`
    );

    if (isLoading) {
        return (
            <Flex align="center" gap={2} color="gray.400" fontSize="sm">
                <Spinner size="xs" /> Procurando cadastros importados do Legal One...
            </Flex>
        );
    }
    if (error) {
        return (
            <Text fontSize="sm" color="orange.300">
                Não foi possível procurar cadastros importados do Legal One. Os de mesmo CPF/CNPJ serão juntados na aprovação.
            </Text>
        );
    }
    if (!data || (!data.byDocument.length && !data.byName.length)) return null;

    const toggle = (id: string, checked: boolean) =>
        onChange(checked ? [...new Set([...selectedIds, id])] : selectedIds.filter(x => x !== id));

    return (
        <Box>
            <Heading size="sm" mb={4} color="brand.500">Cadastros importados do Legal One</Heading>
            <VStack align="stretch" gap={4} p={4} bg="gray.900" borderRadius="md">
                {data.byDocument.length > 0 && (
                    <Box>
                        <Text fontSize="sm" color="gray.300" mb={2}>
                            Mesmo CPF/CNPJ: serão juntados a esta conta na aprovação. Os processos passam para ela, e ela
                            fica com o contato do Legal One que já existe, sem criar outro.
                        </Text>
                        <VStack align="stretch" gap={2}>
                            {data.byDocument.map(c => <CandidateLine key={c.id} c={c} />)}
                        </VStack>
                    </Box>
                )}
                {data.byName.length > 0 && (
                    <Box>
                        <Text fontSize="sm" color="gray.300" mb={2}>
                            Nome parecido: marque só se for a mesma pessoa. O marcado também é juntado a esta conta.
                        </Text>
                        <VStack align="stretch" gap={2} role="group" aria-label="Cadastros de nome parecido">
                            {data.byName.map(c => (
                                <Checkbox.Root
                                    key={c.id}
                                    checked={selectedIds.includes(c.id)}
                                    onCheckedChange={(d) => toggle(c.id, Boolean(d.checked))}
                                    disabled={disabled}
                                    alignItems="flex-start"
                                >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control bgColor={'gray.100'} color={'black'} mt={1} />
                                    <Checkbox.Label><CandidateLine c={c} /></Checkbox.Label>
                                </Checkbox.Root>
                            ))}
                        </VStack>
                    </Box>
                )}
            </VStack>
        </Box>
    );
}
