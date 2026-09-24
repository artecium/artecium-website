"use client";

import {
  AdminFormError,
  AdminFormSection,
  AdminSubmitButton,
  adminInputClass,
  adminLabelClass,
} from "@/components/admin/AdminFormFields";
import { createClientWithUser } from "@/lib/actions/admin/clients";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateCompanyForm() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [website, setWebsite] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const { companyId } = await createClientWithUser({
        companyName,
        legalName,
        taxId,
        website,
        fullName,
        email,
        phone,
      });
      setSuccess("Client created successfully. Redirecting to Customer 360...");
      router.push(`/admin/clients/${companyId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <AdminFormSection title="Company">
        <div>
          <label className={adminLabelClass}>Company name *</label>
          <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={adminInputClass} />
        </div>
        <div>
          <label className={adminLabelClass}>Legal name</label>
          <input value={legalName} onChange={(e) => setLegalName(e.target.value)} className={adminInputClass} />
        </div>
        <div>
          <label className={adminLabelClass}>Tax ID</label>
          <input value={taxId} onChange={(e) => setTaxId(e.target.value)} className={adminInputClass} />
        </div>
        <div>
          <label className={adminLabelClass}>Website</label>
          <input value={website} onChange={(e) => setWebsite(e.target.value)} className={adminInputClass} />
        </div>
      </AdminFormSection>

      <AdminFormSection title="Primary contact">
        <div>
          <label className={adminLabelClass}>Full name *</label>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={adminInputClass} />
        </div>
        <div>
          <label className={adminLabelClass}>Email *</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={adminInputClass} />
        </div>
        <div>
          <label className={adminLabelClass}>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={adminInputClass} />
        </div>
      </AdminFormSection>

      <AdminFormError message={error} />
      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
      <AdminSubmitButton pending={pending} label="Create client" pendingLabel="Creating..." />
    </form>
  );
}
