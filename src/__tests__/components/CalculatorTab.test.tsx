import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Estado das chamadas simuladas (API, axios e toasts)
const api = vi.hoisted(() => ({
    params: null as unknown,
    paramsError: undefined as unknown,
    logs: [] as unknown[],
    mutateParams: vi.fn(),
}));
const axiosMock = vi.hoisted(() => ({ put: vi.fn(), post: vi.fn() }));
const toasts = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('@/hooks/useApi', () => ({
    useApi: (endpoint: string) => endpoint.includes('/params')
        ? { data: api.params, error: api.paramsError, mutate: api.mutateParams }
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
    api.mutateParams.mockReset();
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
        // O botão marcado é anunciado para leitores de tela
        expect(screen.getAllByRole('button', { name: 'Custa ou despesa' })[1]).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getAllByRole('button', { name: 'Débito' })[1]).toHaveAttribute('aria-pressed', 'false');
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

describe('CalculatorTab: opções do Dr. Calc e taxa legal com o Tema 1368', () => {
    const feesOnMulta = () => screen.getByRole('checkbox', { name: /Incidir honorários sobre a multa/ });
    const deflate     = () => screen.getByRole('checkbox', { name: /Deflacionar valor nominal/ });
    const tema1368    = () => btn('Taxa Legal + Tema 1368 (STJ)');

    // O processo fictício com honorários em percentual, para a opção dos honorários valer
    const comHonorariosEmPercentual = () => ({ ...savedSingle(), feesMode: 'PERCENTUAL', feesPercentage: 10 });

    it('as opções vêm desmarcadas, como no Dr. Calc, e vão assim para a API', async () => {
        api.params = comHonorariosEmPercentual();
        render(tab());

        expect(feesOnMulta()).not.toBeChecked();
        expect(deflate()).not.toBeChecked();
        // A ajuda é a descrição da caixa, e não parte do nome
        expect(feesOnMulta()).toHaveAccessibleDescription(/Padrão do Dr\. Calc: desmarcado/);
        await submit();

        await waitFor(() => expect(axiosMock.post).toHaveBeenCalled());
        expect(putBody()).toMatchObject({ feesOnMulta: false, deflate: false });
    });

    it('com honorário fixo em R$ ou "Não atualizar (fixo)", a opção correspondente não se aplica', () => {
        api.params = { ...savedSingle(), correctionIndex: 'NAO_ATUALIZAR' };   // honorário fixo em R$
        render(tab());

        expect(feesOnMulta()).toBeDisabled();
        expect(feesOnMulta()).toHaveAccessibleDescription('Não se aplica com honorários fixos em R$.');
        expect(deflate()).toBeDisabled();
    });

    it('servidor sem as opções do Dr. Calc: avisa e não calcula', async () => {
        api.params = comHonorariosEmPercentual();
        // A versão anterior do servidor devolve o registro sem os campos novos
        axiosMock.put.mockImplementation((_url: string, body: Record<string, unknown>) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { feesOnMulta: _f, deflate: _d, ...antigo } = body;
            return Promise.resolve({ data: antigo });
        });
        render(tab());

        await submit();

        await waitFor(() => expect(toastTitles()).toContain(
            'O servidor não gravou as opções "honorários sobre a multa" e "deflacionar". Atualize a página e tente de novo; se continuar, avise o suporte.',
        ));
        expect(axiosMock.post).not.toHaveBeenCalled();
    });

    it('marca as opções e a taxa legal com o Tema 1368, explica a regra e envia', async () => {
        api.params = comHonorariosEmPercentual();
        render(tab());

        fireEvent.click(tema1368());
        expect(tema1368()).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByText(/SELIC descontada do IPCA-E/)).toBeInTheDocument();
        // A caixa avisa o formulário numa microtarefa depois do clique: o act assíncrono espera
        await act(async () => {
            fireEvent.click(feesOnMulta());
            fireEvent.click(deflate());
        });
        expect(feesOnMulta()).toBeChecked();
        expect(deflate()).toBeChecked();

        await submit();

        await waitFor(() => expect(axiosMock.post).toHaveBeenCalled());
        expect(putBody()).toMatchObject({ moratoryMode: 'TAXA_LEGAL_TEMA1368', feesOnMulta: true, deflate: true });
    });

    it('explica no detalhe da parcela quando a inflação negativa deixou o valor no original', async () => {
        api.params = comHonorariosEmPercentual();
        axiosMock.post.mockResolvedValue({ data: {
            ...fakeResult,
            installmentResults: [{
                installmentIndex: 1, description: 'Parcela A', baseValue: 1000, baseDate: '2023-05-15T00:00:00.000Z',
                correctionFactor: 1, correctedValue: 1000, moratoryMonths: 0, moratoryInterest: 0, compensatoryInterest: 0,
                feesValue: 0, penaltyValue: 0, subtotal: 1000, nominalFloor: true,
                monthBreakdown: [{ year: 2023, month: 6, monthlyRate: -0.985, accumulated: 0.99015 }],
            }],
        } });
        render(tab());

        await submit();
        fireEvent.click(await screen.findByText(/Parcela A — Base/));

        expect(await screen.findByText(/Inflação negativa no período: a parcela ficou com o valor original/)).toBeInTheDocument();
    });

    it('reabre um cálculo salvo com as opções e o modo dos juros', () => {
        api.params = { ...savedSingle(), moratoryMode: 'TAXA_LEGAL_TEMA1368', feesOnMulta: true, deflate: true };
        render(tab());

        expect(feesOnMulta()).toBeChecked();
        expect(deflate()).toBeChecked();
        expect(tema1368()).toHaveAttribute('aria-pressed', 'true');
    });
});

