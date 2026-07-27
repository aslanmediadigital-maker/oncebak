"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Place = {
  id: string;
  name: string;
  region: string;
  category: string;
  price: string;
  rating: number;
  badge: string;
  theme: string;
  coverImage: string | null;
};

type DbBusiness = {
  id: string;
  name: string;
  region: string | null;
  price_level: number | null;
  rating: number | string | null;
  verified: boolean | null;
  featured: boolean | null;
  cover_image: string | null;
  categories: { name: string } | { name: string }[] | null;
};

const themes = ["sunset", "cave", "balloon-card", "garden", "night", "valley"];

function getCategoryName(category: DbBusiness["categories"]): string {
  if (Array.isArray(category)) {
    return category[0]?.name ?? "Restoran";
  }

  return category?.name ?? "Restoran";
}

function getPriceText(priceLevel: number | null): string {
  if (priceLevel === null || priceLevel <= 0) {
    return "Fiyat belirtilmedi";
  }

  return `${priceLevel.toLocaleString("tr-TR")}₺`;
}

function getBadge(business: DbBusiness): string {
  if (business.featured) return "Öne Çıkan";
  if (business.verified) return "Doğrulanmış";
  return "Yeni";
}

const categories = [
  ["🍽️", "Restoran", "120+ mekân"],
  ["☕", "Kafe", "85+ mekân"],
  ["🥐", "Kahvaltı", "60+ mekân"],
  ["🏨", "Otel", "45+ tesis"],
  ["🎈", "Aktivite", "30+ deneyim"],
  ["✨", "Tümü", "Tüm işletmeler"],
];

