'use client';

import { VStack, SimpleGrid, Field, Input, Spinner } from '@chakra-ui/react';
import { Controller, Control, UseFormRegister, FieldErrors, UseFormSetValue, FieldValues } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { maskCEP, unmask } from '@/utils/masks';
import { toaster } from '@/components/ui/toaster';

export interface AddressBlockProps {
    type: 'residential' | 'commercial';
    control: Control<FieldValues>;
    register: UseFormRegister<FieldValues>;
    errors: FieldErrors<FieldValues>;
    watch: (name: any) => any;
    setValue: UseFormSetValue<FieldValues>;
    isDisabled?: boolean;
}

export function AddressBlock({ type, control, register, errors, watch, setValue, isDisabled }: AddressBlockProps) {
    const [isCepLoading, setIsCepLoading] = useState(false);
    const [cepResolved, setCepResolved] = useState(false);
    const [streetLocked, setStreetLocked] = useState(true);
    const [neighborhoodLocked, setNeighborhoodLocked] = useState(true);

    // Ref estável para setValue — evita que o effect re-execute quando
    // o react-hook-form recria a referência após chamar setValue internamente
    const setValueRef = useRef(setValue);
    setValueRef.current = setValue;

    const cepValue = watch(`${type}Cep`);

    useEffect(() => {
        const unmaskedCep = unmask(cepValue || '');

        if (unmaskedCep.length !== 8) {
            setCepResolved(false);
            setStreetLocked(true);
            setNeighborhoodLocked(true);
            return;
        }

        setCepResolved(false);
        setStreetLocked(true);
        setNeighborhoodLocked(true);

        const fetchAddress = async () => {
            setIsCepLoading(true);
            try {
                const response = await axios.get(`https://viacep.com.br/ws/${unmaskedCep}/json/`);
                const { logradouro, bairro, localidade, uf, erro } = response.data;
                if (erro) { toaster.create({ title: 'CEP não encontrado.', type: 'error' }); return; }
                setValueRef.current(`${type}Street`, logradouro || '');
                setValueRef.current(`${type}Neighborhood`, bairro || '');
                setValueRef.current(`${type}City`, localidade);
                setValueRef.current(`${type}State`, uf);
                // Campos que voltaram vazios ficam editáveis (CEP de cidade pequena)
                setCepResolved(true);
                setStreetLocked(!!logradouro);
                setNeighborhoodLocked(!!bairro);
            } catch (error) {
                console.error('Erro ao buscar CEP:', error);
            } finally {
                setIsCepLoading(false);
            }
        };

        fetchAddress();
    // setValue está no ref — não precisa ser dep; type é prop estática
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cepValue, type]);

    const isRequired = type === 'residential' || !isDisabled;

    return (
        <VStack gap={4} align="stretch" opacity={isDisabled ? 0.5 : 1}>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Field.Root invalid={!!errors[`${type}Cep`]} required={isRequired}>
                    <Field.Label gap={2}>CEP {isCepLoading && <Spinner size="sm" />}</Field.Label>
                    <Controller
                        name={`${type}Cep`}
                        control={control}
                        rules={{ required: isRequired ? 'CEP é obrigatório' : false }}
                        render={({ field }) => (
                            <Input disabled={isDisabled} bgColor="gray.700" value={field.value ? maskCEP(field.value) : ''} onChange={field.onChange} maxLength={10} />
                        )}
                    />
                    {errors[`${type}Cep`] && <Field.ErrorText>{(errors[`${type}Cep`] as any)?.message}</Field.ErrorText>}
                </Field.Root>
                <Field.Root invalid={!!errors[`${type}State`]} required={isRequired}>
                    <Field.Label>Estado</Field.Label>
                    <Input disabled bgColor="gray.700" {...register(`${type}State`, { required: isRequired ? 'Estado é obrigatório' : false })} readOnly />
                    {errors[`${type}State`] && <Field.ErrorText>Preencha o CEP para auto-completar</Field.ErrorText>}
                </Field.Root>
                <Field.Root invalid={!!errors[`${type}City`]} required={isRequired}>
                    <Field.Label>Cidade</Field.Label>
                    <Input disabled bgColor="gray.700" {...register(`${type}City`, { required: isRequired ? 'Cidade é obrigatória' : false })} readOnly />
                </Field.Root>
            </SimpleGrid>
            <Field.Root invalid={!!errors[`${type}Street`]} required={isRequired}>
                <Field.Label>
                    Rua / Logradouro
                    {cepResolved && !streetLocked && <span style={{ color: '#B8A76E', fontSize: '12px', marginLeft: '8px' }}>Preencha manualmente</span>}
                </Field.Label>
                <Input
                    disabled={isDisabled || !cepResolved || streetLocked}
                    readOnly={streetLocked && cepResolved}
                    bgColor="gray.700"
                    {...register(`${type}Street`, { required: isRequired ? 'Rua é obrigatória' : false })}
                />
                {errors[`${type}Street`] && (
                    <Field.ErrorText>
                        {streetLocked || !cepResolved ? 'Preencha o CEP para auto-completar' : (errors[`${type}Street`] as any)?.message}
                    </Field.ErrorText>
                )}
            </Field.Root>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Field.Root invalid={!!errors[`${type}Number`]} required={isRequired}>
                    <Field.Label>Número</Field.Label>
                    <Input disabled={isDisabled} bgColor="gray.700" {...register(`${type}Number`, { required: isRequired ? 'Número é obrigatório' : false })} />
                    {errors[`${type}Number`] && <Field.ErrorText>{(errors[`${type}Number`] as any)?.message}</Field.ErrorText>}
                </Field.Root>
                <Field.Root>
                    <Field.Label>Complemento</Field.Label>
                    <Input disabled={isDisabled} bgColor="gray.700" {...register(`${type}Complement`)} />
                </Field.Root>
                <Field.Root invalid={!!errors[`${type}Neighborhood`]} required={isRequired}>
                    <Field.Label>
                        Bairro
                        {cepResolved && !neighborhoodLocked && <span style={{ color: '#B8A76E', fontSize: '12px', marginLeft: '8px' }}>Preencha manualmente</span>}
                    </Field.Label>
                    <Input
                        disabled={isDisabled || !cepResolved || neighborhoodLocked}
                        readOnly={neighborhoodLocked && cepResolved}
                        bgColor="gray.700"
                        {...register(`${type}Neighborhood`, { required: isRequired ? 'Bairro é obrigatório' : false })}
                    />
                </Field.Root>
            </SimpleGrid>
        </VStack>
    );
}
