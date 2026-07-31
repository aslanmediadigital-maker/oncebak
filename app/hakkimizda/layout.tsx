import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkımızda",
};

export default function HakkimizdaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
