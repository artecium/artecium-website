import type { ProjectDiscoveryData } from "@/types/project";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<{ id: string }>;
}

export type DiscoveryEmailData = ProjectDiscoveryData;
