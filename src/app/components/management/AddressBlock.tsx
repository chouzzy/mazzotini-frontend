'use client';

import { VStack, SimpleGrid, Field, Input, Spinner } from '@chakra-ui/react';
import { Controller, Control, UseFormRegister, FieldErrors, UseFormSetValue, FieldValues } from 'react-hook-form';
import { useState, useEffect } from 'react';
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
    const cepValue = watch(`${type}Cep`);

    useEffect(() => {
        const fetchAddress = async (cep: string) => {
            setIsCepLoading(true);
            try {
                const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
                const { logradouro, bairro, localidade, uf, erro } = response.data;
                if (erro) { toaster.create({ title: 'CEP não encontrado.', type: 'error' }); return; }
                setValue(`${type}Street`, logradouro);
                setValue(`${type}Neighborhood`, bairro);
                setValue(`${type}City`, localidade);
                setValue(`${type}State`, uf);
            } catch (error) {
                console.error('Erro ao buscar CEP:', error);
            } finally {
                setIsCepLoading(false);
            }
        };
        const unmaskedCep = unmask(cepValue || '');
        if (unmaskedCep.length === 8) fetchAddress(unmaskedCep);
    }, [cepValue, setValue, type]);

    const isRequired = type === 'residential' || !isDisabled;

    return (
        <VStack gap={4} align="stretch" opacity={isDisabled ? 0.5 : 1}>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Field.Root invalid={!!errors[`${type}Cep`]} required={isRequired}>
                    <Field.Label gap={2}>CEP {isCepLoading && <Spinner size="sm" />}</Field.Label>
                    <Controller
                        name={`${type}Cep`}
                        control={control}
                        rules={{ required: isRequired ? 'O CEP é obrigatório' : false }}
                        render={({ field }) => (
                            <Input disabled={isDisabled} bgColor="gray.700" value={field.value ? maskCEP(field.value) : ''} onChange={field.onChange} maxLength={10} />
                        )}
                    />
                </Field.Root>
                <Field.Root invalid={!!errors[`${type}State`]} required={isRequired}>
                    <Field.Label>Estado</Field.Label>
                    <Input disabled bgColor="gray.700" {...register(`${type}State`, { required: isRequired })} readOnly />
                </Field.Root>
                <Field.Root invalid={!!errors[`${type}City`]} required={isRequired}>
                    <Field.Label>Cidade</Field.Label>
                    <Input disabled bgColor="gray.700" {...register(`${type}City`, { required: isRequired })} readOnly />
                </Field.Root>
            </SimpleGrid>
            <Field.Root invalid={!!errors[`${type}Street`]} required={isRequired}>
                <Field.Label>Rua / Logradouro</Field.Label>
                <Input disabled bgColor="gray.700" {...register(`${type}Street`, { required: isRequired })} readOnly />
            </Field.Root>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Field.Root invalid={!!errors[`${type}Number`]} required={isRequired}>
                    <Field.Label>Número</Field.Label>
                    <Input disabled={isDisabled} bgColor="gray.700" {...register(`${type}Number`, { required: isRequired ? 'O número é obrigatório' : false })} />
                </Field.Root>
                <Field.Root>
                    <Field.Label>Complemento</Field.Label>
                    <Input disabled={isDisabled} bgColor="gray.700" {...register(`${type}Complement`)} />
                </Field.Root>
                <Field.Root invalid={!!errors[`${type}Neighborhood`]} required={isRequired}>
                    <Field.Label>Bairro</Field.Label>
                    <Input disabled bgColor="gray.700" {...register(`${type}Neighborhood`, { required: isRequired })} readOnly />
                </Field.Root>
            </SimpleGrid>
        </VStack>
    );
}
