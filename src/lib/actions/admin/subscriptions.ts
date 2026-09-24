"use server";

import { requireAdminPage } from "@/lib/auth/admin-access";
import {
  assertCompanyAccess,
  assertSubscriptionAccess,
  canManageSubscriptions,
} from "@/lib/auth/resource-access";
import type { AuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { BILLING_PERIODS, PERMISSIONS, SUBSCRIPTION_STATUSES } from "@/types/platform";
import { revalidatePath } from "next/cache";

function requireSubscriptionManager(session: AuthSession) {
  if (!canManageSubscriptions(session)) {
    throw new Error("You do not have permission to manage subscriptions.");
  }
}

function assertSubscriptionStatus(status: string) {
  if (!(SUBSCRIPTION_STATUSES as readonly string[]).includes(status)) {
    throw new Error("Invalid subscription status.");
  }
}

function assertBillingPeriod(period: string) {
  if (!(BILLING_PERIODS as readonly string[]).includes(period)) {
    throw new Error("Invalid billing period.");
  }
}

export async function createSubscription(input: {
  companyId: string;
  serviceId: string;
  servicePlanId?: string | null;
  status?: string;
  price?: number | null;
  currency?: string;
  billingPeriod?: string;
}) {
  const session = await requireAdminPage(PERMISSIONS.CLIENTS_VIEW);
  requireSubscriptionManager(session);
  await assertCompanyAccess(input.companyId);

  const status = input.status ?? "active";
  assertSubscriptionStatus(status);
  const billingPeriod = input.billingPeriod ?? "monthly";
  assertBillingPeriod(billingPeriod);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_subscriptions")
    .insert({
      company_id: input.companyId,
      service_id: input.serviceId,
      service_plan_id: input.servicePlanId || null,
      status,
      price: input.price ?? null,
      currency: input.currency ?? "EUR",
      billing_period: billingPeriod,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/services");
  revalidatePath(`/admin/clients/${input.companyId}`);
  revalidatePath("/client/services");
  return data.id as string;
}

export async function updateSubscription(
  subscriptionId: string,
  input: {
    status?: string;
    servicePlanId?: string | null;
    price?: number | null;
    billingPeriod?: string;
    currentPeriodEnd?: string | null;
  },
) {
  const session = await requireAdminPage(PERMISSIONS.CLIENTS_VIEW);
  requireSubscriptionManager(session);
  const companyId = await assertSubscriptionAccess(subscriptionId);

  if (input.status) assertSubscriptionStatus(input.status);
  if (input.billingPeriod) assertBillingPeriod(input.billingPeriod);

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.status !== undefined) {
    updates.status = input.status;
    if (input.status === "cancelled") {
      updates.cancelled_at = new Date().toISOString();
    }
    if (input.status === "active") {
      updates.reactivated_at = new Date().toISOString();
    }
  }
  if (input.servicePlanId !== undefined) updates.service_plan_id = input.servicePlanId;
  if (input.price !== undefined) updates.price = input.price;
  if (input.billingPeriod !== undefined) updates.billing_period = input.billingPeriod;
  if (input.currentPeriodEnd !== undefined) {
    updates.current_period_end = input.currentPeriodEnd;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_subscriptions")
    .update(updates)
    .eq("id", subscriptionId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/services");
  revalidatePath(`/admin/clients/${companyId}`);
  revalidatePath("/client/services");
}
