import { sendDiscoveryEmail } from "@/lib/email";
import type { ProjectDiscoveryData } from "@/types/project";
import { NextResponse } from "next/server";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateData(data: ProjectDiscoveryData): string | null {
  if (!data.projectType) return "Project type is required";
  if (!data.budget) return "Budget is required";
  if (!data.timeline) return "Timeline is required";
  if (!data.referral) return "Referral source is required";
  if (!data.name.trim()) return "Name is required";
  if (!data.email.trim() || !isValidEmail(data.email)) return "Valid email is required";
  if (!data.description.trim() || data.description.trim().length < 10) {
    return "Project description is required";
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as ProjectDiscoveryData;
    const error = validateData(data);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    await sendDiscoveryEmail(data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to send discovery brief";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
