import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://xn--ncebak-vxa.com"),

  title: {
    default: "ÖnceBak | Kapadokya Mekan Rehberi",
    template: "%s | ÖnceBak",
  },

  description:
    "Kapadokya'daki restoranları, kafeleri, kahvaltı mekanlarını ve aktiviteleri güncel menüler, fiyatlar ve gerçek işletme bilgileriyle keşfedin.",

  keywords: [
    "Kapadokya",
    "Göreme restoran",
    "Nevşehir kafe",
    "Kapadokya kahvaltı",
    "Kapadokya mekan rehberi",
    "Kapadokya menü",
    "Kapadokya fiyatları",
    "ÖnceBak",
  ],

  authors: [
    {
      name: "ÖnceBak",
    },
  ],

  creator: "ÖnceBak",
  publisher: "ÖnceBak",
  applicationName: "ÖnceBak",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://xn--ncebak-vxa.com",
    siteName: "ÖnceBak",
    title: "ÖnceBak | Kapadokya Mekan Rehberi",
    description:
      "Gitmeden önce bak. Kapadokya'daki restoranları, kafeleri ve aktiviteleri güncel fiyatları ve menüleriyle keşfet.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ÖnceBak",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "ÖnceBak | Kapadokya Mekan Rehberi",
    description:
      "Kapadokya'daki restoranları, kafeleri ve aktiviteleri güncel fiyatları ve menüleriyle keşfet.",
    images: ["/og-image.jpg"],
  },

  alternates: {
    canonical: "https://xn--ncebak-vxa.com",
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  manifest: "/manifest.webmanifest",
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