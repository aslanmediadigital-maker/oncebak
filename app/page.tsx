"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Category = {
  id: string | number;
  name: string;
};

type Business = {
  id: string | number;
  name: string;
  slug: string;
  description: string | null;
  region: string | null;
  address: string | null;
  price_level: number | null;
  rating: number | string | null;
  verified: boolean | null;
  featured: boolean | null;
  cover_image: string | null;
  menu_url: string | null;
  category_id: string | number | null;
  categories: Category | Category[] | null;
};

const REGIONS = [
  "Tüm Bölgeler",
  "Nevşehir",
  "Göreme",
  "Ürgüp",
  "Avanos",
  "Uçhisar",
  "Ortahisar",
  "Çavuşin",
];

const CATEGORY_ICONS: Record<string, string> = {
  aktivite: "/category-icons/aktivite.svg",
  aktiviteler: "/category-icons/aktivite.svg",
  "fast food": "/category-icons/fast-food.svg",
  fastfood: "/category-icons/fast-food.svg",
  "gece hayatı": "/category-icons/gece-hayati.svg",
  kafe: "/category-icons/kafe.svg",
  kafeler: "/category-icons/kafe.svg",
  kahvaltı: "/category-icons/kahvalti.svg",
  otel: "/category-icons/otel.svg",
  oteller: "/category-icons/otel.svg",
  restoran: "/category-icons/restoran.svg",
  restoranlar: "/category-icons/restoran.svg",
  tatlı: "/category-icons/tatli-pastane.svg",
  tatlıcı: "/category-icons/tatli-pastane.svg",
  tatlıcılar: "/category-icons/tatli-pastane.svg",
  pastane: "/category-icons/tatli-pastane.svg",
  "tatlı & pastane": "/category-icons/tatli-pastane.svg",
  "tatlı ve pastane": "/category-icons/tatli-pastane.svg",
};

function getCategory(value: Business["categories"]) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getCategoryName(value: Business["categories"]) {
  return getCategory(value)?.name ?? "Mekân";
}

function categoryIcon(name: string) {
  const key = name.toLocaleLowerCase("tr-TR").trim();
  return CATEGORY_ICONS[key] ?? "/category-icons/aktivite.svg";
}

function formatPrice(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Fiyat belirtilmedi";
  return `Kişi başı yaklaşık ${value.toLocaleString("tr-TR")} TL`;
}

function fallbackImage(name: string) {
  const letter = encodeURIComponent(name.trim().charAt(0).toLocaleUpperCase("tr-TR") || "Ö");
  return `https://placehold.co/1200x800/181310/fff7ef?text=${letter}`;
}

