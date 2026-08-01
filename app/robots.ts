import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.xn--ncebak-vxa.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin"],
    },
    host: baseUrl,
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
