import { clientAreaHref, readRequestHostname } from "@/lib/routing";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ClientIndexPage() {
  const requestHeaders = await headers();
  const hostname = readRequestHostname((name) => requestHeaders.get(name));
  redirect(clientAreaHref("/client/dashboard", hostname));
}
