"use client";

import { LumeBookingModal } from "@/components/lab/lume-studio/LumeBookingModal";
import {
  LUME_ABOUT,
  LUME_BARBERS,
  LUME_BRAND,
  LUME_GALLERY,
  LUME_HERO_IMAGE,
  LUME_SERVICES,
} from "@prototypes/lume-studio/data";
import { motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useState } from "react";

function formatEuro(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function LumeStudioExperience() {
  const [bookingOpen, setBookingOpen] = useState(false);

  const openBooking = useCallback(() => setBookingOpen(true), []);

  return (
    <div className="bg-[#0c0b0a] text-[#f5f0e8] antialiased">
      {/* Hero */}
      <section className="relative min-h-[92dvh] overflow-hidden">
        <Image
          src={LUME_HERO_IMAGE}
          alt="Interior cinematográfico de barbearia"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#0c0b0a]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b0a] via-[#0c0b0a]/35 to-[#0c0b0a]/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c0b0a]/90 via-[#0c0b0a]/40 to-transparent" />

        <div className="relative mx-auto flex min-h-[92dvh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8 sm:pb-24">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-[11px] font-medium tracking-[0.32em] text-[#c9a66b] uppercase"
          >
            {LUME_BRAND.city} · {LUME_BRAND.district}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-4 font-[family-name:var(--font-lume-serif)] text-5xl font-medium leading-[1.02] tracking-tight text-[#faf6f0] sm:text-7xl lg:text-8xl"
          >
            {LUME_BRAND.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-lg font-[family-name:var(--font-lume-serif)] text-2xl text-[#e8e0d4]/95 sm:text-3xl"
          >
            {LUME_BRAND.headline}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="mt-4 max-w-md text-base leading-relaxed text-[#d6cfc4]/85"
          >
            {LUME_BRAND.tagline}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <button
              type="button"
              data-lume-cta-primary
              onClick={openBooking}
              className="rounded-full bg-[#c9a66b] px-8 py-3.5 text-sm font-semibold tracking-wide text-[#1a1206] shadow-[0_16px_48px_rgba(201,166,107,0.22)] transition-transform hover:scale-[1.02]"
            >
              Marcar experiência
            </button>
            <button
              type="button"
              onClick={() => scrollTo("espaco")}
              className="rounded-full border border-[#f5f0e8]/25 bg-[#0c0b0a]/30 px-8 py-3.5 text-sm font-medium text-[#f5f0e8] backdrop-blur-sm transition-colors hover:border-[#c9a66b]/50"
            >
              Conhecer o espaço
            </button>
          </motion.div>
        </div>
      </section>

      {/* Sobre */}
      <section id="espaco" className="border-t border-[#2a2420] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
              <Image
                src={LUME_ABOUT.images[0].src}
                alt={LUME_ABOUT.images[0].alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.28em] text-[#c9a66b] uppercase">O espaço</p>
              <h2 className="mt-3 font-[family-name:var(--font-lume-serif)] text-4xl text-[#faf6f0] sm:text-5xl">
                Filosofia Lume
              </h2>
              <p className="mt-6 text-base leading-relaxed text-[#a8a29e]">{LUME_ABOUT.philosophy}</p>
              <p className="mt-4 text-base leading-relaxed text-[#a8a29e]">{LUME_ABOUT.atmosphere}</p>
            </div>
          </div>
          <div className="mt-20 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="lg:order-2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                <Image
                  src={LUME_ABOUT.images[1].src}
                  alt={LUME_ABOUT.images[1].alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
            <div className="lg:order-1">
              <h3 className="font-[family-name:var(--font-lume-serif)] text-3xl text-[#faf6f0]">Ambiente & identidade</h3>
              <p className="mt-4 text-sm leading-relaxed text-[#a8a29e]">
                Materiais naturais, espelhos amplos e uma banda sonora discreta. Cada visita é pensada como um
                capítulo — luz, textura e tempo dedicado só a ti.
              </p>
              <p className="mt-6 border-l-2 border-[#c9a66b]/60 pl-4 text-sm italic text-[#d6cfc4]">
                Dados e preços nesta página são demonstrativos (Artecium Lab).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="border-t border-[#2a2420] bg-[#0f0e0c] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <p className="text-[10px] font-semibold tracking-[0.28em] text-[#c9a66b] uppercase">Serviços</p>
            <h2 className="mt-3 font-[family-name:var(--font-lume-serif)] text-4xl text-[#faf6f0] sm:text-5xl">
              Rituais de grooming
            </h2>
          </div>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {LUME_SERVICES.map((service, i) => (
              <motion.li
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.05 }}
                className="group flex flex-col overflow-hidden rounded-sm border border-[#2a2420] bg-[#141210]"
              >
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141210] via-transparent to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-[family-name:var(--font-lume-serif)] text-xl text-[#faf6f0]">{service.name}</h3>
                    <span className="text-lg text-[#c9a66b]">{formatEuro(service.priceEuro)}</span>
                  </div>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[#a8a29e]">{service.description}</p>
                  <p className="mt-3 text-xs text-[#78716c]">{service.durationMin} minutos</p>
                  <button
                    type="button"
                    onClick={openBooking}
                    className="mt-5 w-full rounded-full border border-[#c9a66b]/40 py-2.5 text-sm font-medium text-[#c9a66b] transition-colors hover:bg-[#c9a66b]/10"
                  >
                    Reservar
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Equipa */}
      <section id="equipa" className="border-t border-[#2a2420] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-semibold tracking-[0.28em] text-[#c9a66b] uppercase">Equipa</p>
          <h2 className="mt-3 font-[family-name:var(--font-lume-serif)] text-4xl text-[#faf6f0]">Os barbeiros</h2>
          <ul className="mt-12 grid gap-8 sm:grid-cols-3">
            {LUME_BARBERS.map((barber) => (
              <li key={barber.id} className="text-center sm:text-left">
                <div className="relative mx-auto aspect-[3/4] max-w-xs overflow-hidden rounded-sm sm:mx-0">
                  <Image
                    src={barber.image}
                    alt={barber.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 80vw, 33vw"
                  />
                </div>
                <h3 className="mt-5 font-[family-name:var(--font-lume-serif)] text-2xl text-[#faf6f0]">{barber.name}</h3>
                <p className="mt-1 text-sm text-[#c9a66b]">{barber.specialty}</p>
                <p className="mt-3 text-sm leading-relaxed text-[#a8a29e]">{barber.bio}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Galeria */}
      <section id="galeria" className="border-t border-[#2a2420] bg-[#0f0e0c] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-semibold tracking-[0.28em] text-[#c9a66b] uppercase">Galeria</p>
          <h2 className="mt-3 font-[family-name:var(--font-lume-serif)] text-4xl text-[#faf6f0]">Luz, textura, detalhe</h2>
          <div className="mt-12 columns-2 gap-3 sm:columns-3 lg:gap-4">
            {LUME_GALLERY.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="mb-3 break-inside-avoid overflow-hidden rounded-sm lg:mb-4"
              >
                <motion.div whileHover={{ scale: 1.02 }} className="relative w-full" style={{ minHeight: item.span === "tall" ? 320 : 200 }}>
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={800}
                    height={item.span === "tall" ? 1000 : 600}
                    className="h-auto w-full object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-[#2a2420] px-5 py-24 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-[family-name:var(--font-lume-serif)] text-4xl text-[#faf6f0] sm:text-5xl">
            Vive a experiência Lume
          </h2>
          <p className="mt-4 text-[#a8a29e]">Marcação demonstrativa · sem compromisso · sem dados reais</p>
          <button
            type="button"
            onClick={openBooking}
            className="mt-8 rounded-full bg-[#c9a66b] px-10 py-4 text-sm font-semibold text-[#1a1206]"
          >
            Marcar experiência
          </button>
        </motion.div>
      </section>

      <LumeBookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
}