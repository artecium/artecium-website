"use client";

import { LuminaBeforeAfterSection } from "@/components/lab/lumina-clinic/LuminaBeforeAfterSection";
import { LuminaBookingModal } from "@/components/lab/lumina-clinic/LuminaBookingModal";
import {
  LUMINA_ABOUT,
  LUMINA_BRAND,
  LUMINA_CONTACT,
  LUMINA_GALLERY,
  LUMINA_HERO_IMAGE,
  LUMINA_TEAM,
  LUMINA_TESTIMONIALS,
  LUMINA_TREATMENTS,
} from "@prototypes/lumina-clinic/data";
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

export function LuminaClinicExperience() {
  const [bookingOpen, setBookingOpen] = useState(false);

  const openBooking = useCallback(() => setBookingOpen(true), []);

  return (
    <div className="bg-[#f7f4ef] text-[#2c3428] antialiased">
      {/* Hero */}
      <section className="relative min-h-[88dvh] overflow-hidden">
        <Image
          src={LUMINA_HERO_IMAGE}
          alt="Espaço clínico luminoso (demonstração)"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#f7f4ef]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f7f4ef] via-[#f7f4ef]/30 to-[#f7f4ef]/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f7f4ef]/95 via-[#f7f4ef]/55 to-transparent" />

        <div className="relative mx-auto flex min-h-[88dvh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8 sm:pb-24">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] font-medium tracking-[0.3em] text-[#7d8c6e] uppercase"
          >
            {LUMINA_BRAND.city} · {LUMINA_BRAND.district}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="mt-4 max-w-3xl font-[family-name:var(--font-lumina-serif)] text-4xl font-medium leading-[1.08] text-[#2c3428] sm:text-6xl lg:text-7xl"
          >
            {LUMINA_BRAND.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-6 max-w-xl font-[family-name:var(--font-lumina-serif)] text-2xl text-[#3d4a3f] sm:text-3xl"
          >
            {LUMINA_BRAND.headline}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-4 max-w-lg text-base leading-relaxed text-[#5c6558]"
          >
            {LUMINA_BRAND.tagline}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <button
              type="button"
              onClick={() => scrollTo("tratamentos")}
              className="rounded-full border border-[#c8c2b8] bg-white/80 px-8 py-3.5 text-sm font-medium text-[#2c3428] backdrop-blur-sm transition-colors hover:border-[#8a9a7b]/50"
            >
              Conhecer tratamentos
            </button>
            <button
              type="button"
              data-lumina-cta-primary
              onClick={openBooking}
              className="rounded-full bg-[#8a9a7b] px-8 py-3.5 text-sm font-semibold tracking-wide text-white shadow-[0_16px_48px_rgba(138,154,123,0.25)] transition-transform hover:scale-[1.01]"
            >
              Marcar consulta
            </button>
          </motion.div>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="border-t border-[#e8e2d8] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="text-[10px] font-semibold tracking-[0.26em] text-[#8a9a7b] uppercase">
                Sobre a clínica
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-lumina-serif)] text-4xl text-[#2c3428] sm:text-5xl">
                Lumina, em poucas palavras
              </h2>
              <p className="mt-6 text-base leading-relaxed text-[#5c6558]">{LUMINA_ABOUT.intro}</p>
              <p className="mt-4 text-base leading-relaxed text-[#5c6558]">{LUMINA_ABOUT.philosophy}</p>
              <p className="mt-8 border-l-2 border-[#8a9a7b]/50 pl-4 text-sm italic text-[#6b7465]">
                Conteúdo, preços e equipa nesta página são fictícios (Artecium Lab).
              </p>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm lg:col-span-7">
              <Image
                src={LUMINA_ABOUT.image}
                alt={LUMINA_ABOUT.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tratamentos */}
      <section id="tratamentos" className="border-t border-[#e8e2d8] bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold tracking-[0.26em] text-[#8a9a7b] uppercase">
              Tratamentos
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-lumina-serif)] text-4xl text-[#2c3428] sm:text-5xl">
              Categorias demonstrativas
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#6b7465]">
              Serviços e valores de exemplo — não representam oferta clínica real.
            </p>
          </div>

          <ul className="mt-14 space-y-16">
            {LUMINA_TREATMENTS.map((treatment, i) => (
              <motion.li
                key={treatment.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-14 ${
                  i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="relative aspect-[5/4] overflow-hidden rounded-sm">
                  <Image
                    src={treatment.image}
                    alt={treatment.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div>
                  <p className="text-xs tracking-wide text-[#8a9a7b] uppercase">{treatment.category}</p>
                  <h3 className="mt-2 font-[family-name:var(--font-lumina-serif)] text-3xl text-[#2c3428]">
                    {treatment.name}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-[#5c6558]">{treatment.description}</p>
                  <p className="mt-4 text-sm text-[#6b7465]">
                    <span className="font-medium text-[#2c3428]">{formatEuro(treatment.priceEuro)}</span>
                    {" · "}
                    {treatment.durationMin} min
                  </p>
                  <button
                    type="button"
                    onClick={openBooking}
                    className="mt-6 rounded-full border border-[#8a9a7b]/50 px-6 py-2.5 text-sm font-medium text-[#5c6558] transition-colors hover:bg-[#8a9a7b]/10"
                  >
                    Marcar (demo)
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      <LuminaBeforeAfterSection />

      {/* Equipa */}
      <section id="equipa" className="border-t border-[#e8e2d8] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-semibold tracking-[0.26em] text-[#8a9a7b] uppercase">Equipa</p>
          <h2 className="mt-3 font-[family-name:var(--font-lumina-serif)] text-4xl text-[#2c3428]">
            Acompanhamento (demo)
          </h2>
          <ul className="mt-12 grid gap-10 sm:grid-cols-3">
            {LUMINA_TEAM.map((member) => (
              <li key={member.id}>
                <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-[#ebe6de]">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 80vw, 33vw"
                  />
                </div>
                <h3 className="mt-5 font-[family-name:var(--font-lumina-serif)] text-2xl text-[#2c3428]">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm text-[#7d8c6e]">{member.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-[#5c6558]">{member.bio}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Espaço */}
      <section id="espaco" className="border-t border-[#e8e2d8] bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-semibold tracking-[0.26em] text-[#8a9a7b] uppercase">Espaço</p>
          <h2 className="mt-3 font-[family-name:var(--font-lumina-serif)] text-4xl text-[#2c3428]">
            Luz, calma e detalhe
          </h2>
          <div className="mt-12 columns-2 gap-3 sm:columns-3 lg:gap-4">
            {LUMINA_GALLERY.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="mb-3 break-inside-avoid overflow-hidden rounded-sm lg:mb-4"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={800}
                  height={item.span === "tall" ? 1000 : 600}
                  className="h-auto w-full object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testemunhos */}
      <section id="testemunhos" className="border-t border-[#e8e2d8] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-semibold tracking-[0.26em] text-[#8a9a7b] uppercase">
            Testemunhos
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-lumina-serif)] text-4xl text-[#2c3428]">
            Notas demonstrativas
          </h2>
          <p className="mt-2 text-sm text-[#6b7465]">
            Não são opiniões reais de pacientes.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-3">
            {LUMINA_TESTIMONIALS.map((t) => (
              <li
                key={t.id}
                className="rounded-2xl border border-[#e8e2d8] bg-[#faf8f5] p-6"
              >
                <p className="text-sm leading-relaxed text-[#3d4a3f]">{t.quote}</p>
                <p className="mt-4 text-xs font-medium text-[#8a9a7b]">{t.author}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contactos */}
      <section id="contactos" className="border-t border-[#e8e2d8] bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.26em] text-[#8a9a7b] uppercase">
              Contactos
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-lumina-serif)] text-4xl text-[#2c3428]">
              Visita demonstrativa
            </h2>
            <dl className="mt-8 space-y-4 text-sm text-[#5c6558]">
              <div>
                <dt className="text-xs text-[#9ca393] uppercase">Morada</dt>
                <dd className="mt-1">{LUMINA_CONTACT.address}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#9ca393] uppercase">Horário</dt>
                <dd className="mt-1">{LUMINA_CONTACT.hours}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#9ca393] uppercase">Telefone</dt>
                <dd className="mt-1">{LUMINA_CONTACT.phone}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#9ca393] uppercase">Email</dt>
                <dd className="mt-1">{LUMINA_CONTACT.email}</dd>
              </div>
            </dl>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col justify-center rounded-2xl border border-[#e8e2d8] bg-[#f7f4ef] p-8 text-center sm:p-10"
          >
            <h3 className="font-[family-name:var(--font-lumina-serif)] text-2xl text-[#2c3428]">
              Marcação em poucos passos
            </h3>
            <p className="mt-3 text-sm text-[#6b7465]">
              Experiência visual premium — sem dados de saúde nem reservas reais.
            </p>
            <button
              type="button"
              onClick={openBooking}
              className="mt-8 rounded-full bg-[#2c3428] px-10 py-3.5 text-sm font-semibold text-[#faf8f5]"
            >
              Marcar consulta
            </button>
          </motion.div>
        </div>
      </section>

      <LuminaBookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
}