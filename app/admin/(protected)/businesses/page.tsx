"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Business = {
  id: string | number;
  name: string;
  slug: string;
  region: string | null;
  address: string | null;
  price_level: number | null;
  cover_image: string | null;
  verified: boolean | null;
  featured: boolean | null;
};

export default function BusinessesPage() {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(currentSession);
      setAuthLoading(false);

      if (!currentSession) {
        router.replace("/admin");
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setAuthLoading(false);

      if (!currentSession) {
        router.replace("/admin");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!session) return;
    void loadBusinesses();
  }, [session]);

  async function loadBusinesses() {
    setLoading(true);
    setMessage("");
    setSuccess(false);

    const { data, error } = await supabase
      .from("businesses")
      .select(
        "id, name, slug, region, address, price_level, cover_image, verified, featured"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`İşletmeler alınamadı: ${error.message}`);
      setBusinesses([]);
    } else {
      setBusinesses((data ?? []) as Business[]);
    }

    setLoading(false);
  }

  async function handleDelete(business: Business) {
    const approved = window.confirm(
      `"${business.name}" işletmesini kalıcı olarak silmek istediğine emin misin?`
    );

    if (!approved) return;

    setDeletingId(business.id);
    setMessage("");
    setSuccess(false);

    const { data, error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", business.id)
      .select("id");

    if (error) {
      setMessage(`İşletme silinemedi: ${error.message}`);
      setDeletingId(null);
      return;
    }

    if (!data || data.length === 0) {
      setMessage(
        "Kayıt silinmedi. Supabase DELETE RLS izni eksik veya bu kullanıcıya silme yetkisi verilmemiş."
      );
      setDeletingId(null);
      return;
    }

    setBusinesses((current) =>
      current.filter((item) => item.id !== business.id)
    );
    setSuccess(true);
    setMessage("İşletme kalıcı olarak silindi.");
    setDeletingId(null);
  }

  async function handleLogout() {
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/admin");
  }

  const filteredBusinesses = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    if (!query) return businesses;

    return businesses.filter((business) =>
      `${business.name} ${business.region ?? ""} ${business.address ?? ""}`
        .toLocaleLowerCase("tr-TR")
        .includes(query)
    );
  }, [businesses, search]);

  function formatPrice(price: number | null) {
    if (price === null || !Number.isFinite(price)) return "Belirtilmedi";
    return `${price.toLocaleString("tr-TR")}₺`;
  }

  if (authLoading || !session) {
    return (
      <main style={styles.centerPage}>
        <p style={{ fontWeight: 800 }}>Oturum kontrol ediliyor...</p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <aside style={styles.sidebar}>
        <div>
          <a href="/" style={styles.logo}>
            Önce<span style={{ color: "#ff5a1f" }}>Bak</span>
          </a>

          <p style={styles.panelLabel}>Yönetim Paneli</p>

          <nav style={styles.navigation}>
            <a href="/admin/dashboard" style={styles.navigationItem}>
              Dashboard
            </a>

            <a href="/admin" style={styles.navigationItem}>
              ＋ Yeni İşletme
            </a>

            <a href="/admin/businesses" style={styles.activeNavigationItem}>
              İşletmeler
            </a>

            <a href="/" style={styles.navigationItem}>
              Ana Siteyi Görüntüle
            </a>
          </nav>
        </div>

        <button type="button" onClick={handleLogout} style={styles.logoutButton}>
          Çıkış Yap
        </button>
      </aside>

      <section style={styles.content}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>ÖNCEBAK YÖNETİMİ</p>
            <h1 style={styles.title}>İşletmeler</h1>
            <p style={styles.subtitle}>
              Kayıtları görüntüle, düzenle veya güvenli şekilde sil.
            </p>
          </div>

          <a href="/admin" style={styles.addButton}>
            + Yeni İşletme
          </a>
        </header>

        <div style={styles.toolbar}>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="İşletme, bölge veya adres ara..."
            style={styles.searchInput}
          />

          <button type="button" onClick={loadBusinesses} style={styles.refreshButton}>
            Yenile
          </button>
        </div>

        {message && (
          <div
            style={{
              ...styles.message,
              background: success ? "#ecfdf3" : "#fff1f0",
              color: success ? "#067647" : "#b42318",
              borderColor: success ? "#abefc6" : "#fecdca",
            }}
          >
            {message}
          </div>
        )}

        {loading ? (
          <div style={styles.emptyCard}>İşletmeler yükleniyor...</div>
        ) : filteredBusinesses.length === 0 ? (
          <div style={styles.emptyCard}>
            {search
              ? "Aramana uygun işletme bulunamadı."
              : "Henüz işletme eklenmemiş."}
          </div>
        ) : (
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <span>İşletme</span>
              <span>Bölge</span>
              <span>Ortalama fiyat</span>
              <span>Durum</span>
              <span style={{ textAlign: "right" }}>İşlemler</span>
            </div>

            {filteredBusinesses.map((business) => (
              <div key={business.id} style={styles.tableRow}>
                <div style={styles.businessCell}>
                  <div style={styles.imageBox}>
                    {business.cover_image ? (
                      <img
                        src={business.cover_image}
                        alt={business.name}
                        style={styles.image}
                      />
                    ) : (
                      <span>{business.name.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>

                  <div>
                    <strong style={styles.businessName}>{business.name}</strong>
                    <small style={styles.address}>
                      {business.address || "Adres belirtilmedi"}
                    </small>
                  </div>
                </div>

                <span style={styles.cellText}>
                  {business.region || "Belirtilmedi"}
                </span>

                <strong style={styles.cellText}>
                  {formatPrice(business.price_level)}
                </strong>

                <div style={styles.badges}>
                  {business.featured && (
                    <span style={styles.featuredBadge}>Öne çıkan</span>
                  )}
                  {business.verified && (
                    <span style={styles.verifiedBadge}>Doğrulanmış</span>
                  )}
                  {!business.featured && !business.verified && (
                    <span style={styles.standardBadge}>Standart</span>
                  )}
                </div>

                <div style={styles.actions}>
                  <a
                    href={`/mekan/${business.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.viewButton}
                  >
                    Görüntüle
                  </a>

                  <a
                    href={`/admin/businesses/${business.id}`}
                    style={styles.editButton}
                  >
                    Düzenle
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDelete(business)}
                    disabled={deletingId === business.id}
                    style={{
                      ...styles.deleteButton,
                      opacity: deletingId === business.id ? 0.6 : 1,
                    }}
                  >
                    {deletingId === business.id ? "Siliniyor..." : "Sil"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

const styles = {
  centerPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f7f5f2",
    color: "#171717",
  },

  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "260px minmax(0, 1fr)",
    background: "#f7f5f2",
    color: "#171717",
  },

  sidebar: {
    position: "sticky" as const,
    top: 0,
    minHeight: "100vh",
    padding: "32px 24px",
    background: "#171717",
    color: "#fff",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between",
  },

  logo: {
    color: "#fff",
    textDecoration: "none",
    fontSize: "26px",
    fontWeight: 900,
  },

  panelLabel: {
    marginTop: "8px",
    color: "#a3a3a3",
    fontSize: "13px",
  },

  navigation: {
    marginTop: "42px",
    display: "grid",
    gap: "10px",
  },

  activeNavigationItem: {
    padding: "14px 16px",
    borderRadius: "12px",
    background: "#ff5a1f",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 800,
  },

  navigationItem: {
    padding: "14px 16px",
    borderRadius: "12px",
    color: "#d4d4d4",
    textDecoration: "none",
    fontWeight: 700,
  },

  logoutButton: {
    width: "100%",
    padding: "13px 16px",
    border: "1px solid #353535",
    borderRadius: "12px",
    background: "#242424",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },

  content: {
    width: "100%",
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "48px 38px 90px",
  },

  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "28px",
  },

  eyebrow: {
    margin: 0,
    color: "#ff5a1f",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "1.5px",
  },

  title: {
    margin: "8px 0 10px",
    fontSize: "38px",
  },

  subtitle: {
    margin: 0,
    color: "#737373",
    lineHeight: 1.6,
  },

  addButton: {
    padding: "12px 18px",
    borderRadius: "12px",
    background: "#ff5a1f",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 900,
  },

  toolbar: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "12px",
    marginBottom: "20px",
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "14px 15px",
    border: "1px solid #dedbd7",
    borderRadius: "12px",
    background: "#fff",
    color: "#171717",
    fontSize: "14px",
    outline: "none",
  },

  refreshButton: {
    padding: "14px 18px",
    border: "1px solid #dedbd7",
    borderRadius: "12px",
    background: "#fff",
    color: "#171717",
    fontWeight: 800,
    cursor: "pointer",
  },

  message: {
    marginBottom: "20px",
    padding: "14px 16px",
    border: "1px solid",
    borderRadius: "12px",
    fontWeight: 700,
  },

  emptyCard: {
    padding: "46px 24px",
    border: "1px solid #ebe8e4",
    borderRadius: "20px",
    background: "#fff",
    color: "#737373",
    textAlign: "center" as const,
    fontWeight: 700,
  },

  tableCard: {
    overflow: "hidden",
    border: "1px solid #ebe8e4",
    borderRadius: "20px",
    background: "#fff",
    boxShadow: "0 18px 50px rgba(38,30,24,.05)",
  },

  tableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr",
    gap: "18px",
    padding: "15px 20px",
    borderBottom: "1px solid #ebe8e4",
    background: "#faf9f7",
    color: "#737373",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: ".7px",
    textTransform: "uppercase" as const,
  },

  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr",
    alignItems: "center",
    gap: "18px",
    padding: "17px 20px",
    borderBottom: "1px solid #eee",
  },

  businessCell: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    minWidth: 0,
  },

  imageBox: {
    width: "56px",
    height: "56px",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    overflow: "hidden",
    borderRadius: "13px",
    background: "#f0ece7",
    color: "#ff5a1f",
    fontSize: "20px",
    fontWeight: 900,
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },

  businessName: {
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },

  address: {
    display: "block",
    maxWidth: "280px",
    marginTop: "5px",
    overflow: "hidden",
    color: "#8a8a8a",
    fontSize: "11px",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },

  cellText: {
    fontSize: "13px",
  },

  badges: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "6px",
  },

  featuredBadge: {
    padding: "5px 8px",
    borderRadius: "999px",
    background: "#fff4ed",
    color: "#c4320a",
    fontSize: "10px",
    fontWeight: 850,
  },

  verifiedBadge: {
    padding: "5px 8px",
    borderRadius: "999px",
    background: "#eff8ff",
    color: "#175cd3",
    fontSize: "10px",
    fontWeight: 850,
  },

  standardBadge: {
    padding: "5px 8px",
    borderRadius: "999px",
    background: "#f2f4f7",
    color: "#475467",
    fontSize: "10px",
    fontWeight: 850,
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "7px",
  },

  viewButton: {
    padding: "9px 11px",
    border: "1px solid #dedbd7",
    borderRadius: "9px",
    background: "#fff",
    color: "#171717",
    fontSize: "11px",
    fontWeight: 800,
    textDecoration: "none",
  },

  editButton: {
    padding: "9px 11px",
    border: "1px solid #fedf89",
    borderRadius: "9px",
    background: "#fffaeb",
    color: "#b54708",
    fontSize: "11px",
    fontWeight: 800,
    textDecoration: "none",
  },

  deleteButton: {
    padding: "9px 11px",
    border: "1px solid #fecdca",
    borderRadius: "9px",
    background: "#fff1f0",
    color: "#b42318",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },
};
