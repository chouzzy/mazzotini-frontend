/**
 * Setup de autenticação para os testes E2E.
 *
 * Estratégia: injetar cookies/localStorage que o Auth0 SDK espera,
 * sem precisar de um login real. O frontend usa @auth0/auth0-react;
 * podemos injetar um estado de sessão fake no localStorage.
 *
 * IMPORTANTE: Isso só funciona se o frontend estiver rodando com
 * NEXT_PUBLIC_AUTH0_SKIP_CHECK=true (ou equivalente) para aceitar
 * tokens de desenvolvimento. Configure isso no .env.local de teste.
 *
 * Alternativa: Se o app não tiver modo de bypass, faça login real aqui
 * com page.fill() nos campos de email/senha do Auth0.
 */

import { test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SESSION_PATH = path.join(__dirname, '.auth/session.json');

setup('gerar sessão de teste', async ({ page }) => {
    // Se já existe uma sessão válida, reutiliza
    if (fs.existsSync(SESSION_PATH)) {
        console.log('Sessão já existe, reutilizando.');
        return;
    }

    // Acessa a página de login e realiza o login com credenciais de teste.
    // Configure as variáveis de ambiente TEST_EMAIL e TEST_PASSWORD.
    const testEmail = process.env.TEST_EMAIL;
    const testPassword = process.env.TEST_PASSWORD;

    if (!testEmail || !testPassword) {
        console.warn(
            '⚠️  TEST_EMAIL e TEST_PASSWORD não configurados.\n' +
            '   Os testes E2E serão pulados nas rotas autenticadas.\n' +
            '   Configure no .env.test do frontend para habilitar.'
        );
        // Cria um arquivo de sessão vazio para não falhar
        fs.mkdirSync(path.dirname(SESSION_PATH), { recursive: true });
        fs.writeFileSync(SESSION_PATH, JSON.stringify({ cookies: [], origins: [] }));
        return;
    }

    // Navegação para a página inicial — Auth0 Universal Login redireciona
    await page.goto('/');

    // Aguarda o redirect para Auth0
    await page.waitForURL(/auth0\.com/, { timeout: 10000 }).catch(() => {
        console.warn('Não redirecionou para Auth0 — app pode estar em modo de desenvolvimento');
    });

    // Preenche as credenciais se estiver na tela do Auth0
    if (page.url().includes('auth0.com')) {
        await page.fill('input[name="username"]', testEmail);
        await page.fill('input[name="password"]', testPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL('http://localhost:3000/**', { timeout: 15000 });
    }

    // Salva a sessão para os demais testes
    await page.context().storageState({ path: SESSION_PATH });
    console.log('Sessão de teste salva com sucesso.');
});
