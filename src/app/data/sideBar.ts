import { PiHouseDuotone, PiChartPieSlice, PiScales, PiList, PiUser, PiUsers, PiFolderFill, PiHeartbeat } from "react-icons/pi";

const SideBarItems = [
    { name: 'Home', icon: PiHouseDuotone, href: '/' },
    { name: 'Dashboard', icon: PiChartPieSlice, href: '/dashboard' },
    { name: 'Pastas', icon: PiFolderFill, href: '/pastas' },
    { name: 'Meus Processos', icon: PiScales, href: '/processos' },
    { name: 'Novo Processo', icon: PiList, href: '/processos/novo', roles: ['ADMIN', 'OPERATOR'] },
    { name: 'Meu Perfil', icon: PiUser, href: '/perfil' },
    { name: 'Usuários', icon: PiUsers, href: '/gestao/usuarios' },
    { name: 'Logs do Sistema', icon: PiHeartbeat, href: '/logs', roles: ['ADMIN'] },
];

export {SideBarItems}