"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function ProgrammeRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/prep/dashboard"); }, [router]);
  return null;
}
