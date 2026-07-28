"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import AdminSidebar from "../components/AdminSidebar";

type Category = {
  id: string | number;
  name: string;
};

type Business = {
  id: string | number;
  name: string;
  slug: string;
  region: string | null;
  cover_image: string | null;
  rating: number | null;
  verified: boolean | null;
  featured: boolean | null;
  category_id: string | number | null;
  created_at?: string | null;
  categories?: Category | Category[] | null;
};

const REGIONS = [
  "Tümü",
  "Nevşehir",
  "Göreme",
  "Ürgüp",
  "Avanos",
  "Uçhisar",
  "Ortahisar",
];

function getCategoryName(value: Business["categories"]) {
  if (!value) return "Kategorisiz";
  if (Array.isArray(value)) return value[0]?.name ?? "Kategorisiz";
  return value.name ?? "Kategorisiz";
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("Tümü");
  const [categoryId, setCategoryId] = useState("Tümü");

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
          region,
          cover_image,
          rating,
          verified,
          featured,
          category_id,
          created_at,
          categories (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false }),
      supabase
        .from("categories")
        .select("id, name")
        .order("name", { ascending: true }),
    ]);

    if (businessResult.error) {
      setMessage(`İşletmeler yüklenemedi: ${businessResult.error.message}`);
      setBusinesses([]);
    } else {
      setBusinesses((businessResult.data ?? []) as Business[]);
    }

    if (!categoryResult.error) {
      setCategories((categoryResult.data ?? []) as Category[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredBusinesses = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    return businesses.filter((business) => {
      const matchesSearch =
        !query ||
        business.name.toLocaleLowerCase("tr-TR").includes(query) ||
        (business.region ?? "").toLocaleLowerCase("tr-TR").includes(query) ||
        getCategoryName(business.categories)
          .toLocaleLowerCase("tr-TR")
          .includes(query);

      const matchesRegion =
        region === "Tümü" || business.region === region;

      const matchesCategory =
        categoryId === "Tümü" ||
        String(business.category_id ?? "") === categoryId;

      return matchesSearch && matchesRegion && matchesCategory;
    });
  }, [businesses, search, region, categoryId]);

  async function handleDelete(business: Business) {
    const confirmed = window.confirm(
      `"${business.name}" işletmesini silmek istediğine emin misin? Bu işlem geri alınamaz.`
    );

    if (!confirmed) return;

    setDeletingId(business.id);
    setMessage("");

    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", business.id);

    if (error) {
      setMessage(`İşletme silinemedi: ${error.message}`);
      setDeletingId(null);
      return;
    }

    setBusinesses((current) =>
      current.filter((item) => item.id !== business.id)
    );
    setMessage("İşletme başarıyla silindi.");
    setDeletingId(null);
  }

  return (
    <main className="admin-page">
      <AdminSidebar />

      <section className="workspace">
        <header className="page-header">
          <div>
            <span className="eyebrow">İÇERİK YÖNETİMİ</span>
            <h1>İşletmeler</h1>
            <p>
              Sistemde kayıtlı işletmeleri ara, filtrele ve yönet.
            </p>
          </div>

          <Link href="/admin/yeni-isletme" className="primary-button">
            ＋ Yeni işletme ekle
          </Link>
        </header>

        <section className="stats">
          <div>
            <strong>{businesses.length}</strong>
            <span>Toplam işletme</span>
          </div>
          <div>
            <strong>
              {businesses.filter((item) => item.verified).length}
            </strong>
            <span>Doğrulanmış</span>
          </div>
          <div>
            <strong>
              {businesses.filter((item) => item.featured).length}
            </strong>
            <span>Editörün seçimi</span>
          </div>
        </section>

        <section className="filters">
          <label className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="İşletme, bölge veya kategori ara..."
            />
          </label>

          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          >
            {REGIONS.map((item) => (
              <option value={item} key={item}>
                {item === "Tümü" ? "Tüm bölgeler" : item}
              </option>
            ))}
          </select>

          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="Tümü">Tüm kategoriler</option>
            {categories.map((category) => (
              <option value={String(category.id)} key={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </section>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <section className="list-card">
          <div className="list-head">
            <span>İşletme</span>
            <span>Kategori</span>
            <span>Bölge</span>
            <span>Puan</span>
            <span>Durum</span>
            <span>İşlemler</span>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="spinner" />
              <strong>İşletmeler yükleniyor</strong>
              <p>Supabase verileri getiriliyor.</p>
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⌕</div>
              <strong>İşletme bulunamadı</strong>
              <p>Arama veya filtreleri değiştirerek tekrar dene.</p>
            </div>
          ) : (
            <div className="business-list">
              {filteredBusinesses.map((business) => (
                <article className="business-row" key={business.id}>
                  <div className="business-info">
                    <div className="cover">
                      {business.cover_image ? (
                        <img
                          src={business.cover_image}
                          alt={business.name}
                        />
                      ) : (
                        <span>{business.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    <div>
                      <strong>{business.name}</strong>
                      <small>/mekan/{business.slug}</small>
                    </div>
                  </div>

                  <span className="category">
                    {getCategoryName(business.categories)}
                  </span>

                  <span className="region">
                    {business.region || "Belirtilmedi"}
                  </span>

                  <span className="rating">
                    ★ {Number(business.rating ?? 0).toFixed(1)}
                  </span>

                  <div className="badges">
                    {business.verified && (
                      <span className="verified">Doğrulanmış</span>
                    )}
                    {business.featured && (
                      <span className="featured">Öne çıkan</span>
                    )}
                    {!business.verified && !business.featured && (
                      <span className="standard">Standart</span>
                    )}
                  </div>

                  <div className="actions">
                    <Link
                      href={`/mekan/${business.slug}`}
                      target="_blank"
                      className="view-button"
                    >
                      Gör
                    </Link>

                    <Link
                      href={`/admin/isletmeler/${business.id}/duzenle`}
                      className="edit-button"
                    >
                      Düzenle
                    </Link>

                    <button
                      type="button"
                      className="delete-button"
                      disabled={deletingId === business.id}
                      onClick={() => handleDelete(business)}
                    >
                      {deletingId === business.id ? "Siliniyor..." : "Sil"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {!loading && filteredBusinesses.length > 0 && (
          <div className="result-count">
            {filteredBusinesses.length} işletme gösteriliyor
          </div>
        )}
      </section>

      <style jsx global>{`
        :root {
          --ink: #181513;
          --muted: #77706a;
          --line: #e9e2dc;
          --paper: #f6f2ee;
          --white: #ffffff;
          --accent: #ff5a1f;
          --dark: #171412;
          --danger: #b42318;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: var(--paper);
          color: var(--ink);
          font-family: Arial, Helvetica, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        button,
        input,
        select {
          font: inherit;
        }

        .admin-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 250px minmax(0, 1fr);
        }

        .sidebar {
          position: sticky;
          top: 0;
          min-height: 100vh;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 30px 22px;
          background: var(--dark);
          color: white;
        }

        .brand {
          display: inline-block;
          margin: 3px 10px 5px;
          color: white;
          font-size: 25px;
          font-weight: 950;
          letter-spacing: -1.3px;
          text-decoration: none;
        }

        .brand span {
          color: var(--accent);
        }

        .panel-label {
          margin: 0 10px 38px;
          color: rgba(255, 255, 255, 0.35);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .sidebar nav {
          display: grid;
          gap: 7px;
        }

        .sidebar nav a {
          padding: 13px 14px;
          border-radius: 11px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          font-weight: 850;
          text-decoration: none;
        }

        .sidebar nav a:hover,
        .sidebar nav a.active {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .sidebar-note {
          margin: 0 10px;
          color: rgba(255, 255, 255, 0.28);
          font-size: 11px;
          line-height: 1.6;
        }

        .workspace {
          width: min(1180px, calc(100% - 48px));
          margin: 0 auto;
          padding: 52px 0 90px;
        }

        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 28px;
          margin-bottom: 28px;
        }

        .eyebrow {
          color: var(--accent);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 1.7px;
        }

        .page-header h1 {
          margin: 10px 0 8px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(42px, 6vw, 64px);
          font-weight: 500;
          line-height: 1;
          letter-spacing: -3px;
        }

        .page-header p {
          max-width: 600px;
          margin: 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.7;
        }

        .primary-button {
          flex: none;
          padding: 14px 19px;
          border-radius: 999px;
          background: var(--accent);
          color: white;
          font-size: 11px;
          font-weight: 950;
          text-decoration: none;
          box-shadow: 0 12px 30px rgba(255, 90, 31, 0.22);
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .stats > div {
          padding: 20px;
          border: 1px solid var(--line);
          border-radius: 17px;
          background: white;
        }

        .stats strong {
          display: block;
          margin-bottom: 5px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 29px;
          font-weight: 500;
        }

        .stats span {
          color: var(--muted);
          font-size: 10px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .filters {
          display: grid;
          grid-template-columns: minmax(260px, 1fr) 180px 190px;
          gap: 12px;
          margin-bottom: 18px;
        }

        .search-box {
          position: relative;
        }

        .search-box > span {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          font-size: 20px;
        }

        .search-box input {
          padding-left: 43px;
        }

        .filters input,
        .filters select {
          width: 100%;
          min-height: 48px;
          padding: 0 14px;
          border: 1px solid var(--line);
          border-radius: 13px;
          outline: none;
          background: white;
          color: var(--ink);
        }

        .filters input:focus,
        .filters select:focus {
          border-color: rgba(255, 90, 31, 0.55);
          box-shadow: 0 0 0 4px rgba(255, 90, 31, 0.08);
        }

        .message {
          margin-bottom: 16px;
          padding: 14px 16px;
          border: 1px solid #f0d0c4;
          border-radius: 13px;
          background: #fff7f2;
          color: #9d3d1e;
          font-size: 12px;
          font-weight: 800;
        }

        .list-card {
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 20px;
          background: white;
          box-shadow: 0 18px 50px rgba(44, 28, 18, 0.04);
        }

        .list-head,
        .business-row {
          display: grid;
          grid-template-columns:
            minmax(250px, 1.5fr)
            minmax(110px, 0.7fr)
            minmax(100px, 0.65fr)
            80px
            minmax(110px, 0.7fr)
            minmax(220px, 1fr);
          align-items: center;
          gap: 16px;
        }

        .list-head {
          padding: 15px 18px;
          border-bottom: 1px solid var(--line);
          background: #fbf9f7;
        }

        .list-head span {
          color: var(--muted);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .business-row {
          padding: 15px 18px;
          border-bottom: 1px solid var(--line);
        }

        .business-row:last-child {
          border-bottom: none;
        }

        .business-row:hover {
          background: #fffdfb;
        }

        .business-info {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .cover {
          width: 58px;
          height: 58px;
          display: grid;
          flex: none;
          place-items: center;
          overflow: hidden;
          border-radius: 13px;
          background: #f1ebe6;
          color: var(--accent);
          font-family: Georgia, "Times New Roman", serif;
          font-size: 24px;
        }

        .cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .business-info > div:last-child {
          min-width: 0;
        }

        .business-info strong {
          display: block;
          overflow: hidden;
          margin-bottom: 5px;
          font-size: 12px;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .business-info small {
          display: block;
          overflow: hidden;
          color: var(--muted);
          font-size: 9px;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .category,
        .region {
          color: #514a45;
          font-size: 11px;
          font-weight: 750;
        }

        .rating {
          color: #a96500;
          font-size: 11px;
          font-weight: 950;
        }

        .badges {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .badges span {
          display: inline-flex;
          padding: 6px 8px;
          border-radius: 999px;
          font-size: 8px;
          font-weight: 950;
        }

        .verified {
          background: #e9f7f0;
          color: #13734a;
        }

        .featured {
          background: #fff0e9;
          color: var(--accent);
        }

        .standard {
          background: #f1efed;
          color: #77706a;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 7px;
        }

        .actions a,
        .actions button {
          padding: 9px 11px;
          border-radius: 9px;
          font-size: 9px;
          font-weight: 950;
          text-decoration: none;
          cursor: pointer;
        }

        .view-button {
          border: 1px solid var(--line);
          background: white;
          color: var(--ink);
        }

        .edit-button {
          border: 1px solid #ffd1be;
          background: #fff4ee;
          color: var(--accent);
        }

        .delete-button {
          border: 1px solid #f4c7c3;
          background: #fff1f0;
          color: var(--danger);
        }

        .delete-button:disabled {
          opacity: 0.55;
          cursor: wait;
        }

        .empty-state {
          display: grid;
          place-items: center;
          padding: 80px 20px;
          text-align: center;
        }

        .empty-state strong {
          margin: 13px 0 5px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 23px;
          font-weight: 500;
        }

        .empty-state p {
          margin: 0;
          color: var(--muted);
          font-size: 11px;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: #fff0e9;
          color: var(--accent);
          font-size: 24px;
        }

        .spinner {
          width: 34px;
          height: 34px;
          border: 3px solid #eee6df;
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .result-count {
          margin-top: 13px;
          color: var(--muted);
          font-size: 10px;
          text-align: right;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1100px) {
          .list-head {
            display: none;
          }

          .business-row {
            grid-template-columns: minmax(0, 1fr) auto;
          }

          .business-info {
            grid-column: 1;
          }

          .actions {
            grid-column: 2;
            grid-row: 1;
          }

          .category,
          .region,
          .rating,
          .badges {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 900px) {
          .admin-page {
            grid-template-columns: 1fr;
          }

          .sidebar {
            position: static;
            min-height: auto;
            height: auto;
            padding: 17px 20px;
          }

          .panel-label,
          .sidebar-note {
            display: none;
          }

          .brand {
            margin: 0 0 14px;
          }

          .sidebar nav {
            display: flex;
            overflow-x: auto;
          }

          .sidebar nav a {
            flex: none;
          }

          .workspace {
            width: min(100% - 28px, 1180px);
            padding-top: 34px;
          }
        }

        @media (max-width: 700px) {
          .page-header {
            flex-direction: column;
          }

          .page-header h1 {
            font-size: 45px;
            letter-spacing: -2px;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .filters {
            grid-template-columns: 1fr;
          }

          .business-row {
            grid-template-columns: 1fr;
            gap: 13px;
          }

          .business-info,
          .actions,
          .category,
          .region,
          .rating,
          .badges {
            grid-column: 1;
            grid-row: auto;
          }

          .actions {
            justify-content: flex-start;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </main>
  );
}
