import type { Metadata } from "next";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import BusinessDetailClient, {
  type Business,
} from "./BusinessDetailClient";

const BASE_URL = "https://www.xn--ncebak-vxa.com";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getCategoryName(categories: Business["categories"]) {
  if (Array.isArray(categories)) return categories[0]?.name ?? null;
  return categories?.name ?? null;
}

function isRestaurantCategory(categoryName: string | null) {
  return (
    categoryName?.toLocaleLowerCase("tr-TR").includes("restoran") ?? false
  );
}

function hasPrice(business: Business) {
  return (
    business.price_level !== null && Number.isFinite(business.price_level)
  );
}

function hasMenu(business: Business) {
  return Boolean(
    business.menu_url ||
      (Array.isArray(business.menu_images) && business.menu_images.length > 0)
  );
}

function getBusinessImages(business: Business) {
  return Array.from(
    new Set(
      [
        business.cover_image,
        ...(Array.isArray(business.gallery) ? business.gallery : []),
        ...(Array.isArray(business.menu_images) ? business.menu_images : []),
      ].filter(
        (image): image is string =>
          typeof image === "string" && image.trim().length > 0
      )
    )
  );
}

function formatTurkishList(items: string[]) {
  if (items.length < 2) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} ve ${items.at(-1)}`;
}

function getSeoContent(business: Business) {
  const subject = [business.name, business.region].filter(Boolean).join(" ");
  const titleDetails = [
    hasMenu(business) ? "Menü" : null,
    hasPrice(business) ? "Fiyatları" : null,
  ].filter((detail): detail is string => Boolean(detail));
  const titleSuffix = formatTurkishList(titleDetails);
  const title = titleSuffix ? `${subject} ${titleSuffix}` : subject;

  const descriptionDetails = [
    hasMenu(business) ? "menüsü" : null,
    hasPrice(business) ? "fiyatları" : null,
    getBusinessImages(business).length > 0 ? "fotoğrafları" : null,
    business.google_maps_url || business.address ? "konumu" : null,
    business.phone ? "iletişim bilgileri" : null,
  ].filter((detail): detail is string => Boolean(detail));
  const details = formatTurkishList(descriptionDetails);
  const description = details
    ? `${subject} ${details}. Gitmeden önce ÖnceBak.`
    : `${subject} hakkında bilgiler. Gitmeden önce ÖnceBak.`;

  return { title, description };
}

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

  const seo = getSeoContent(business);
  const canonicalUrl = `${BASE_URL}/mekan/${business.slug}`;
  const socialTitle = `${seo.title} | ÖnceBak`;

  return {
    title: seo.title,
    description: seo.description,

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      type: "website",
      locale: "tr_TR",
      url: canonicalUrl,
      siteName: "ÖnceBak",
      title: socialTitle,
      description: seo.description,
      images: business.cover_image
        ? [
            {
              url: business.cover_image,
              alt: business.name,
            },
          ]
        : [],
    },

    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: seo.description,
      images: business.cover_image
        ? [business.cover_image]
        : [],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const business = await getBusiness(slug);

  const pageUrl = business
    ? `${BASE_URL}/mekan/${business.slug}`
    : `${BASE_URL}/mekan/${slug}`;

  const jsonLd = business
    ? (() => {
        const categoryName = getCategoryName(business.categories);
        const images = getBusinessImages(business);
        const priceLevel = business.price_level;
        const priceRange = priceLevel !== null && Number.isFinite(priceLevel)
          ? `${priceLevel.toLocaleString("tr-TR")} TL`
          : undefined;

        return {
          "@context": "https://schema.org",
          "@type": isRestaurantCategory(categoryName)
            ? "Restaurant"
            : "LocalBusiness",
          "@id": `${pageUrl}#business`,
          name: business.name,
          url: pageUrl,
          category: categoryName || undefined,
          image: images.length > 0 ? images : undefined,
          telephone: business.phone || undefined,
          address:
            business.address || business.region
              ? {
                  "@type": "PostalAddress",
                  streetAddress: business.address || undefined,
                  addressLocality: business.region || undefined,
                }
              : undefined,
          hasMap: business.google_maps_url || undefined,
          priceRange,
        };
      })()
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
