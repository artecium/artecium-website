"use client";

import { LoginForm } from "@/components/auth/LoginForm";

/** Admin entry login — reuses client form with staff-only redirect behaviour. */
export function AdminLoginForm() {
  return <LoginForm mode="admin" />;
}
