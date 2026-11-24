/** Client-side sign-up validation and error classification (no secrets). */

export const MIN_SIGN_UP_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignUpFieldErrors = {
  email?: "required" | "invalid";
  password?: "required" | "tooShort";
  confirmPassword?: "required" | "mismatch";
};

export function validateSignUpFields(input: {
  email: string;
  password: string;
  confirmPassword: string;
}): SignUpFieldErrors | null {
  const errors: SignUpFieldErrors = {};
  const email = input.email.trim();

  if (!email) {
    errors.email = "required";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "invalid";
  }

  if (!input.password) {
    errors.password = "required";
  } else if (input.password.length < MIN_SIGN_UP_PASSWORD_LENGTH) {
    errors.password = "tooShort";
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "required";
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "mismatch";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export type SignUpErrorKind =
  | "generic"
  | "signupDisabled"
  | "weakPassword"
  | "invalidEmail";

/** Map Supabase Auth errors without revealing whether an email is registered. */
export function classifySignUpError(
  message: string,
  code?: string | null,
): SignUpErrorKind {
  const normalized = `${code ?? ""} ${message}`.toLowerCase();

  if (
    normalized.includes("signup_disabled") ||
    normalized.includes("signups not allowed")
  ) {
    return "signupDisabled";
  }
  if (
    normalized.includes("weak_password") ||
    (normalized.includes("password") && normalized.includes("weak"))
  ) {
    return "weakPassword";
  }
  if (
    normalized.includes("invalid_email") ||
    normalized.includes("unable to validate email")
  ) {
    return "invalidEmail";
  }

  return "generic";
}
