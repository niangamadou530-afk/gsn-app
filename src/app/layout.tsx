import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { t } from "@/lib/i18n";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: t("common.appTitle"),
  description: t("common.appDescription"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full ${plusJakartaSans.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          precedence="default"
        />
      </head>
      <body className={`min-h-full flex flex-col antialiased ${plusJakartaSans.className}`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e && e.message && /failed to load chunk/i.test(e.message)) {
                  var key = 'gsn_chunk_reload_' + window.location.pathname;
                  if (!window.sessionStorage.getItem(key)) {
                    window.sessionStorage.setItem(key, '1');
                    window.location.reload();
                  }
                }
              });
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
