import type { Metadata } from "next";
import KayitForm from "./KayitForm";

export const metadata: Metadata = {
  title: "Kayıt",
  description: "ÖnceBak hesabını oluştur.",
  alternates: {
    canonical: "/kayit",
  },
};

export default function KayitPage() {
  return <KayitForm />;
}
