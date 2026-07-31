import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İşletmeni Tanıt",
};

export default function IsletmeniTanitLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
