import { marketing } from "@/lib/ui/marketing-classes";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  titleId?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  titleId,
}: SectionHeaderProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      {eyebrow ? <p className={`mb-4 ${marketing.eyebrow}`}>{eyebrow}</p> : null}
      <h2 id={titleId} className={marketing.titleLg}>
        {title}
      </h2>
      {description ? <p className={`mt-4 ${marketing.body}`}>{description}</p> : null}
    </div>
  );
}