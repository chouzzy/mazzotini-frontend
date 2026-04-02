import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    timeout: 30000,
    reporter: 'list',

    use: {
        // Frontend rodando localmente
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
        // Injeta o storage state com a sessão mockada (gerado pelo auth.setup.ts)
        storageState: 'e2e/.auth/session.json',
    },

    projects: [
        // Passo 1: gera a sessão autenticada mockada
        {
            name: 'setup-auth',
            testMatch: /auth\.setup\.ts/,
            use: { storageState: undefined },
        },
        // Passo 2: roda os testes com a sessão gerada
        {
            name: 'smoke',
            testMatch: /smoke\.spec\.ts/,
            dependencies: ['setup-auth'],
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'processos',
            testMatch: /processos\.spec\.ts/,
            dependencies: ['setup-auth'],
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
