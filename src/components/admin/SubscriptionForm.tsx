"use client";

import {
  AdminFormError,
  AdminSubmitButton,
  adminInputClass,
  adminLabelClass,
} from "@/components/admin/AdminFormFields";
import { createSubscription, updateSubscription } from "@/lib/actions/admin/subscriptions";
import { SUBSCRIPTION_STATUSES } from "@/types/platform";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface SubscriptionFormProps {
  companies: Array<{ id: string; name: string }>;
  services: Array<{ id: string; name: string }>;
  plans: Array<{ id: string; name: string; service_id: string; price: number | null }>;
  subscription?: {
    id: string;
    company_id: string;
    service_id: string;
    service_plan_id: string | null;
    status: string;
    price: number | null;
    billing_period: string;
  };
}

export function SubscriptionForm({
  companies,
  services,
  plans,
  subscription,
}: SubscriptionFormProps) {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(subscription?.company_id ?? "");
  const [serviceId, setServiceId] = useState(subscription?.service_id ?? "");
  const [planId, setPlanId] = useState(subscription?.service_plan_id ?? "");
  const [status, setStatus] = useState(subscription?.status ?? "active");
  const [price, setPrice] = useState(String(subscription?.price ?? ""));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredPlans = useMemo(
    () => plans.filter((p) => p.service_id === serviceId),
    [plans, serviceId],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (subscription) {
        await updateSubscription(subscription.id, {
          status,
          servicePlanId: planId || null,
          price: price ? Number(price) : null,
        });
      } else {
        if (!companyId || !serviceId) throw new Error("Company and service are required.");
        await createSubscription({
          companyId,
          serviceId,
          servicePlanId: planId || null,
          status,
          price: price ? Number(price) : null,
        });
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save subscription.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
      {!subscription ? (
        <>
          <div>
            <label className={adminLabelClass}>Client</label>
            <select required value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={adminInputClass}>
              <option value="">Select client</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={adminLabelClass}>Service</label>
            <select required value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={adminInputClass}>
              <option value="">Select service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </>
      ) : null}
      <div>
        <label className={adminLabelClass}>Plan</label>
        <select value={planId} onChange={(e) => setPlanId(e.target.value)} className={adminInputClass}>
          <option value="">No plan</option>
          {filteredPlans.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={adminLabelClass}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={adminInputClass}>
            {SUBSCRIPTION_STATUSES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={adminLabelClass}>Price (EUR)</label>
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={adminInputClass} />
        </div>
      </div>
      <AdminFormError message={error} />
      <AdminSubmitButton pending={pending} label={subscription ? "Update subscription" : "Create subscription"} />
    </form>
  );
}
