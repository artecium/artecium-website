import { COMPANY_PHONE } from "@/config/contact";
import {
  BUDGET_LABELS,
  PROJECT_TYPE_LABELS,
  TIMELINE_LABELS,
  type ProjectDiscoveryData,
} from "@/types/project";

export function buildWhatsAppMessage(data: ProjectDiscoveryData): string {
  const lines = [
    "Hello Artecium,",
    "",
    `My name is ${data.name}.`,
    "I'd like to discuss the following project.",
    "",
    "Project",
    data.projectType ? PROJECT_TYPE_LABELS[data.projectType] : "",
    "",
    "Budget",
    data.budget ? BUDGET_LABELS[data.budget] : "",
    "",
    "Timeline",
    data.timeline ? TIMELINE_LABELS[data.timeline] : "",
  ];

  if (data.company.trim()) {
    lines.push("", "Company", data.company.trim());
  }

  lines.push(
    "",
    "Project Description",
    data.description.trim(),
    "",
    "I'm looking forward to hearing from you.",
  );

  return lines.join("\n");
}

export function getWhatsAppUrl(message: string): string {
  const phone = COMPANY_PHONE.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
