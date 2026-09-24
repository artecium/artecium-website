/**
 * Future AI assistant architecture.
 * The assistant must enforce the same permission checks as the requesting user.
 */

import type { Permission, UserRole } from "@/types/platform";

export interface AiAssistantContext {
  userId: string;
  roles: UserRole[];
  permissions: Permission[];
  companyIds: string[];
  locale: string;
}

export interface AiAssistantQuery {
  prompt: string;
  context: AiAssistantContext;
}

export interface AiAssistantResponse {
  configured: boolean;
  message: string;
}

export function getAiAssistantState(): AiAssistantResponse {
  return {
    configured: false,
    message:
      "O assistente de IA ainda não está configurado. A integração respeitará as permissões do utilizador autenticado.",
  };
}
