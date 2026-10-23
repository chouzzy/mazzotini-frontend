import { describe, it, expect } from 'vitest';
import { SideBarItems } from '@/app/data/sideBar';

describe('menu lateral', () => {
    it.each(['Usuários', 'Notificações', 'Configurações'])('"%s" aparece só para o admin', (name) => {
        const item = SideBarItems.find(i => i.name === name);

        expect(item).toBeDefined();
        expect(item?.roles).toEqual(['ADMIN']);
    });
});
