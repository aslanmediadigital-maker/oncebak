import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İşletmeni Tanıt",
  alternates: {
    canonical: "/isletmeni-tanit",
  },
};

export default function IsletmeniTanitLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
