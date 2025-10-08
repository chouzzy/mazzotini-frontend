// /src/utils/masks.ts

/**
 * Remove todos os caracteres que não são dígitos de uma string.
 * @param value A string a ser limpa.
 * @returns Apenas os números da string.
 */
export const unmask = (value: string) => value ? value.replace(/\D/g, '') : '';

/**
 * Aplica uma máscara de CEP (XX.XXX-XXX).
 * @param value A string contendo os números.
 */
export const maskCEP = (value: string) => {
    return unmask(value)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1-$2')
        .substring(0, 10); // Limita o comprimento
};

/**
 * Aplica uma máscara de CPF (XXX.XXX.XXX-XX).
 * @param value A string contendo os números.
 */
export const maskCPF = (value: string) => {
    return unmask(value)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .substring(0, 14);
};

/**
 * Aplica uma máscara de CNPJ (XX.XXX.XXX/XXXX-XX).
 * @param value A string contendo os números.
 */
export const maskCNPJ = (value: string) => {
    return unmask(value)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})/, '$1-$2')
        .substring(0, 18);
};

/**
 * Aplica dinamicamente a máscara de CPF ou CNPJ com base no comprimento.
 * @param value A string a ser formatada.
 */
export const maskCPFOrCNPJ = (value: string) => {
    const unmaskedValue = unmask(value);
    if (unmaskedValue.length <= 11) {
        return maskCPF(unmaskedValue);
    }
    return maskCNPJ(unmaskedValue);
};

/**
 * Aplica uma máscara de telemóvel/celular.
 * @param value A string contendo os números.
 */
export const maskPhone = (value: string) => {
    const unmaskedValue = unmask(value);
    if (unmaskedValue.length > 10) {
        return unmaskedValue
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .substring(0, 15);
    }
    return unmaskedValue
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 14);
};

