import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim",
  alternates: {
    canonical: "/iletisim",
  },
};

export default function IletisimLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
