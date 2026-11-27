import { LuminaClinicExperience } from "@/components/lab/lumina-clinic/LuminaClinicExperience";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";

const luminaSerif = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-lumina-serif",
  display: "swap",
  weight: ["400", "500", "600"],
});

const luminaSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-lumina-sans",
  display: "swap",
});

export const metadata = {
  title: "Lumina Clinic — Estética | Artecium Lab",
  description:
    "Demonstração comercial de clínica de estética contemporânea com marcação multi-etapas (dados fictícios).",
  robots: { index: false, follow: false },
};

export default function LuminaClinicPrototypePage() {
  return (
    <div
      className={`${luminaSerif.variable} ${luminaSans.variable} font-[family-name:var(--font-lumina-sans)]`}
    >
      <LuminaClinicExperience />
    </div>
  );
}