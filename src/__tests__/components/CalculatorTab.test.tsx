import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Estado das chamadas simuladas (API, axios e toasts)
const api = vi.hoisted(() => ({
    params: null as unknown,
    paramsError: undefined as unknown,
    logs: [] as unknown[],
}));
const axiosMock = vi.hoisted(() => ({ put: vi.fn(), post: vi.fn() }));
const toasts = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('@/hooks/useApi', () => ({
    useApi: (endpoint: string) => endpoint.includes('/params')
        ? { data: api.params, error: api.paramsError, mutate: vi.fn() }
        : { data: api.logs, mutate: vi.fn() },
}));
vi.mock('axios', () => ({ default: axiosMock }));
vi.mock('@auth0/auth0-react', () => ({ useAuth0: () => ({ getAccessTokenSilently: async () => 'token-ficticio' }) }));
vi.mock('@/components/ui/toaster', () => ({ Toaster: () => null, toaster: toasts }));
vi.mock('@/app/processos/[legalOneId]/page', () => ({}));

import { CalculatorTab } from '@/app/components/assets/tabs/CalculatorTab';

// Processo fictício com um cálculo salvo
const savedSingle = () => ({
    correctionIndex: 'IPCA', moratoryMode: 'PERSONALIZADO', moratoryRate: 2, moratoryRateUnit: 'AM',
    moratoryType: 'SIMPLES', moratoryStartDate: '2025-09-01T00:00:00.000Z',
    compensatoryRate: 12, compensatoryRateUnit: 'AA', compensatoryType: 'SIMPLES', compensatoryStartDate: '2025-09-01T00:00:00.000Z',
    multaPercentage: 0, feesMode: 'FIXO', feesPercentage: 0, feesFixedValue: 2500, penaltyPercentage: 0, feesOnPenalty: false,
    installments: [{ baseValue: 2000, baseDate: '2025-09-01T00:00:00.000Z', description: 'Parcela A' }],
    calculationLabel: null, extraCalculations: [],
});

// O mesmo processo com um segundo cálculo salvo
const savedTwo = () => ({
    ...savedSingle(),
    calculationLabel: 'Contrato A',
    extraCalculations: [{
        label: 'Contrato B', correctionIndex: 'INPC', moratoryMode: 'TAXA_LEGAL', moratoryRate: 1, moratoryRateUnit: 'AM',
        moratoryType: 'SIMPLES', moratoryStartDate: null, compensatoryRate: 6, compensatoryRateUnit: 'AA',
        compensatoryType: 'SIMPLES', compensatoryStartDate: '2025-11-15T00:00:00.000Z', multaPercentage: 0,
        feesMode: 'PERCENTUAL', feesPercentage: 10, feesFixedValue: 0, penaltyPercentage: 0, feesOnPenalty: false,
        installments: [{ baseValue: 700, baseDate: '2025-11-15T00:00:00.000Z', type: 'DEBITO' }],
    }],
});

const fakeResult = {
    totalValue: 1, correctedValue: 1, moratoryInterest: 0, compensatoryInterest: 0, multaValue: 0, subtotalA: 1,
    feesValue: 0, subtotalB: 1, penaltyValue: 0, grossTotal: 1, abatimentoResults: [], abatimentoTotal: 0,
    baseTotal: 1, referenceMonth: 10, referenceYear: 2026, installmentResults: [],
};

const tab = () => (
    <ChakraProvider value={defaultSystem}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <CalculatorTab asset={{ legalOneId: 999 } as any} onRefresh={() => {}} />
    </ChakraProvider>
);

const btn = (name: RegExp | string) => screen.getByRole('button', { name });
const valueInputs = () => screen.getAllByPlaceholderText('1.150.972,30') as HTMLInputElement[];
// Ordem das datas: início dos juros moratórios, início dos remuneratórios e as parcelas
const dateInputs = () => screen.getAllByPlaceholderText('DD/MM/AAAA') as HTMLInputElement[];
const labelInput = () => screen.queryByPlaceholderText('Ex: Contrato 1') as HTMLInputElement | null;
const type = (el: HTMLInputElement, value: string) => fireEvent.change(el, { target: { value } });
const tabLabels = () => Array.from(btn(/Adicionar cálculo/).parentElement!.querySelectorAll('button'))
    .map(b => b.textContent)
    .filter(t => !/Adicionar/.test(t ?? ''));