export default function HomePage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("Tüm Bölgeler");
  const [categoryId, setCategoryId] = useState("Tüm Kategoriler");
  const [activeQuery, setActiveQuery] = useState("");
  const [activeRegion, setActiveRegion] = useState("Tüm Bölgeler");
  const [activeCategory, setActiveCategory] = useState("Tüm Kategoriler");
  const [showAll, setShowAll] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setNavScrolled(window.scrollY > 24);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setMessage("");

      const [businessResult, categoryResult] = await Promise.all([
        supabase
          .from("businesses")
          .select(`
            id,
            name,
            slug,
            description,
            region,
            address,
            price_level,
            rating,
            verified,
            featured,
            cover_image,
            menu_url,
            category_id,
            categories (
              id,
              name
            )
          `)
          .order("featured", { ascending: false })
          .order("rating", { ascending: false }),
        supabase
          .from("categories")
          .select("id, name")
          .order("name", { ascending: true }),
      ]);

      if (!active) return;

      if (businessResult.error) {
        setBusinesses([]);
        setMessage(`İşletmeler yüklenemedi: ${businessResult.error.message}`);
      } else {
        setBusinesses((businessResult.data ?? []) as unknown as Business[]);
      }

      if (!categoryResult.error) {
        setCategories((categoryResult.data ?? []) as Category[]);
      }

      setLoading(false);
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    businesses.forEach((business) => {
      const category = getCategory(business.categories);
      if (!category) return;
      const key = String(category.id);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return counts;
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    const query = activeQuery.trim().toLocaleLowerCase("tr-TR");

    return businesses.filter((business) => {
      const categoryName = getCategoryName(business.categories);
      const matchesQuery =
        !query ||
        business.name.toLocaleLowerCase("tr-TR").includes(query) ||
        (business.region ?? "").toLocaleLowerCase("tr-TR").includes(query) ||
        (business.description ?? "").toLocaleLowerCase("tr-TR").includes(query) ||
        categoryName.toLocaleLowerCase("tr-TR").includes(query);

      const matchesRegion =
        activeRegion === "Tüm Bölgeler" || business.region === activeRegion;

      const matchesCategory =
        activeCategory === "Tüm Kategoriler" ||
        String(business.category_id ?? "") === activeCategory;

      return matchesQuery && matchesRegion && matchesCategory;
    });
  }, [businesses, activeQuery, activeRegion, activeCategory]);

  const visibleBusinesses = showAll
    ? filteredBusinesses
    : filteredBusinesses.slice(0, 8);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveQuery(search);
    setActiveRegion(region);
    setActiveCategory(categoryId);
    setShowAll(true);

    window.setTimeout(() => {
      document
        .getElementById("mekanlar")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function selectCategory(id: string) {
    setCategoryId(id);
    setActiveCategory(id);
    setShowAll(true);

    window.setTimeout(() => {
      document
        .getElementById("mekanlar")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  return (
    <main>
      <header className={`topbar ${navScrolled ? "scrolled" : ""}`}>
        <div className="shell nav">
          <Link href="/" className="brand" aria-label="ÖnceBak ana sayfa">
            Önce<span>Bak</span>
            <small>Gitmeden önce bak.</small>
          </Link>

          <nav className="nav-links" aria-label="Ana menü">
            <Link href="/">Ana Sayfa</Link>
            <Link href="#mekanlar">Mekânlar</Link>
            <Link href="#kategoriler">Kategoriler</Link>
            <Link href="#nasil-calisir">Nasıl Çalışır?</Link>
          </nav>

          <Link href="/iletisim" className="business-link">
            İşletmeni Tanıt
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-overlay" />

        <div className="shell hero-content">
          <span className="hero-label">KAPADOKYA&apos;YI DAHA BİLİNÇLİ KEŞFET</span>

          <h1>
            Gitmeden önce
            <strong> ÖnceBak.</strong>
          </h1>

          <p>
            Restoranları, kafeleri ve aktiviteleri güncel fiyatları,
            menüleri ve gerçek işletme bilgileriyle keşfet.
          </p>

          <form className="search-panel" onSubmit={handleSearch}>
            <label>
              <span>Nereye veya neye bakıyorsun?</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Mekân, kategori veya bölge ara"
              />
            </label>

            <label>
              <span>Bölge</span>
              <select
                value={region}
                onChange={(event) => setRegion(event.target.value)}
              >
                {REGIONS.map((item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Kategori</span>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="Tüm Kategoriler">Tüm Kategoriler</option>
                {categories.map((category) => (
                  <option value={String(category.id)} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit">Ara →</button>
          </form>

          <div className="trust-row">
            <span>✓ Güncel fiyatlar</span>
            <span>✓ Gerçek menüler</span>
            <span>✓ Doğrulanmış bilgiler</span>
            <span>✓ Tek tıkla iletişim</span>
          </div>
        </div>
      </section>

      <section className="category-section" id="kategoriler">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="eyebrow">NE ARIYORSUN?</span>
              <h2>Popüler kategoriler</h2>
            </div>
            <p>
              Kapadokya&apos;da aradığın deneyime göre mekânları hızla filtrele.
            </p>
          </div>

          <div className="category-grid">
            {categories.slice(0, 8).map((category) => (
              <button
                type="button"
                className="category-card"
                key={category.id}
                onClick={() => selectCategory(String(category.id))}
              >
                <span className="category-icon">
                  <img
                    src={categoryIcon(category.name)}
                    alt={category.name}
                    width={30}
                    height={30}
                  />
                </span>
                <strong>{category.name}</strong>
                <small>
                  {categoryCounts.get(String(category.id)) ?? 0} işletme
                </small>
                <i>→</i>
              </button>
            ))}

            {!loading && categories.length === 0 && (
              <div className="empty-category">
                Henüz kategori eklenmemiş.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="business-section" id="mekanlar">
        <div className="shell">
          <div className="section-heading business-heading">
            <div>
              <span className="eyebrow">KEŞFETMEYE BAŞLA</span>
              <h2>
                {activeQuery ||
                activeRegion !== "Tüm Bölgeler" ||
                activeCategory !== "Tüm Kategoriler"
                  ? "Arama sonuçları"
                  : "Öne çıkan mekânlar"}
              </h2>
            </div>

            <div className="result-info">
              <strong>{filteredBusinesses.length}</strong>
              <span>işletme bulundu</span>
            </div>
          </div>

          {message && <div className="status error">{message}</div>}

          {loading ? (
            <div className="loading-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="skeleton" key={index}>
                  <span />
                  <i />
                  <i />
                </div>
              ))}
            </div>
          ) : visibleBusinesses.length > 0 ? (
            <>
              <div className="business-grid">
                {visibleBusinesses.map((business) => {
                  const rating = Number(business.rating ?? 0);
                  const categoryName = getCategoryName(business.categories);

                  return (
                    <Link
                      href={`/mekan/${business.slug}`}
                      className="business-card"
                      key={business.id}
                    >
                      <div className="card-image">
                        <img
                          src={
                            business.cover_image ||
                            fallbackImage(business.name)
                          }
                          alt={business.name}
                          loading="lazy"
                        />

                        <div className="card-badges">
                          <span>{categoryName}</span>
                          {business.verified && <span>✓ Doğrulandı</span>}
                        </div>

                        {business.featured && (
                          <span className="featured-badge">Öne Çıkan</span>
                        )}
                      </div>

                      <div className="card-body">
                        <div className="card-title">
                          <div>
                            <h3>{business.name}</h3>
                            <p>
                              {business.region || "Kapadokya"}
                              {business.address
                                ? ` · ${business.address}`
                                : ""}
                            </p>
                          </div>

                          {rating > 0 && (
                            <div className="rating">
                              <span>★</span>
                              {rating.toFixed(1)}
                            </div>
                          )}
                        </div>

                        <p className="description">
                          {business.description ||
                            "İşletme detaylarını, fotoğraflarını ve güncel bilgilerini incele."}
                        </p>

                        <div className="card-footer">
                          <div>
                            <small>ORTALAMA FİYAT</small>
                            <strong>{formatPrice(business.price_level)}</strong>
                          </div>

                          <span className="detail-button">
                            Detayları Gör →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {!showAll && filteredBusinesses.length > 8 && (
                <div className="show-more-wrap">
                  <button type="button" onClick={() => setShowAll(true)}>
                    Tüm mekânları göster
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <span>⌕</span>
              <h3>Sonuç bulunamadı</h3>
              <p>Arama kelimelerini veya filtrelerini değiştirerek tekrar dene.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setRegion("Tüm Bölgeler");
                  setCategoryId("Tüm Kategoriler");
                  setActiveQuery("");
                  setActiveRegion("Tüm Bölgeler");
                  setActiveCategory("Tüm Kategoriler");
                  setShowAll(false);
                }}
              >
                Filtreleri temizle
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="process-section" id="nasil-calisir">
        <div className="shell">
          <div className="process-intro">
            <span className="eyebrow light">NEDEN ÖNCEBAK?</span>
            <h2>Karar vermeden önce bilmen gerekenler tek yerde.</h2>
            <p>
              Sürpriz fiyatlar, eski menüler ve eksik bilgiler yerine daha
              şeffaf bir keşif deneyimi sunuyoruz.
            </p>
          </div>

          <div className="process-grid">
            <article>
              <b>01</b>
              <h3>Keşfet</h3>
              <p>Bölge ve kategori seçerek sana uygun işletmeleri bul.</p>
            </article>
            <article>
              <b>02</b>
              <h3>İncele</h3>
              <p>Fotoğraflara, menüye, fiyatlara ve işletme bilgilerine bak.</p>
            </article>
            <article>
              <b>03</b>
              <h3>Karar ver</h3>
              <p>İletişime geç, yol tarifi al ve sürpriz yaşamadan git.</p>
            </article>
          </div>
        </div>
      </section>

      <footer>
        <div className="shell footer-content">
          <div>
            <Link href="/" className="brand footer-brand">
              Önce<span>Bak</span>
            </Link>
            <p>
              Kapadokya&apos;daki restoranları, kafeleri ve aktiviteleri güncel
              bilgilerle keşfet. Gitmeden önce bak, sürpriz yaşamadan karar ver.
            </p>
          </div>

          <div>
            <strong>Keşfet</strong>
            <Link href="/#mekanlar">Mekânlar</Link>
            <Link href="/#kategoriler">Kategoriler</Link>
            <Link href="/#nasil-calisir">Nasıl Çalışır?</Link>
          </div>

          <div>
            <strong>Kurumsal</strong>
            <Link href="/hakkimizda">Hakkımızda</Link>
            <Link href="/gizlilik">Gizlilik Politikası</Link>
            <Link href="/kullanim-sartlari">Kullanım Şartları</Link>
            <Link href="/iletisim">İletişim</Link>
          </div>

          <div className="footer-business">
            <strong>İşletme Sahibi misiniz?</strong>
            <p>
              İşletmenizi ÖnceBak&apos;ta tanıtın ve Kapadokya&apos;yı keşfeden
              daha fazla kişiye ulaşın.
            </p>
            <Link href="/iletisim" className="footer-business-button">
              İşletmeni Tanıt →
            </Link>
          </div>
        </div>

        <div className="shell copyright">
          <span>© {new Date().getFullYear()} ÖnceBak. Tüm hakları saklıdır.</span>
          <div className="copyright-links">
            <Link href="/hakkimizda">Hakkımızda</Link>
            <Link href="/gizlilik">Gizlilik</Link>
            <Link href="/kullanim-sartlari">Kullanım Şartları</Link>
            <Link href="/iletisim">İletişim</Link>
          </div>
        </div>
      </footer>

      <GlobalStyles />
    </main>
  );
}

function GlobalStyles() {
  return (
    <style jsx global>{`
      :root {
        --accent: #f36f32;
        --accent-dark: #d6531b;
        --dark: #181310;
        --dark-soft: #251d18;
        --cream: #f7f3ee;
        --white: #ffffff;
        --text: #241c17;
        --muted: #746a63;
        --line: rgba(36, 28, 23, 0.12);
        --shadow: 0 24px 70px rgba(49, 31, 20, 0.12);
      }

      * {
        box-sizing: border-box;
      }

      html {
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
        background: var(--cream);
        color: var(--text);
        font-family: Arial, Helvetica, sans-serif;
      }

      button,
      input,
      select {
        font: inherit;
      }

      button,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      .shell {
        width: min(1180px, calc(100% - 40px));
        margin: 0 auto;
      }

      .topbar {
        position: fixed;
        z-index: 50;
        top: 0;
        left: 0;
        width: 100%;
        background: transparent;
        border-bottom: 1px solid transparent;
        box-shadow: none;
        transition:
          background 0.28s ease,
          border-color 0.28s ease,
          box-shadow 0.28s ease,
          backdrop-filter 0.28s ease;
      }

      .topbar.scrolled {
        background: rgba(14, 11, 9, 0.78);
        border-bottom-color: rgba(255, 255, 255, 0.12);
        box-shadow: 0 10px 34px rgba(0, 0, 0, 0.18);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }

      .topbar:not(.scrolled)::after {
        content: "";
        position: absolute;
        z-index: -1;
        inset: 0;
        background: linear-gradient(
          180deg,
          rgba(10, 7, 5, 0.46) 0%,
          rgba(10, 7, 5, 0.12) 72%,
          transparent 100%
        );
        pointer-events: none;
      }

      .nav {
        min-height: 88px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 30px;
      }

      .brand {
        display: inline-flex;
        position: relative;
        flex-direction: column;
        color: white;
        font-size: 25px;
        font-weight: 950;
        line-height: 0.9;
        letter-spacing: -1.2px;
        text-decoration: none;
      }

      .brand span {
        color: var(--accent);
      }

      .brand small {
        margin-top: 9px;
        color: rgba(255, 255, 255, 0.58);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 1.3px;
        text-transform: uppercase;
      }

      .nav-links {
        display: flex;
        align-items: center;
        gap: 29px;
      }

      .nav-links a {
        color: rgba(255, 255, 255, 0.82);
        font-size: 12px;
        font-weight: 800;
        text-decoration: none;
      }

      .nav-links a:hover {
        color: white;
      }

      .business-link {
        padding: 13px 19px;
        border: 1px solid var(--accent);
        border-radius: 999px;
        background: var(--accent);
        color: white;
        font-size: 11px;
        font-weight: 900;
        text-decoration: none;
        transition: 0.25s ease;
      }

      .business-link:hover {
        border-color: var(--accent-dark);
        background: var(--accent-dark);
        transform: translateY(-2px);
      }

      .hero {
        position: relative;
        min-height: 760px;
        display: flex;
        align-items: center;
        overflow: hidden;
        background:
          url("https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=2200&q=88")
          center/cover no-repeat;
      }

      .hero-overlay {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(90deg, rgba(18, 11, 7, 0.84), rgba(18, 11, 7, 0.22)),
          linear-gradient(0deg, rgba(18, 11, 7, 0.54), transparent 50%);
      }

      .hero-content {
        position: relative;
        z-index: 2;
        padding-top: 115px;
        color: white;
      }

      .hero-label,
      .eyebrow {
        display: inline-block;
        color: var(--accent);
        font-size: 10px;
        font-weight: 950;
        letter-spacing: 2.2px;
      }

      .hero h1 {
        max-width: 800px;
        margin: 20px 0 20px;
        font-size: clamp(58px, 8vw, 100px);
        line-height: 0.9;
        letter-spacing: -6px;
      }

      .hero h1 strong {
        color: var(--accent);
      }

      .hero > .hero-content > p {
        max-width: 650px;
        margin: 0;
        color: rgba(255, 255, 255, 0.72);
        font-size: 18px;
        line-height: 1.65;
      }

      .search-panel {
        display: grid;
        grid-template-columns: 1.6fr 1fr 1fr auto;
        align-items: end;
        gap: 10px;
        margin-top: 38px;
        padding: 11px;
        border: 1px solid rgba(255, 255, 255, 0.26);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 30px 80px rgba(10, 5, 2, 0.26);
      }

      .search-panel label {
        display: grid;
        gap: 7px;
        min-width: 0;
        padding: 4px 10px;
      }

      .search-panel label span {
        color: #8c7f77;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 1.1px;
        text-transform: uppercase;
      }

      .search-panel input,
      .search-panel select {
        width: 100%;
        min-width: 0;
        padding: 8px 0;
        border: 0;
        outline: 0;
        background: transparent;
        color: var(--dark);
        font-size: 13px;
        font-weight: 800;
      }

      .search-panel button {
        min-height: 58px;
        padding: 0 30px;
        border: 0;
        border-radius: 15px;
        background: var(--accent);
        color: white;
        font-size: 12px;
        font-weight: 950;
        cursor: pointer;
      }

      .search-panel button:hover {
        background: var(--accent-dark);
      }

      .trust-row {
        display: flex;
        flex-wrap: wrap;
        gap: 21px;
        margin-top: 20px;
        color: rgba(255, 255, 255, 0.72);
        font-size: 10px;
        font-weight: 800;
      }

      .category-section,
      .business-section {
        padding: 100px 0;
      }

      .business-section {
        padding-top: 30px;
      }

      .section-heading {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 35px;
        margin-bottom: 38px;
      }

      .section-heading h2 {
        margin: 10px 0 0;
        font-size: clamp(38px, 5vw, 58px);
        line-height: 0.96;
        letter-spacing: -3px;
      }

      .section-heading > p {
        max-width: 440px;
        margin: 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.75;
      }

      .category-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
      }

      .category-card {
        position: relative;
        min-height: 190px;
        padding: 24px;
        border: 1px solid var(--line);
        border-radius: 22px;
        background: white;
        color: var(--text);
        text-align: left;
        box-shadow: 0 13px 38px rgba(44, 27, 17, 0.05);
        cursor: pointer;
        transition: 0.25s ease;
      }

      .category-card:hover {
        transform: translateY(-5px);
        border-color: rgba(243, 111, 50, 0.45);
        box-shadow: var(--shadow);
      }

      .category-icon {
        display: grid;
        width: 50px;
        height: 50px;
        place-items: center;
        margin-bottom: 25px;
        border-radius: 15px;
        background: #fff1e9;
        font-size: 24px;
      }

      .category-icon img {
        width:30px;
        height:30px;
        object-fit:contain;
      }

      .category-card strong {
        display: block;
        margin-bottom: 7px;
        font-size: 18px;
      }

      .category-card small {
        color: var(--muted);
        font-size: 11px;
      }

      .category-card i {
        position: absolute;
        right: 22px;
        bottom: 20px;
        color: var(--accent);
        font-size: 20px;
        font-style: normal;
      }

      .empty-category {
        padding: 30px;
        border: 1px dashed var(--line);
        border-radius: 20px;
        color: var(--muted);
      }

      .business-heading {
        align-items: center;
      }

      .result-info {
        display: flex;
        align-items: baseline;
        gap: 8px;
      }

      .result-info strong {
        color: var(--accent);
        font-size: 28px;
      }

      .result-info span {
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
      }

      .business-grid,
      .loading-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 22px;
      }

      .business-card {
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 26px;
        background: white;
        color: inherit;
        box-shadow: 0 18px 55px rgba(48, 30, 19, 0.07);
        text-decoration: none;
        transition: 0.28s ease;
      }

      .business-card:hover {
        transform: translateY(-7px);
        box-shadow: var(--shadow);
      }

      .business-card:hover .card-image img {
        transform: scale(1.045);
      }

      .card-image {
        position: relative;
        height: 310px;
        overflow: hidden;
        background: var(--dark);
      }

      .card-image::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(0deg, rgba(20, 12, 7, 0.48), transparent 55%);
        pointer-events: none;
      }

      .card-image img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        transition: transform 0.5s ease;
      }

      .card-badges {
        position: absolute;
        z-index: 2;
        top: 16px;
        left: 16px;
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
      }

      .card-badges span,
      .featured-badge {
        padding: 8px 11px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.92);
        color: var(--dark);
        font-size: 9px;
        font-weight: 950;
        backdrop-filter: blur(12px);
      }

      .featured-badge {
        position: absolute;
        z-index: 2;
        right: 16px;
        bottom: 16px;
        background: var(--accent);
        color: white;
      }

      .card-body {
        padding: 24px;
      }

      .card-title {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
      }

      .card-title h3 {
        margin: 0;
        font-size: 24px;
        letter-spacing: -1px;
      }

      .card-title p {
        max-width: 360px;
        margin: 7px 0 0;
        overflow: hidden;
        color: var(--muted);
        font-size: 11px;
        font-weight: 700;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .rating {
        display: flex;
        flex: none;
        align-items: center;
        gap: 5px;
        padding: 7px 9px;
        border-radius: 10px;
        background: #fff4d6;
        font-size: 11px;
        font-weight: 950;
      }

      .rating span {
        color: #efaa18;
      }

      .description {
        min-height: 44px;
        margin: 18px 0 22px;
        overflow: hidden;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.75;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .card-footer {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 15px;
        padding-top: 18px;
        border-top: 1px solid var(--line);
      }

      .card-footer > div {
        display: grid;
        gap: 5px;
      }

      .card-footer small {
        color: #a0968f;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: 1px;
      }

      .card-footer strong {
        font-size: 11px;
      }

      .detail-button {
        padding: 11px 14px;
        border-radius: 999px;
        background: var(--dark);
        color: white;
        font-size: 10px;
        font-weight: 950;
      }

      .show-more-wrap {
        display: flex;
        justify-content: center;
        margin-top: 35px;
      }

      .show-more-wrap button,
      .empty-state button {
        padding: 14px 20px;
        border: 0;
        border-radius: 999px;
        background: var(--accent);
        color: white;
        font-size: 11px;
        font-weight: 950;
        cursor: pointer;
      }

      .status {
        margin-bottom: 20px;
        padding: 15px 18px;
        border-radius: 14px;
        font-size: 12px;
        font-weight: 800;
      }

      .status.error {
        background: #ffe8e4;
        color: #a62b1d;
      }

      .loading-grid .skeleton {
        min-height: 500px;
        overflow: hidden;
        border-radius: 26px;
        background: white;
      }

      .skeleton span,
      .skeleton i {
        display: block;
        border-radius: 10px;
        background: linear-gradient(90deg, #eee7df, #f9f5f1, #eee7df);
        background-size: 200% 100%;
        animation: pulse 1.4s infinite;
      }

      .skeleton span {
        height: 310px;
        border-radius: 0;
      }

      .skeleton i {
        width: 60%;
        height: 18px;
        margin: 25px 24px 0;
      }

      .skeleton i:last-child {
        width: 38%;
        height: 12px;
        margin-top: 12px;
      }

      @keyframes pulse {
        to {
          background-position: -200% 0;
        }
      }

      .empty-state {
        padding: 75px 25px;
        border: 1px dashed var(--line);
        border-radius: 26px;
        background: rgba(255, 255, 255, 0.55);
        text-align: center;
      }

      .empty-state > span {
        font-size: 45px;
      }

      .empty-state h3 {
        margin: 15px 0 8px;
        font-size: 26px;
      }

      .empty-state p {
        margin: 0 0 20px;
        color: var(--muted);
      }

      .process-section {
        padding: 110px 0;
        background: var(--dark);
        color: white;
      }

      .process-section .shell {
        display: grid;
        grid-template-columns: 0.85fr 1.15fr;
        gap: 70px;
      }

      .eyebrow.light {
        color: var(--accent);
      }

      .process-intro h2 {
        margin: 15px 0 22px;
        font-size: clamp(42px, 5vw, 64px);
        line-height: 0.98;
        letter-spacing: -3.2px;
      }

      .process-intro p {
        color: rgba(255, 255, 255, 0.57);
        font-size: 14px;
        line-height: 1.8;
      }

      .process-grid {
        display: grid;
        gap: 12px;
      }

      .process-grid article {
        position: relative;
        padding: 28px 30px 28px 92px;
        border: 1px solid rgba(255, 255, 255, 0.11);
        border-radius: 19px;
        background: rgba(255, 255, 255, 0.035);
      }

      .process-grid b {
        position: absolute;
        top: 27px;
        left: 27px;
        color: var(--accent);
        font-size: 12px;
      }

      .process-grid h3 {
        margin: 0 0 7px;
        font-size: 19px;
      }

      .process-grid p {
        margin: 0;
        color: rgba(255, 255, 255, 0.54);
        font-size: 12px;
        line-height: 1.65;
      }

      footer {
        padding: 70px 0 25px;
        background: #100c0a;
        color: white;
      }

      .footer-content {
        display: grid;
        grid-template-columns: 1.45fr 0.65fr 0.65fr 1.15fr;
        gap: 50px;
        align-items: start;
      }

      .footer-brand {
        display: inline-block;
        color: white;
        font-size: 29px;
      }

      .footer-content > div:first-child p {
        max-width: 360px;
        color: rgba(255, 255, 255, 0.45);
        font-size: 12px;
        line-height: 1.8;
      }

      .footer-content > div:not(:first-child) {
        display: grid;
        align-content: start;
        gap: 13px;
      }

      .footer-content strong {
        margin-bottom: 4px;
        font-size: 11px;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .footer-content a:not(.brand) {
        color: rgba(255, 255, 255, 0.48);
        font-size: 11px;
        text-decoration: none;
        transition: color 0.2s ease;
      }

      .footer-content a:not(.brand):hover {
        color: white;
      }

      .footer-business {
        padding: 22px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        background: linear-gradient(
          145deg,
          rgba(243, 111, 50, 0.09),
          rgba(255, 255, 255, 0.025)
        );
      }

      .footer-business p {
        max-width: 280px;
        margin: 0;
        color: rgba(255, 255, 255, 0.48);
        font-size: 11px;
        line-height: 1.7;
      }

      .footer-business-button {
        display: inline-flex;
        width: fit-content;
        margin-top: 5px;
        padding: 12px 16px;
        border-radius: 999px;
        background: var(--accent);
        color: white !important;
        font-size: 10px !important;
        font-weight: 950;
        text-decoration: none;
        transition: 0.25s ease;
      }

      .footer-business-button:hover {
        background: var(--accent-dark);
        transform: translateY(-2px);
      }

      .copyright-links {
        display: flex;
        align-items: center;
        gap: 18px;
      }

      .copyright-links a {
        color: rgba(255, 255, 255, 0.38);
        text-decoration: none;
        transition: color 0.2s ease;
      }

      .copyright-links a:hover {
        color: white;
      }

      .copyright {
        display: flex;
        justify-content: space-between;
        margin-top: 55px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.35);
        font-size: 9px;
      }

      @media (max-width: 950px) {
        .nav-links {
          display: none;
        }

        .hero {
          min-height: 820px;
        }

        .search-panel {
          grid-template-columns: 1fr 1fr;
        }

        .search-panel button {
          grid-column: span 2;
        }

        .category-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .business-grid,
        .loading-grid {
          grid-template-columns: 1fr;
        }

        .process-section .shell {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 650px) {
        .shell {
          width: min(100% - 24px, 1180px);
        }

        .nav {
          min-height: 72px;
        }

        .brand small {
          display: none;
        }

        .business-link {
          padding: 10px 12px;
          font-size: 9px;
        }

        .hero {
          min-height: 900px;
          align-items: flex-start;
        }

        .hero-content {
          padding-top: 145px;
        }

        .hero h1 {
          margin-top: 16px;
          font-size: 61px;
          letter-spacing: -4px;
        }

        .hero > .hero-content > p {
          font-size: 15px;
        }

        .search-panel {
          grid-template-columns: 1fr;
          margin-top: 30px;
          border-radius: 18px;
        }

        .search-panel button {
          grid-column: auto;
        }

        .trust-row {
          gap: 11px 16px;
        }

        .category-section,
        .business-section {
          padding: 70px 0;
        }

        .business-section {
          padding-top: 15px;
        }

        .section-heading {
          align-items: flex-start;
          flex-direction: column;
          margin-bottom: 28px;
        }

        .section-heading h2 {
          font-size: 42px;
          letter-spacing: -2.4px;
        }

        .category-grid {
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }

        .category-card {
          min-height: 155px;
          padding: 17px;
          border-radius: 18px;
        }

        .category-icon {
          width: 42px;
          height: 42px;
          margin-bottom: 17px;
          font-size: 20px;
        }

        .category-card strong {
          font-size: 15px;
        }

        .category-card i {
          right: 16px;
          bottom: 14px;
        }

        .card-image {
          height: 245px;
        }

        .card-body {
          padding: 20px;
        }

        .card-title h3 {
          font-size: 21px;
        }

        .card-footer {
          align-items: flex-start;
          flex-direction: column;
        }

        .detail-button {
          width: 100%;
          text-align: center;
        }

        .process-section {
          padding: 80px 0;
        }

        .process-section .shell {
          gap: 40px;
        }

        .process-grid article {
          padding: 24px 20px 24px 68px;
        }

        .process-grid b {
          top: 24px;
          left: 22px;
        }

        .footer-content {
          grid-template-columns: 1fr;
          gap: 35px;
        }

        .copyright {
          align-items: flex-start;
          flex-direction: column;
          gap: 14px;
        }

        .copyright-links {
          flex-wrap: wrap;
          gap: 12px 18px;
        }
      }
    `}</style>
  );
}
