"use client";

import {
  LUME_BARBERS,
  LUME_SERVICES,
  LUME_TIME_SLOTS,
  type LumeBarber,
  type LumeService,
} from "@prototypes/lume-studio/data";
import { labSafeSendEmail } from "@/lib/lab/mock-providers";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

export type BookingStep =
  | "service"
  | "barber"
  | "date"
  | "time"
  | "details"
  | "review"
  | "confirmed";

type BookingDraft = {
  service?: LumeService;
  barber?: LumeBarber;
  date?: string;
  time?: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
};

const FLOW_STEPS: { id: BookingStep; label: string }[] = [
  { id: "service", label: "Serviço" },
  { id: "barber", label: "Profissional" },
  { id: "date", label: "Data" },
  { id: "time", label: "Hora" },
  { id: "details", label: "Dados" },
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

export function LumeBookingModal({ open, onClose }: Props) {
  const [step, setStep] = useState<BookingStep>("service");
  const [draft, setDraft] = useState<BookingDraft>({
    name: "João Demo",
    email: "cliente.demo@lume-studio.test",
    phone: "+351 912 345 678",
    notes: "",
  });
  const [confirmationId, setConfirmationId] = useState<string | null>(null);

  const calendarDays = useMemo(() => buildCalendarDays(21), []);

  const reset = useCallback(() => {
    setStep("service");
    setDraft({
      name: "João Demo",
      email: "cliente.demo@lume-studio.test",
      phone: "+351 912 345 678",
      notes: "",
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
    if (i > 0) setStep(order[i - 1] as BookingStep);
  };

  const confirm = async () => {
    await labSafeSendEmail({
      to: draft.email,
      subject: "Lume Studio — demonstração",
      html: "<p>Mock</p>",
    });
    setConfirmationId(`LUME-${Date.now().toString(36).toUpperCase()}`);
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
          className="fixed inset-0 z-[250] flex items-end justify-center bg-[#0a0908]/80 p-0 backdrop-blur-md sm:items-center sm:p-4"
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Marcação Lume Studio"
            data-lume-booking-modal
            initial={{ y: 48, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[min(94dvh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-[#3d342c]/80 bg-[#12100e] shadow-[0_40px_120px_rgba(0,0,0,0.65)] sm:rounded-3xl"
          >
            <header className="shrink-0 border-b border-[#2a2420] px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.24em] text-[#c9a66b] uppercase">
                    Marcação demonstração
                  </p>
                  <p className="mt-1 text-sm text-[#e8e0d4]/70">
                    {step === "confirmed"
                      ? "Experiência concluída"
                      : `Etapa ${Math.min(stepIndex + 1, 6)} · ${FLOW_STEPS[stepIndex]?.label ?? ""}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#3d342c] text-[#e8e0d4]/80 transition-colors hover:bg-[#1f1b17]"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#1f1b17]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#8b6914] to-[#c9a66b]"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  {step === "service" && (
                    <>
                    <StepTitle title="Escolhe o teu serviço" subtitle="Cada opção inclui imagem e tempo estimado." />
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {LUME_SERVICES.map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          data-lume-service-card
                          onClick={() => {
                            setDraft((d) => ({ ...d, service }));
                            setStep("barber");
                          }}
                          className="group overflow-hidden rounded-2xl border border-[#2a2420] bg-[#1a1714] text-left transition-all hover:border-[#c9a66b]/45 hover:shadow-[0_12px_40px_rgba(201,166,107,0.08)]"
                        >
                          <div className="relative h-32 w-full">
                            <Image
                              src={service.image}
                              alt=""
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 640px) 100vw, 320px"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#12100e] via-transparent to-transparent" />
                          </div>
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-[family-name:var(--font-lume-serif)] text-lg text-[#f5f0e8]">
                                {service.name}
                              </h3>
                              <span className="text-sm font-medium text-[#c9a66b]">
                                {formatEuro(service.priceEuro)}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#a8a29e]">
                              {service.description}
                            </p>
                            <p className="mt-2 text-[10px] tracking-wide text-[#78716c] uppercase">
                              {service.durationMin} min
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                    </>
                  )}

                  {step === "barber" && (
                    <>
                    <StepTitle title="Escolhe o profissional" subtitle="Especialidades distintas, mesma obsessão pelo detalhe." />
                    <ul className="mt-5 space-y-3">
                      {LUME_BARBERS.map((barber) => (
                        <li key={barber.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setDraft((d) => ({ ...d, barber }));
                              setStep("date");
                            }}
                            className="flex w-full gap-4 overflow-hidden rounded-2xl border border-[#2a2420] bg-[#1a1714] p-3 text-left transition-colors hover:border-[#c9a66b]/45"
                          >
                            <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl">
                              <Image
                                src={barber.image}
                                alt={barber.name}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            </div>
                            <div className="min-w-0 py-1">
                              <p className="font-[family-name:var(--font-lume-serif)] text-lg text-[#f5f0e8]">
                                {barber.name}
                              </p>
                              <p className="text-xs text-[#c9a66b]">{barber.specialty}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-[#a8a29e]">{barber.bio}</p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                    </>
                  )}

                  {step === "date" && (
                    <>
                    <StepTitle title="Escolhe a data" subtitle="Calendário de demonstração — próximas 3 semanas." />
                    <div className="mt-5 rounded-2xl border border-[#2a2420] bg-[#1a1714] p-4" data-lume-calendar>
                      <p className="mb-3 text-center text-xs font-medium tracking-[0.2em] text-[#c9a66b] uppercase">
                        {new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" }).format(new Date())}
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
                                ? "border-[#c9a66b] bg-[#c9a66b]/15 text-[#f5f0e8]"
                                : "border-[#2a2420] text-[#e8e0d4] hover:border-[#c9a66b]/40"
                            } ${day.isToday ? "ring-1 ring-[#c9a66b]/30" : ""}`}
                          >
                            <span className="text-[10px] text-[#78716c]">{day.weekday}</span>
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
                      title="Escolhe o horário"
                      subtitle={draft.date ? formatDisplayDate(draft.date) : ""}
                    />
                    <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {LUME_TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            setDraft((d) => ({ ...d, time: slot }));
                            setStep("details");
                          }}
                          className={`rounded-xl border py-3 text-sm font-medium transition-all ${
                            draft.time === slot
                              ? "border-[#c9a66b] bg-[#c9a66b]/15 text-[#f5f0e8]"
                              : "border-[#2a2420] text-[#e8e0d4] hover:border-[#c9a66b]/40"
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
                    <StepTitle title="Dados de demonstração" subtitle="Não são guardados nem enviados." />
                    <motion.div className="mt-5 space-y-4">
                      {(
                        [
                          ["name", "Nome"],
                          ["email", "Email"],
                          ["phone", "Telemóvel"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="block">
                          <span className="text-xs text-[#a8a29e]">{label}</span>
                          <input
                            className="mt-1.5 w-full rounded-xl border border-[#2a2420] bg-[#0c0b0a] px-4 py-3 text-sm text-[#f5f0e8] outline-none ring-[#c9a66b]/0 transition-shadow focus:border-[#c9a66b]/50 focus:ring-2 focus:ring-[#c9a66b]/20"
                            value={draft[key]}
                            onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                          />
                        </label>
                      ))}
                      <label className="block">
                        <span className="text-xs text-[#a8a29e]">Notas</span>
                        <textarea
                          rows={2}
                          className="mt-1.5 w-full rounded-xl border border-[#2a2420] bg-[#0c0b0a] px-4 py-3 text-sm text-[#f5f0e8] outline-none focus:border-[#c9a66b]/50"
                          value={draft.notes}
                          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setStep("review")}
                        className="w-full rounded-full bg-[#c9a66b] py-3.5 text-sm font-semibold text-[#1a1206] transition-opacity hover:opacity-95"
                      >
                        Rever marcação
                      </button>
                    </motion.div>
                    </>
                  )}

                  {step === "review" && draft.service && draft.barber && (
                    <>
                      <StepTitle title="Resumo visual" subtitle="Confirmação apenas demonstrativa." />
                      <div className="mt-5 overflow-hidden rounded-2xl border border-[#2a2420]">
                        <div className="relative h-40">
                          <Image
                            src={draft.service.image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="640px"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#12100e] to-transparent" />
                          <div className="absolute bottom-4 left-4">
                            <p className="font-[family-name:var(--font-lume-serif)] text-2xl text-white">
                              {draft.service.name}
                            </p>
                            <p className="text-sm text-[#c9a66b]">{formatEuro(draft.service.priceEuro)}</p>
                          </div>
                        </div>
                        <dl className="space-y-0 divide-y divide-[#2a2420] p-4 text-sm">
                          <ReviewRow label="Profissional" value={draft.barber.name} />
                          <ReviewRow
                            label="Quando"
                            value={`${draft.date ? formatDisplayDate(draft.date) : "—"} · ${draft.time ?? "—"}`}
                          />
                          <ReviewRow label="Cliente" value={draft.name} />
                        </dl>
                      </div>
                      <button
                        type="button"
                        data-lume-confirm
                        onClick={() => void confirm()}
                        className="mt-6 w-full rounded-full bg-[#c9a66b] py-3.5 text-sm font-semibold text-[#1a1206]"
                      >
                        Confirmar demonstração
                      </button>
                    </>
                  )}

                  {step === "confirmed" && (
                    <div className="py-4 text-center" data-lume-confirmation>
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#c9a66b]/50 bg-[#c9a66b]/10"
                      >
                        <svg className="h-10 w-10 text-[#c9a66b]" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path
                            d="M5 13l4 4L19 7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </motion.div>
                      <h3 className="mt-6 font-[family-name:var(--font-lume-serif)] text-3xl text-[#f5f0e8]">
                        Marcação registada
                      </h3>
                      <p className="mt-2 text-sm text-[#a8a29e]">
                        Demonstração Artecium Lab — sem reserva real nem email enviado.
                      </p>
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mx-auto mt-8 max-w-sm rounded-2xl border border-[#2a2420] bg-[#1a1714] p-5 text-left text-sm"
                      >
                        <p className="text-[#c9a66b]">{draft.service?.name}</p>
                        <p className="mt-1 text-[#f5f0e8]">{draft.barber?.name}</p>
                        <p className="mt-2 text-[#a8a29e]">
                          {draft.date && formatDisplayDate(draft.date)} · {draft.time}
                        </p>
                        <p className="mt-4 font-mono text-xs text-[#78716c]">Ref. {confirmationId}</p>
                      </motion.div>
                      <button
                        type="button"
                        onClick={close}
                        className="mt-8 rounded-full border border-[#3d342c] px-8 py-3 text-sm text-[#e8e0d4]"
                      >
                        Fechar
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {step !== "confirmed" && step !== "service" && (
              <footer className="shrink-0 border-t border-[#2a2420] px-5 py-3 sm:px-6">
                <button
                  type="button"
                  onClick={goBack}
                  className="text-xs font-medium text-[#c9a66b] hover:text-[#e8e0d4]"
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
      <h2 className="font-[family-name:var(--font-lume-serif)] text-2xl text-[#f5f0e8] sm:text-3xl">{title}</h2>
      {subtitle ? <p className="mt-1.5 text-sm text-[#a8a29e]">{subtitle}</p> : null}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-[#78716c]">{label}</dt>
      <dd className="text-right font-medium text-[#f5f0e8]">{value}</dd>
    </div>
  );
}