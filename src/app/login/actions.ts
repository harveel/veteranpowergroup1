"use server";

import { redirect } from "next/navigation";
import { authenticateStaff, clearPrototypeSession, createPrototypeSession, getStaffAccess } from "@/lib/prototype-auth";
import { firstAllowedHref } from "@/lib/staff-sections";

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    redirect("/login?error=invalid");
  }

  const staff = await authenticateStaff(email, password);
  if (!staff) redirect("/login?error=invalid");

  const home = firstAllowedHref((await getStaffAccess(staff.userId)).sections);
  if (!home) redirect("/login?error=access");
  await createPrototypeSession(staff);
  redirect(home);
}

export async function logout() {
  await clearPrototypeSession();
  redirect("/login");
}
