'use client';

import { Input, InputProps } from '@chakra-ui/react';
import { forwardRef } from 'react';

// O botão de subir e descer de dentro do campo muda o valor do mesmo jeito que a seta do teclado.
// O Input do Chakra não o esconde no Edge: só o afasta da borda, por causa do padding
const NO_SPIN_BUTTONS = {
    appearance: 'textfield',
    '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': { appearance: 'none', margin: 0 },
};

/**
 * Campo numérico que só muda digitando.
 *
 * ## Por que existe
 * No `type="number"`, com o campo em foco, a seta do teclado, a rolagem do mouse e o botão de dentro
 * do campo somam ou tiram um `step` sem ninguém ter a intenção: 10 vira 9,99 e, num campo sem `min`,
 * 0 vira -0,01. Na calculadora, esse valor entra no recálculo mensal sem ninguém conferir.
 *
 * ## Por que continua `type="number"`
 * Num campo de texto, "10,5" não seria lido como 10,5: o `parseFloat` daria 10, e o `valueAsNumber`,
 * `NaN`. A validação de `min` e `step` do navegador também deixaria de valer.
 *
 * ## A rolagem
 * Ela não pode ser cancelada, porque o React registra o `wheel` como passivo. Como o navegador só
 * muda o campo em foco, o foco sai durante a rolagem, e a página rola normalmente. Ele volta logo
 * depois, para o próximo dígito não se perder.
 */
export const PlainNumberInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'css'>>(
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
                    const field = e.currentTarget;
                    if (document.activeElement === field) {
                        field.blur();
                        setTimeout(() => {
                            if (document.activeElement === document.body) field.focus({ preventScroll: true });
                        });
                    }
                    onWheel?.(e);
                }}
            />
        );
    },
);
