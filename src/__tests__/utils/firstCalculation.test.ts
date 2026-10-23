import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveFirstCalculation, toFirstCalculationInstallments } from '@/utils/firstCalculation';

const axiosMock = vi.hoisted(() => ({ put: vi.fn(), post: vi.fn() }));
vi.mock('axios', () => ({ default: axiosMock }));

// Processo e parâmetros fictícios
const params = { correctionIndex: 'IPCA', installments: [{ baseValue: 1000, baseDate: '2026-01-15T00:00:00.000Z' }] };
const save = () => saveFirstCalculation(101, params, 'token-exemplo');
const apiError = (error: string) => Object.assign(new Error('400'), { response: { data: { error } } });

describe('saveFirstCalculation (primeiro cálculo no cadastro de processo)', () => {
    beforeEach(() => {
        axiosMock.put.mockReset().mockResolvedValue({ data: {} });
        axiosMock.post.mockReset().mockResolvedValue({ data: { totalValue: 1000 } });
    });

    it('salva os parâmetros, calcula e, sem avisos, não mostra nada', async () => {
        expect(await save()).toBeNull();
        expect(axiosMock.put.mock.calls[0][0]).toMatch(/\/api\/calculator\/101\/params$/);
        expect(axiosMock.put.mock.calls[0][1]).toBe(params);
        expect(axiosMock.post.mock.calls[0][0]).toMatch(/\/api\/calculator\/101\/calculate$/);
    });

    it('se o salvamento falha, diz que os parâmetros não foram salvos e não calcula', async () => {
        axiosMock.put.mockRejectedValue(apiError('"Não atualizar (fixo)" vale para datas a partir de 01/07/1994. Mude a data da parcela de 15/01/1990 ou escolha outro índice.'));

        expect(await save()).toEqual({
            title:       'Processo criado, mas os parâmetros de cálculo não foram salvos',
            description: '"Não atualizar (fixo)" vale para datas a partir de 01/07/1994. Mude a data da parcela de 15/01/1990 ou escolha outro índice. Configure o cálculo na aba Cálculo Judicial.',
        });
        expect(axiosMock.post).not.toHaveBeenCalled();
    });

    it('se o cálculo é recusado, diz que os parâmetros foram salvos', async () => {
        axiosMock.post.mockRejectedValue(apiError('Falta IPCA de 02/2023 no banco de índices. Avise o suporte.'));

        expect(await save()).toEqual({
            title:       'Processo criado, mas o cálculo foi recusado',
            description: 'Falta IPCA de 02/2023 no banco de índices. Avise o suporte. Os parâmetros foram salvos; ajuste-os na aba Cálculo Judicial.',
        });
    });

    it('mostra os avisos do cálculo', async () => {
        axiosMock.post.mockResolvedValue({ data: { totalValue: 1004.97, warnings: ['IPCA de 10/2026 ainda sem valor no banco: o mês entrou como 0%.'] } });

        expect(await save()).toEqual({
            title:       'Processo criado e calculado, com avisos',
            description: 'IPCA de 10/2026 ainda sem valor no banco: o mês entrou como 0%. Confira na aba Cálculo Judicial.',
        });
    });

    it('sem motivo na resposta, usa uma mensagem padrão', async () => {
        axiosMock.put.mockRejectedValue(new Error('Network Error'));

        expect((await save())?.description).toBe('Erro ao salvar os parâmetros. Configure o cálculo na aba Cálculo Judicial.');
    });
});

describe('toFirstCalculationInstallments (parcelas do cadastro, antes de criar o processo)', () => {
    const row = (baseValue: string, baseDate: string, description = '') => ({ baseValue, baseDate, description });

    it('converte as parcelas e ignora a linha toda vazia', () => {
        expect(toFirstCalculationInstallments([row('1.000,50', '2026-01-15', 'Parcela A'), row('', '')])).toEqual({
            ok: true,
            installments: [{ baseValue: 1000.5, baseDate: '2026-01-15T00:00:00.000Z', description: 'Parcela A' }],
        });
    });

    it.each([
        ['valor sem data (data incompleta no campo)', [row('1.000,00', '')], 'Parcela 1 do cálculo: informe a data completa.'],
        ['data sem valor', [row('', '2026-01-15')], 'Parcela 1 do cálculo: informe o valor.'],
        ['valor que não é número', [row('mil reais', '2026-01-15')], 'Parcela 1 do cálculo: valor inválido (mil reais).'],
        ['ano de cinco dígitos', [row('1.000,00', '20260-01-15')], 'Parcela 1 do cálculo: data inválida (20260-01-15).'],
        ['linha incompleta depois de uma boa', [row('500,00', '2026-01-15'), row('300,00', '')], 'Parcela 2 do cálculo: informe a data completa.'],
    ])('recusa %s', (_, rows, error) => {
        expect(toFirstCalculationInstallments(rows)).toEqual({ ok: false, error });
    });
});