const submit = async () => { await act(async () => { fireEvent.click(btn(/Salvar e Calcular/)); }); };
const putBody = () => axiosMock.put.mock.calls[0][1];
const toastTitles = () => toasts.create.mock.calls.map(call => call[0].title);

beforeEach(() => {
    api.params = null;
    api.paramsError = undefined;
    api.logs = [];
    // O servidor devolve o que gravou, inclusive os cálculos extras
    axiosMock.put.mockReset().mockImplementation((_url: string, body: unknown) => Promise.resolve({ data: body }));
    axiosMock.post.mockReset().mockResolvedValue({ data: fakeResult });
    toasts.create.mockReset();
});

describe('CalculatorTab: vários cálculos no mesmo processo', () => {
    it('com um cálculo só, salva como antes e apaga cálculos extras antigos', async () => {
        api.params = savedSingle();
        render(tab());

        expect(labelInput()).toBeNull();
        await submit();

        await waitFor(() => expect(axiosMock.post).toHaveBeenCalled());
        expect(putBody()).toMatchObject({ correctionIndex: 'IPCA', feesFixedValue: 2500, calculationLabel: null, extraCalculations: [] });
        expect(putBody().installments).toEqual([expect.objectContaining({ baseValue: 2000, baseDate: '2025-09-01T00:00:00.000Z' })]);
    });

    it('o cálculo novo copia índice e taxas, sem parcelas, datas de início nem honorário fixo', () => {
        api.params = savedSingle();
        render(tab());

        fireEvent.click(btn(/Adicionar cálculo/));

        expect(tabLabels()).toEqual(['Cálculo 1', 'Cálculo 2']);
        expect(labelInput()!.value).toBe('Cálculo 2');
        expect(valueInputs()[0].value).toBe('');
        expect(dateInputs()[0].value).toBe('');
        expect(dateInputs()[1].value).toBe('');
        expect((screen.getByPlaceholderText('0,00') as HTMLInputElement).value).toBe('');
        expect(toastTitles()).toContain('Cálculo adicionado. Confira os honorários, as datas de início dos juros e as parcelas.');
    });

    it('trocar de cálculo mantém o que foi digitado, e salvar envia os dois', async () => {
        api.params = savedSingle();
        render(tab());

        type(valueInputs()[0], '3.000,00');
        fireEvent.click(btn(/Adicionar cálculo/));
        type(labelInput()!, 'Contrato B');
        type(valueInputs()[0], '150.000');
        type(dateInputs()[2], '15/11/2025');
        fireEvent.click(btn('Cálculo 1'));
        expect(valueInputs()[0].value).toBe('3.000,00');
        fireEvent.click(btn('Contrato B'));
        expect(valueInputs()[0].value).toBe('150.000');

        await submit();

        await waitFor(() => expect(axiosMock.post).toHaveBeenCalled());
        expect(putBody().calculationLabel).toBe('Cálculo 1');
        expect(putBody().installments[0].baseValue).toBe(3000);
        expect(putBody().extraCalculations).toEqual([expect.objectContaining({
            label: 'Contrato B',
            compensatoryRate: 12,
            feesFixedValue: 0,
            installments: [expect.objectContaining({ baseValue: 150000, baseDate: '2025-11-15T00:00:00.000Z' })],
        })]);
    });

    it('um erro num cálculo fechado abre esse cálculo e diz qual é, sem salvar', async () => {
        api.params = savedSingle();
        render(tab());

        fireEvent.click(btn(/Adicionar cálculo/));
        type(valueInputs()[0], '700,00');
        type(dateInputs()[2], '15/13/2025');
        fireEvent.click(btn('Cálculo 1'));
        await submit();

        expect(toastTitles()).toContain('Cálculo 2: parcela 1: data inválida (15/13/2025).');
        expect(labelInput()!.value).toBe('Cálculo 2');
        expect(axiosMock.put).not.toHaveBeenCalled();
    });

    it('apagar um cálculo salvo pede confirmação antes de salvar', async () => {
        api.params = savedTwo();
        render(tab());

        expect(tabLabels()).toEqual(['Contrato A', 'Contrato B']);
        fireEvent.click(btn('Contrato B'));
        fireEvent.click(btn(/Remover este cálculo/));
        await submit();

        expect(axiosMock.put).not.toHaveBeenCalled();
        expect(screen.getByText(/Um cálculo salvo neste processo não está mais na tela e será apagado/)).toBeInTheDocument();

        await act(async () => { fireEvent.click(btn('Apagar e salvar')); });

        await waitFor(() => expect(axiosMock.put).toHaveBeenCalled());
        expect(putBody()).toMatchObject({ calculationLabel: null, extraCalculations: [] });
    });

    it('reabrir um log antigo num processo com dois cálculos também pede confirmação', async () => {
        api.params = savedTwo();
        api.logs = [{
            id: 'log-1', calculatedAt: '2026-09-05T07:00:00Z', calculatedBy: 'cron', referenceMonth: 9, referenceYear: 2026,
            baseTotal: 1, correctedValue: 1, moratoryInterest: 0, compensatoryInterest: 0, feesValue: 0, penaltyValue: 0,
            totalValue: 1, breakdown: [], paramsSnapshot: { ...savedSingle(), calculationLabel: undefined, extraCalculations: undefined },
        }];
        render(tab());

        fireEvent.click(btn(/Reabrir/));
        expect(labelInput()).toBeNull();
        await submit();

        expect(axiosMock.put).not.toHaveBeenCalled();
        expect(screen.getByText(/será apagado/)).toBeInTheDocument();
    });

    it('no primeiro salvamento de um processo novo, continua no cálculo aberto', async () => {
        const view = render(tab());

        type(valueInputs()[0], '2.000,00');
        type(dateInputs()[2], '01/09/2025');
        fireEvent.click(btn(/Adicionar cálculo/));
        type(valueInputs()[0], '700,00');
        type(dateInputs()[2], '15/11/2025');
        await submit();
        await waitFor(() => expect(axiosMock.post).toHaveBeenCalled());

        // O SWR recarrega os parâmetros salvos
        api.params = { ...savedTwo(), calculationLabel: 'Cálculo 1' };
        view.rerender(tab());

        expect(labelInput()!.value).toBe('Cálculo 2');
        expect(valueInputs()[0].value).toBe('700,00');
    });

    it('servidor sem suporte a vários cálculos: avisa e não calcula', async () => {
        api.params = savedSingle();
        axiosMock.put.mockResolvedValue({ data: {} });
        render(tab());

        fireEvent.click(btn(/Adicionar cálculo/));
        type(valueInputs()[0], '700,00');
        type(dateInputs()[2], '15/11/2025');
        await submit();

        await waitFor(() => expect(toastTitles()).toContain(
            'O servidor não gravou os outros cálculos. Atualize a página e tente de novo; se continuar, avise o suporte.',
        ));
        expect(axiosMock.post).not.toHaveBeenCalled();
    });

    it('os nomes padrão não se repetem depois de remover um cálculo', () => {
        api.params = savedSingle();
        render(tab());

        fireEvent.click(btn(/Adicionar cálculo/));
        fireEvent.click(btn(/Adicionar cálculo/));
        fireEvent.click(btn('Cálculo 2'));
        fireEvent.click(btn(/Remover este cálculo/));
        fireEvent.click(btn(/Adicionar cálculo/));

        expect(tabLabels()).toEqual(['Cálculo 1', 'Cálculo 3', 'Cálculo 4']);
    });

    it('se a confirmação ficou aberta e a lista mudou, ela some, para a contagem não ficar errada', async () => {
        api.params = savedTwo();
        render(tab());

        fireEvent.click(btn('Contrato B'));
        fireEvent.click(btn(/Remover este cálculo/));
        await submit();
        expect(screen.getByText(/será apagado/)).toBeInTheDocument();

        fireEvent.click(btn(/Adicionar cálculo/));

        expect(screen.queryByText(/será apagado/)).toBeNull();
    });

    it('sem os parâmetros salvos (erro ao carregar), não deixa salvar', () => {
        api.params = undefined;
        api.paramsError = new Error('Falha de rede');
        render(tab());

        expect(screen.getByText(/Não foi possível carregar os parâmetros salvos deste processo/)).toBeInTheDocument();
        expect(btn(/Salvar e Calcular/)).toBeDisabled();
    });

    it('enquanto os parâmetros salvos carregam, não deixa salvar', () => {
        api.params = undefined;
        render(tab());

        expect(btn(/Salvar e Calcular/)).toBeDisabled();
        expect(screen.queryByText(/Não foi possível carregar/)).toBeNull();
    });

    it('se só a atualização em segundo plano falhar, os dados carregados continuam valendo', () => {
        api.params = savedSingle();
        api.paramsError = new Error('Falha de rede');
        render(tab());

        expect(btn(/Salvar e Calcular/)).toBeEnabled();
        expect(screen.queryByText(/Não foi possível carregar/)).toBeNull();
    });

    it('mostra os avisos do cálculo, como um mês sem índice no banco', async () => {
        api.params = savedSingle();
        const aviso = 'IPCA de 10/2026 ainda sem valor no banco: o mês entrou como 0%.';
        axiosMock.post.mockResolvedValue({ data: { ...fakeResult, warnings: [aviso] } });
        render(tab());

        await submit();

        expect(await screen.findByText(aviso)).toBeInTheDocument();
        expect(toastTitles()).toContain('Cálculo feito, com avisos. Confira o quadro de atenção no resultado.');
        expect(toastTitles()).not.toContain('Cálculo realizado com sucesso!');
    });

    it('sem avisos, não mostra o quadro de atenção', async () => {
        api.params = savedSingle();
        render(tab());

        await submit();

        await waitFor(() => expect(axiosMock.post).toHaveBeenCalled());
        expect(screen.queryByText('Atenção')).toBeNull();
    });
});

