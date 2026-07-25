import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Business = {
  id: number | string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
  phone?: string | null;
  website?: string | null;
};

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: business, error } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, description, location, image_url, phone, website"
    )
    .eq("slug", slug)
    .maybeSingle<Business>();

  if (error) {
    console.error("İşletme yükleme hatası:", error);
  }

  if (!business) {
    notFound();
  }

  return (
    <main className="business-detail-page">
      <section className="business-hero">
        {business.image_url ? (
          <img
            src={business.image_url}
            alt={business.name}
            className="business-cover"
          />
        ) : (
          <div className="business-cover-placeholder">
            İşletme fotoğrafı bulunamadı
          </div>
        )}

        <div className="business-overlay" />

        <div className="business-hero-content">
          <a href="/" className="back-link">
            ← Ana sayfaya dön
          </a>

          <h1>{business.name}</h1>

          {business.location && (
            <p className="business-location">📍 {business.location}</p>
          )}
        </div>
      </section>

      <section className="business-content">
        <div className="business-main-card">
          <h2>İşletme hakkında</h2>

          <p>
            {business.description ||
              "Bu işletme için henüz açıklama eklenmemiş."}
          </p>
        </div>

        <aside className="business-info-card">
          <h2>İletişim</h2>

          {business.location && (
            <div className="info-row">
              <span>Adres</span>
              <strong>{business.location}</strong>
            </div>
          )}

          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="business-action-button"
            >
              Telefonu ara
            </a>
          )}

          {business.website && (
            <a
              href={business.website}
              target="_blank"
              rel="noreferrer"
              className="business-action-button secondary"
            >
              Web sitesine git
            </a>
          )}

          {!business.phone && !business.website && (
            <p className="empty-info">
              İletişim bilgileri henüz eklenmemiş.
            </p>
          )}
        </aside>
      </section>

      <section className="coming-sections">
        <div>
          <span>🍽️</span>
          <h3>Menü</h3>
          <p>İşletmenin menüsü burada gösterilecek.</p>
        </div>

        <div>
          <span>📷</span>
          <h3>Galeri</h3>
          <p>İşletmenin fotoğrafları burada gösterilecek.</p>
        </div>

        <div>
          <span>⭐</span>
          <h3>Değerlendirmeler</h3>
          <p>Kullanıcı yorumları burada gösterilecek.</p>
        </div>
      </section>
    </main>
  );
}
