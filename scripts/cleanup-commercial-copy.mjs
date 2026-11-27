/**
 * One-off maintenance: align i18n source strings with commercial-catalog (localhost phase 4).
 * Does not touch Supabase or Stripe.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const PT_REPLACEMENTS = [
  [/500 €\/mês/g, "400 €/mês"],
  [/900 €\/mês/g, "750 €/mês"],
  [/500 € por mês/g, "400 € por mês"],
  [/900 € por mês/g, "750 € por mês"],
  [/500 € \/ mês/g, "400 € / mês"],
  [/900 € \/ mês/g, "750 € / mês"],
  [/planos mensais a partir de 500 €/g, "planos mensais a partir de 400 €"],
  [/começa nos 500 €\/mês/g, "começa nos 400 €/mês"],
  [/custa 900 €\/mês/g, "custa 750 €/mês"],
  [/Growth \(500 €\/mês\)/g, "Growth (400 €/mês)"],
  [/Advanced \(900 €\/mês\)/g, "Advanced (750 €/mês)"],
  [/Growth a 500 €\/mês/g, "Growth a 400 €/mês"],
  [/Advanced a 900 €\/mês/g, "Advanced a 750 €/mês"],
  [/Growth \(500 €\/mês\) e Advanced \(900 €\/mês\)/g, "Growth (400 €/mês) e Advanced (750 €/mês)"],
];

const EN_REPLACEMENTS = [
  [/€500\/month/g, "€400/month"],
  [/€900\/month/g, "€750/month"],
  [/€500\/mo/g, "€400/mo"],
  [/€900\/mo/g, "€750/mo"],
  [/€500 \/ month/g, "€400 / month"],
  [/€900 \/ month/g, "€750 / month"],
  [/€500 per month/g, "€400 per month"],
  [/€900 per month/g, "€750 per month"],
  [/monthly plans from €500/g, "monthly plans from €400"],
  [/starts at €500\/month/g, "starts at €400/month"],
  [/costs €900\/month/g, "costs €750/month"],
  [/Growth at €500\/month/g, "Growth at €400/month"],
  [/Advanced at €900\/month/g, "Advanced at €750/month"],
  [/Growth \(€500\/month\) and Advanced \(€900\/month\)/g, "Growth (€400/month) and Advanced (€750/month)"],
];

function applyReplacements(text, pairs) {
  return pairs.reduce((acc, [re, rep]) => acc.replace(re, rep), text);
}

function walkJson(obj, pairs) {
  if (typeof obj === "string") return applyReplacements(obj, pairs);
  if (Array.isArray(obj)) return obj.map((v) => walkJson(v, pairs));
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = walkJson(v, pairs);
    }
    return out;
  }
  return obj;
}

function patchFile(rel, pairs, extra) {
  const path = resolve(root, rel);
  const raw = readFileSync(path, "utf8");
  const json = JSON.parse(raw);
  extra?.(json);
  const next = walkJson(json, pairs);
  writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  console.log("patched", rel);
}

patchFile("src/i18n/messages/pt-PT.json", PT_REPLACEMENTS, (json) => {
  if (json.home?.pricing) {
    delete json.home.pricing;
    console.log("  removed dead home.pricing (pt-PT)");
  }
});

patchFile("src/i18n/messages/en.json", EN_REPLACEMENTS, (json) => {
  if (json.home?.pricing) {
    delete json.home.pricing;
    console.log("  removed dead home.pricing (en)");
  }
});

patchFile("src/i18n/messages/blog-articles/pt.json", PT_REPLACEMENTS);
patchFile("src/i18n/messages/blog-articles/en.json", EN_REPLACEMENTS);

console.log("done");