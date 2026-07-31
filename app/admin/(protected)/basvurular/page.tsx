"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type RequestStatus = "pending" | "approved" | "rejected";

type BusinessRequest = {
  id: string;
  business_name: string;
  category: string;
  region: string;
  address: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
  google_maps_url: string | null;
  description: string | null;
  price_level: number | null;
  menu_url: string | null;
  cover_image_url: string | null;
  gallery_urls: string[] | null;
  menu_file_url: string | null;
  status: RequestStatus;
  created_at: string;
};

function isImageMenuUrl(value: string | null | undefined) {
  return Boolean(
    value && /\.(?:png|jpe?g|webp|gif|avif)(?:$|[?#])/i.test(value)
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(status: RequestStatus) {
  if (status === "approved") return "Onaylandı";
  if (status === "rejected") return "Reddedildi";
  return "Bekliyor";
}

function createSlug(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function BasvurularPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [requests, setRequests] = useState<BusinessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState<BusinessRequest | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(currentSession);
      setAuthLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    async function loadRequests() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("business_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(`Başvurular alınamadı: ${error.message}`);
        setRequests([]);
        setLoading(false);
        return;
      }

      setRequests((data ?? []) as BusinessRequest[]);
      setLoading(false);
    }

    loadRequests();
  }, [session]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    if (!query) return requests;

    return requests.filter((request) =>
      [
        request.business_name,
        request.category,
        request.region,
        request.phone,
        request.email ?? "",
      ].some((value) => value.toLocaleLowerCase("tr-TR").includes(query))
    );
  }, [requests, search]);

  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((item) => item.status === "pending").length,
      approved: requests.filter((item) => item.status === "approved").length,
      rejected: requests.filter((item) => item.status === "rejected").length,
    }),
    [requests]
  );

  async function handleLogout() {
    await supabase.auth.signOut({ scope: "local" });
  }

  async function handleReject(request: BusinessRequest) {
    if (request.status === "rejected") {
      setActionMessage({
        type: "error",
        text: "Bu başvuru zaten reddedilmiş.",
      });
      return;
    }

    const confirmed = window.confirm(
      `${request.business_name} adlı işletme başvurusunu reddetmek istiyor musun?`
    );

    if (!confirmed) return;

    setActionLoadingId(request.id);
    setActionMessage(null);

    const { error } = await supabase
      .from("business_requests")
      .update({ status: "rejected" })
      .eq("id", request.id);

    if (error) {
      setActionMessage({
        type: "error",
        text: `Başvuru reddedilemedi: ${error.message}`,
      });
      setActionLoadingId(null);
      return;
    }

    setRequests((current) =>
      current.map((item) =>
        item.id === request.id ? { ...item, status: "rejected" } : item
      )
    );

    setSelectedRequest((current) =>
      current?.id === request.id ? { ...current, status: "rejected" } : current
    );

    setActionMessage({
      type: "success",
      text: `${request.business_name} başvurusu reddedildi.`,
    });
    setActionLoadingId(null);
  }

  async function handleDelete(request: BusinessRequest) {
    const confirmed = window.confirm(
      `${request.business_name} adlı başvuruyu kalıcı olarak silmek istiyor musun? Bu işlem geri alınamaz.`
    );

    if (!confirmed) return;

    setActionLoadingId(request.id);
    setActionMessage(null);

    const { error } = await supabase
      .from("business_requests")
      .delete()
      .eq("id", request.id);

    if (error) {
      setActionMessage({
        type: "error",
        text: `Başvuru silinemedi: ${error.message}`,
      });
      setActionLoadingId(null);
      return;
    }

    setRequests((current) => current.filter((item) => item.id !== request.id));
    setSelectedRequest((current) =>
      current?.id === request.id ? null : current
    );

    setActionMessage({
      type: "success",
      text: `${request.business_name} başvurusu silindi.`,
    });
    setActionLoadingId(null);
  }

  async function handleApprove(request: BusinessRequest) {
    if (request.status === "approved") {
      setActionMessage({
        type: "error",
        text: "Bu başvuru zaten onaylanmış.",
      });
      return;
    }

    const confirmed = window.confirm(
      `${request.business_name} adlı işletmeyi onaylayıp yayına almak istiyor musun?`
    );

    if (!confirmed) return;

    setActionLoadingId(request.id);
    setActionMessage(null);

    const slug = `${createSlug(request.business_name)}-${Date.now()}`;
    const submittedMenuUrl = request.menu_file_url || request.menu_url;
    const submittedMenuIsImage = isImageMenuUrl(submittedMenuUrl);

    const { error: insertError } = await supabase.from("businesses").insert({
      name: request.business_name,
      slug,
      description: request.description,
      region: request.region,
      address: request.address,
      phone: request.phone,
      website: request.website,
      instagram: request.instagram,
      price_level: request.price_level,
      rating: 0,
      verified: false,
      featured: false,
      cover_image: request.cover_image_url,
      gallery: request.gallery_urls ?? [],
      menu_url: submittedMenuIsImage ? null : submittedMenuUrl,
      menu_images:
        submittedMenuIsImage && submittedMenuUrl ? [submittedMenuUrl] : [],
      menu_updated_at: submittedMenuUrl ? new Date().toISOString() : null,
    });

    if (insertError) {
      setActionMessage({
        type: "error",
        text: `İşletme yayınlanamadı: ${insertError.message}`,
      });
      setActionLoadingId(null);
      return;
    }

    const { error: updateError } = await supabase
      .from("business_requests")
      .update({ status: "approved" })
      .eq("id", request.id);

    if (updateError) {
      setActionMessage({
        type: "error",
        text:
          "İşletme businesses tablosuna eklendi ancak başvuru durumu güncellenemedi: " +
          updateError.message,
      });
      setActionLoadingId(null);
      return;
    }

    setRequests((current) =>
      current.map((item) =>
        item.id === request.id ? { ...item, status: "approved" } : item
      )
    );

    setSelectedRequest((current) =>
      current?.id === request.id ? { ...current, status: "approved" } : current
    );

    setActionMessage({
      type: "success",
      text: `${request.business_name} onaylandı ve işletmeler tablosuna eklendi.`,
    });
    setActionLoadingId(null);
  }

  if (authLoading) {
    return (
      <main style={styles.centerPage}>
        <p style={{ fontWeight: 800 }}>Oturum kontrol ediliyor...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main style={styles.centerPage}>
        <div style={styles.loginNotice}>
          <h1 style={{ margin: 0 }}>Giriş gerekli</h1>
          <p style={styles.mutedText}>
            İşletme başvurularını görmek için yönetim panelinde oturum açmalısın.
          </p>
          <a href="/admin" style={styles.primaryLink}>
            Admin girişine git →
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="applications-page" style={styles.page}>
      <aside className="applications-sidebar" style={styles.sidebar}>
        <div>
          <a href="/" style={styles.logo}>
            Önce<span style={{ color: "#ff5a1f" }}>Bak</span>
          </a>

          <p style={styles.panelLabel}>Yönetim Paneli</p>

          <nav className="applications-navigation" style={styles.navigation}>
            <a href="/admin/dashboard" style={styles.navigationItem}>
              📊 Dashboard
            </a>

            <a href="/admin/basvurular" style={styles.activeNavigationItem}>
              📥 İşletme Başvuruları
            </a>

            <a href="/admin/isletmeler" style={styles.navigationItem}>
              🏢 İşletmeler
            </a>

            <a href="/admin/yeni-isletme" style={styles.navigationItem}>
              ➕ Yeni İşletme
            </a>

            <a href="/admin/one-cikanlar" style={styles.navigationItem}>
              ⭐ Öne Çıkanlar
            </a>

            <a href="/admin/ayarlar" style={styles.navigationItem}>
              ⚙ Ayarlar
            </a>
          </nav>
        </div>

        <div>
          <a href="/" style={styles.sidebarSiteLink}>
            Ana siteyi görüntüle →
          </a>
          <button type="button" onClick={handleLogout} style={styles.logoutButton}>
            Çıkış Yap
          </button>
        </div>
      </aside>

      <section className="applications-content" style={styles.content}>
        <header className="applications-header" style={styles.header}>
          <div>
            <p style={styles.eyebrow}>İŞLETME YÖNETİMİ</p>
            <h1 style={styles.title}>İşletme başvuruları</h1>
            <p style={styles.subtitle}>
              ÖnceBak&apos;ta yer almak isteyen işletmelerden gelen başvuruları
              buradan inceleyebilirsin.
            </p>
          </div>

          <a className="applications-new-button" href="/admin/yeni-isletme" style={styles.newBusinessButton}>
            + Yeni İşletme
          </a>
        </header>

        <section className="applications-stats" style={styles.statsGrid}>
          <StatCard label="Toplam Başvuru" value={stats.total} />
          <StatCard label="Bekleyen" value={stats.pending} />
          <StatCard label="Onaylanan" value={stats.approved} />
          <StatCard label="Reddedilen" value={stats.rejected} />
        </section>

        {actionMessage && (
          <div
            style={{
              ...styles.actionMessage,
              ...(actionMessage.type === "success"
                ? styles.actionSuccess
                : styles.actionError),
            }}
          >
            {actionMessage.text}
          </div>
        )}

        <section className="applications-table-card" style={styles.tableCard}>
          <div className="applications-table-header" style={styles.tableHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Başvurular</h2>
              <p style={styles.sectionDescription}>
                En yeni başvurular önce gösterilir.
              </p>
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="İşletme, kategori veya bölge ara..."
              className="applications-search" style={styles.searchInput}
            />
          </div>

          {loading && (
            <div style={styles.stateBox}>Başvurular yükleniyor...</div>
          )}

          {!loading && errorMessage && (
            <div style={styles.errorBox}>{errorMessage}</div>
          )}

          {!loading && !errorMessage && filteredRequests.length === 0 && (
            <div style={styles.stateBox}>
              {search
                ? "Aramana uygun başvuru bulunamadı."
                : "Henüz işletme başvurusu bulunmuyor."}
            </div>
          )}

          {!loading && !errorMessage && filteredRequests.length > 0 && (
            <div className="applications-table-wrapper" style={styles.tableWrapper}>
              <table className="applications-table" style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>İşletme</th>
                    <th style={styles.th}>Kategori</th>
                    <th style={styles.th}>Bölge</th>
                    <th style={styles.th}>Telefon</th>
                    <th style={styles.th}>Tarih</th>
                    <th style={styles.th}>Durum</th>
                    <th style={styles.th}>İşlemler</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map((request) => (
                    <tr className="applications-row" key={request.id}>
                      <td data-label="İşletme" style={styles.td}>
                        <strong>{request.business_name}</strong>
                        {request.email && (
                          <span style={styles.secondaryText}>{request.email}</span>
                        )}
                      </td>
                      <td data-label="Kategori" style={styles.td}>{request.category}</td>
                      <td data-label="Bölge" style={styles.td}>{request.region}</td>
                      <td data-label="Telefon" style={styles.td}>{request.phone}</td>
                      <td data-label="Tarih" style={styles.td}>{formatDate(request.created_at)}</td>
                      <td data-label="Durum" style={styles.td}>
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
                          {statusLabel(request.status)}
                        </span>
                      </td>
                      <td data-label="İşlemler" style={styles.td}>
                        <div className="applications-actions" style={styles.actionGroup}>
                          <button
                            type="button"
                            onClick={() => setSelectedRequest(request)}
                            style={styles.viewButton}
                          >
                            Gör
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(request)}
                            disabled={
                              actionLoadingId === request.id ||
                              request.status === "approved"
                            }
                            style={{
                              ...styles.approveButton,
                              opacity:
                                actionLoadingId === request.id ||
                                request.status === "approved"
                                  ? 0.55
                                  : 1,
                              cursor:
                                actionLoadingId === request.id ||
                                request.status === "approved"
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {actionLoadingId === request.id
                              ? "Onaylanıyor..."
                              : request.status === "approved"
                                ? "Onaylandı"
                                : "Onayla"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(request)}
                            disabled={
                              actionLoadingId === request.id ||
                              request.status === "rejected"
                            }
                            style={{
                              ...styles.rejectButton,
                              opacity:
                                actionLoadingId === request.id ||
                                request.status === "rejected"
                                  ? 0.55
                                  : 1,
                              cursor:
                                actionLoadingId === request.id ||
                                request.status === "rejected"
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {actionLoadingId === request.id
                              ? "İşleniyor..."
                              : request.status === "rejected"
                                ? "Reddedildi"
                                : "Reddet"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(request)}
                            disabled={actionLoadingId === request.id}
                            style={{
                              ...styles.deleteButton,
                              opacity:
                                actionLoadingId === request.id ? 0.55 : 1,
                              cursor:
                                actionLoadingId === request.id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {actionLoadingId === request.id ? "İşleniyor..." : "Sil"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {selectedRequest && (
        <div
          className="applications-modal-backdrop" style={styles.modalBackdrop}
          onClick={() => setSelectedRequest(null)}
        >
          <div className="applications-modal" style={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div className="applications-modal-header" style={styles.modalHeader}>
              <div>
                <p style={styles.eyebrow}>BAŞVURU DETAYI</p>
                <h2 style={styles.modalTitle}>
                  {selectedRequest.business_name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                style={styles.closeButton}
                aria-label="Pencereyi kapat"
              >
                ×
              </button>
            </div>

            {selectedRequest.cover_image_url ? (
              <div style={styles.coverImageSection}>
                <img
                  src={selectedRequest.cover_image_url}
                  alt={`${selectedRequest.business_name} kapak fotoğrafı`}
                  className="applications-cover-image"
                  style={styles.coverImage}
                />

                <a
                  href={selectedRequest.cover_image_url}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.openImageLink}
                >
                  Fotoğrafı yeni sekmede aç →
                </a>
              </div>
            ) : (
              <div style={styles.coverImageEmpty}>
                Kapak fotoğrafı yüklenmemiş.
              </div>
            )}

            <section style={styles.mediaSection}>
              <div style={styles.mediaSectionHeader}>
                <div>
                  <span style={styles.detailLabel}>Galeri</span>
                  <strong style={styles.mediaSectionTitle}>
                    {(selectedRequest.gallery_urls ?? []).length} fotoğraf
                  </strong>
                </div>
              </div>

              {(selectedRequest.gallery_urls ?? []).length > 0 ? (
                <div className="applications-gallery" style={styles.galleryGrid}>
                  {(selectedRequest.gallery_urls ?? []).map((imageUrl, index) => (
                    <a
                      key={`${imageUrl}-${index}`}
                      href={imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.galleryItem}
                    >
                      <img
                        src={imageUrl}
                        alt={`${selectedRequest.business_name} galeri fotoğrafı ${index + 1}`}
                        style={styles.galleryImage}
                      />
                      <span style={styles.galleryNumber}>{index + 1}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div style={styles.mediaEmpty}>Galeri fotoğrafı yüklenmemiş.</div>
              )}
            </section>

            <section style={styles.mediaSection}>
              <span style={styles.detailLabel}>Menü dosyası</span>

              {selectedRequest.menu_file_url ? (
                selectedRequest.menu_file_url.toLowerCase().includes(".pdf") ? (
                  <a
                    href={selectedRequest.menu_file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="applications-menu-card"
                    style={styles.menuFileCard}
                  >
                    <span style={styles.pdfBadge}>PDF</span>
                    <div>
                      <strong style={styles.menuFileTitle}>
                        Menü PDF&apos;ini görüntüle
                      </strong>
                      <small style={styles.menuFileText}>
                        Dosya yeni sekmede açılır.
                      </small>
                    </div>
                    <span style={styles.menuArrow}>→</span>
                  </a>
                ) : (
                  <div style={styles.menuImageSection}>
                    <img
                      src={selectedRequest.menu_file_url}
                      alt={`${selectedRequest.business_name} menüsü`}
                      style={styles.menuImage}
                    />
                    <a
                      href={selectedRequest.menu_file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.openImageLink}
                    >
                      Menü görselini yeni sekmede aç →
                    </a>
                  </div>
                )
              ) : selectedRequest.menu_url ? (
                <a
                  href={selectedRequest.menu_url}
                  target="_blank"
                  rel="noreferrer"
                  className="applications-menu-card"
                  style={styles.menuFileCard}
                >
                  <span style={styles.linkBadge}>URL</span>
                  <div>
                    <strong style={styles.menuFileTitle}>
                      Menü bağlantısını aç
                    </strong>
                    <small style={styles.menuFileText}>
                      İşletmenin eklediği harici menü bağlantısı.
                    </small>
                  </div>
                  <span style={styles.menuArrow}>→</span>
                </a>
              ) : (
                <div style={styles.mediaEmpty}>Menü dosyası yüklenmemiş.</div>
              )}
            </section>

            <div className="applications-detail-grid" style={styles.detailGrid}>
              <Detail label="Kategori" value={selectedRequest.category} />
              <Detail label="Bölge" value={selectedRequest.region} />
              <Detail label="Adres" value={selectedRequest.address} />
              <Detail label="Telefon" value={selectedRequest.phone} />
              <Detail label="WhatsApp" value={selectedRequest.whatsapp} />
              <Detail label="E-posta" value={selectedRequest.email} />
              <Detail label="Instagram" value={selectedRequest.instagram} />
              <Detail label="Web sitesi" value={selectedRequest.website} />
              <Detail
                label="Google Maps"
                value={selectedRequest.google_maps_url}
              />
              <Detail
                label="Ortalama fiyat"
                value={
                  selectedRequest.price_level !== null
                    ? `${selectedRequest.price_level.toLocaleString("tr-TR")} TL`
                    : null
                }
              />
              <Detail label="Menü bağlantısı" value={selectedRequest.menu_url} />
              <Detail
                label="Başvuru tarihi"
                value={formatDate(selectedRequest.created_at)}
              />
            </div>

            <div style={styles.descriptionBox}>
              <span style={styles.detailLabel}>Açıklama</span>
              <p style={styles.descriptionText}>
                {selectedRequest.description || "Açıklama eklenmemiş."}
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          max-width: 100%;
          overflow-x: hidden;
        }

        @media (max-width: 1100px) {
          .applications-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 980px) {
          .applications-page {
            display: block !important;
            min-width: 0;
            overflow-x: hidden;
          }

          .applications-sidebar {
            position: sticky !important;
            z-index: 50;
            top: 0;
            width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            padding: 14px 14px 12px !important;
          }

          .applications-sidebar > div:first-child {
            width: 100%;
          }

          .applications-sidebar > div:last-child {
            display: none !important;
          }

          .applications-sidebar [style*="font-size: 26px"] {
            display: inline-block;
            font-size: 22px !important;
          }

          .applications-sidebar [style*="margin-top: 8px"] {
            display: none !important;
          }

          .applications-navigation {
            display: flex !important;
            width: 100%;
            gap: 8px !important;
            overflow-x: auto;
            margin-top: 12px !important;
            padding-bottom: 2px;
            scrollbar-width: none;
          }

          .applications-navigation::-webkit-scrollbar {
            display: none;
          }

          .applications-navigation a {
            flex: 0 0 auto;
            padding: 10px 12px !important;
            font-size: 12px;
            white-space: nowrap;
          }

          .applications-content {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 26px 16px 60px !important;
          }

          .applications-header {
            align-items: stretch !important;
            flex-direction: column !important;
            gap: 16px !important;
            margin-bottom: 22px !important;
          }

          .applications-header h1 {
            font-size: 34px !important;
            overflow-wrap: anywhere;
          }

          .applications-new-button {
            display: flex !important;
            width: 100%;
            justify-content: center;
            text-align: center;
          }

          .applications-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }

          .applications-table-header {
            align-items: stretch !important;
            flex-direction: column !important;
            gap: 16px !important;
            padding: 20px !important;
          }

          .applications-search {
            max-width: none !important;
          }

          .applications-table-wrapper {
            overflow: visible !important;
            padding: 14px;
          }

          .applications-table {
            min-width: 0 !important;
            border-collapse: separate !important;
            border-spacing: 0 14px !important;
          }

          .applications-table thead {
            display: none;
          }

          .applications-table tbody,
          .applications-table tr,
          .applications-table td {
            display: block;
            width: 100%;
          }

          .applications-row {
            overflow: hidden;
            border: 1px solid #ebe8e4;
            border-radius: 16px;
            background: #fff;
            box-shadow: 0 8px 24px rgba(38, 30, 24, 0.05);
          }

          .applications-row td {
            display: grid !important;
            grid-template-columns: minmax(88px, 0.42fr) minmax(0, 1fr);
            align-items: start;
            gap: 12px;
            padding: 12px 14px !important;
            border-bottom: 1px solid #f0eeeb !important;
            overflow-wrap: anywhere;
          }

          .applications-row td:last-child {
            border-bottom: 0 !important;
          }

          .applications-row td::before {
            content: attr(data-label);
            color: #737373;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.4px;
            text-transform: uppercase;
          }

          .applications-actions {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px !important;
          }

          .applications-actions button {
            width: 100%;
          }

          .applications-modal-backdrop {
            align-items: end !important;
            padding: 0 !important;
          }

          .applications-modal {
            width: 100% !important;
            max-width: none !important;
            max-height: 94vh !important;
            padding: 20px 16px 28px !important;
            border-radius: 22px 22px 0 0 !important;
          }

          .applications-modal-header h2 {
            font-size: 25px !important;
            overflow-wrap: anywhere;
          }

          .applications-cover-image {
            height: 220px !important;
          }

          .applications-gallery {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .applications-detail-grid {
            grid-template-columns: 1fr !important;
          }

          .applications-menu-card {
            grid-template-columns: 48px minmax(0, 1fr) auto !important;
            gap: 10px !important;
            padding: 13px !important;
          }

          .applications-menu-card > span:first-child {
            width: 48px !important;
            height: 48px !important;
          }
        }

        @media (max-width: 560px) {
          .applications-content {
            padding-inline: 10px !important;
          }

          .applications-stats {
            grid-template-columns: 1fr !important;
          }

          .applications-table-card {
            border-radius: 16px !important;
          }

          .applications-table-wrapper {
            padding: 10px;
          }

          .applications-row td {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .applications-actions {
            grid-template-columns: 1fr !important;
          }

          .applications-gallery {
            grid-template-columns: 1fr !important;
          }

          .applications-modal-header {
            gap: 12px !important;
          }

          .applications-menu-card {
            grid-template-columns: 44px minmax(0, 1fr) !important;
          }

          .applications-menu-card > span:last-child {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <strong style={styles.statValue}>{value}</strong>
    </article>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div style={styles.detailItem}>
      <span style={styles.detailLabel}>{label}</span>
      <strong style={styles.detailValue}>{value || "Belirtilmemiş"}</strong>
    </div>
  );
}

const styles = {
  centerPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background: "#f7f5f2",
    color: "#171717",
  },
  loginNotice: {
    width: "100%",
    maxWidth: "460px",
    padding: "34px",
    borderRadius: "22px",
    border: "1px solid #ebe8e4",
    background: "#fff",
    boxShadow: "0 20px 50px rgba(38, 30, 24, 0.08)",
  },
  mutedText: {
    color: "#737373",
    lineHeight: 1.6,
  },
  primaryLink: {
    display: "inline-flex",
    marginTop: "10px",
    padding: "13px 18px",
    borderRadius: "11px",
    background: "#ff5a1f",
    color: "#fff",
    fontWeight: 900,
    textDecoration: "none",
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
  navigationItem: {
    padding: "14px 16px",
    borderRadius: "12px",
    color: "#d4d4d4",
    textDecoration: "none",
    fontWeight: 700,
  },
  activeNavigationItem: {
    padding: "14px 16px",
    borderRadius: "12px",
    background: "#ff5a1f",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 800,
  },
  sidebarSiteLink: {
    display: "block",
    marginBottom: "12px",
    color: "#a3a3a3",
    textDecoration: "none",
    fontSize: "13px",
  },
  logoutButton: {
    width: "100%",
    padding: "12px 18px",
    border: "1px solid #393939",
    borderRadius: "12px",
    background: "#242424",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  content: {
    width: "100%",
    maxWidth: "1500px",
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
    maxWidth: "690px",
    margin: 0,
    color: "#737373",
    lineHeight: 1.6,
  },
  newBusinessButton: {
    padding: "13px 18px",
    borderRadius: "12px",
    background: "#171717",
    color: "#fff",
    fontWeight: 900,
    textDecoration: "none",
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
  actionMessage: {
    marginBottom: "20px",
    padding: "15px 17px",
    border: "1px solid",
    borderRadius: "12px",
    fontWeight: 800,
    lineHeight: 1.5,
  },
  actionSuccess: {
    borderColor: "#abefc6",
    background: "#ecfdf3",
    color: "#067647",
  },
  actionError: {
    borderColor: "#fecdca",
    background: "#fff1f0",
    color: "#b42318",
  },
  tableCard: {
    overflow: "hidden",
    border: "1px solid #ebe8e4",
    borderRadius: "22px",
    background: "#fff",
    boxShadow: "0 20px 50px rgba(38, 30, 24, 0.06)",
  },
  tableHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    padding: "26px 28px",
    borderBottom: "1px solid #eee",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "22px",
  },
  sectionDescription: {
    margin: "6px 0 0",
    color: "#737373",
    fontSize: "14px",
  },
  searchInput: {
    width: "100%",
    maxWidth: "330px",
    padding: "13px 14px",
    border: "1px solid #dedbd7",
    borderRadius: "11px",
    outline: "none",
  },
  stateBox: {
    padding: "44px 28px",
    color: "#737373",
    textAlign: "center" as const,
    fontWeight: 700,
  },
  errorBox: {
    margin: "24px",
    padding: "16px",
    border: "1px solid #fecdca",
    borderRadius: "12px",
    background: "#fff1f0",
    color: "#b42318",
    fontWeight: 700,
  },
  tableWrapper: {
    overflowX: "auto" as const,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    minWidth: "1120px",
  },
  th: {
    padding: "15px 18px",
    borderBottom: "1px solid #eee",
    background: "#faf9f7",
    color: "#737373",
    fontSize: "12px",
    textAlign: "left" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  td: {
    padding: "17px 18px",
    borderBottom: "1px solid #f0eeeb",
    fontSize: "14px",
    verticalAlign: "middle" as const,
  },
  secondaryText: {
    display: "block",
    marginTop: "5px",
    color: "#8a8a8a",
    fontSize: "12px",
    fontWeight: 400,
  },
  statusBadge: {
    display: "inline-flex",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "12px",
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
  actionGroup: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },
  viewButton: {
    padding: "8px 10px",
    border: "1px solid #ddd",
    borderRadius: "9px",
    background: "#fff",
    color: "#333",
    fontWeight: 800,
    cursor: "pointer",
  },
  approveButton: {
    padding: "8px 10px",
    border: "1px solid #abefc6",
    borderRadius: "9px",
    background: "#ecfdf3",
    color: "#067647",
    fontWeight: 800,
  },
  rejectButton: {
    padding: "8px 10px",
    border: "1px solid #fedf89",
    borderRadius: "9px",
    background: "#fffaeb",
    color: "#b54708",
    fontWeight: 800,
  },
  deleteButton: {
    padding: "8px 10px",
    border: "1px solid #fecdca",
    borderRadius: "9px",
    background: "#fff1f0",
    color: "#b42318",
    fontWeight: 800,
  },
  modalBackdrop: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 100,
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background: "rgba(17, 17, 17, 0.66)",
  },
  modal: {
    width: "100%",
    maxWidth: "860px",
    maxHeight: "90vh",
    overflowY: "auto" as const,
    padding: "28px",
    borderRadius: "22px",
    background: "#fff",
    boxShadow: "0 30px 100px rgba(0, 0, 0, 0.25)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "24px",
  },
  modalTitle: {
    margin: "8px 0 0",
    fontSize: "30px",
  },
  closeButton: {
    width: "42px",
    height: "42px",
    border: "1px solid #e5e5e5",
    borderRadius: "50%",
    background: "#fff",
    color: "#171717",
    fontSize: "24px",
    cursor: "pointer",
  },
  coverImageSection: {
    marginBottom: "22px",
  },
  coverImage: {
    width: "100%",
    height: "320px",
    display: "block",
    objectFit: "cover" as const,
    border: "1px solid #ececec",
    borderRadius: "18px",
    background: "#f3f1ee",
  },
  openImageLink: {
    display: "inline-flex",
    marginTop: "10px",
    color: "#ff5a1f",
    fontSize: "12px",
    fontWeight: 900,
    textDecoration: "none",
  },
  coverImageEmpty: {
    display: "grid",
    minHeight: "150px",
    placeItems: "center",
    marginBottom: "22px",
    border: "1px dashed #dedbd7",
    borderRadius: "18px",
    background: "#faf9f7",
    color: "#8a8a8a",
    fontSize: "13px",
    fontWeight: 800,
  },
  mediaSection: {
    marginBottom: "22px",
  },
  mediaSectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "12px",
  },
  mediaSectionTitle: {
    display: "block",
    fontSize: "14px",
  },
  galleryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "10px",
  },
  galleryItem: {
    position: "relative" as const,
    height: "145px",
    overflow: "hidden",
    border: "1px solid #ececec",
    borderRadius: "14px",
    background: "#f3f1ee",
    textDecoration: "none",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover" as const,
  },
  galleryNumber: {
    position: "absolute" as const,
    right: "8px",
    bottom: "8px",
    display: "grid",
    width: "27px",
    height: "27px",
    placeItems: "center",
    borderRadius: "50%",
    background: "rgba(17, 17, 17, 0.78)",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 900,
  },
  mediaEmpty: {
    display: "grid",
    minHeight: "96px",
    placeItems: "center",
    border: "1px dashed #dedbd7",
    borderRadius: "14px",
    background: "#faf9f7",
    color: "#8a8a8a",
    fontSize: "13px",
    fontWeight: 800,
  },
  menuFileCard: {
    display: "grid",
    gridTemplateColumns: "56px minmax(0, 1fr) auto",
    alignItems: "center",
    gap: "14px",
    padding: "16px",
    border: "1px solid #eee",
    borderRadius: "14px",
    background: "#faf9f7",
    color: "#171717",
    textDecoration: "none",
  },
  pdfBadge: {
    display: "grid",
    width: "56px",
    height: "56px",
    placeItems: "center",
    borderRadius: "14px",
    background: "#fff1f0",
    color: "#b42318",
    fontSize: "12px",
    fontWeight: 900,
  },
  linkBadge: {
    display: "grid",
    width: "56px",
    height: "56px",
    placeItems: "center",
    borderRadius: "14px",
    background: "#fff3e8",
    color: "#b54708",
    fontSize: "12px",
    fontWeight: 900,
  },
  menuFileTitle: {
    display: "block",
    fontSize: "14px",
  },
  menuFileText: {
    display: "block",
    marginTop: "5px",
    color: "#737373",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  menuArrow: {
    color: "#ff5a1f",
    fontSize: "20px",
    fontWeight: 900,
  },
  menuImageSection: {
    overflow: "hidden",
    border: "1px solid #ececec",
    borderRadius: "16px",
    background: "#faf9f7",
  },
  menuImage: {
    width: "100%",
    maxHeight: "480px",
    display: "block",
    objectFit: "contain" as const,
    background: "#f3f1ee",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
  },
  detailItem: {
    padding: "16px",
    border: "1px solid #eee",
    borderRadius: "13px",
    background: "#faf9f7",
  },
  detailLabel: {
    display: "block",
    marginBottom: "7px",
    color: "#737373",
    fontSize: "11px",
    fontWeight: 900,
    textTransform: "uppercase" as const,
    letterSpacing: "0.6px",
  },
  detailValue: {
    fontSize: "14px",
    lineHeight: 1.5,
    overflowWrap: "anywhere" as const,
  },
  descriptionBox: {
    marginTop: "14px",
    padding: "18px",
    border: "1px solid #eee",
    borderRadius: "13px",
    background: "#faf9f7",
  },
  descriptionText: {
    margin: 0,
    color: "#4f4f4f",
    lineHeight: 1.75,
  },
};
