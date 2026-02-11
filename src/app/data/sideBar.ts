import { PiHouseDuotone, PiChartPieSlice, PiScales, PiList, PiUser, PiGear, PiUsers, PiFolderDashedDuotone, PiFolderFill } from "react-icons/pi";

const SideBarItems = [
    { name: 'Home', icon: PiHouseDuotone, href: '/' },
    { name: 'Dashboard', icon: PiChartPieSlice, href: '/dashboard' },
    { name: 'Pastas', icon: PiFolderFill, href: '/pastas' },
    { name: 'Meus Processos', icon: PiScales, href: '/processos' },
    { name: 'Novo Processo', icon: PiList, href: '/processos/novo' },
    { name: 'Meu Perfil', icon: PiUser, href: '/perfil' },
    { name: 'Usuários', icon: PiUsers, href: '/gestao/usuarios' },
    // { name: 'Configurações', icon: PiGear, href: '/configuracoes' },
];

export {SideBarItems}