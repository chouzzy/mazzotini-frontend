/**
 * Smoke Tests E2E — Frontend
 *
 * Objetivo: garantir que nenhuma página carrega com erro de crash (tela branca,
 * erro de hidratação, JS exception não capturada, ou texto de erro visível).
 *
 * O que NÃO é testado aqui: funcionalidade, lógica de negócio, visual.
 * Para isso existem os testes de integração no backend.
 *
 * Execução:
 *   npx playwright test smoke
 *
 * Pré-requisito: frontend rodando em localhost:3000
 */

import { test, expect } from '@playwright/test';

// Rotas a testar.
// Para rotas dinâmicas (ex: /editar), use um legalOneId real e estável do banco.
// O ID 4680 é o processo 0033246-68.1998.8.26.0224, usado como fixture de smoke.
const ROUTES = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/processos', name: 'Lista de Processos' },
    { path: '/processos/novo', name: 'Novo Processo' },
    { path: '/processos/4680', name: 'Detalhe do Processo' },
    { path: '/processos/4680/editar', name: 'Editar Processo' },
    { path: '/pastas', name: 'Pastas' },
    { path: '/gestao/usuarios', name: 'Gestão de Usuários' },
    { path: '/gestao/aprovacoes', name: 'Gestão de Aprovações' },
    { path: '/perfil', name: 'Perfil' },
];

// Textos que indicam crash ou erro grave na página
const ERROR_INDICATORS = [
    'Application error',
    'Internal Server Error',
    'Unhandled Runtime Error',
    'ChunkLoadError',
    'TypeError',
    'ReferenceError',
];

for (const route of ROUTES) {
    test(`${route.name} (${route.path}) → carrega sem crash`, async ({ page }) => {
        const jsErrors: string[] = [];

        // Captura erros de JavaScript não tratados
        page.on('pageerror', (err) => {
            jsErrors.push(err.message);
        });

        const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });

        // Não deve retornar erro HTTP (500, etc.)
        if (response) {
            expect(response.status()).not.toBe(500);
        }

        // Aguarda o React hidratar (máximo 5s)
        await page.waitForTimeout(2000);

        // Verifica que não há texto de erro visível na página
        const bodyText = await page.locator('body').innerText().catch(() => '');
        for (const errorText of ERROR_INDICATORS) {
            expect(bodyText).not.toContain(errorText);
        }

        // Erros de JS não devem ocorrer (ChunkLoadError, TypeError, etc.)
        const criticalErrors = jsErrors.filter(e =>
            !e.includes('ResizeObserver') && // falso positivo comum
            !e.includes('Non-Error promise rejection') // aviso, não erro
        );
        if (criticalErrors.length > 0) {
            console.error(`Erros JS em ${route.path}:`, criticalErrors);
        }
        expect(criticalErrors).toHaveLength(0);
    });
}

// -----------------------------------------------------------------------
// Teste específico: Página de processo inexistente → 404 amigável
// -----------------------------------------------------------------------
test('Página de processo inexistente → exibe 404, não crash', async ({ page }) => {
    await page.goto('/processos/999999999');
    await page.waitForTimeout(1000);

    const bodyText = await page.locator('body').innerText().catch(() => '');

    // Deve mostrar uma mensagem de "não encontrado", não uma tela branca ou erro técnico
    const hasNotFound = bodyText.includes('404') ||
        bodyText.includes('não encontrado') ||
        bodyText.includes('Não encontrado') ||
        bodyText.includes('not found');

    // Não deve ter erros técnicos expostos
    for (const errorText of ERROR_INDICATORS) {
        expect(bodyText).not.toContain(errorText);
    }

    // Se o app redirecionar para /dashboard ou /processos ao invés de 404, também é aceitável
    const currentPath = new URL(page.url()).pathname;
    const isAcceptable = hasNotFound ||
        currentPath === '/processos' ||
        currentPath === '/dashboard' ||
        currentPath === '/';

    expect(isAcceptable).toBe(true);
});
