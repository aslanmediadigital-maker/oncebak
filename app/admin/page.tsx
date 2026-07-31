"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "./components/AdminSidebar";

const supabase = createClient();

type Business = {
  id: string | number;
  name: string;
  slug: string;
  region: string | null;
  cover_image: string | null;
  verified: boolean | null;
  featured: boolean | null;
  created_at: string | null;
};

type BusinessRequest = {
  id: string;
  business_name: string;
  category: string;
  region: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export function AdminPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const isProtectedDashboard = pathname === "/admin/dashboard";
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [requests, setRequests] = useState<BusinessRequest[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    let mounted = true;

    if (isProtectedDashboard) {
      async function loadClientSession() {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!currentSession) {
          router.replace("/admin");
          return;
        }

        setSession(currentSession);
        setAuthLoading(false);
      }

      void loadClientSession();

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
    }

    async function checkAdminSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setSession(null);
        setAuthLoading(false);
        return;
      }

      const { data: isAdmin, error } = await supabase.rpc("is_admin");
      if (!mounted) return;

      if (!error && isAdmin) {
        router.replace("/admin/dashboard");
        router.refresh();
        return;
      }

      router.replace("/");
    }

    void checkAdminSession();

    return () => {
      mounted = false;
    };
  }, [isProtectedDashboard, router]);

  useEffect(() => {
    if (!session) {
      setDashboardLoading(false);
      return;
    }

    async function loadDashboard() {
      setDashboardLoading(true);
      setDashboardError("");

      const [businessResult, requestResult] = await Promise.all([
        supabase
          .from("businesses")
          .select(
            "id, name, slug, region, cover_image, verified, featured, created_at"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("business_requests")
          .select("id, business_name, category, region, status, created_at")
          .order("created_at", { ascending: false }),
      ]);

      const errors = [
        businessResult.error?.message,
        requestResult.error?.message,
      ].filter(Boolean);

      if (errors.length > 0) {
        setDashboardError(`Dashboard verileri alınamadı: ${errors.join(" | ")}`);
      }

      setBusinesses((businessResult.data ?? []) as Business[]);
      setRequests((requestResult.data ?? []) as BusinessRequest[]);
      setDashboardLoading(false);
    }

    loadDashboard();
  }, [session]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");

    if (!email.trim() || !password) {
      setAuthMessage("E-posta ve şifre zorunludur.");
      return;
    }

    setLoginLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setAuthMessage("E-posta veya şifre hatalı.");
      setLoginLoading(false);
      return;
    }

    const { data: isAdmin, error: adminError } =
      await supabase.rpc("is_admin");

    if (adminError || !isAdmin) {
      setLoginLoading(false);
      router.replace("/");
      router.refresh();
      return;
    }

    setPassword("");
    setLoginLoading(false);
    router.replace("/admin/dashboard");
    router.refresh();
  }

  const stats = useMemo(
    () => ({
      totalBusinesses: businesses.length,
      pendingRequests: requests.filter((item) => item.status === "pending")
        .length,
      approvedRequests: requests.filter((item) => item.status === "approved")
        .length,
      featuredBusinesses: businesses.filter((item) => item.featured).length,
    }),
    [businesses, requests]
  );

  const recentRequests = requests.slice(0, 5);
  const recentBusinesses = businesses.slice(0, 4);

  function formatDate(value: string | null) {
    if (!value) return "Tarih yok";

    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  }

  if (authLoading) {
    return (
      <main style={styles.authPage}>
        <p style={{ fontWeight: 800 }}>Oturum kontrol ediliyor...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main style={styles.authPage}>
        <form onSubmit={handleLogin} style={styles.loginCard}>
          <a href="/" style={styles.loginLogo}>
            Önce<span style={{ color: "#ff5a1f" }}>Bak</span>
          </a>

          <p style={styles.loginSubtitle}>Yönetim paneline giriş yap</p>

          <label style={styles.field}>
            <span style={styles.label}>E-posta</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ornek@email.com"
              autoComplete="email"
              required
              style={styles.input}
            />
          </label>

          <label style={{ ...styles.field, marginTop: "18px" }}>
            <span style={styles.label}>Şifre</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Şifren"
              autoComplete="current-password"
              required
              style={styles.input}
            />
          </label>

          {authMessage && <div style={styles.authError}>{authMessage}</div>}

          <button
            type="submit"
            disabled={loginLoading}
            style={{
              ...styles.loginButton,
              opacity: loginLoading ? 0.65 : 1,
              cursor: loginLoading ? "not-allowed" : "pointer",
            }}
          >
            {loginLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>

          <a href="/" style={styles.backLink}>
            Ana sayfaya dön
          </a>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-page" style={styles.page}>
      <AdminSidebar />

      <nav className="admin-mobile-nav" aria-label="Mobil yönetim menüsü">
        <a href="/admin">Dashboard</a>
        <a href="/admin/isletmeler">İşletmeler</a>
        <a href="/admin/basvurular">Başvurular</a>
        <a href="/admin/yeni-isletme">+ Yeni İşletme</a>
      </nav>

      <section className="admin-content" style={styles.content}>
        <header className="admin-header" style={styles.header}>
          <div>
            <p style={styles.eyebrow}>ÖNCEBAK YÖNETİMİ</p>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>
              İşletmeleri, başvuruları ve platformun genel durumunu tek
              ekrandan takip et.
            </p>
          </div>

          <a className="admin-primary-button" href="/admin/yeni-isletme" style={styles.primaryButton}>
            + Yeni İşletme
          </a>
        </header>

        {dashboardError && (
          <div style={styles.errorMessage}>{dashboardError}</div>
        )}

        <section className="admin-stats-grid" style={styles.statsGrid}>
          <StatCard
            label="Toplam İşletme"
            value={dashboardLoading ? "..." : stats.totalBusinesses}
            description="Sistemde yayınlanan işletmeler"
          />
          <StatCard
            label="Bekleyen Başvuru"
            value={dashboardLoading ? "..." : stats.pendingRequests}
            description="İncelenmeyi bekleyen başvurular"
          />
          <StatCard
            label="Onaylanan Başvuru"
            value={dashboardLoading ? "..." : stats.approvedRequests}
            description="Onaylanmış işletme başvuruları"
          />
          <StatCard
            label="Öne Çıkan"
            value={dashboardLoading ? "..." : stats.featuredBusinesses}
            description="Öne çıkan olarak işaretlenenler"
          />
        </section>

        <section className="admin-dashboard-grid" style={styles.dashboardGrid}>
          <article className="admin-panel-card" style={styles.panelCard}>
            <div className="admin-panel-header" style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>Son başvurular</h2>
                <p style={styles.panelDescription}>
                  En yeni işletme başvuruları.
                </p>
              </div>

              <a href="/admin/basvurular" style={styles.inlineLink}>
                Tümünü gör →
              </a>
            </div>

            {dashboardLoading ? (
              <div style={styles.emptyState}>Başvurular yükleniyor...</div>
            ) : recentRequests.length === 0 ? (
              <div style={styles.emptyState}>Henüz başvuru bulunmuyor.</div>
            ) : (
              <div>
                {recentRequests.map((request) => (
                  <div className="admin-request-row" key={request.id} style={styles.requestRow}>
                    <div>
                      <strong style={styles.requestName}>
                        {request.business_name}
                      </strong>
                      <span style={styles.requestMeta}>
                        {request.category} · {request.region}
                      </span>
                    </div>

                    <div className="admin-request-right" style={styles.requestRight}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(request.status === "approved"
                            ? styles.approvedBadge
                            : request.status === "rejected"
                              ? styles.rejectedBadge
                              : styles.pendingBadge),
                        }}
                      >
                        {request.status === "approved"
                          ? "Onaylandı"
                          : request.status === "rejected"
                            ? "Reddedildi"
                            : "Bekliyor"}
                      </span>
                      <span style={styles.dateText}>
                        {formatDate(request.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="admin-quick-card" style={styles.quickCard}>
            <p style={styles.eyebrow}>HIZLI İŞLEMLER</p>
            <h2 style={styles.quickTitle}>Yönetimi hızlandır.</h2>
            <p style={styles.quickDescription}>
              En sık kullandığın yönetim işlemlerine doğrudan ulaş.
            </p>

            <div style={styles.quickLinks}>
              <a href="/admin/basvurular" style={styles.quickLink}>
                <span>📥</span>
                Başvuruları incele
              </a>
              <a href="/admin/yeni-isletme" style={styles.quickLink}>
                <span>➕</span>
                Yeni işletme ekle
              </a>
              <a href="/admin/isletmeler" style={styles.quickLink}>
                <span>🏢</span>
                İşletmeleri yönet
              </a>
              <a href="/" style={styles.quickLink}>
                <span>↗</span>
                Ana siteyi görüntüle
              </a>
            </div>
          </article>
        </section>

        <section className="admin-business-section" style={styles.businessSection}>
          <div className="admin-section-header" style={styles.sectionHeader}>
            <div>
              <h2 style={styles.panelTitle}>Son eklenen işletmeler</h2>
              <p style={styles.panelDescription}>
                Sisteme en son kaydedilen işletmeler.
              </p>
            </div>

            <a href="/admin/isletmeler" style={styles.inlineLink}>
              Tüm işletmeler →
            </a>
          </div>

          {dashboardLoading ? (
            <div style={styles.emptyState}>İşletmeler yükleniyor...</div>
          ) : recentBusinesses.length === 0 ? (
            <div style={styles.emptyState}>Henüz işletme eklenmemiş.</div>
          ) : (
            <div className="admin-business-grid" style={styles.businessGrid}>
              {recentBusinesses.map((business) => (
                <article className="admin-business-card" key={business.id} style={styles.businessCard}>
                  <div style={styles.imageArea}>
                    {business.cover_image ? (
                      <img
                        src={business.cover_image}
                        alt={business.name}
                        style={styles.businessImage}
                      />
                    ) : (
                      <div style={styles.imagePlaceholder}>Fotoğraf yok</div>
                    )}
                  </div>

                  <div style={styles.businessBody}>
                    <div className="admin-business-top" style={styles.businessTop}>
                      <div>
                        <h3 style={styles.businessName}>{business.name}</h3>
                        <p style={styles.businessRegion}>
                          {business.region || "Bölge belirtilmedi"}
                        </p>
                      </div>

                      <div style={styles.badgeGroup}>
                        {business.featured && (
                          <span style={styles.featuredBadge}>Öne çıkan</span>
                        )}
                        {business.verified && (
                          <span style={styles.verifiedBadge}>Doğrulanmış</span>
                        )}
                      </div>
                    </div>

                    <div className="admin-business-actions" style={styles.businessActions}>
                      <a
                        href={`/admin/isletmeler/${business.id}`}
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
      </section>

      <style jsx global>{`
        .admin-mobile-nav {
          display: none;
        }

        @media (max-width: 1100px) {
          .admin-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .admin-dashboard-grid {
            grid-template-columns: 1fr !important;
          }

          .admin-business-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 760px) {
          .admin-page {
            display: block !important;
            min-width: 0;
            overflow-x: hidden;
          }

          .admin-page > :first-child {
            display: none !important;
          }

          .admin-mobile-nav {
            position: sticky;
            z-index: 50;
            top: 0;
            display: flex;
            width: 100%;
            gap: 7px;
            overflow-x: auto;
            padding: 11px 12px;
            border-bottom: 1px solid #2f2f2f;
            background: #171717;
            scrollbar-width: none;
          }

          .admin-mobile-nav::-webkit-scrollbar {
            display: none;
          }

          .admin-mobile-nav a {
            flex: 0 0 auto;
            padding: 10px 12px;
            border: 1px solid #343434;
            border-radius: 10px;
            background: #232323;
            color: #fff;
            font-size: 11px;
            font-weight: 800;
            text-decoration: none;
            white-space: nowrap;
          }

          .admin-mobile-nav a:last-child {
            border-color: #ff5a1f;
            background: #ff5a1f;
          }

          .admin-content {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 24px 14px 55px !important;
          }

          .admin-header {
            align-items: stretch !important;
            flex-direction: column !important;
            gap: 16px !important;
            margin-bottom: 22px !important;
          }

          .admin-header h1 {
            font-size: 32px !important;
          }

          .admin-primary-button {
            display: flex !important;
            width: 100%;
            justify-content: center;
            box-sizing: border-box;
            text-align: center;
          }

          .admin-stats-grid,
          .admin-business-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          .admin-dashboard-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }

          .admin-panel-header,
          .admin-section-header {
            align-items: flex-start !important;
            flex-direction: column !important;
            gap: 12px !important;
          }

          .admin-request-row {
            align-items: flex-start !important;
            flex-direction: column !important;
            gap: 12px !important;
            padding: 16px !important;
          }

          .admin-request-right {
            width: 100%;
            justify-content: space-between;
          }

          .admin-quick-card,
          .admin-business-section {
            padding: 20px !important;
          }

          .admin-business-top {
            flex-direction: column !important;
          }

          .admin-business-top > div:last-child {
            justify-content: flex-start !important;
          }

          .admin-business-actions {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 420px) {
          .admin-content {
            padding-inline: 10px !important;
          }

          .admin-mobile-nav {
            padding-inline: 10px;
          }

          .admin-panel-card,
          .admin-quick-card,
          .admin-business-section,
          .admin-business-card {
            border-radius: 16px !important;
          }
        }
      `}</style>
    </main>
  );
}

export default AdminPageContent;

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <article style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <strong style={styles.statValue}>{value}</strong>
      <p style={styles.statDescription}>{description}</p>
    </article>
  );
}

const styles = {
  authPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background: "#f7f5f2",
    color: "#171717",
  },
  loginCard: {
    width: "100%",
    maxWidth: "420px",
    padding: "34px",
    background: "#fff",
    border: "1px solid #ebe8e4",
    borderRadius: "22px",
    boxShadow: "0 20px 50px rgba(38, 30, 24, 0.08)",
  },
  loginLogo: {
    color: "#171717",
    textDecoration: "none",
    fontSize: "27px",
    fontWeight: 900,
  },
  loginSubtitle: {
    margin: "8px 0 28px",
    color: "#737373",
    fontSize: "14px",
  },
  field: {
    display: "grid",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 800,
  },
  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "14px 15px",
    border: "1px solid #dedbd7",
    borderRadius: "11px",
    background: "#fff",
    color: "#171717",
    fontSize: "15px",
    outline: "none",
  },
  authError: {
    marginTop: "18px",
    padding: "13px 14px",
    border: "1px solid #fecdca",
    borderRadius: "11px",
    background: "#fff1f0",
    color: "#b42318",
    fontWeight: 700,
  },
  loginButton: {
    width: "100%",
    marginTop: "20px",
    padding: "14px",
    border: "none",
    borderRadius: "11px",
    background: "#ff5a1f",
    color: "#fff",
    fontWeight: 900,
  },
  backLink: {
    display: "block",
    marginTop: "18px",
    color: "#737373",
    textAlign: "center" as const,
    textDecoration: "none",
    fontSize: "14px",
  },
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "260px minmax(0, 1fr)",
    background: "#f7f5f2",
    color: "#171717",
  },
  content: {
    width: "100%",
    maxWidth: "1450px",
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
    fontSize: "38px",
    lineHeight: 1.1,
  },
  subtitle: {
    maxWidth: "700px",
    margin: 0,
    color: "#737373",
    lineHeight: 1.6,
  },
  primaryButton: {
    padding: "13px 18px",
    borderRadius: "12px",
    background: "#171717",
    color: "#fff",
    fontWeight: 900,
    textDecoration: "none",
  },
  errorMessage: {
    marginBottom: "20px",
    padding: "15px 17px",
    border: "1px solid #fecdca",
    borderRadius: "12px",
    background: "#fff1f0",
    color: "#b42318",
    fontWeight: 700,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },
  statCard: {
    padding: "24px",
    border: "1px solid #ebe8e4",
    borderRadius: "18px",
    background: "#fff",
    boxShadow: "0 14px 40px rgba(38, 30, 24, 0.05)",
  },
  statLabel: {
    display: "block",
    color: "#737373",
    fontSize: "13px",
    fontWeight: 800,
  },
  statValue: {
    display: "block",
    marginTop: "14px",
    fontSize: "34px",
    lineHeight: 1,
  },
  statDescription: {
    margin: "10px 0 0",
    color: "#8a8a8a",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.65fr) minmax(300px, 0.75fr)",
    gap: "20px",
    marginBottom: "24px",
  },
  panelCard: {
    overflow: "hidden",
    border: "1px solid #ebe8e4",
    borderRadius: "22px",
    background: "#fff",
    boxShadow: "0 20px 50px rgba(38, 30, 24, 0.05)",
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    padding: "24px",
    borderBottom: "1px solid #eee",
  },
  panelTitle: {
    margin: 0,
    fontSize: "22px",
  },
  panelDescription: {
    margin: "6px 0 0",
    color: "#737373",
    fontSize: "13px",
  },
  inlineLink: {
    color: "#ff5a1f",
    fontSize: "13px",
    fontWeight: 900,
    textDecoration: "none",
  },
  requestRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    padding: "17px 24px",
    borderBottom: "1px solid #f0eeeb",
  },
  requestName: {
    display: "block",
    fontSize: "14px",
  },
  requestMeta: {
    display: "block",
    marginTop: "5px",
    color: "#8a8a8a",
    fontSize: "12px",
  },
  requestRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  statusBadge: {
    display: "inline-flex",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 900,
  },
  pendingBadge: {
    background: "#fff3e8",
    color: "#b54708",
  },
  approvedBadge: {
    background: "#ecfdf3",
    color: "#067647",
  },
  rejectedBadge: {
    background: "#fff1f0",
    color: "#b42318",
  },
  dateText: {
    color: "#8a8a8a",
    fontSize: "11px",
  },
  quickCard: {
    padding: "26px",
    borderRadius: "22px",
    background: "#171717",
    color: "#fff",
    boxShadow: "0 20px 50px rgba(38, 30, 24, 0.12)",
  },
  quickTitle: {
    margin: "10px 0 8px",
    fontSize: "27px",
  },
  quickDescription: {
    margin: 0,
    color: "#a3a3a3",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  quickLinks: {
    display: "grid",
    gap: "10px",
    marginTop: "24px",
  },
  quickLink: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "13px 14px",
    border: "1px solid #353535",
    borderRadius: "12px",
    background: "#242424",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 800,
    textDecoration: "none",
  },
  businessSection: {
    padding: "26px",
    border: "1px solid #ebe8e4",
    borderRadius: "22px",
    background: "#fff",
    boxShadow: "0 20px 50px rgba(38, 30, 24, 0.05)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "20px",
  },
  businessGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "16px",
  },
  businessCard: {
    overflow: "hidden",
    border: "1px solid #ebe8e4",
    borderRadius: "17px",
    background: "#fff",
  },
  imageArea: {
    aspectRatio: "16 / 10",
    background: "#efede9",
  },
  businessImage: {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover" as const,
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    color: "#8a8a8a",
    fontSize: "12px",
    fontWeight: 700,
  },
  businessBody: {
    padding: "15px",
  },
  businessTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "10px",
  },
  businessName: {
    margin: 0,
    fontSize: "16px",
  },
  businessRegion: {
    margin: "5px 0 0",
    color: "#ff5a1f",
    fontSize: "12px",
    fontWeight: 800,
  },
  badgeGroup: {
    display: "flex",
    flexWrap: "wrap" as const,
    justifyContent: "flex-end",
    gap: "5px",
  },
  featuredBadge: {
    padding: "5px 7px",
    borderRadius: "999px",
    background: "#fff4ed",
    color: "#c4320a",
    fontSize: "9px",
    fontWeight: 800,
  },
  verifiedBadge: {
    padding: "5px 7px",
    borderRadius: "999px",
    background: "#eff8ff",
    color: "#175cd3",
    fontSize: "9px",
    fontWeight: 800,
  },
  businessActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "15px",
  },
  editButton: {
    padding: "9px 10px",
    border: "1px solid #fedf89",
    borderRadius: "9px",
    background: "#fffaeb",
    color: "#b54708",
    textAlign: "center" as const,
    textDecoration: "none",
    fontSize: "11px",
    fontWeight: 800,
  },
  viewButton: {
    padding: "9px 10px",
    border: "1px solid #dedbd7",
    borderRadius: "9px",
    color: "#171717",
    textAlign: "center" as const,
    textDecoration: "none",
    fontSize: "11px",
    fontWeight: 800,
  },
  emptyState: {
    padding: "40px 24px",
    color: "#737373",
    textAlign: "center" as const,
    fontWeight: 700,
  },
};

