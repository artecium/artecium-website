"use client";

import { BeforeAfterSlider } from "@/components/lab/BeforeAfterSlider";
import { LUMINA_BEFORE_AFTER } from "@prototypes/lumina-clinic/data";
import { motion } from "framer-motion";

export function LuminaBeforeAfterSection() {
  return (
    <section id="antes-depois" className="border-t border-[#e8e2d8] bg-[#f7f4ef] px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold tracking-[0.26em] text-[#8a9a7b] uppercase">
            Comparador
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-lumina-serif)] text-4xl text-[#2c3428] sm:text-5xl">
            Antes &amp; depois
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#6b7465]">
            Exemplos ilustrativos com a mesma fotografia base e tratamento tonal para simular evolução
            —{" "}
            <span className="font-medium text-[#5c6558]">não são resultados clínicos reais</span> nem
            casos de pacientes da Lumina Clinic. Arrasta o divisor para comparar.
          </p>
        </div>

        <ul className="mt-14 space-y-20">
          {LUMINA_BEFORE_AFTER.map((item, i) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.04 }}
              className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-10"
            >
              <div className="lg:col-span-8">
                <BeforeAfterSlider
                  beforeSrc={item.image}
                  afterSrc={item.image}
                  beforeAlt={`Antes — ${item.procedure} (demonstração)`}
                  afterAlt={`Depois — ${item.procedure} (demonstração)`}
                  beforeImageClassName={item.beforeImageClassName}
                  afterImageClassName={item.afterImageClassName}
                />
              </div>
              <div className="lg:col-span-4 lg:pt-6">
                <p className="text-[10px] font-medium tracking-[0.2em] text-[#9ca393] uppercase">
                  Ilustração · demo
                </p>
                <h3 className="mt-2 font-[family-name:var(--font-lumina-serif)] text-2xl text-[#2c3428]">
                  {item.procedure}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#5c6558]">{item.description}</p>
                <p className="mt-4 border-l-2 border-[#8a9a7b]/40 pl-3 text-xs leading-relaxed text-[#6b7465] italic">
                  Conteúdo demonstrativo Artecium Lab — sem promessa de resultados.
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}