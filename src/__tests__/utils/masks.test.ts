import { describe, it, expect } from 'vitest';
import {
    unmask,
    maskCEP,
    maskCPF,
    maskCNPJ,
    maskCPFOrCNPJ,
    maskPhone,
    translateRole,
    getRoleColorScheme,
} from '@/utils/masks';

describe('unmask', () => {
    it('remove todos os caracteres não-numéricos', () => {
        expect(unmask('123.456.789-00')).toBe('12345678900');
        expect(unmask('(11) 91234-5678')).toBe('11912345678');
        expect(unmask('')).toBe('');
    });
});

describe('maskCPF', () => {
    it('formata CPF com pontos e traço', () => {
        expect(maskCPF('12345678900')).toBe('123.456.789-00');
    });

    it('funciona com valor já formatado', () => {
        expect(maskCPF('123.456.789-00')).toBe('123.456.789-00');
    });

    it('retorna vazio para string vazia', () => {
        expect(maskCPF('')).toBe('');
    });
});

describe('maskCNPJ', () => {
    it('formata CNPJ corretamente', () => {
        expect(maskCNPJ('11222333000181')).toBe('11.222.333/0001-81');
    });
});

describe('maskCPFOrCNPJ', () => {
    it('aplica máscara de CPF para até 11 dígitos', () => {
        expect(maskCPFOrCNPJ('12345678900')).toBe('123.456.789-00');
    });

    it('aplica máscara de CNPJ para mais de 11 dígitos', () => {
        expect(maskCPFOrCNPJ('11222333000181')).toBe('11.222.333/0001-81');
    });
});

describe('maskCEP', () => {
    it('formata CEP com ponto e traço', () => {
        expect(maskCEP('01310100')).toBe('01.310-100');
    });

    it('funciona com valor já formatado', () => {
        expect(maskCEP('01.310-100')).toBe('01.310-100');
    });
});

describe('maskPhone', () => {
    it('formata celular com 11 dígitos', () => {
        expect(maskPhone('11912345678')).toBe('(11) 91234-5678');
    });

    it('formata telefone fixo com 10 dígitos', () => {
        expect(maskPhone('1134567890')).toBe('(11) 3456-7890');
    });

    it('retorna vazio para string vazia', () => {
        expect(maskPhone('')).toBe('');
    });
});

describe('translateRole', () => {
    it('traduz ADMIN para ADMINISTRADOR', () => {
        expect(translateRole('ADMIN')).toBe('ADMINISTRADOR');
    });

    it('traduz INVESTOR para CLIENTE', () => {
        expect(translateRole('INVESTOR')).toBe('CLIENTE');
    });

    it('traduz ASSOCIATE para ASSOCIADO', () => {
        expect(translateRole('ASSOCIATE')).toBe('ASSOCIADO');
    });

    it('traduz OPERATOR para OPERADOR', () => {
        expect(translateRole('OPERATOR')).toBe('OPERADOR');
    });

    it('é case-insensitive', () => {
        expect(translateRole('admin')).toBe('ADMINISTRADOR');
        expect(translateRole('investor')).toBe('CLIENTE');
    });

    it('retorna a role original em maiúsculas se desconhecida', () => {
        expect(translateRole('superuser')).toBe('SUPERUSER');
    });
});

describe('getRoleColorScheme', () => {
    it('retorna red para ADMIN', () => {
        expect(getRoleColorScheme('ADMIN')).toBe('red');
    });

    it('retorna green para INVESTOR', () => {
        expect(getRoleColorScheme('INVESTOR')).toBe('green');
    });

    it('retorna blue para ASSOCIATE', () => {
        expect(getRoleColorScheme('ASSOCIATE')).toBe('blue');
    });

    it('retorna orange para OPERATOR', () => {
        expect(getRoleColorScheme('OPERATOR')).toBe('orange');
    });

    it('retorna gray para role desconhecida', () => {
        expect(getRoleColorScheme('UNKNOWN')).toBe('gray');
    });

    it('é case-insensitive', () => {
        expect(getRoleColorScheme('admin')).toBe('red');
    });
});
