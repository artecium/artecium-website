"use server";

import { requireAdminPage } from "@/lib/auth/admin-access";
import {
  assertCompanyAccess,
  isValidEmail,
} from "@/lib/auth/resource-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/types/platform";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";

export interface CreateClientInput {
  companyName: string;
  email: string;
  fullName: string;
  phone?: string;
  website?: string;
  taxId?: string;
  legalName?: string;
  contactRole?: "owner" | "billing" | "technical" | "general";
}

async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient();
  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

export async function createClientWithUser(
  input: CreateClientInput,
): Promise<{ companyId: string; userId: string }> {
  await requireAdminPage(PERMISSIONS.CLIENTS_EDIT);

  const companyName = input.companyName.trim();
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();

  if (!companyName) throw new Error("Company name is required.");
  if (!fullName) throw new Error("Contact name is required.");
  if (!isValidEmail(email)) throw new Error("Invalid email address.");

  const supabase = await createClient();

  if (input.taxId?.trim()) {
    const { data: existingCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("tax_id", input.taxId.trim())
      .is("deleted_at", null)
      .maybeSingle();
    if (existingCompany) {
      throw new Error("A company with this tax ID already exists.");
    }
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existingProfile) {
    throw new Error("A user with this email already exists.");
  }

  const existingAuth = await findAuthUserByEmail(email);
  if (existingAuth) {
    throw new Error("An auth account with this email already exists.");
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: companyName,
      legal_name: input.legalName?.trim() || null,
      tax_id: input.taxId?.trim() || null,
      website: input.website?.trim() || null,
    })
    .select("id")
    .single();

  if (companyError || !company) {
    throw new Error(companyError?.message ?? "Failed to create company.");
  }

  const companyId = company.id as string;
  const tempPassword = randomBytes(24).toString("base64url");

  const admin = createAdminClient();
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError || !authData.user) {
    await supabase.from("companies").delete().eq("id", companyId);
    throw new Error(authError?.message ?? "Failed to create user account.");
  }

  const userId = authData.user.id;

  const { error: companyUserError } = await supabase.from("company_users").insert({
    company_id: companyId,
    user_id: userId,
    is_primary: true,
    contact_role: input.contactRole ?? "owner",
  });

  if (companyUserError) {
    throw new Error(companyUserError.message);
  }

  const { error: contactError } = await supabase.from("contacts").insert({
    company_id: companyId,
    full_name: fullName,
    email,
    phone: input.phone?.trim() || null,
    is_primary: true,
    contact_type: input.contactRole ?? "owner",
    user_id: userId,
  });

  if (contactError) {
    throw new Error(contactError.message);
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${companyId}`);

  return { companyId, userId };
}

export async function updateCompany(
  companyId: string,
  input: {
    name?: string;
    legal_name?: string;
    tax_id?: string;
    website?: string;
  },
) {
  await requireAdminPage(PERMISSIONS.CLIENTS_EDIT);
  await assertCompanyAccess(companyId);

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.legal_name !== undefined
        ? { legal_name: input.legal_name.trim() || null }
        : {}),
      ...(input.tax_id !== undefined ? { tax_id: input.tax_id.trim() || null } : {}),
      ...(input.website !== undefined ? { website: input.website.trim() || null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/clients/${companyId}`);
  revalidatePath("/admin/clients");
}
