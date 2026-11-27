export type LumeService = {
  id: string;
  name: string;
  durationMin: number;
  priceEuro: number;
  description: string;
  image: string;
};

export type LumeBarber = {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  image: string;
};

export type LumeGalleryItem = {
  id: string;
  alt: string;
  src: string;
  span?: "wide" | "tall";
};

/** Verified Unsplash IDs (auto=format&fit=crop) — demonstração apenas. */
function lumeImg(photoId: string, width: number, extra = "") {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=80${extra}`;
}

const PHOTOS = {
  interiorWide: "1556228720-195a672e8a03",
  barberAction: "1560250097-0b93528c311a",
  haircutDetail: "1622286342621-4bd786c2447c",
  fadeStyle: "1621605815971-fbc98d665033",
  portraitA: "1507003211169-0a1dd7228f2d",
  portraitB: "1506794778202-cad84cf45f1d",
} as const;

export const LUME_BRAND = {
  name: "LUME STUDIO",
  city: "Lisboa",
  district: "Príncipe Real",
  headline: "O teu estilo. A tua assinatura.",
  tagline:
    "Barbearia contemporânea onde precisão, silêncio e ritual de cuidado masculino criam uma experiência memorável.",
};

export const LUME_HERO_IMAGE = lumeImg(PHOTOS.interiorWide, 1920, "&h=1200");

export const LUME_ABOUT = {
  philosophy:
    "Na Lume Studio acreditamos que um corte é mais do que estética — é presença, confiança e tempo bem gasto. Luz quente, texturas naturais e um atendimento sem pressa.",
  atmosphere:
    "Interior em carvão e creme, cadeiras em couro, ferramentas japonesas e uma equipa obcecada pelo detalhe.",
  images: [
    {
      src: lumeImg(PHOTOS.barberAction, 1200, "&h=1400"),
      alt: "Espelhos e iluminação âmbar no salão",
    },
    {
      src: lumeImg(PHOTOS.interiorWide, 1200, "&h=1400"),
      alt: "Cadeiras de barbeiro em couro preto",
    },
  ],
};

export const LUME_SERVICES: LumeService[] = [
  {
    id: "corte-classico",
    name: "Corte clássico",
    durationMin: 40,
    priceEuro: 28,
    description: "Silhueta atemporal, acabamento tesoura e styling à mão.",
    image: lumeImg(PHOTOS.haircutDetail, 800, "&h=1000"),
  },
  {
    id: "skin-fade",
    name: "Skin Fade",
    durationMin: 50,
    priceEuro: 34,
    description: "Degradé zero, linhas limpas e textura com movimento.",
    image: lumeImg(PHOTOS.fadeStyle, 800, "&h=1000"),
  },
  {
    id: "corte-barba",
    name: "Corte + Barba",
    durationMin: 70,
    priceEuro: 48,
    description: "Corte completo com contorno de barba e hidratação final.",
    image: lumeImg(PHOTOS.barberAction, 800, "&h=1000"),
  },
  {
    id: "tratamento-barba",
    name: "Tratamento de barba",
    durationMin: 35,
    priceEuro: 26,
    description: "Toalha quente, óleos nutritivos e navalha para definir.",
    image: lumeImg(PHOTOS.haircutDetail, 800, "&h=1000&crop=entropy"),
  },
  {
    id: "experiencia-completa",
    name: "Experiência completa",
    durationMin: 90,
    priceEuro: 68,
    description: "Ritual Lume — corte, barba, scalp massage e fragrância.",
    image: lumeImg(PHOTOS.interiorWide, 800, "&h=1000"),
  },
];

export const LUME_BARBERS: LumeBarber[] = [
  {
    id: "miguel",
    name: "Miguel Alves",
    specialty: "Skin fade · linhas gráficas",
    bio: "Director criativo com olhar editorial e 12 anos em salões premium.",
    image: lumeImg(PHOTOS.portraitA, 800, "&h=1000"),
  },
  {
    id: "tiago",
    name: "Tiago Ferreira",
    specialty: "Barba clássica · navalha",
    bio: "Rituais de barba e texturas naturais para rostos com personalidade.",
    image: lumeImg(PHOTOS.portraitB, 800, "&h=1000"),
  },
  {
    id: "andre",
    name: "André Costa",
    specialty: "Corte clássico · styling",
    bio: "Precisão discreta e consultoria de imagem para o dia a dia.",
    image: lumeImg(PHOTOS.barberAction, 800, "&h=1000&crop=faces"),
  },
];

export const LUME_TIME_SLOTS = [
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
  "18:45",
];

export const LUME_GALLERY: LumeGalleryItem[] = [
  {
    id: "g1",
    alt: "Fade preciso com textura",
    src: lumeImg(PHOTOS.fadeStyle, 900, "&h=800"),
    span: "wide",
  },
  {
    id: "g2",
    alt: "Barba alinhada com navalha",
    src: lumeImg(PHOTOS.haircutDetail, 700, "&h=900"),
  },
  {
    id: "g3",
    alt: "Interior Lume com luz quente",
    src: lumeImg(PHOTOS.interiorWide, 700, "&h=900"),
  },
  {
    id: "g4",
    alt: "Ferramentas de grooming",
    src: lumeImg(PHOTOS.haircutDetail, 700, "&h=900&crop=entropy"),
  },
  {
    id: "g5",
    alt: "Cliente no espelho",
    src: lumeImg(PHOTOS.barberAction, 700, "&h=1100"),
    span: "tall",
  },
  {
    id: "g6",
    alt: "Corte masculino em progresso",
    src: lumeImg(PHOTOS.fadeStyle, 900, "&h=800&crop=faces"),
  },
  {
    id: "g7",
    alt: "Detalhe de styling",
    src: lumeImg(PHOTOS.portraitA, 700, "&h=900"),
  },
  {
    id: "g8",
    alt: "Ambiente do salão à noite",
    src: lumeImg(PHOTOS.interiorWide, 900, "&h=700"),
    span: "wide",
  },
];