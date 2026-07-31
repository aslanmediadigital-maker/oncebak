"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";
import SiteHeader from "../../components/SiteHeader";

export type Business = {
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
  menu_images: string[] | null;
  menu_updated_at: string | null;
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

function isPdfUrl(value: string | null) {
  if (!value) return false;
  return /\.pdf(?:$|[?#])/i.test(value);
}

function isImageUrl(value: string | null) {
  if (!value) return false;
  return /\.(?:png|jpe?g|webp|gif|avif)(?:$|[?#])/i.test(value);
}

function formatMenuDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function BusinessDetailPage({
  initialBusiness,
}: {
  initialBusiness: Business | null;
}) {
  const business = initialBusiness;
  const [similar, setSimilar] = useState<Business[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [menuViewerOpen, setMenuViewerOpen] = useState(false);
  const [menuPageIndex, setMenuPageIndex] = useState(0);
  const [failedMenuImages, setFailedMenuImages] = useState<string[]>([]);
  const menuCloseButtonRef = useRef<HTMLButtonElement>(null);
  const menuDialogRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuTouchStartX = useRef<number | null>(null);

  useEffect(() => {
    setSimilar([]);
    if (!business) return;

    const current = business;
    let active = true;

    function loadFavorite() {
      const stored = window.localStorage.getItem("oncebak-favorites");
      if (stored) {
        try {
          const ids = JSON.parse(stored) as Array<string | number>;
          setFavorite(ids.map(String).includes(String(current.id)));
        } catch {
          setFavorite(false);
        }
      } else {
        setFavorite(false);
      }
    }

    async function loadSimilar() {
      const categoryName = getCategoryName(current.categories);

      const { data: similarData } = await supabase
        .from("businesses")
        .select(
          "id, name, slug, description, region, address, phone, whatsapp, instagram, website, google_maps_url, menu_url, menu_images, menu_updated_at, opening_hours, features, gallery, price_level, rating, verified, featured, cover_image, categories(name)"
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
      }
    }

    loadFavorite();
    void loadSimilar();

    return () => {
      active = false;
    };
  }, [business]);

  const gallery = useMemo(() => {
    if (!business) return [];

    const images = [
      business.cover_image,
      ...(Array.isArray(business.gallery) ? business.gallery : []),
    ].filter((item): item is string => Boolean(item));

    return Array.from(new Set(images));
  }, [business]);

  const menuImages = useMemo(() => {
    if (!business) return [];
    const galleryMenuImages = Array.isArray(business.menu_images)
      ? business.menu_images.filter(
          (item): item is string =>
            typeof item === "string" &&
            isImageUrl(item) &&
            !failedMenuImages.includes(item)
        )
      : [];

    if (galleryMenuImages.length > 0) return galleryMenuImages;
    if (
      isImageUrl(business.menu_url) &&
      !failedMenuImages.includes(business.menu_url as string)
    ) {
      return [business.menu_url as string];
    }
    return [];
  }, [business, failedMenuImages]);

  const legacyMenuUrl =
    business?.menu_url && !isImageUrl(business.menu_url)
      ? business.menu_url
      : null;
  const menuUpdatedLabel = formatMenuDate(business?.menu_updated_at ?? null);
  const hasMenu = menuImages.length > 0 || Boolean(legacyMenuUrl);

  useEffect(() => {
    if (!menuViewerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuCloseButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuViewerOpen(false);
      } else if (event.key === "ArrowRight") {
        setMenuPageIndex((current) =>
          menuImages.length ? (current + 1) % menuImages.length : 0
        );
      } else if (event.key === "ArrowLeft") {
        setMenuPageIndex((current) =>
          menuImages.length
            ? (current - 1 + menuImages.length) % menuImages.length
            : 0
        );
      } else if (event.key === "Tab") {
        const focusable = Array.from(
          menuDialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
          ) ?? []
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      menuTriggerRef.current?.focus();
    };
  }, [menuViewerOpen, menuImages.length]);

  useEffect(() => {
    if (menuPageIndex >= menuImages.length) {
      setMenuPageIndex(Math.max(0, menuImages.length - 1));
    }
    if (menuViewerOpen && menuImages.length === 0) {
      setMenuViewerOpen(false);
    }
  }, [menuImages.length, menuPageIndex, menuViewerOpen]);

  function markMenuImageFailed(url: string) {
    setFailedMenuImages((current) =>
      current.includes(url) ? current : [...current, url]
    );
  }

  function openMenuViewer() {
    setMenuPageIndex(0);
    setMenuViewerOpen(true);
  }

  function showPreviousMenuPage() {
    setMenuPageIndex((current) =>
      (current - 1 + menuImages.length) % menuImages.length
    );
  }

  function showNextMenuPage() {
    setMenuPageIndex((current) => (current + 1) % menuImages.length);
  }

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

  if (!business) {
    return (
      <main className="state-page">
        <div className="state-card">
          <strong>İşletme bulunamadı</strong>
          <p>İşletme bulunamadı veya bilgiler yüklenemedi.</p>
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
      <SiteHeader />

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

              {hasMenu && (
                <a
                  href="#menu"
                  className="action secondary"
                >
                  Menüyü Gör
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

              <button
                type="button"
                className={`action secondary favorite-action ${
                  favorite ? "active" : ""
                }`}
                onClick={toggleFavorite}
              >
                {favorite ? "♥ Favorilerde" : "♡ Favoriye Ekle"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="gallery-section">
          <div className="shell">
            <div className={`gallery-grid ${gallery.length === 1 ? "single" : ""}`}>
              <button className="gallery-main" onClick={() => setLightboxIndex(0)}>
                <img src={gallery[0]} alt={business.name} />
              </button>

              {gallery.length > 1 && (
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
              )}

              <button
                type="button"
                className="all-photos-button"
                onClick={() => setLightboxIndex(0)}
              >
                Tüm fotoğrafları gör · {gallery.length}
              </button>
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

            {hasMenu && (
              <section className="ob-menu-card" id="menu">
                <div className="ob-menu-card__copy">
                  <span className="ob-menu-card__eyebrow">MENÜ &amp; FİYATLAR</span>
                  <h2>Güncel menüyü inceleyin</h2>
                  {menuUpdatedLabel && (
                    <p className="ob-menu-card__date">
                      Son güncelleme: {menuUpdatedLabel}
                    </p>
                  )}
                  <p>
                    Ürünleri ve güncel fiyatları menü sayfaları arasında rahatça
                    gezinerek inceleyin.
                  </p>

                  {menuImages.length > 0 && (
                    <span className="ob-menu-card__count">
                      {menuImages.length} menü sayfası
                    </span>
                  )}

                  <div className="ob-menu-card__actions">
                    {menuImages.length > 0 && (
                      <button
                        type="button"
                        ref={menuTriggerRef}
                        onClick={openMenuViewer}
                        className="ob-menu-card__primary"
                      >
                        Menüyü Görüntüle
                      </button>
                    )}
                    {legacyMenuUrl && (
                      <a
                        href={legacyMenuUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ob-menu-card__secondary"
                      >
                        {isPdfUrl(legacyMenuUrl)
                          ? "PDF Olarak Aç"
                          : "Harici Menüyü Aç"}
                      </a>
                    )}
                  </div>
                </div>

                {menuImages.length > 0 ? (
                  <button
                    type="button"
                    className="ob-menu-card__preview"
                    onClick={openMenuViewer}
                    aria-label={`${business.name} menüsünü görüntüle`}
                  >
                    <img
                      src={menuImages[0]}
                      alt={`${business.name} menü önizlemesi`}
                      loading="lazy"
                      onError={() => markMenuImageFailed(menuImages[0])}
                    />
                    <span>Menüyü aç</span>
                  </button>
                ) : (
                  <a
                    href={legacyMenuUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="ob-menu-card__external"
                  >
                    <span>{isPdfUrl(legacyMenuUrl) ? "PDF MENÜ" : "MENÜ"}</span>
                    <strong>Güncel menüyü yeni sekmede açın</strong>
                  </a>
                )}
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
          <a href="/" className="footer-brand">
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

      {menuViewerOpen && menuImages[menuPageIndex] && (
        <div
          className="ob-menu-viewer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ob-menu-viewer-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMenuViewerOpen(false);
          }}
        >
          <div
            className="ob-menu-viewer__panel"
            ref={menuDialogRef}
            onTouchStart={(event) => {
              menuTouchStartX.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const startX = menuTouchStartX.current;
              const endX = event.changedTouches[0]?.clientX;
              menuTouchStartX.current = null;
              if (
                startX === null ||
                endX === undefined ||
                Math.abs(startX - endX) < 45 ||
                menuImages.length < 2
              ) {
                return;
              }
              if (startX > endX) showNextMenuPage();
              else showPreviousMenuPage();
            }}
          >
            <header className="ob-menu-viewer__header">
              <div>
                <span>MENÜ &amp; FİYATLAR</span>
                <strong id="ob-menu-viewer-title">{business.name}</strong>
              </div>
              <span className="ob-menu-viewer__counter" aria-live="polite">
                {menuPageIndex + 1} / {menuImages.length}
              </span>
              <button
                type="button"
                ref={menuCloseButtonRef}
                className="ob-menu-viewer__close"
                onClick={() => setMenuViewerOpen(false)}
                aria-label="Menü görüntüleyiciyi kapat"
              >
                ×
              </button>
            </header>

            <div className="ob-menu-viewer__stage">
              {menuImages.length > 1 && (
                <button
                  type="button"
                  className="ob-menu-viewer__arrow ob-menu-viewer__arrow--left"
                  onClick={showPreviousMenuPage}
                  aria-label="Önceki menü sayfası"
                >
                  ‹
                </button>
              )}

              <img
                className="ob-menu-viewer__image"
                src={menuImages[menuPageIndex]}
                alt={`${business.name} menü sayfası ${menuPageIndex + 1}`}
                onError={() => markMenuImageFailed(menuImages[menuPageIndex])}
              />

              {menuImages.length > 1 && (
                <button
                  type="button"
                  className="ob-menu-viewer__arrow ob-menu-viewer__arrow--right"
                  onClick={showNextMenuPage}
                  aria-label="Sonraki menü sayfası"
                >
                  ›
                </button>
              )}
            </div>

            {menuImages.length > 1 && (
              <div
                className="ob-menu-viewer__thumbs"
                aria-label="Menü sayfaları"
              >
                {menuImages.map((image, index) => (
                  <button
                    type="button"
                    key={image}
                    className={
                      index === menuPageIndex
                        ? "ob-menu-viewer__thumb is-active"
                        : "ob-menu-viewer__thumb"
                    }
                    onClick={() => setMenuPageIndex(index)}
                    aria-label={`${index + 1}. menü sayfasına git`}
                    aria-current={index === menuPageIndex ? "page" : undefined}
                  >
                    <img
                      src={image}
                      alt=""
                      onError={() => markMenuImageFailed(image)}
                    />
                    <span>{index + 1}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
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

      .footer-brand {
        color: white;
        font-size: 26px;
        font-weight: 950;
        letter-spacing: -1.4px;
        text-decoration: none;
      }
      .footer-brand span { color: var(--accent); }

      .hero {
        position: relative;
        min-height: 500px;
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
        background-position: center center;
        background-size: cover;
        transform: scale(1);
      }
      .hero-overlay {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(180deg, rgba(10,8,6,.34) 0%, rgba(10,8,6,.12) 34%, rgba(10,8,6,.92) 100%),
          linear-gradient(90deg, rgba(10,8,6,.44), transparent 58%);
      }
      .hero-content {
        position: relative;
        z-index: 2;
        width: 100%;
        padding-bottom: 48px;
      }
      .back-link {
        position: absolute;
        bottom: 205px;
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
        font-size: clamp(42px, 5vw, 64px);
        font-weight: 500;
        line-height: 1;
        letter-spacing: -2.8px;
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
        min-width: 118px;
        padding: 14px 18px;
        border-radius: 13px;
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
      .favorite-action { cursor: pointer; }
      .favorite-action.active {
        border-color: var(--accent);
        background: var(--accent);
      }

      .gallery-section { padding: 24px 0 0; background: var(--paper); }
      .gallery-grid {
        display: grid;
        grid-template-columns: 1.4fr .6fr;
        gap: 10px;
        position: relative;
        height: 420px;
        overflow: hidden;
        border-radius: 22px;
        box-shadow: 0 24px 70px rgba(46,30,20,.10);
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
      .gallery-grid.single { grid-template-columns: 1fr; }
      .gallery-grid.single .gallery-main { width: 100%; }
      .all-photos-button {
        position: absolute !important;
        right: 16px;
        bottom: 16px;
        z-index: 4;
        width: auto !important;
        padding: 12px 15px !important;
        border: 1px solid rgba(255,255,255,.55) !important;
        border-radius: 12px !important;
        background: rgba(18,15,13,.76) !important;
        color: white;
        font-size: 11px;
        font-weight: 900;
        backdrop-filter: blur(12px);
      }
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

      .content-section { padding: 58px 0 100px; }
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
        box-shadow: 0 18px 55px rgba(46,30,20,.055);
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
        display: grid;
        grid-template-columns: minmax(0, .82fr) minmax(280px, 1.18fr);
        align-items: stretch;
        gap: 28px;
        padding: 30px;
        border-radius: 24px;
        background: var(--accent);
        color: white;
        box-shadow: 0 22px 65px rgba(255,90,31,.20);
        scroll-margin-top: 24px;
      }
      .menu-copy {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .menu-card p { color: rgba(255,255,255,.76); line-height: 1.7; }
      .menu-copy > a {
        align-self: flex-start;
        margin-top: 10px;
        padding: 14px 18px;
        border-radius: 13px;
        background: var(--dark);
        color: white;
        font-size: 12px;
        font-weight: 900;
        text-decoration: none;
      }
      .menu-preview {
        min-height: 330px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.28);
        border-radius: 18px;
        background: rgba(255,255,255,.94);
        box-shadow: 0 18px 50px rgba(87,26,5,.18);
      }
      .menu-preview img,
      .menu-preview iframe {
        width: 100%;
        height: 100%;
        min-height: 330px;
        display: block;
        border: 0;
        object-fit: contain;
        background: white;
      }
      .menu-external {
        display: flex;
        min-height: 250px;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 28px;
        border: 1px solid rgba(255,255,255,.28);
        border-radius: 18px;
        background: rgba(255,255,255,.96);
        color: var(--ink);
        text-align: center;
        text-decoration: none;
      }
      .menu-external span {
        padding: 8px 10px;
        border-radius: 9px;
        background: #fff0e9;
        color: var(--accent);
        font-size: 10px;
        font-weight: 950;
        letter-spacing: 1px;
      }
      .menu-external strong { font-family: Georgia, serif; font-size: 24px; font-weight: 500; }
      .menu-external small { color: var(--muted); font-size: 11px; }
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
        .hero { min-height: 500px; }
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
        .hero { min-height: 600px; }
        .hero-content { padding-bottom: 34px; }
        .back-link { bottom: 220px; }
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
        .menu-card { grid-template-columns: 1fr; padding: 24px 20px; }
        .menu-preview, .menu-preview img, .menu-preview iframe { min-height: 420px; }
        .map-card { align-items: flex-start; flex-direction: column; padding: 27px 22px; }
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
