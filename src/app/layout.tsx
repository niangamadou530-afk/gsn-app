import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import "./globals.css";

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
    <html lang="fr" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
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
