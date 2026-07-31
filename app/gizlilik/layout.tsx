import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
};

export default function GizlilikLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