describe('CalculatorTab: custas e despesas', () => {
    it('marca uma parcela como custa ou despesa, explica a regra e envia o tipo', async () => {
        api.params = savedSingle();
        render(tab());

        fireEvent.click(btn(/Adicionar Parcela/));
        fireEvent.click(screen.getAllByRole('button', { name: 'Custa ou despesa' })[1]);
        expect(screen.getByText(/Só é corrigida pelo índice do cálculo/)).toBeInTheDocument();
        type(valueInputs()[1], '350,00');
        type(dateInputs()[3], '05/10/2025');

        await submit();

        await waitFor(() => expect(axiosMock.post).toHaveBeenCalled());
        expect(putBody().installments[1]).toEqual({
            baseValue: 350, baseDate: '2025-10-05T00:00:00.000Z', description: undefined, type: 'CUSTA', deductionPoint: undefined,
        });
    });

    it('mostra as custas no resultado, somadas no fim', async () => {
        api.params = savedSingle();
        axiosMock.post.mockResolvedValue({ data: {
            ...fakeResult,
            custaResults: [{ description: 'Perícia', baseDate: '2025-10-05T00:00:00.000Z', baseValue: 350, correctionFactor: 1.01, correctedValue: 353.5 }],
            custaTotal: 353.5,
        } });
        render(tab());

        await submit();

        expect(await screen.findByText('Custas e despesas')).toBeInTheDocument();
        expect(screen.getByText('Perícia')).toBeInTheDocument();
        expect(screen.getAllByText(/353,50/)).toHaveLength(2);
    });

    it('sem custas, não mostra o quadro', async () => {
        api.params = savedSingle();
        render(tab());

        await submit();

        await waitFor(() => expect(axiosMock.post).toHaveBeenCalled());
        expect(screen.queryByText('Custas e despesas')).toBeNull();
    });
});
