"use client";

import {
  LUMINA_TEAM,
  LUMINA_TIME_SLOTS,
  LUMINA_TREATMENTS,
  type LuminaProfessional,
  type LuminaTreatment,
} from "@prototypes/lumina-clinic/data";
import { labSafeSendEmail } from "@/lib/lab/mock-providers";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

export type LuminaBookingStep =
  | "treatment"
  | "professional"
  | "date"
  | "time"
  | "details"
  | "review"
  | "confirmed";

type BookingDraft = {
  treatment?: LuminaTreatment;
  professional?: LuminaProfessional;
  date?: string;
  time?: string;
  name: string;
  email: string;
  phone: string;
};

const FLOW_STEPS: { id: LuminaBookingStep; label: string }[] = [
  { id: "treatment", label: "Tratamento" },
  { id: "professional", label: "Profissional" },
  { id: "date", label: "Data" },
  { id: "time", label: "Hora" },
  { id: "details", label: "Contacto" },
  { id: "review", label: "Rever" },
];

function formatEuro(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDisplayDate(iso: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${iso}T12:00:00`));
}

function buildCalendarDays(count: number) {
  const rows: { iso: string; day: number; weekday: string; isToday: boolean }[] = [];
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const weekdayFmt = new Intl.DateTimeFormat("pt-PT", { weekday: "short" });

  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    rows.push({
      iso,
      day: d.getDate(),
      weekday: weekdayFmt.format(d),
      isToday: iso === todayIso,
    });
  }
  return rows;
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export function LuminaBookingModal({ open, onClose }: Props) {
  const [step, setStep] = useState<LuminaBookingStep>("treatment");
  const [draft, setDraft] = useState<BookingDraft>({
    name: "Ana Demo",
    email: "cliente.demo@lumina-clinic.test",
    phone: "+351 912 000 000",
  });
  const [confirmationId, setConfirmationId] = useState<string | null>(null);

  const calendarDays = useMemo(() => buildCalendarDays(21), []);

  const reset = useCallback(() => {
    setStep("treatment");
    setDraft({
      name: "Ana Demo",
      email: "cliente.demo@lumina-clinic.test",
      phone: "+351 912 000 000",
    });
    setConfirmationId(null);
  }, []);

  const close = () => {
    onClose();
    setTimeout(reset, 400);
  };

  const stepIndex = FLOW_STEPS.findIndex((s) => s.id === step);
  const progress =
    step === "confirmed" ? 100 : Math.round(((stepIndex + 1) / FLOW_STEPS.length) * 100);

  const goBack = () => {
    const order = [...FLOW_STEPS.map((s) => s.id), "confirmed" as const];
    const i = order.indexOf(step);
    if (i > 0) setStep(order[i - 1] as LuminaBookingStep);
  };

  const confirm = async () => {
    await labSafeSendEmail({
      to: draft.email,
      subject: "Lumina Clinic — demonstração",
      html: "<p>Mock</p>",
    });
    const suffix = Date.now().toString(36).toUpperCase().slice(-4);
    setConfirmationId(`LUMINA-DEMO-${suffix}`);
    setStep("confirmed");
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[250] flex items-end justify-center bg-[#2c3428]/35 p-0 backdrop-blur-md sm:items-center sm:p-4"
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Marcação Lumina Clinic"
            data-lumina-booking-modal
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[min(94dvh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-[#e0dbd2] bg-[#faf8f5] shadow-[0_32px_80px_rgba(44,52,40,0.18)] sm:rounded-3xl"
          >
            <header className="shrink-0 border-b border-[#e8e2d8] px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.22em] text-[#7d8c6e] uppercase">
                    Marcação demonstração
                  </p>
                  <p className="mt-1 text-sm text-[#6b7465]">
                    {step === "confirmed"
                      ? "Pedido concluído"
                      : `Etapa ${Math.min(stepIndex + 1, 6)} · ${FLOW_STEPS[stepIndex]?.label ?? ""}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e0dbd2] text-[#5c6558] transition-colors hover:bg-[#f0ebe3]"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#ebe6de]">
                <motion.div
                  className="h-full rounded-full bg-[#8a9a7b]"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {step === "treatment" && (
                    <>
                      <StepTitle
                        title="Escolher tratamento"
                        subtitle="Imagens e descrições são exclusivamente demonstrativas."
                      />
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {LUMINA_TREATMENTS.map((treatment) => (
                          <button
                            key={treatment.id}
                            type="button"
                            data-lumina-treatment-card
                            onClick={() => {
                              setDraft((d) => ({ ...d, treatment }));
                              setStep("professional");
                            }}
                            className="group overflow-hidden rounded-2xl border border-[#e8e2d8] bg-white text-left transition-all hover:border-[#8a9a7b]/60 hover:shadow-[0_12px_36px_rgba(44,52,40,0.08)]"
                          >
                            <div className="relative h-32 w-full">
                              <Image
                                src={treatment.image}
                                alt=""
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                sizes="(max-width: 640px) 100vw, 320px"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                            </div>
                            <div className="p-4">
                              <p className="text-[10px] tracking-wide text-[#8a9a7b] uppercase">
                                {treatment.category}
                              </p>
                              <div className="mt-1 flex items-start justify-between gap-2">
                                <h3 className="font-[family-name:var(--font-lumina-serif)] text-lg text-[#2c3428]">
                                  {treatment.name}
                                </h3>
                                <span className="text-sm font-medium text-[#5c6558]">
                                  {formatEuro(treatment.priceEuro)}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#6b7465]">
                                {treatment.description}
                              </p>
                              <p className="mt-2 text-[10px] text-[#9ca393] uppercase">
                                {treatment.durationMin} min
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {step === "professional" && (
                    <>
                      <StepTitle
                        title="Escolher profissional"
                        subtitle="Perfis fictícios — sem credenciais médicas reais."
                      />
                      <ul className="mt-5 space-y-3">
                        {LUMINA_TEAM.map((professional) => (
                          <li key={professional.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setDraft((d) => ({ ...d, professional }));
                                setStep("date");
                              }}
                              className="flex w-full gap-4 overflow-hidden rounded-2xl border border-[#e8e2d8] bg-white p-3 text-left transition-colors hover:border-[#8a9a7b]/50"
                            >
                              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl">
                                <Image
                                  src={professional.image}
                                  alt={professional.name}
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                />
                              </div>
                              <div className="min-w-0 py-1">
                                <p className="font-[family-name:var(--font-lumina-serif)] text-lg text-[#2c3428]">
                                  {professional.name}
                                </p>
                                <p className="text-xs text-[#7d8c6e]">{professional.role}</p>
                                <p className="mt-1 line-clamp-2 text-xs text-[#6b7465]">
                                  {professional.bio}
                                </p>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {step === "date" && (
                    <>
                      <StepTitle title="Selecionar data" subtitle="Calendário demonstrativo — 3 semanas." />
                      <div
                        className="mt-5 rounded-2xl border border-[#e8e2d8] bg-white p-4"
                        data-lumina-calendar
                      >
                        <p className="mb-3 text-center text-xs font-medium tracking-[0.2em] text-[#8a9a7b] uppercase">
                          {new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" }).format(
                            new Date(),
                          )}
                        </p>
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                          {calendarDays.map((day) => (
                            <button
                              key={day.iso}
                              type="button"
                              onClick={() => {
                                setDraft((d) => ({ ...d, date: day.iso }));
                                setStep("time");
                              }}
                              className={`flex flex-col items-center rounded-xl border px-2 py-3 transition-colors ${
                                draft.date === day.iso
                                  ? "border-[#8a9a7b] bg-[#8a9a7b]/12 text-[#2c3428]"
                                  : "border-[#ebe6de] text-[#3d4a3f] hover:border-[#8a9a7b]/40"
                              } ${day.isToday ? "ring-1 ring-[#8a9a7b]/35" : ""}`}
                            >
                              <span className="text-[10px] text-[#9ca393]">{day.weekday}</span>
                              <span className="mt-1 text-lg font-medium">{day.day}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {step === "time" && (
                    <>
                      <StepTitle
                        title="Selecionar horário"
                        subtitle={draft.date ? formatDisplayDate(draft.date) : ""}
                      />
                      <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {LUMINA_TIME_SLOTS.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              setDraft((d) => ({ ...d, time: slot }));
                              setStep("details");
                            }}
                            className={`rounded-xl border py-3 text-sm font-medium transition-all ${
                              draft.time === slot
                                ? "border-[#8a9a7b] bg-[#8a9a7b]/12 text-[#2c3428]"
                                : "border-[#ebe6de] text-[#3d4a3f] hover:border-[#8a9a7b]/40"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {step === "details" && (
                    <>
                      <StepTitle
                        title="Dados de contacto"
                        subtitle="Apenas nome, email e telemóvel. Sem dados de saúde."
                      />
                      <div className="mt-5 space-y-4">
                        {(
                          [
                            ["name", "Nome"],
                            ["email", "Email"],
                            ["phone", "Telemóvel"],
                          ] as const
                        ).map(([key, label]) => (
                          <label key={key} className="block">
                            <span className="text-xs text-[#6b7465]">{label}</span>
                            <input
                              className="mt-1.5 w-full rounded-xl border border-[#e0dbd2] bg-[#faf8f5] px-4 py-3 text-sm text-[#2c3428] outline-none focus:border-[#8a9a7b]/60 focus:ring-2 focus:ring-[#8a9a7b]/15"
                              value={draft[key]}
                              onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                              autoComplete={
                                key === "email" ? "email" : key === "phone" ? "tel" : "name"
                              }
                            />
                          </label>
                        ))}
                        <button
                          type="button"
                          onClick={() => setStep("review")}
                          className="w-full rounded-full bg-[#8a9a7b] py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
                        >
                          Rever marcação
                        </button>
                      </div>
                    </>
                  )}

                  {step === "review" && draft.treatment && draft.professional && (
                    <>
                      <StepTitle title="Rever marcação" subtitle="Confirmação apenas demonstrativa." />
                      <div className="mt-5 overflow-hidden rounded-2xl border border-[#e8e2d8] bg-white">
                        <div className="relative h-40">
                          <Image
                            src={draft.treatment.image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="640px"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-white/95 to-transparent" />
                          <div className="absolute bottom-4 left-4">
                            <p className="font-[family-name:var(--font-lumina-serif)] text-2xl text-[#2c3428]">
                              {draft.treatment.name}
                            </p>
                            <p className="text-sm text-[#6b7465]">{formatEuro(draft.treatment.priceEuro)}</p>
                          </div>
                        </div>
                        <dl className="divide-y divide-[#ebe6de] p-4 text-sm">
                          <ReviewRow label="Profissional" value={draft.professional.name} />
                          <ReviewRow
                            label="Quando"
                            value={`${draft.date ? formatDisplayDate(draft.date) : "—"} · ${draft.time ?? "—"}`}
                          />
                          <ReviewRow label="Contacto" value={draft.name} />
                        </dl>
                      </div>
                      <button
                        type="button"
                        data-lumina-confirm
                        onClick={() => void confirm()}
                        className="mt-6 w-full rounded-full bg-[#2c3428] py-3.5 text-sm font-semibold text-[#faf8f5]"
                      >
                        Confirmar demonstração
                      </button>
                    </>
                  )}

                  {step === "confirmed" && (
                    <div className="py-4 text-center" data-lumina-confirmation>
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#8a9a7b]/40 bg-[#8a9a7b]/10"
                      >
                        <svg className="h-10 w-10 text-[#7d8c6e]" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path
                            d="M5 13l4 4L19 7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </motion.div>
                      <h3 className="mt-6 font-[family-name:var(--font-lumina-serif)] text-3xl text-[#2c3428]">
                        Consulta registada (demo)
                      </h3>
                      <p className="mt-2 text-sm text-[#6b7465]">
                        Artecium Lab — sem reserva real, sem email enviado, sem dados clínicos.
                      </p>
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                        className="mx-auto mt-8 max-w-sm rounded-2xl border border-[#e8e2d8] bg-white p-5 text-left text-sm"
                      >
                        <p className="text-[#7d8c6e]">{draft.treatment?.name}</p>
                        <p className="mt-1 text-[#2c3428]">{draft.professional?.name}</p>
                        <p className="mt-2 text-[#6b7465]">
                          {draft.date && formatDisplayDate(draft.date)} · {draft.time}
                        </p>
                        <p className="mt-4 font-mono text-xs text-[#9ca393]">Ref. {confirmationId}</p>
                      </motion.div>
                      <button
                        type="button"
                        onClick={close}
                        className="mt-8 rounded-full border border-[#d5cfc6] px-8 py-3 text-sm text-[#5c6558]"
                      >
                        Fechar
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {step !== "confirmed" && step !== "treatment" && (
              <footer className="shrink-0 border-t border-[#e8e2d8] px-5 py-3 sm:px-6">
                <button
                  type="button"
                  onClick={goBack}
                  className="text-xs font-medium text-[#7d8c6e] hover:text-[#2c3428]"
                >
                  ← Voltar
                </button>
              </footer>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="font-[family-name:var(--font-lumina-serif)] text-2xl text-[#2c3428] sm:text-3xl">
        {title}
      </h2>
      {subtitle ? <p className="mt-1.5 text-sm text-[#6b7465]">{subtitle}</p> : null}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-[#9ca393]">{label}</dt>
      <dd className="text-right font-medium text-[#2c3428]">{value}</dd>
    </div>
  );
}