"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function ResumeurRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/prep/generer"); }, [router]);
  return null;
}
