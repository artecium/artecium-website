import { prototypeRegistry } from "@prototypes/registry";
import Link from "next/link";

export default function PrototypesIndexPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        Artecium Lab
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#a8a29e]">
        Protótipos isolados para demonstrações comerciais, interfaces e novos produtos.
        Tudo o que vês aqui usa dados fictícios.
      </p>

      <ul className="mt-10 grid gap-5 sm:grid-cols-2">
        {prototypeRegistry.map((entry) => (
          <li
            key={entry.slug}
            className="group rounded-2xl border border-[#2a2520] bg-[#141210]/80 p-6 transition-colors hover:border-amber-600/40"
          >
            <p className="text-[10px] font-medium tracking-[0.2em] text-amber-500/90 uppercase">
              {entry.subtitle}
            </p>
            <h2 className="mt-2 font-serif text-2xl text-white">{entry.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#a8a29e]">{entry.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#2a2520] px-2.5 py-0.5 text-[10px] text-[#d6d3d1]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Link
              href={entry.href}
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-amber-300 transition-colors group-hover:text-amber-200"
            >
              Abrir protótipo
              <span aria-hidden>→</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}