// src/data/testimonials.ts

export interface Testimonial {
  id: string;
  quote: string; // O depoimento em si
  authorName: string;
  authorTitle: string;
  authorImage?: string; // URL da imagem do autor (opcional)
  rating?: number; // Número de estrelas (0-5)
}

export const mazzotiniTestimonials: Testimonial[] = [
  {
    id: '1',
    quote: "A parceria com a Awer foi um divisor de águas para a Namari. Eles não apenas entregaram uma plataforma de e-commerce robusta, mas mergulharam de cabeça para entender as particularidades do nosso negócio. O resultado foi um aumento expressivo nas vendas e, mais importante, um processo de gestão muito mais simples e inteligente. Sinto que tenho um parceiro estratégico, não apenas um fornecedor de tecnologia.",
    authorName: 'Mariela Passalacqua',
    authorTitle: 'Dona, Loja Namari',
    authorImage: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 5,
  },
  {
    id: '2',
    quote: "A parceria com a Awer transformou a gestão do nosso escritório. Com o suporte estratégico e a tecnologia desenvolvida por eles — especialmente os bots de segurança — tivemos uma melhoria real nos resultados. Sou muito grata pela dedicação e competência desse time incrivel.",
    authorName: 'Marina Precinotto',
    authorTitle: 'Sócia Patrimonial, SCC Advocacia',
    authorImage: '/feedbacks/marina.jpg',
    rating: 5,
  },
  {
    id: '3',
    quote: "Antes da Awer, nossos processos internos eram um grande desafio, dependendo de múltiplas planilhas e controles manuais. A transformação foi incrível. A equipe Awer desenvolveu uma solução sob medida que centralizou nossa operação, nos dando uma visão clara e em tempo real do nosso negócio. O suporte e a atenção que recebemos durante todo o projeto foram excepcionais.",
    authorName: 'Graziela',
    authorTitle: 'Dona, JMA Comércio',
    authorImage: 'https://randomuser.me/api/portraits/women/50.jpg',
    rating: 5,
  },
  {
    id: '4',
    quote: "Como engenheiro, fiquei genuinamente impressionado com a qualidade técnica da equipe Awer. Eles não apenas utilizam uma stack moderna, mas demonstram um profundo conhecimento em arquitetura de software e escalabilidade. O projeto que desenvolvemos juntos foi entregue com um código limpo, bem documentado e, o mais importante, uma base sólida que nos permitirá crescer sem acumular débitos técnicos. É raro encontrar consultorias com esse nível de excelência técnica.",
    authorName: 'Luan Ribeiro',
    authorTitle: 'Engenheiro, C2DI',
    authorImage: 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: 5,
  },
  {
    id: '5',
    quote: "Trabalhar com a Awer foi uma experiência de colaboração excepcional. A metodologia ágil que eles aplicam é pragmática e eficiente, com uma comunicação transparente que manteve nossas equipes perfeitamente alinhadas. Mais do que desenvolvedores, eles agiram como verdadeiros parceiros na resolução de problemas, sempre dispostos a discutir e encontrar a melhor solução técnica para os desafios complexos que enfrentamos. O suporte técnico pós-entrega também é um grande diferencial.",
    authorName: 'Ernesto',
    authorTitle: 'Engenheiro, C2DI',
    authorImage: 'https://randomuser.me/api/portraits/men/36.jpg',
    rating: 5,
  },
];
