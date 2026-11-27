export type PrototypeStatus = "ready" | "draft" | "archived";

export type PrototypeEntry = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  href: `/prototypes/${string}`;
  status: PrototypeStatus;
  tags: string[];
};

export const prototypeRegistry: PrototypeEntry[] = [
  {
    slug: "lumina-clinic",
    title: "Lumina Clinic",
    subtitle: "Clínica de estética contemporânea",
    description:
      "Homepage editorial em tons marfim e verde-sálvia, galeria do espaço e marcação demonstrativa sem dados de saúde.",
    href: "/prototypes/lumina-clinic",
    status: "ready",
    tags: ["booking", "comercial", "clínica"],
  },
  {
    slug: "lume-studio",
    title: "Lume Studio",
    subtitle: "Barbearia contemporânea",
    description:
      "Barbearia premium com narrativa visual, galeria editorial e marcação demonstrativa em modal multi-etapas.",
    href: "/prototypes/lume-studio",
    status: "ready",
    tags: ["booking", "comercial", "barbearia"],
  },
];