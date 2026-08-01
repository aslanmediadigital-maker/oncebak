import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = "https://www.xn--ncebak-vxa.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/hakkimizda`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/iletisim`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/isletmeni-tanit`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/gizlilik`,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  const { data, error } = await supabase
    .from("businesses")
    .select("slug");

  if (error || !data) {
    return staticPages;
  }

  const businessPages: MetadataRoute.Sitemap = data.map((business) => ({
    url: `${BASE_URL}/mekan/${business.slug}`,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticPages, ...businessPages];
}
