import { getStructuredDataGraph } from "@/lib/seo/json-ld";

export function StructuredData() {
  const structuredData = getStructuredDataGraph();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
