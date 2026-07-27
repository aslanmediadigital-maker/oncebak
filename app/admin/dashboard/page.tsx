"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";

type Business = {
  id: string | number;
  name: string;
  slug: string;
  region: string | null;
  price_level: number | null;
  cover_image: string | null;
  verified: boolean | null;
  featured: boolean | null;
  created_at: string | null;
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [message, setMessage] = useState("");

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

    async function loadDashboard() {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("businesses")
        .select(
          "id, name, slug, region, price_level, cover_image, verified, featured, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(`Dashboard verileri alınamadı: ${error.message}`);
        setBusinesses([]);
      } else {
        setBusinesses((data ?? []) as Business[]);
      }

      setLoading(false);
    }

    loadDashboard();
  }, [session]);

  const stats = useMemo(() => {
    const total = businesses.length;
    const featured = businesses.filter((business) => business.featured).length;
    const verified = businesses.filter((business) => business.verified).length;
    const todayKey = new Date().toISOString().slice(0, 10);

    const addedToday = businesses.filter((business) => {
      if (!business.created_at) return false;
      return business.created_at.slice(0, 10) === todayKey;
    }).length;

    return { total, featured, verified, addedToday };
  }, [businesses]);

  const recentBusinesses = businesses.slice(0, 6);

  function formatPrice(price: number | null) {
    if (price === null || !Number.isFinite(price)) return "Belirtilmedi";
    return `${price.toLocaleString("tr-TR")}₺`;
  }

  async function handleLogout() {
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/admin");
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
            <a href="/admin/dashboard" style={styles.activeNavigationItem}>
              Dashboard
            </a>

            <a href="/admin" style={styles.navigationItem}>
              ＋ Yeni İşletme
            </a>

            <a href="/admin/businesses" style={styles.navigationItem}>
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
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>ÖNCEBAK YÖNETİMİ</p>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>
              Platformdaki işletmeleri tek ekrandan takip et.
            </p>
          </div>

          <a href="/admin" style={styles.addButton}>
            + Yeni İşletme
          </a>
        </div>

        {message && <div style={styles.errorMessage}>{message}</div>}

        <div style={styles.statsGrid}>
          <StatCard
            title="Toplam İşletme"
            value={loading ? "..." : stats.total}
            description="Sistemde kayıtlı işletme"
          />
          <StatCard
            title="Öne Çıkan"
            value={loading ? "..." : stats.featured}
            description="Öne çıkan işletme"
          />
          <StatCard
            title="Doğrulanmış"
            value={loading ? "..." : stats.verified}
            description="Doğrulanmış işletme"
          />
          <StatCard
            title="Bugün Eklenen"
            value={loading ? "..." : stats.addedToday}
            description="Bugün sisteme eklenen"
          />
        </div>

        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Son eklenen işletmeler</h2>
            <p style={styles.sectionDescription}>
              En son eklenen kayıtları hızlıca görüntüle.
            </p>
          </div>

          <a href="/admin/businesses" style={styles.allButton}>
            Tümünü Gör →
          </a>
        </div>

        {loading ? (
          <div style={styles.emptyCard}>Dashboard yükleniyor...</div>
        ) : recentBusinesses.length === 0 ? (
          <div style={styles.emptyCard}>Henüz işletme eklenmemiş.</div>
        ) : (
          <div style={styles.recentGrid}>
            {recentBusinesses.map((business) => (
              <article key={business.id} style={styles.card}>
                <div style={styles.imageArea}>
                  {business.cover_image ? (
                    <img
                      src={business.cover_image}
                      alt={business.name}
                      style={styles.image}
                    />
                  ) : (
                    <div style={styles.imagePlaceholder}>Fotoğraf yok</div>
                  )}
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.cardTop}>
                    <div>
                      <h3 style={styles.cardTitle}>{business.name}</h3>
                      <p style={styles.cardMeta}>
                        {business.region || "Bölge belirtilmedi"}
                      </p>
                    </div>

                    <div style={styles.badges}>
                      {business.featured && (
                        <span style={styles.featuredBadge}>Öne çıkan</span>
                      )}
                      {business.verified && (
                        <span style={styles.verifiedBadge}>Doğrulanmış</span>
                      )}
                    </div>
                  </div>

                  <div style={styles.priceRow}>
                    <span style={styles.priceLabel}>Ortalama fiyat</span>
                    <strong style={styles.price}>
                      {formatPrice(business.price_level)}
                    </strong>
                  </div>

                  <div style={styles.cardActions}>
                    <a
                      href={`/admin/businesses/${business.id}`}
                      style={styles.editButton}
                    >
                      Düzenle
                    </a>

                    <a
                      href={`/mekan/${business.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.viewButton}
                    >
                      Görüntüle
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <article style={styles.statCard}>
      <p style={styles.statTitle}>{title}</p>
      <strong style={styles.statValue}>{value}</strong>
      <p style={styles.statDescription}>{description}</p>
    </article>
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
    maxWidth: "1250px",
    margin: "0 auto",
    padding: "48px 38px 80px",
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
    fontSize: "36px",
    lineHeight: 1.1,
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

  errorMessage: {
    marginBottom: "20px",
    padding: "14px 16px",
    border: "1px solid #fecdca",
    borderRadius: "11px",
    background: "#fff1f0",
    color: "#b42318",
    fontWeight: 700,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "18px",
    marginBottom: "34px",
  },

  statCard: {
    padding: "22px",
    border: "1px solid #ebe8e4",
    borderRadius: "18px",
    background: "#fff",
    boxShadow: "0 12px 30px rgba(38, 30, 24, 0.04)",
  },

  statTitle: {
    margin: 0,
    color: "#737373",
    fontSize: "13px",
    fontWeight: 800,
  },

  statValue: {
    display: "block",
    marginTop: "12px",
    fontSize: "34px",
    lineHeight: 1,
  },

  statDescription: {
    margin: "10px 0 0",
    color: "#8a8a8a",
    fontSize: "12px",
    lineHeight: 1.4,
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "20px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "24px",
  },

  sectionDescription: {
    margin: "7px 0 0",
    color: "#737373",
    fontSize: "14px",
  },

  allButton: {
    color: "#ff5a1f",
    textDecoration: "none",
    fontWeight: 900,
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

  recentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
    gap: "20px",
  },

  card: {
    overflow: "hidden",
    border: "1px solid #ebe8e4",
    borderRadius: "20px",
    background: "#fff",
    boxShadow: "0 14px 35px rgba(38, 30, 24, 0.05)",
  },

  imageArea: {
    width: "100%",
    aspectRatio: "16 / 10",
    background: "#efede9",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },

  imagePlaceholder: {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    color: "#8a8a8a",
    fontWeight: 700,
  },

  cardBody: {
    padding: "18px",
  },

  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "19px",
  },

  cardMeta: {
    margin: "6px 0 0",
    color: "#ff5a1f",
    fontSize: "13px",
    fontWeight: 800,
  },

  badges: {
    display: "flex",
    flexWrap: "wrap" as const,
    justifyContent: "flex-end",
    gap: "6px",
  },

  featuredBadge: {
    padding: "5px 8px",
    borderRadius: "999px",
    background: "#fff4ed",
    color: "#c4320a",
    fontSize: "11px",
    fontWeight: 800,
  },

  verifiedBadge: {
    padding: "5px 8px",
    borderRadius: "999px",
    background: "#eff8ff",
    color: "#175cd3",
    fontSize: "11px",
    fontWeight: 800,
  },

  priceRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    marginTop: "18px",
    paddingTop: "16px",
    borderTop: "1px solid #eee",
  },

  priceLabel: {
    color: "#737373",
    fontSize: "13px",
  },

  price: {
    fontSize: "17px",
  },

  cardActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "16px",
  },

  editButton: {
    padding: "11px 14px",
    border: "1px solid #fedf89",
    borderRadius: "10px",
    background: "#fffaeb",
    color: "#b54708",
    textAlign: "center" as const,
    textDecoration: "none",
    fontWeight: 800,
  },

  viewButton: {
    padding: "11px 14px",
    border: "1px solid #dedbd7",
    borderRadius: "10px",
    color: "#171717",
    textAlign: "center" as const,
    textDecoration: "none",
    fontWeight: 800,
  },
};
