import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NERVIA - Importation de Dossiers",
  description: "Application pour importer des gros dossiers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
