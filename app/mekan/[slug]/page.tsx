"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Business = {
  id: string | number;
  name: string;
  slug: string;
  description: string | null;
  region: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  google_maps_url: string | null;
  menu_url: string | null;
  opening_hours: Record<string, string> | null;
  features: string[] | null;
  gallery: string[] | null;
  price_level: number | null;
  rating: number | string | null;
  verified: boolean | null;
  featured: boolean | null;
  cover_image: string | null;
  categories: { name: string } | { name: string }[] | null;
};

const days = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

function getCategoryName(category: Business["categories"]) {
  if (Array.isArray(category)) return category[0]?.name ?? "Mekân";
  return category?.name ?? "Mekân";
}

function formatPrice(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Belirtilmedi";
  return `${value.toLocaleString("tr-TR")}₺`;
}

function normalizePhone(value: string | null) {
  if (!value) return "";
  return value.replace(/[^\d+]/g, "");
}

function getInstagramUrl(value: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://instagram.com/${value.replace(/^@/, "")}`;
}

export default function BusinessDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [business, setBusiness] = useState<Business | null>(null);
  const [similar, setSimilar] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (!slug) return;

    let active = true;

    async function loadBusiness() {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("businesses")
        .select(
          "id, name, slug, description, region, address, phone, whatsapp, instagram, website, google_maps_url, menu_url, opening_hours, features, gallery, price_level, rating, verified, featured, cover_image, categories(name)"
        )
        .eq("slug", slug)
        .single();

      if (!active) return;

      if (error || !data) {
        setMessage("İşletme bulunamadı veya bilgiler yüklenemedi.");
        setLoading(false);
        return;
      }

      const current = data as unknown as Business;
      setBusiness(current);

      const stored = window.localStorage.getItem("oncebak-favorites");
      if (stored) {
        try {
          const ids = JSON.parse(stored) as Array<string | number>;
          setFavorite(ids.map(String).includes(String(current.id)));
        } catch {
          setFavorite(false);
        }
      }

      const categoryName = getCategoryName(current.categories);

      const { data: similarData } = await supabase
        .from("businesses")
        .select(
          "id, name, slug, description, region, address, phone, whatsapp, instagram, website, google_maps_url, menu_url, opening_hours, features, gallery, price_level, rating, verified, featured, cover_image, categories(name)"
        )
        .neq("id", current.id)
        .limit(3);

      if (active) {
        const rows = ((similarData ?? []) as unknown as Business[]).sort(
          (a, b) =>
            Number(getCategoryName(b.categories) === categoryName) -
            Number(getCategoryName(a.categories) === categoryName)
        );
        setSimilar(rows);
        setLoading(false);
      }
    }

    loadBusiness();

    return () => {
      active = false;
    };
  }, [slug]);

  const gallery = useMemo(() => {
    if (!business) return [];

    const images = [
      business.cover_image,
      ...(Array.isArray(business.gallery) ? business.gallery : []),
    ].filter((item): item is string => Boolean(item));

    return Array.from(new Set(images));
  }, [business]);

  function toggleFavorite() {
    if (!business) return;

    const stored = window.localStorage.getItem("oncebak-favorites");
    let current: string[] = [];

    if (stored) {
      try {
        current = (JSON.parse(stored) as Array<string | number>).map(String);
      } catch {
        current = [];
      }
    }

    const id = String(business.id);
    const next = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];

    window.localStorage.setItem("oncebak-favorites", JSON.stringify(next));
    setFavorite(next.includes(id));
  }

  if (loading) {
    return (
      <main className="state-page">
        <div className="state-card">
          <span className="loader" />
          <strong>İşletme yükleniyor</strong>
          <p>Güncel bilgiler hazırlanıyor.</p>
        </div>
        <GlobalStyles />
      </main>
    );
  }

  if (!business || message) {
    return (
      <main className="state-page">
        <div className="state-card">
          <strong>İşletme bulunamadı</strong>
          <p>{message}</p>
          <a href="/">Ana sayfaya dön</a>
        </div>
        <GlobalStyles />
      </main>
    );
  }

  const category = getCategoryName(business.categories);
  const rating = Number(business.rating ?? 0);
  const whatsapp = normalizePhone(business.whatsapp || business.phone);
  const phone = normalizePhone(business.phone);

  return (
    <main>
      <header className="topbar">
        <div className="shell nav">
          <a href="/" className="brand">
            Önce<span>Bak</span>
          </a>

          <div className="nav-links">
            <a href="/">Ana Sayfa</a>
            <a href="/#mekanlar">Mekânlar</a>
            <a href="/#kategoriler">Kategoriler</a>
          </div>

          <button className={`favorite-top ${favorite ? "active" : ""}`} onClick={toggleFavorite}>
            {favorite ? "♥ Favorilerde" : "♡ Favoriye Ekle"}
          </button>
        </div>
      </header>

      <section className="hero">
        <div
          className="hero-background"
          style={
            business.cover_image
              ? { backgroundImage: `url("${business.cover_image}")` }
              : undefined
          }
        />
        <div className="hero-overlay" />

        <div className="shell hero-content">
          <a href="/" className="back-link">← Keşfe dön</a>

          <div className="hero-bottom">
            <div>
              <div className="badges">
                {business.featured && <span className="badge premium">Editörün Seçimi</span>}
                {business.verified && <span className="badge verified">✓ Doğrulanmış</span>}
                <span className="badge neutral">{category}</span>
              </div>

              <h1>{business.name}</h1>

              <div className="hero-meta">
                <span>📍 {business.region || "Kapadokya"}</span>
                <span>★ {rating > 0 ? rating.toFixed(1) : "Yeni"}</span>
                <span>₺ {formatPrice(business.price_level)} kişi başı</span>
              </div>
            </div>

            <div className="hero-actions">
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.replace("+", "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="action primary"
                >
                  WhatsApp
                </a>
              )}

              {phone && (
                <a href={`tel:${phone}`} className="action secondary">
                  Ara
                </a>
              )}

              {business.google_maps_url && (
                <a
                  href={business.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="action secondary"
                >
                  Yol Tarifi
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="gallery-section">
          <div className="shell">
            <div className="gallery-grid">
              <button className="gallery-main" onClick={() => setLightboxIndex(0)}>
                <img src={gallery[0]} alt={business.name} />
              </button>

              <div className="gallery-side">
                {gallery.slice(1, 5).map((image, index) => (
                  <button key={image} onClick={() => setLightboxIndex(index + 1)}>
                    <img src={image} alt={`${business.name} galeri ${index + 2}`} />
                    {index === 3 && gallery.length > 5 && (
                      <span className="more-photos">+{gallery.length - 5} fotoğraf</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="content-section">
        <div className="shell content-grid">
          <div className="main-column">
            <section className="content-card intro-card">
              <span className="eyebrow">MEKÂN HAKKINDA</span>
              <h2>{business.name} deneyimi</h2>
              <p>
                {business.description ||
                  "Bu işletme için ayrıntılı açıklama henüz eklenmedi. Güncel iletişim ve konum bilgilerini kullanarak işletmeye ulaşabilirsin."}
              </p>
            </section>

            {Array.isArray(business.features) && business.features.length > 0 && (
              <section className="content-card">
                <span className="eyebrow">ÖZELLİKLER</span>
                <h2>Burada seni neler bekliyor?</h2>

                <div className="features-grid">
                  {business.features.map((feature) => (
                    <div className="feature" key={feature}>
                      <span>✓</span>
                      <strong>{feature}</strong>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {business.menu_url && (
              <section className="menu-card">
                <div>
                  <span className="eyebrow light">GÜNCEL MENÜ</span>
                  <h2>Gitmeden önce menüye göz at.</h2>
                  <p>Ürünleri ve fiyatları işletmenin güncel menüsünden incele.</p>
                </div>

                <a href={business.menu_url} target="_blank" rel="noreferrer">
                  Menüyü Gör →
                </a>
              </section>
            )}

            {business.google_maps_url && (
              <section className="content-card map-card">
                <div>
                  <span className="eyebrow">KONUM</span>
                  <h2>Nasıl gidilir?</h2>
                  <p>{business.address || `${business.region || "Kapadokya"}, Nevşehir`}</p>
                </div>

                <a href={business.google_maps_url} target="_blank" rel="noreferrer">
                  Google Maps'te Aç ↗
                </a>
              </section>
            )}
          </div>

          <aside className="side-column">
            <div className="info-card sticky-card">
              <span className="eyebrow">HIZLI BİLGİ</span>

              <InfoRow label="Kategori" value={category} />
              <InfoRow label="Bölge" value={business.region || "Kapadokya"} />
              <InfoRow label="Ortalama fiyat" value={formatPrice(business.price_level)} />
              <InfoRow
                label="Puan"
                value={rating > 0 ? `${rating.toFixed(1)} / 5` : "Henüz puan yok"}
              />

              <div className="divider" />

              {business.opening_hours && (
                <div className="hours">
                  <strong>Çalışma saatleri</strong>
                  {days.map((day) => (
                    <div key={day}>
                      <span>{day}</span>
                      <b>{business.opening_hours?.[day] || "Belirtilmedi"}</b>
                    </div>
                  ))}
                </div>
              )}

              <div className="contact-buttons">
                {phone && <a href={`tel:${phone}`}>Telefonla Ara</a>}

                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp.replace("+", "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp'tan Yaz
                  </a>
                )}

                {business.instagram && (
                  <a
                    href={getInstagramUrl(business.instagram)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Instagram
                  </a>
                )}

                {business.website && (
                  <a href={business.website} target="_blank" rel="noreferrer">
                    Web Sitesi
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="similar-section">
          <div className="shell">
            <div className="section-heading">
              <div>
                <span className="eyebrow">BENZER KEŞİFLER</span>
                <h2>Bunları da beğenebilirsin</h2>
              </div>
              <a href="/#mekanlar">Tüm mekânlar →</a>
            </div>

            <div className="similar-grid">
              {similar.map((item) => (
                <a href={`/mekan/${item.slug}`} className="similar-card" key={item.id}>
                  <div className="similar-image">
                    {item.cover_image ? (
                      <img src={item.cover_image} alt={item.name} />
                    ) : (
                      <span>{item.name.slice(0, 1)}</span>
                    )}
                  </div>

                  <div className="similar-content">
                    <small>{item.region || "Kapadokya"} · {getCategoryName(item.categories)}</small>
                    <h3>{item.name}</h3>
                    <strong>{formatPrice(item.price_level)}</strong>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer>
        <div className="shell footer-content">
          <a href="/" className="brand footer-brand">
            Önce<span>Bak</span>
          </a>
          <p>Kapadokya'yı gitmeden önce keşfetmenin en seçkin yolu.</p>
          <span>© 2026 ÖnceBak</span>
        </div>
      </footer>

      {lightboxIndex !== null && gallery[lightboxIndex] && (
        <div className="lightbox" onClick={() => setLightboxIndex(null)}>
          <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>×</button>

          <button
            className="lightbox-arrow left"
            onClick={(event) => {
              event.stopPropagation();
              setLightboxIndex(
                (lightboxIndex - 1 + gallery.length) % gallery.length
              );
            }}
          >
            ‹
          </button>

          <img
            src={gallery[lightboxIndex]}
            alt={`${business.name} büyük fotoğraf`}
            onClick={(event) => event.stopPropagation()}
          />

          <button
            className="lightbox-arrow right"
            onClick={(event) => {
              event.stopPropagation();
              setLightboxIndex((lightboxIndex + 1) % gallery.length);
            }}
          >
            ›
          </button>

          <span className="lightbox-counter">
            {lightboxIndex + 1} / {gallery.length}
          </span>
        </div>
      )}

      <div className="mobile-action-bar">
        {phone && <a href={`tel:${phone}`}>Ara</a>}
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp.replace("+", "")}`}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
        )}
        {business.google_maps_url && (
          <a href={business.google_maps_url} target="_blank" rel="noreferrer">
            Yol Tarifi
          </a>
        )}
      </div>

      <GlobalStyles />
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function GlobalStyles() {
  return (
    <style jsx global>{`
      :root {
        --ink: #171412;
        --muted: #746d67;
        --line: #e9e3dd;
        --paper: #f7f3ee;
        --white: #ffffff;
        --accent: #ff5a1f;
        --dark: #181513;
      }

      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body {
        margin: 0;
        background: var(--paper);
        color: var(--ink);
        font-family: Arial, Helvetica, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      button, a { -webkit-tap-highlight-color: transparent; }
      button { font: inherit; }
      a { color: inherit; }
      .shell { width: min(1180px, calc(100% - 44px)); margin: 0 auto; }

      .state-page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: var(--paper);
      }
      .state-card {
        width: min(460px, 100%);
        padding: 42px 28px;
        border: 1px solid var(--line);
        border-radius: 24px;
        background: white;
        text-align: center;
        box-shadow: 0 25px 70px rgba(40, 26, 18, .08);
      }
      .state-card strong { display: block; font-family: Georgia, serif; font-size: 30px; }
      .state-card p { color: var(--muted); line-height: 1.6; }
      .state-card a {
        display: inline-block;
        margin-top: 12px;
        padding: 13px 18px;
        border-radius: 999px;
        background: var(--accent);
        color: white;
        font-weight: 900;
        text-decoration: none;
      }
      .loader {
        width: 36px;
        height: 36px;
        display: block;
        margin: 0 auto 22px;
        border: 3px solid #eee5df;
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin .8s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }

      .topbar {
        position: absolute;
        z-index: 20;
        top: 0;
        left: 0;
        right: 0;
        border-bottom: 1px solid rgba(255,255,255,.14);
        color: white;
      }
      .nav {
        min-height: 78px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 26px;
      }
      .brand {
        color: white;
        font-size: 26px;
        font-weight: 950;
        letter-spacing: -1.4px;
        text-decoration: none;
      }
      .brand span { color: var(--accent); }
      .nav-links { display: flex; gap: 28px; }
      .nav-links a {
        color: rgba(255,255,255,.75);
        font-size: 13px;
        font-weight: 800;
        text-decoration: none;
      }
      .favorite-top {
        padding: 11px 15px;
        border: 1px solid rgba(255,255,255,.35);
        border-radius: 999px;
        background: rgba(20,16,13,.25);
        color: white;
        font-size: 12px;
        font-weight: 900;
        cursor: pointer;
        backdrop-filter: blur(12px);
      }
      .favorite-top.active { background: var(--accent); border-color: var(--accent); }

      .hero {
        position: relative;
        min-height: 660px;
        display: flex;
        align-items: flex-end;
        overflow: hidden;
        background: #513b30;
        color: white;
      }
      .hero-background {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 70% 30%, #9d6c4f, transparent 28%),
          linear-gradient(145deg, #a1765e, #2c211c);
        background-position: center;
        background-size: cover;
        transform: scale(1.02);
      }
      .hero-overlay {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(180deg, rgba(10,8,6,.30) 0%, rgba(10,8,6,.10) 35%, rgba(10,8,6,.88) 100%);
      }
      .hero-content {
        position: relative;
        z-index: 2;
        width: 100%;
        padding-bottom: 72px;
      }
      .back-link {
        position: absolute;
        bottom: 250px;
        color: rgba(255,255,255,.78);
        font-size: 12px;
        font-weight: 850;
        text-decoration: none;
      }
      .hero-bottom {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 40px;
      }
      .badges { display: flex; flex-wrap: wrap; gap: 8px; }
      .badge {
        padding: 8px 11px;
        border-radius: 999px;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .8px;
        text-transform: uppercase;
      }
      .badge.premium { background: var(--accent); color: white; }
      .badge.verified { background: #eff8ff; color: #175cd3; }
      .badge.neutral {
        border: 1px solid rgba(255,255,255,.32);
        background: rgba(20,16,13,.32);
        color: white;
        backdrop-filter: blur(10px);
      }
      .hero h1 {
        max-width: 850px;
        margin: 18px 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: clamp(52px, 7vw, 86px);
        font-weight: 500;
        line-height: .95;
        letter-spacing: -4px;
      }
      .hero-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 22px;
        color: rgba(255,255,255,.78);
        font-size: 13px;
        font-weight: 750;
      }
      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 10px;
      }
      .action {
        min-width: 115px;
        padding: 14px 17px;
        border-radius: 999px;
        text-align: center;
        font-size: 12px;
        font-weight: 900;
        text-decoration: none;
      }
      .action.primary { background: var(--accent); color: white; }
      .action.secondary {
        border: 1px solid rgba(255,255,255,.32);
        background: rgba(20,16,13,.34);
        color: white;
        backdrop-filter: blur(12px);
      }

      .gallery-section { padding: 28px 0 0; background: var(--paper); }
      .gallery-grid {
        display: grid;
        grid-template-columns: 1.4fr .6fr;
        gap: 10px;
        height: 430px;
        overflow: hidden;
        border-radius: 24px;
      }
      .gallery-grid button {
        position: relative;
        overflow: hidden;
        padding: 0;
        border: none;
        background: #ddd;
        cursor: pointer;
      }
      .gallery-grid img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        transition: transform .4s ease;
      }
      .gallery-grid button:hover img { transform: scale(1.035); }
      .gallery-side {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .more-photos {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        background: rgba(17,14,12,.62);
        color: white;
        font-size: 13px;
        font-weight: 900;
      }

      .content-section { padding: 78px 0 100px; }
      .content-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        align-items: start;
        gap: 36px;
      }
      .main-column { display: grid; gap: 22px; }
      .content-card {
        padding: 34px;
        border: 1px solid var(--line);
        border-radius: 24px;
        background: white;
        box-shadow: 0 18px 55px rgba(46,30,20,.04);
      }
      .eyebrow {
        display: block;
        margin-bottom: 13px;
        color: var(--accent);
        font-size: 10px;
        font-weight: 950;
        letter-spacing: 1.7px;
      }
      .eyebrow.light { color: #ffd0bc; }
      .content-card h2, .menu-card h2, .section-heading h2 {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 38px;
        font-weight: 500;
        line-height: 1.08;
        letter-spacing: -1.5px;
      }
      .content-card p {
        margin: 18px 0 0;
        color: var(--muted);
        font-size: 15px;
        line-height: 1.9;
      }
      .features-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-top: 26px;
      }
      .feature {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 15px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: #fbf9f6;
        font-size: 12px;
      }
      .feature span {
        width: 28px;
        height: 28px;
        display: grid;
        place-items: center;
        border-radius: 9px;
        background: #fff0e9;
        color: var(--accent);
        font-weight: 950;
      }
      .menu-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 30px;
        padding: 38px;
        border-radius: 24px;
        background: var(--accent);
        color: white;
        box-shadow: 0 22px 65px rgba(255,90,31,.20);
      }
      .menu-card p { color: rgba(255,255,255,.74); line-height: 1.7; }
      .menu-card a {
        flex: none;
        padding: 14px 18px;
        border-radius: 999px;
        background: var(--dark);
        color: white;
        font-size: 12px;
        font-weight: 900;
        text-decoration: none;
      }
      .map-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 30px;
      }
      .map-card a {
        flex: none;
        padding: 13px 17px;
        border-radius: 999px;
        background: var(--dark);
        color: white;
        font-size: 12px;
        font-weight: 900;
        text-decoration: none;
      }

      .sticky-card { position: sticky; top: 24px; }
      .info-card {
        padding: 27px;
        border: 1px solid var(--line);
        border-radius: 24px;
        background: white;
        box-shadow: 0 22px 60px rgba(46,30,20,.07);
      }
      .info-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 13px 0;
        border-bottom: 1px solid #f0ece8;
      }
      .info-row span { color: var(--muted); font-size: 12px; }
      .info-row strong { font-size: 12px; text-align: right; }
      .divider { height: 1px; margin: 17px 0; background: var(--line); }
      .hours > strong { display: block; margin-bottom: 10px; font-size: 13px; }
      .hours > div {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 0;
        color: var(--muted);
        font-size: 11px;
      }
      .hours b { color: var(--ink); font-weight: 800; }
      .contact-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 9px;
        margin-top: 22px;
      }
      .contact-buttons a {
        padding: 12px 10px;
        border: 1px solid var(--line);
        border-radius: 11px;
        background: #fbf9f6;
        color: var(--ink);
        font-size: 10px;
        font-weight: 900;
        text-align: center;
        text-decoration: none;
      }
      .contact-buttons a:first-child {
        background: var(--accent);
        border-color: var(--accent);
        color: white;
      }

      .similar-section { padding: 90px 0; background: white; }
      .section-heading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 34px;
      }
      .section-heading a {
        color: var(--accent);
        font-size: 12px;
        font-weight: 900;
        text-decoration: none;
      }
      .similar-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }
      .similar-card {
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 20px;
        background: white;
        text-decoration: none;
        transition: transform .2s ease, box-shadow .2s ease;
      }
      .similar-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 22px 55px rgba(46,30,20,.08);
      }
      .similar-image {
        height: 210px;
        display: grid;
        place-items: center;
        overflow: hidden;
        background: #e8ddd4;
        color: var(--accent);
        font-family: Georgia, serif;
        font-size: 54px;
      }
      .similar-image img { width: 100%; height: 100%; object-fit: cover; }
      .similar-content { padding: 18px; }
      .similar-content small { color: var(--muted); font-size: 10px; }
      .similar-content h3 {
        margin: 7px 0 14px;
        font-family: Georgia, serif;
        font-size: 22px;
        font-weight: 500;
      }
      .similar-content strong { color: var(--accent); font-size: 13px; }

      footer { padding: 56px 0; background: var(--dark); color: white; }
      .footer-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 30px;
      }
      .footer-content p { color: rgba(255,255,255,.45); font-size: 12px; }
      .footer-content > span { color: rgba(255,255,255,.35); font-size: 10px; }

      .lightbox {
        position: fixed;
        z-index: 500;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 40px 80px;
        background: rgba(8,7,6,.95);
      }
      .lightbox img {
        max-width: 100%;
        max-height: 86vh;
        border-radius: 12px;
        object-fit: contain;
      }
      .lightbox-close {
        position: absolute;
        top: 24px;
        right: 28px;
        width: 45px;
        height: 45px;
        border: 1px solid rgba(255,255,255,.22);
        border-radius: 50%;
        background: rgba(255,255,255,.08);
        color: white;
        font-size: 28px;
        cursor: pointer;
      }
      .lightbox-arrow {
        position: absolute;
        top: 50%;
        width: 48px;
        height: 48px;
        border: 1px solid rgba(255,255,255,.22);
        border-radius: 50%;
        background: rgba(255,255,255,.08);
        color: white;
        font-size: 30px;
        cursor: pointer;
      }
      .lightbox-arrow.left { left: 22px; }
      .lightbox-arrow.right { right: 22px; }
      .lightbox-counter {
        position: absolute;
        bottom: 22px;
        color: rgba(255,255,255,.7);
        font-size: 12px;
      }

      .mobile-action-bar { display: none; }

      @media (max-width: 950px) {
        .nav-links { display: none; }
        .hero { min-height: 600px; }
        .hero-bottom { align-items: flex-start; flex-direction: column; }
        .hero-actions { justify-content: flex-start; }
        .gallery-grid { grid-template-columns: 1fr; height: auto; }
        .gallery-main { height: 380px; }
        .gallery-side { height: 220px; }
        .content-grid { grid-template-columns: 1fr; }
        .sticky-card { position: static; }
        .similar-grid { grid-template-columns: repeat(2, 1fr); }
      }

      @media (max-width: 650px) {
        .shell { width: min(100% - 24px, 1180px); }
        .topbar { position: absolute; }
        .nav { min-height: 68px; }
        .favorite-top { padding: 9px 11px; font-size: 10px; }
        .hero { min-height: 600px; }
        .hero-content { padding-bottom: 44px; }
        .back-link { bottom: 260px; }
        .hero h1 { font-size: 50px; letter-spacing: -2.5px; }
        .hero-meta { gap: 12px; font-size: 11px; }
        .hero-actions { width: 100%; display: grid; grid-template-columns: repeat(2, 1fr); }
        .action { min-width: 0; }
        .gallery-section { padding-top: 12px; }
        .gallery-grid { border-radius: 18px; }
        .gallery-main { height: 285px; }
        .gallery-side { height: 190px; }
        .content-section { padding: 55px 0 80px; }
        .content-card { padding: 25px 21px; border-radius: 19px; }
        .content-card h2, .menu-card h2, .section-heading h2 { font-size: 32px; }
        .features-grid { grid-template-columns: 1fr; }
        .menu-card, .map-card { align-items: flex-start; flex-direction: column; padding: 27px 22px; }
        .contact-buttons { grid-template-columns: 1fr; }
        .similar-section { padding: 70px 0 100px; }
        .section-heading { align-items: flex-start; flex-direction: column; }
        .similar-grid { grid-template-columns: 1fr; }
        .footer-content { align-items: flex-start; flex-direction: column; }
        .lightbox { padding: 55px 14px; }
        .lightbox-arrow { width: 40px; height: 40px; }
        .lightbox-arrow.left { left: 7px; }
        .lightbox-arrow.right { right: 7px; }
        .mobile-action-bar {
          position: fixed;
          z-index: 100;
          left: 10px;
          right: 10px;
          bottom: 10px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 7px;
          padding: 8px;
          border: 1px solid rgba(255,255,255,.5);
          border-radius: 16px;
          background: rgba(255,255,255,.92);
          box-shadow: 0 18px 55px rgba(30,20,14,.20);
          backdrop-filter: blur(16px);
        }
        .mobile-action-bar a {
          padding: 12px 6px;
          border-radius: 10px;
          background: var(--dark);
          color: white;
          font-size: 10px;
          font-weight: 900;
          text-align: center;
          text-decoration: none;
        }
        .mobile-action-bar a:nth-child(2) { background: var(--accent); }
      }
    `}</style>
  );
}
