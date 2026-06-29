import { redirect } from "next/navigation";

export default function AccueilRedirectPage() {
  redirect("/mjs/login");
}
