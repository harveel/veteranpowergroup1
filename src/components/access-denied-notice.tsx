"use client";

import { useSearchParams } from "next/navigation";

export function AccessDeniedNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("access") !== "denied") return null;
  return <p className="notice notice-error access-denied-notice" role="alert">You don&apos;t have access to that section. Ask an administrator if you need it.</p>;
}
