import type { LegalBlock, LegalDocumentContent } from "@/content/legal/types";

interface LegalDocumentProps {
  content: LegalDocumentContent;
}

function renderBlock(block: LegalBlock, index: number) {
  switch (block.type) {
    case "p":
      return (
        <p key={index} className="text-sm leading-relaxed text-[#94A3B8] sm:text-[0.9375rem]">
          {block.text}
        </p>
      );
    case "ul":
      return (
        <ul
          key={index}
          className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#94A3B8] sm:text-[0.9375rem]"
        >
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div key={index} className="overflow-x-auto rounded-xl border border-[#1E293B]">
          <table className="min-w-full divide-y divide-[#1E293B] text-left text-sm">
            <thead className="bg-[#0A0F1E]">
              <tr>
                {block.headers.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-4 py-3 font-medium text-white"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] bg-[#050816]/40">
              {block.rows.map((row) => (
                <tr key={row.join("-")}>
                  {row.map((cell) => (
                    <td key={cell} className="px-4 py-3 align-top text-[#94A3B8]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

export function LegalDocument({ content }: LegalDocumentProps) {
  return (
    <article className="mx-auto max-w-3xl">
      <header className="mb-10 border-b border-[#1E293B] pb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {content.title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[#94A3B8] sm:text-base">
          {content.description}
        </p>
        <p className="mt-3 text-xs uppercase tracking-wide text-[#64748B]">
          {content.lastUpdated}
        </p>
      </header>

      {content.disclaimer ? (
        <div className="mb-10 rounded-xl border border-[#1E293B] bg-[#0E1324]/60 px-5 py-4">
          <p className="text-sm leading-relaxed text-[#94A3B8]">{content.disclaimer}</p>
        </div>
      ) : null}

      {content.showToc ? (
        <nav
          aria-label="Table of contents"
          className="mb-10 rounded-xl border border-[#1E293B] bg-[#0E1324]/40 p-5"
        >
          <h2 className="text-sm font-medium text-white">
            {content.tocLabel ?? "Contents"}
          </h2>
          <ol className="mt-3 space-y-2 text-sm">
            {content.sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-[#60A5FA] transition-colors hover:text-[#93C5FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                >
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="space-y-10">
        {content.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-28 space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {section.title}
            </h2>
            <div className="space-y-4">{section.blocks.map(renderBlock)}</div>
          </section>
        ))}
      </div>
    </article>
  );
}
