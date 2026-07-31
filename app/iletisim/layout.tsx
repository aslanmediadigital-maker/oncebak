import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim",
};

export default function IletisimLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
