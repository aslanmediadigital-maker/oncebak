import type { Metadata } from "next";
import KayitForm from "./KayitForm";

export const metadata: Metadata = {
  title: "Kayıt",
  description: "ÖnceBak hesabını oluştur.",
};

export default function KayitPage() {
  return <KayitForm />;
}
