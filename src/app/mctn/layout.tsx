import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PFIMN — Programme National de Formation aux Métiers du Numérique",
  description:
    "Programme National de Formation et d'Insertion aux Métiers du Numérique · Ministère de la Communication, des Télécommunications et du Numérique · Sénégal 2025–2034",
};

export default function MctnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
