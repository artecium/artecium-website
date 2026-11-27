import Link from "next/link";

export function LabConfigError({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-xl font-semibold text-red-300">Configuração do Lab inválida</h1>
      <p className="mt-4 text-sm leading-relaxed text-[#a8a29e]">{message}</p>
      <p className="mt-6 text-sm text-amber-200/80">
        Usa <code className="rounded bg-[#1f1b17] px-1.5 py-0.5">npm run dev:prototype</code> com{" "}
        <code className="rounded bg-[#1f1b17] px-1.5 py-0.5">.env.prototype.local</code> (sem Supabase
        remoto). O <code className="rounded bg-[#1f1b17] px-1.5 py-0.5">.env.local</code> não deve
        apontar para produção quando <code className="rounded bg-[#1f1b17] px-1.5 py-0.5">ARTECIUM_RUNTIME=prototype</code>.
      </p>
      <Link href="/prototypes" className="mt-8 inline-block text-sm text-amber-400 underline">
        Voltar ao índice
      </Link>
    </main>
  );
}