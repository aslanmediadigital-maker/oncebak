import type { Metadata } from "next";
import GirisForm from "./GirisForm";

export const metadata: Metadata = {
  title: "Giriş",
  description: "ÖnceBak hesabına giriş yap.",
  alternates: {
    canonical: "/giris",
  },
};

type GirisPageProps = {
  searchParams: Promise<{ durum?: string | string[] }>;
};

export default async function GirisPage({ searchParams }: GirisPageProps) {
  const { durum: rawStatus } = await searchParams;
  const durum =
    rawStatus === "onaylandi" || rawStatus === "onay-hatasi"
      ? rawStatus
      : null;

  return <GirisForm durum={durum} />;
}
