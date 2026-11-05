import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { vi, describe, it, expect } from 'vitest';
import { PlainNumberInput } from '@/components/ui/PlainNumberInput';

const inChakra = (node: React.ReactNode) => render(<ChakraProvider value={defaultSystem}>{node}</ChakraProvider>);
const field = () => screen.getByRole('spinbutton') as HTMLInputElement;

// O fireEvent devolve false quando o evento foi cancelado
describe('PlainNumberInput', () => {
    it('cancela a seta para cima e para baixo', () => {
        inChakra(<PlainNumberInput defaultValue="10" step="0.01" />);

        expect(fireEvent.keyDown(field(), { key: 'ArrowDown' })).toBe(false);
        expect(fireEvent.keyDown(field(), { key: 'ArrowUp' })).toBe(false);
        expect(field().value).toBe('10');
    });

    it.each(['0', ',', '.', '-', 'Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'])(
        'não atrapalha a digitação: %s',
        key => {
            inChakra(<PlainNumberInput defaultValue="10" />);

            expect(fireEvent.keyDown(field(), { key })).toBe(true);
        },
    );

    it('a rolagem tira o foco do campo, para o navegador não mudar o valor', () => {
        inChakra(<PlainNumberInput defaultValue="10" />);
        field().focus();
        expect(document.activeElement).toBe(field());

        fireEvent.wheel(field(), { deltaY: 100 });

        expect(document.activeElement).not.toBe(field());
        expect(field().value).toBe('10');
    });

    it('a rolagem sobre o campo sem foco não tira o foco de outro campo', () => {
        inChakra(<><input aria-label="outro" /><PlainNumberInput defaultValue="10" /></>);
        const other = screen.getByLabelText('outro');
        other.focus();

        fireEvent.wheel(field(), { deltaY: 100 });

        expect(document.activeElement).toBe(other);
    });

    it('mantém os atributos e os eventos de quem usa o campo', () => {
        const onKeyDown = vi.fn();
        const onWheel = vi.fn();
        const onChange = vi.fn();
        inChakra(<PlainNumberInput min={0} step="0.0001" onKeyDown={onKeyDown} onWheel={onWheel} onChange={onChange} defaultValue="1" />);

        expect(field().type).toBe('number');
        expect(field().min).toBe('0');
        expect(field().step).toBe('0.0001');

        fireEvent.keyDown(field(), { key: 'ArrowDown' });
        fireEvent.keyDown(field(), { key: '5' });
        fireEvent.wheel(field(), { deltaY: 100 });
        fireEvent.change(field(), { target: { value: '5' } });

        expect(onKeyDown).toHaveBeenCalledTimes(2);
        expect(onWheel).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('funciona com o register do react-hook-form: mostra, recebe e envia o valor', async () => {
        const onSubmit = vi.fn();
        const Form = () => {
            const { register, handleSubmit } = useForm({ defaultValues: { rate: '10' } });
            return (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <PlainNumberInput {...register('rate')} step="0.01" />
                    <button type="submit">Enviar</button>
                </form>
            );
        };
        inChakra(<Form />);
        expect(field().value).toBe('10');

        fireEvent.change(field(), { target: { value: '12.5' } });
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Enviar' })); });

        expect(onSubmit.mock.calls[0][0]).toEqual({ rate: '12.5' });
    });
});
