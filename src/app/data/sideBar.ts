import { PiHouseDuotone, PiChartPieSlice, PiScales, PiList, PiUser, PiGear } from "react-icons/pi";

const SideBarItems = [
    { name: 'Home', icon: PiHouseDuotone, href: '/' },
    // { name: 'Dashboard', icon: PiChartPieSlice, href: '/dashboard' },
    { name: 'Meus Ativos', icon: PiScales, href: '/ativos' },
    { name: 'Novo Ativo', icon: PiList, href: '/ativos/novo' },
    { name: 'Meu Perfil', icon: PiUser, href: '/perfil' },
    { name: 'Configurações', icon: PiGear, href: '/configuracoes' },
];

export {SideBarItems}