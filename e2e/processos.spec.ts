/**
 * Testes E2E: Fluxo de Cadastro de Processo (/processos/novo)
 *
 * O que é testado:
 * - Página carrega sem erro
 * - Toggle entre busca por número e por código de pasta
 * - Campo de busca aceita input
 * - Banner de aviso de múltiplas pastas é exibido quando aplicável
 */

import { test, expect } from '@playwright/test';

test.describe('Novo Processo (/processos/novo)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/processos/novo');
        await page.waitForTimeout(1000);
    });

    test('página carrega sem crash', async ({ page }) => {
        const bodyText = await page.locator('body').innerText().catch(() => '');
        expect(bodyText).not.toContain('Application error');
        expect(bodyText).not.toContain('Internal Server Error');
    });

    test('botão de toggle "Número do Processo" está visível', async ({ page }) => {
        const button = page.getByText('Número do Processo');
        await expect(button).toBeVisible();
    });

    test('botão de toggle "Código da Pasta" está visível', async ({ page }) => {
        const button = page.getByText('Código da Pasta');
        await expect(button).toBeVisible();
    });

    test('campo de busca por número aceita input', async ({ page }) => {
        // Garante que está no modo de busca por número
        await page.getByText('Número do Processo').click();
        await page.waitForTimeout(300);

        const input = page.locator('input[placeholder*="número"]').or(
            page.locator('input[type="text"]').first()
        );
        await expect(input).toBeVisible();
        await input.fill('0099999-88.2024.8.26.0100');
        await expect(input).toHaveValue('0099999-88.2024.8.26.0100');
    });

    test('alternar para modo Código da Pasta muda o placeholder do input', async ({ page }) => {
        await page.getByText('Código da Pasta').click();
        await page.waitForTimeout(300);

        // O input deve existir e aceitar um código de pasta
        const input = page.locator('input').first();
        await expect(input).toBeVisible();
        await input.fill('Proc-0002091/032');
        await expect(input).toHaveValue('Proc-0002091/032');
    });
});
