import type { Metadata } from "next";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import BusinessDetailClient, {
  type Business,
} from "./BusinessDetailClient";

const BASE_URL = "https://xn--ncebak-vxa.com";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const getBusiness = cache(async (slug: string): Promise<Business | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, description, region, address, phone, whatsapp, instagram, website, google_maps_url, menu_url, menu_images, menu_updated_at, opening_hours, features, gallery, price_level, rating, verified, featured, cover_image, categories(name)"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as unknown as Business;
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusiness(slug);

  if (!business) {
    return {
      title: "Mekân Bulunamadı",
      description: "Aradığınız işletme ÖnceBak üzerinde bulunamadı.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    business.description?.slice(0, 160) ||
    `${business.name} için güncel menü, fiyat, konum ve iletişim bilgilerini ÖnceBak üzerinden inceleyin.`;

  const canonicalUrl = `${BASE_URL}/mekan/${business.slug}`;

  return {
    title: business.name,
    description,

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      type: "website",
      locale: "tr_TR",
      url: canonicalUrl,
      siteName: "ÖnceBak",
      title: `${business.name} | ÖnceBak`,
      description,
      images: business.cover_image
        ? [
            {
              url: business.cover_image,
              alt: business.name,
            },
          ]
        : ["/og-image.jpg"],
    },

    twitter: {
      card: "summary_large_image",
      title: `${business.name} | ÖnceBak`,
      description,
      images: business.cover_image
        ? [business.cover_image]
        : ["/og-image.jpg"],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const business = await getBusiness(slug);

  const pageUrl = business
    ? `${BASE_URL}/mekan/${business.slug}`
    : `${BASE_URL}/mekan/${slug}`;

  const instagramUrl = business?.instagram
    ? business.instagram.startsWith("http")
      ? business.instagram
      : `https://instagram.com/${business.instagram.replace(/^@/, "")}`
    : null;

  const jsonLd = business
    ? {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": `${pageUrl}#business`,
        name: business.name,
        url: pageUrl,
        description:
          business.description ||
          `${business.name} hakkında güncel işletme bilgileri.`,
        image: business.cover_image || undefined,
        telephone: business.phone || undefined,
        address:
          business.address || business.region
            ? {
                "@type": "PostalAddress",
                streetAddress: business.address || undefined,
                addressLocality: business.region || undefined,
                addressRegion: "Nevşehir",
                addressCountry: "TR",
              }
            : undefined,
        sameAs: [business.website, instagramUrl].filter(Boolean),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}

      <BusinessDetailClient initialBusiness={business} />
    </>
  );
}
