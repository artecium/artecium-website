"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, isAppLocale, type AppLocale } from "./config";

export async function setLocale(locale: AppLocale, pathname: string) {
  if (!isAppLocale(locale)) {
    return { success: false as const };
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath(pathname || "/");
  revalidatePath("/", "layout");

  return { success: true as const };
}
