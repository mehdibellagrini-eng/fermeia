import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ferme IA — Dashboard",
  description: "Tableau de bord temps réel — système d'agents IA autonomes",
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⬡</text></svg>" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Inter:wght@400;600;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#050508] text-white antialiased">{children}</body>
    </html>
  );
}
