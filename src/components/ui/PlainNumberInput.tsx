'use client';

import { Input, InputProps } from '@chakra-ui/react';
import { forwardRef } from 'react';

// O botão de subir e descer de dentro do campo muda o valor do mesmo jeito que a seta do teclado
const NO_SPIN_BUTTONS = {
    appearance: 'textfield',
    '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': { appearance: 'none', margin: 0 },
};

/**
 * Campo numérico que só muda digitando.
 *
 * ## Por que existe
 * No `type="number"`, com o campo em foco, a seta do teclado, a rolagem do mouse e o botão de dentro
 * do campo somam ou tiram um `step`, sem ninguém ter a intenção: 10 vira 9,99, e 0 virava -0,01
 * antes de o campo ter `min`. O valor errado vai para o cálculo, que recalcula sozinho todo mês.
 *
 * ## Por que continua `type="number"`
 * Num campo de texto, "10,5" chegaria ao `parseFloat` como 10, e a validação de `min` e `step` do
 * navegador deixaria de valer.
 *
 * A rolagem não pode ser cancelada, porque o React registra o `wheel` como passivo. Tirar o foco
 * resolve: o navegador só muda o campo em foco, e a página rola normalmente.
 */
export const PlainNumberInput = forwardRef<HTMLInputElement, InputProps>(
    function PlainNumberInput({ onKeyDown, onWheel, ...props }, ref) {
        return (
            <Input
                {...props}
                ref={ref}
                type="number"
                css={NO_SPIN_BUTTONS}
                onKeyDown={e => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                    onKeyDown?.(e);
                }}
                onWheel={e => {
                    e.currentTarget.blur();
                    onWheel?.(e);
                }}
            />
        );
    },
);
