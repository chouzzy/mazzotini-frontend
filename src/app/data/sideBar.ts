import {
    PiHouseDuotone, PiChartPieSlice, PiScales, PiList,
    PiUser, PiUsers, PiFolderFill, PiUsersThree,
} from "react-icons/pi";

const SideBarItems = [
    { name: 'Home',             icon: PiHouseDuotone,   href: '/' },
    { name: 'Dashboard',        icon: PiChartPieSlice,  href: '/dashboard',           hideForRoles: ['ASSOCIATE'] },
    { name: 'Pastas',           icon: PiFolderFill,     href: '/pastas',              hideForRoles: ['ASSOCIATE'] },
    { name: 'Meus Processos',   icon: PiScales,         href: '/processos',           hideForRoles: ['ASSOCIATE'] },
    { name: 'Novo Processo',    icon: PiList,            href: '/processos/novo',      roles: ['ADMIN', 'OPERATOR'] },
    { name: 'Área do Associado',icon: PiUsersThree,     href: '/associado',           roles: ['ASSOCIATE'] },
    { name: 'Meu Perfil',       icon: PiUser,            href: '/perfil' },
    { name: 'Usuários',         icon: PiUsers,           href: '/gestao/usuarios',     roles: ['ADMIN', 'OPERATOR'] },
];

export { SideBarItems };
