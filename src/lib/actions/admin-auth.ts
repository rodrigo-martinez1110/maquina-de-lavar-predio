"use server";

import { redirect } from "next/navigation";
import { setAdminSession } from "../auth/admin-session";
import { env } from "../env";

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password !== env.ADMIN_PASSWORD) redirect("/admin/login?error=1");

  await setAdminSession();
  redirect("/admin");
}