describe('CalculatorTab: revisão de 23/10', () => {
    it('a colagem diz quais linhas ficaram de fora e mantém todas as casas do valor', async () => {
        api.params = savedSingle();
        render(tab());

        fireEvent.click(btn(/^Colar$/));
        fireEvent.change(screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement, {
            target: { value: '15/01/2025;333,3333\n31/02/2025;100,00\n10/03/2025;abc' },
        });
        fireEvent.click(btn(/^Importar$/));

        expect(toasts.create).toHaveBeenCalledWith(expect.objectContaining({
            title: '1 parcela(s) importada(s).',
            description: 'Ficaram de fora: linha 2 (data inválida: 31/02/2025), linha 3 (valor inválido).',
            type: 'warning',
        }));
        expect(valueInputs().map(i => i.value)).toContain('333,3333');
    });

    it('na colagem, o número da linha conta as linhas em branco do começo', async () => {
        api.params = savedSingle();
        render(tab());

        fireEvent.click(btn(/^Colar$/));
        fireEvent.change(screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement, {
            target: { value: '\n\n15/01/2025;100,00\n31/02/2025;100,00\n' },
        });
        fireEvent.click(btn(/^Importar$/));

        expect(toasts.create).toHaveBeenCalledWith(expect.objectContaining({
            title: '1 parcela(s) importada(s).',
            description: 'Ficaram de fora: linha 4 (data inválida: 31/02/2025).',
        }));
    });

    it('o mês de referência vai no corpo do cálculo, e os parâmetros são recarregados depois', async () => {
        api.params = savedSingle();
        render(tab());

        type(screen.getByPlaceholderText('MM/AAAA') as HTMLInputElement, '2026-09');
        await submit();

        await waitFor(() => expect(axiosMock.post).toHaveBeenCalled());
        expect(axiosMock.post.mock.calls[0][1]).toEqual({ referenceYear: 2026, referenceMonth: 9 });
        await waitFor(() => expect(api.mutateParams).toHaveBeenCalledTimes(2));   // depois de salvar e depois de calcular
    });

    it('escolher o índice não tira o foco do campo (o select não é remontado)', async () => {
        api.params = savedSingle();
        const { container } = render(tab());
        const trigger = () => container.querySelector('[data-scope="select"][data-part="trigger"]') as HTMLElement;
        const before = trigger();

        before.focus();
        await act(async () => { fireEvent.click(before); });
        const option = screen.getAllByRole('option').find(o => /INPC/.test(o.textContent ?? ''))!;
        await act(async () => { fireEvent.click(option); });

        expect(trigger()).toBe(before);
    });
});
