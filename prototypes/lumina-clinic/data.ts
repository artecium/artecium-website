export type LuminaTreatment = {
  id: string;
  name: string;
  category: string;
  durationMin: number;
  priceEuro: number;
  description: string;
  image: string;
};

export type LuminaProfessional = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
};

export type LuminaGalleryItem = {
  id: string;
  alt: string;
  src: string;
  span?: "wide" | "tall";
};

export type LuminaTestimonial = {
  id: string;
  quote: string;
  author: string;
};

export type LuminaBeforeAfterCase = {
  id: string;
  procedure: string;
  description: string;
  /** Mesma fotografia em ambas as camadas — coerência do «caso» ilustrativo. */
  image: string;
  beforeImageClassName: string;
  afterImageClassName: string;
};

function luminaImg(photoId: string, width: number, extra = "") {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=80${extra}`;
}

/** IDs validados em Unsplash — apenas demonstração. */
const PHOTOS = {
  clinicalLight: "1576091160399-112ba8d25d1d",
  portraitA: "1494790108377-be9c29b29330",
  portraitB: "1438761681033-6461ffad8d80",
  portraitC: "1507003211169-0a1dd7228f2d",
  portraitD: "1506794778202-cad84cf45f1d",
} as const;

export const LUMINA_BRAND = {
  name: "Lumina Clinic",
  city: "Cascais",
  district: "Marina",
  headline: "O equilíbrio entre ciência, beleza e bem-estar.",
  tagline:
    "Clínica de estética contemporânea com luz natural, rituais calmos e acompanhamento personalizado — demonstração comercial Artecium Lab.",
};

export const LUMINA_HERO_IMAGE = luminaImg(PHOTOS.clinicalLight, 1920, "&h=1280");

export const LUMINA_ABOUT = {
  intro:
    "A Lumina Clinic nasce da ideia de que beleza e bem-estar caminham juntos — com tempo, escuta e tecnologia aplicada com sobriedade.",
  philosophy:
    "Cada visita é desenhada como uma experiência serena: receção luminosa, salas amplas e uma equipa focada em orientar, não em pressionar.",
  image: luminaImg(PHOTOS.clinicalLight, 1200, "&h=1500&crop=entropy"),
  imageAlt: "Detalhe luminoso de zona de tratamento (imagens demonstrativas)",
};

export const LUMINA_TREATMENTS: LuminaTreatment[] = [
  {
    id: "medicina-estetica",
    name: "Medicina estética",
    category: "Corpo & contorno",
    durationMin: 45,
    priceEuro: 120,
    description: "Protocolo demonstrativo de harmonização suave e avaliação de bem-estar.",
    image: luminaImg(PHOTOS.clinicalLight, 900, "&h=700"),
  },
  {
    id: "dermatologia-estetica",
    name: "Dermatologia estética",
    category: "Pele",
    durationMin: 50,
    priceEuro: 95,
    description: "Cuidado facial orientado à luminosidade e textura — conteúdo fictício.",
    image: luminaImg(PHOTOS.clinicalLight, 900, "&h=700&crop=faces"),
  },
  {
    id: "tratamentos-faciais",
    name: "Tratamentos faciais",
    category: "Facial",
    durationMin: 60,
    priceEuro: 85,
    description: "Ritual de limpeza, massagem e máscara hidratante em ambiente calmo.",
    image: luminaImg(PHOTOS.portraitA, 900, "&h=700&crop=faces"),
  },
  {
    id: "rejuvenescimento",
    name: "Rejuvenescimento",
    category: "Avançado",
    durationMin: 55,
    priceEuro: 140,
    description: "Sessão demonstrativa com foco em firmeza e viço — sem dados clínicos.",
    image: luminaImg(PHOTOS.portraitB, 900, "&h=700&crop=faces"),
  },
  {
    id: "bem-estar",
    name: "Bem-estar",
    category: "Relaxamento",
    durationMin: 75,
    priceEuro: 70,
    description: "Momento de pausa com aromaterapia leve e zona de descanso dedicada.",
    image: luminaImg(PHOTOS.clinicalLight, 900, "&h=800&crop=entropy"),
  },
];

export const LUMINA_TEAM: LuminaProfessional[] = [
  {
    id: "sara",
    name: "Sara Menezes",
    role: "Coordenadora de experiência (demo)",
    bio: "Acolhe clientes e orienta o percurso na clínica. Personagem e função exclusivamente demonstrativas.",
    image: luminaImg(PHOTOS.portraitA, 800, "&h=1000&crop=faces"),
  },
  {
    id: "rita",
    name: "Rita Caldeira",
    role: "Consultora de tratamentos faciais (demo)",
    bio: "Apresenta rituais faciais e acompanhamento pós-visita fictício — sem credenciais reais.",
    image: luminaImg(PHOTOS.portraitB, 800, "&h=1000&crop=faces"),
  },
  {
    id: "diogo",
    name: "Diogo Vale",
    role: "Especialista de bem-estar (demo)",
    bio: "Focado em momentos de relaxamento e integração de protocolos demonstrativos de bem-estar.",
    image: luminaImg(PHOTOS.portraitC, 800, "&h=1000&crop=faces"),
  },
];

export const LUMINA_GALLERY: LuminaGalleryItem[] = [
  {
    id: "g1",
    alt: "Receção luminosa",
    src: luminaImg(PHOTOS.clinicalLight, 900, "&h=650&crop=entropy"),
    span: "wide",
  },
  {
    id: "g2",
    alt: "Sala de tratamento",
    src: luminaImg(PHOTOS.clinicalLight, 700, "&h=900"),
  },
  {
    id: "g3",
    alt: "Detalhe arquitetónico",
    src: luminaImg(PHOTOS.portraitD, 700, "&h=900&crop=entropy"),
  },
  {
    id: "g4",
    alt: "Zona de espera",
    src: luminaImg(PHOTOS.clinicalLight, 700, "&h=900&crop=faces"),
    span: "tall",
  },
  {
    id: "g5",
    alt: "Ambiente sereno",
    src: luminaImg(PHOTOS.portraitA, 900, "&h=650&crop=entropy"),
  },
  {
    id: "g6",
    alt: "Luz natural no atelier",
    src: luminaImg(PHOTOS.portraitB, 900, "&h=650"),
    span: "wide",
  },
];

export const LUMINA_TESTIMONIALS: LuminaTestimonial[] = [
  {
    id: "t1",
    quote:
      "«Ambiente muito sereno — utilizei só para perceber como seria marcar online numa clínica premium.»",
    author: "Mariana L. · cenário demonstrativo",
  },
  {
    id: "t2",
    quote:
      "«A navegação parece cuidada e calma; percebe-se o detalhe no espaçamento e nas fotografias.»",
    author: "Cliente fictício · demo Artecium",
  },
  {
    id: "t3",
    quote:
      "«Testemunho de exemplo para reunião comercial — não representa opiniões reais de pacientes.»",
    author: "Nota interna Lumina Lab",
  },
];

export const LUMINA_BEFORE_AFTER: LuminaBeforeAfterCase[] = [
  {
    id: "ba-facial",
    procedure: "Luminosidade facial (ilustração)",
    description:
      "Comparador editorial para apresentações comerciais. Ajuste tonal simula «antes» mais mate e «depois» mais luminoso — não documenta tratamento real.",
    image: luminaImg(PHOTOS.portraitA, 1400, "&h=900&crop=faces"),
    beforeImageClassName: "brightness-[0.92] saturate-[0.86] contrast-[0.98]",
    afterImageClassName: "brightness-[1.06] saturate-[1.08] contrast-[1.02]",
  },
  {
    id: "ba-textura",
    procedure: "Uniformização de tom (ilustração)",
    description:
      "Mesma imagem de referência em ambos os lados do slider. Destinado a mostrar a experiência de comparação, não a prometer resultados.",
    image: luminaImg(PHOTOS.portraitB, 1400, "&h=900&crop=faces"),
    beforeImageClassName: "brightness-[0.9] saturate-[0.84] contrast-[0.96]",
    afterImageClassName: "brightness-[1.05] saturate-[1.05] contrast-[1.03]",
  },
  {
    id: "ba-rejuvenescimento",
    procedure: "Rejuvenescimento suave (ilustração)",
    description:
      "Exemplo de narrativa «antes / depois» para reuniões. Personagem e evolução são fictícios e claramente demonstrativos.",
    image: luminaImg(PHOTOS.portraitA, 1400, "&h=900&crop=faces"),
    beforeImageClassName: "brightness-[0.91] contrast-[0.94] saturate-[0.85]",
    afterImageClassName: "brightness-[1.04] contrast-[1.04] saturate-[1.1]",
  },
];

export const LUMINA_CONTACT = {
  address: "Av. da Náutica 24, Cascais (endereço demonstrativo)",
  hours: "Seg–Sex 09:00–19:00 · Sáb 10:00–14:00 (horário fictício)",
  phone: "+351 210 000 000 (exemplo)",
  email: "rececao.demo@lumina-clinic.test",
};

export const LUMINA_TIME_SLOTS = [
  "09:00",
  "09:45",
  "10:30",
  "11:15",
  "12:00",
  "14:00",
  "14:45",
  "15:30",
  "16:15",
  "17:00",
  "18:00",
];