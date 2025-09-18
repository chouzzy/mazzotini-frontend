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
    quote:
      'Eu buscava uma alternativa de investimento que fosse segura e ao mesmo tempo oferecesse uma rentabilidade real, acima da inflação. Na Mazzotini, encontrei exatamente isso. A correção pelo IPCA me dá a tranquilidade de que meu capital está protegido, e a plataforma online torna todo o processo de acompanhamento incrivelmente transparente e simples. Recomendo fortemente.',
    authorName: 'Carlos Almeida',
    authorTitle: 'Investidor Particular',
    authorImage: 'https://randomuser.me/api/portraits/men/44.jpg',
    rating: 5,
  },
  {
    id: '2',
    quote:
      'O que mais me impressionou foi a clareza das informações. Consigo ver o valor atualizado dos meus ativos, o status de cada processo e a rentabilidade acumulada com apenas alguns cliques. A plataforma da Mazzotini desmistificou o investimento em créditos judiciais para mim. É a combinação perfeita de tecnologia e uma ótima oportunidade de negócio.',
    authorName: 'Juliana Costa Silva',
    authorTitle: 'Consultora Financeira',
    authorImage: 'https://randomuser.me/api/portraits/women/32.jpg',
    rating: 5,
  },
  {
    id: '3',
    quote:
      'Como empresário, entendo a importância da liquidez. O modelo de negócio da Mazzotini é brilhante porque gera valor para todas as partes: oferece uma solução para quem precisa do dinheiro agora e cria uma oportunidade de investimento sólida e com propósito para nós, investidores. É um investimento inteligente e com impacto positivo.',
    authorName: 'Ricardo Borges',
    authorTitle: 'Empresário',
    authorImage: 'https://randomuser.me/api/portraits/men/50.jpg',
    rating: 5,
  },
  {
    id: '4',
    quote:
      'A equipe de suporte foi fundamental para me ajudar a entender os detalhes do meu primeiro investimento. Sempre muito atenciosos e dispostos a explicar cada etapa. Essa confiança no atendimento, somada à solidez dos ativos, me fez ter certeza de que fiz a escolha certa.',
    authorName: 'Fernanda Lima',
    authorTitle: 'Advogada',
    authorImage: 'https://randomuser.me/api/portraits/women/23.jpg',
    rating: 5,
  },
];
