import { LumeStudioExperience } from "@/components/lab/lume-studio/LumeStudioExperience";
import { DM_Sans, Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-lume-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-lume-sans",
  display: "swap",
});

export const metadata = {
  title: "Lume Studio — Barbearia | Artecium Lab",
  description: "Demonstração comercial de marcação para barbearia contemporânea (dados fictícios).",
  robots: { index: false, follow: false },
};

export default function LumeStudioPrototypePage() {
  return (
    <div className={`${playfair.variable} ${dmSans.variable}`}>
      <LumeStudioExperience />
    </div>
  );
}