export default function Home() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [region, setRegion] = useState("Tümü");
  const [category, setCategory] = useState("Tümü");
  const [price, setPrice] = useState("Tümü");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadBusinesses() {
      setLoading(true);
      setLoadError("");

      const { data, error } = await supabase
        .from("businesses")
        .select(
          "id, name, region, price_level, rating, verified, featured, cover_image, categories(name)"
        )
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("İşletmeler alınamadı:", error);
        setLoadError("İşletmeler şu anda yüklenemedi.");
        setPlaces([]);
        setLoading(false);
        return;
      }

      const mappedPlaces: Place[] = ((data ?? []) as unknown as DbBusiness[]).map(
        (business, index) => ({
          id: business.id,
          name: business.name,
          region: business.region ?? "Kapadokya",
          category: getCategoryName(business.categories),
          price: getPriceText(business.price_level),
          rating: Number(business.rating ?? 0),
          badge: getBadge(business),
          theme: themes[index % themes.length],
          coverImage: business.cover_image,
        })
      );

      setPlaces(mappedPlaces);
      setLoading(false);
    }

    loadBusinesses();

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return places.filter((place) => {
      const regionOk = region === "Tümü" || place.region === region;
      const categoryOk = category === "Tümü" || place.category === category;
      const numericPrice = Number(place.price.replace("₺", ""));
      const priceOk =
        price === "Tümü" ||
        (price === "Ekonomik" && numericPrice < 250) ||
        (price === "Orta" && numericPrice >= 250 && numericPrice <= 400) ||
        (price === "Premium" && numericPrice > 400);
      return regionOk && categoryOk && priceOk;
    });
  }, [places, region, category, price]);

  function toggleFavorite(id: string) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  return (
    <main>
      <header className="topbar">
        <div className="container nav">
          <a href="#" className="logo">Önce<span>Bak</span></a>

          <nav className="desktop-nav">
            <a href="#">Ana Sayfa</a>
            <a href="#mekanlar">Mekânlar</a>
            <a href="#kategoriler">Kategoriler</a>
            <a href="#isletme">İşletmeni Ekle</a>
          </nav>

          <div className="nav-actions">
            <button className="round-button" aria-label="Favoriler">
              ♡
              {favorites.length > 0 && <span className="favorite-count">{favorites.length}</span>}
            </button>
            <button
              className="round-button mobile-button"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menü"
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="mobile-nav">
            <a href="#">Ana Sayfa</a>
            <a href="#mekanlar">Mekânlar</a>
            <a href="#kategoriler">Kategoriler</a>
            <a href="#isletme">İşletmeni Ekle</a>
          </nav>
        )}
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">📍 Kapadokya’nın yerel keşif platformu</span>
            <h1>Gitmeden önce <span>ÖnceBak.</span></h1>
            <p>
              Restoranları, kafeleri ve aktiviteleri güncel fiyatları,
              gerçek menüleri ve doğrulanmış bilgileriyle keşfet.
            </p>
            <div className="hero-buttons">
              <a className="primary-button" href="#mekanlar">Mekânları keşfet <b>→</b></a>
              <a className="secondary-button" href="#isletme">İşletmeni ekle</a>
            </div>
          </div>

          <div className="hero-art" aria-label="Kapadokya manzarası">
            <div className="sun" />
            <div className="balloon balloon-one" />
            <div className="balloon balloon-two" />
            <div className="balloon balloon-three" />
            <div className="mountain mountain-one" />
            <div className="mountain mountain-two" />
            <div className="mountain mountain-three" />
            <div className="floating-card card-top">
              <b>Güncel menüler</b>
              <small>Son kontrol: bugün</small>
            </div>
            <div className="floating-card card-bottom">
              <b>⭐ 4.8</b>
              <small>320 doğrulanmış değerlendirme</small>
            </div>
          </div>
        </div>
      </section>

      <section className="search-wrap">
        <div className="container">
          <div className="search-panel">
            <Select label="Bölge" value={region} onChange={setRegion} options={["Tümü", "Göreme", "Ürgüp", "Uçhisar", "Avanos"]} />
            <Select label="Kategori" value={category} onChange={setCategory} options={["Tümü", "Restoran", "Kafe", "Kahvaltı"]} />
            <Select label="Fiyat" value={price} onChange={setPrice} options={["Tümü", "Ekonomik", "Orta", "Premium"]} />
            <a href="#mekanlar" className="search-button">⌕ Ara</a>
          </div>
        </div>
      </section>

      <section id="kategoriler" className="section">
        <div className="container">
          <div className="section-heading">
            <h2>Popüler kategoriler</h2>
            <p>Ne aradığını seç, sana uygun yerleri hemen gösterelim.</p>
          </div>

          <div className="category-grid">
            {categories.map(([emoji, name, count]) => (
              <button
                key={name}
                className={`category-card ${category === name ? "selected" : ""}`}
                onClick={() => setCategory(name)}
              >
                <span className="category-icon">{emoji}</span>
                <b>{name}</b>
                <small>{count}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="mekanlar" className="section places-section">
        <div className="container">
          <div className="section-heading row-heading">
            <div>
              <h2>Öne çıkan mekânlar</h2>
              <p>
                {loading
                  ? "İşletmeler yükleniyor..."
                  : `${filtered.length} doğrulanmış sonuç gösteriliyor.`}
              </p>
            </div>
            <a href="#mekanlar">Tümünü gör →</a>
          </div>

          {loadError ? (
            <div className="empty-state">
              <b>Bağlantı hatası</b>
              <p>{loadError}</p>
            </div>
          ) : loading ? (
            <div className="empty-state">
              <b>Yükleniyor</b>
              <p>İşletmeler veritabanından getiriliyor.</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="places-grid">
              {filtered.map((place) => (
                <article key={place.id} className="place-card">
                  <div
                    className={`place-image ${place.theme}`}
                    style={
                      place.coverImage
                        ? {
                            backgroundImage: `url("${place.coverImage}")`,
                            backgroundPosition: "center",
                            backgroundSize: "cover",
                          }
                        : undefined
                    }
                  >
                    <span className="place-badge">{place.badge}</span>
                    <button
                      className={`heart ${favorites.includes(place.id) ? "active" : ""}`}
                      onClick={() => toggleFavorite(place.id)}
                      aria-label="Favoriye ekle"
                    >
                      {favorites.includes(place.id) ? "♥" : "♡"}
                    </button>
                    {!place.coverImage && (
                      <div className="mini-landscape"><i /><i /><i /></div>
                    )}
                  </div>

                  <div className="place-content">
                    <div className="place-title-row">
                      <h3>{place.name}</h3>
                      <b>⭐ {place.rating.toFixed(1)}</b>
                    </div>
                    <p>{place.region} · {place.category}</p>
                    <div className="price-row">
                      <span>Kişi başı ortalama</span>
                      <strong>{place.price}</strong>
                    </div>
                    <button className="menu-button">Menüyü gör →</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <b>Sonuç bulunamadı</b>
              <p>Filtreleri değiştirerek yeniden deneyebilirsin.</p>
            </div>
          )}
        </div>
      </section>

      <section className="benefits">
        <div className="container benefits-grid">
          <Benefit icon="✓" title="Doğrulanmış bilgiler" text="Yayın öncesi bilgiler kontrol edilir." />
          <Benefit icon="↻" title="Güncel fiyatlar" text="Son güncelleme tarihi açıkça gösterilir." />
          <Benefit icon="☷" title="Gerçek menüler" text="Menüler doğrudan işletmelerden alınır." />
          <Benefit icon="◉" title="Kolay iletişim" text="Tek tıkla WhatsApp, telefon ve konum." />
        </div>
      </section>

      <section id="isletme" className="business-section">
        <div className="container business-box">
          <div>
            <h2>İşletmeni ÖnceBak’a ekle</h2>
            <p>Menünü, fiyatlarını ve iletişim bilgilerini potansiyel müşterilere göster.</p>
          </div>
          <button>Ücretsiz başvuru yap</button>
        </div>
      </section>

      <footer>
        <div className="container footer-grid">
          <div>
            <a className="footer-logo" href="#">Önce<span>Bak</span></a>
            <p>Kapadokya’daki mekânları, menüleri ve güncel fiyatları gitmeden önce keşfet.</p>
          </div>
          <FooterColumn title="Keşfet" links={["Mekânlar", "Kategoriler", "Bölgeler"]} />
          <FooterColumn title="İşletmeler" links={["İşletmeni ekle", "Premium profil", "Reklam seçenekleri"]} />
          <FooterColumn title="İletişim" links={["info@öncebak.com", "Göreme, Nevşehir", "Instagram"]} />
        </div>
        <div className="container copyright">© 2026 ÖnceBak. Tüm hakları saklıdır.</div>
      </footer>
    </main>
  );
}

function Select({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="select-box">
      <small>{label}</small>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Benefit({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="benefit-card">
      <span>{icon}</span>
      <b>{title}</b>
      <p>{text}</p>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="footer-column">
      <b>{title}</b>
      {links.map((link) => <a href="#" key={link}>{link}</a>)}
    </div>
  );
}
