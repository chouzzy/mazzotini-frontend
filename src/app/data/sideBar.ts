import {
    PiHouseDuotone, PiChartPieSlice, PiScales, PiList,
    PiUser, PiUsers, PiFolderFill, PiUsersThree, PiGear, PiFolderOpen,
} from "react-icons/pi";

const SideBarItems = [
    // Visível para todos
    { name: 'Home',             icon: PiHouseDuotone,   href: '/' },

    // Dashboard: investidores/admin/operator veem o padrão, associado vê o próprio
    { name: 'Dashboard',        icon: PiChartPieSlice,  href: '/dashboard',               hideForRoles: ['ASSOCIATE'] },
    { name: 'Dashboard',        icon: PiChartPieSlice,  href: '/associado/dashboard',     roles: ['ASSOCIATE'] },

    // Itens exclusivos de INVESTOR / ADMIN / OPERATOR
    { name: 'Pastas',           icon: PiFolderFill,     href: '/pastas',                  hideForRoles: ['ASSOCIATE'] },
    { name: 'Meus Processos',   icon: PiScales,         href: '/processos',               hideForRoles: ['ASSOCIATE'] },
    { name: 'Novo Processo',    icon: PiList,            href: '/processos/novo',          roles: ['ADMIN', 'OPERATOR'] },

    // Área exclusiva do ASSOCIATE
    { name: 'Meus Clientes',    icon: PiUsersThree,     href: '/associado',               roles: ['ASSOCIATE'] },

    // Documentos financeiros — só INVESTOR vê (não ASSOCIATE, não admin)
    { name: 'Meus Documentos',  icon: PiFolderOpen,      href: '/meus-documentos',          roles: ['INVESTOR'] },

    // Visível para todos
    { name: 'Meu Perfil',       icon: PiUser,            href: '/perfil' },

    // Restrito a ADMIN / OPERATOR
    { name: 'Usuários',         icon: PiUsers,           href: '/gestao/usuarios',         roles: ['ADMIN', 'OPERATOR'] },
    { name: 'Configurações',    icon: PiGear,            href: '/configuracoes',            roles: ['ADMIN'] },
];

export { SideBarItems };
