import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ÖnceBak — Gitmeden önce bak",
  description:
    "Kapadokya'daki restoranları, kafeleri ve aktiviteleri güncel menüleri ve fiyatlarıyla keşfet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
