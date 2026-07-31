"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type FormState = {
  name: string;
  description: string;
  region: string;
  address: string;
  phone: string;
  website: string;
  instagram: string;
  price: string;
  verified: boolean;
  featured: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  region: "",
  address: "",
  phone: "",
  website: "",
  instagram: "",
  price: "",
  verified: false,
  featured: false,
};

export default function EditBusinessPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const businessId = params.id;

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [slug, setSlug] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
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

    checkSession();

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
    if (!session || !businessId) return;

    async function loadBusiness() {
      setPageLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("businesses")
        .select(
          "name, slug, description, region, address, phone, website, instagram, price_level, verified, featured, cover_image"
        )
        .eq("id", businessId)
        .single();

      if (error || !data) {
        setMessage(
          error
            ? `İşletme alınamadı: ${error.message}`
            : "İşletme bulunamadı."
        );
        setSuccess(false);
        setPageLoading(false);
        return;
      }

      setForm({
        name: data.name ?? "",
        description: data.description ?? "",
        region: data.region ?? "",
        address: data.address ?? "",
        phone: data.phone ?? "",
        website: data.website ?? "",
        instagram: data.instagram ?? "",
        price:
          data.price_level === null || data.price_level === undefined
            ? ""
            : String(data.price_level),
        verified: Boolean(data.verified),
        featured: Boolean(data.featured),
      });

      setSlug(data.slug ?? "");
      setCurrentImage(data.cover_image ?? null);
      setPageLoading(false);
    }

    loadBusiness();
  }, [session, businessId]);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!form.name.trim()) {
      setMessage("İşletme adı zorunludur.");
      return;
    }

    const price = Number(form.price);

    if (form.price && (!Number.isFinite(price) || price < 0)) {
      setMessage("Geçerli bir fiyat yazmalısın.");
      return;
    }

    setSaving(true);

    try {
      let coverImage = currentImage;

      if (newImage) {
        const extension =
          newImage.name.split(".").pop()?.toLowerCase() || "jpg";
        const filePath = `businesses/${slug || businessId}-${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("business-images")
          .upload(filePath, newImage, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Yeni fotoğraf yüklenemedi: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("business-images")
          .getPublicUrl(filePath);

        coverImage = publicUrlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          name: form.name.trim(),
          description: form.description.trim() || null,
          region: form.region.trim() || null,
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          website: form.website.trim() || null,
          instagram: form.instagram.trim() || null,
          price_level: form.price ? price : null,
          verified: form.verified,
          featured: form.featured,
          cover_image: coverImage,
        })
        .eq("id", businessId);

      if (updateError) {
        throw new Error(`İşletme güncellenemedi: ${updateError.message}`);
      }

      setCurrentImage(coverImage);
      setNewImage(null);
      setSuccess(true);
      setMessage("İşletme başarıyla güncellendi.");

      const fileInput = document.getElementById(
        "new-business-image"
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      setSuccess(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Beklenmeyen bir hata oluştu."
      );
    } finally {
      setSaving(false);
    }
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
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>ÖNCEBAK YÖNETİMİ</p>
            <h1 style={styles.title}>İşletmeyi düzenle</h1>
            <p style={styles.subtitle}>
              İşletme bilgilerini, fotoğrafını ve durumunu güncelle.
            </p>
          </div>

          <a href="/admin/businesses" style={styles.backButton}>
            ← İşletmelere Dön
          </a>
        </div>

        {pageLoading ? (
          <div style={styles.emptyCard}>İşletme bilgileri yükleniyor...</div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.formCard}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Temel bilgiler</h2>
              <p style={styles.sectionDescription}>
                Değişiklikleri yaptıktan sonra kaydet.
              </p>
            </div>

            <div style={styles.grid}>
              <Field
                label="İşletme adı *"
                value={form.name}
                placeholder="İşletme adı"
                onChange={(value) => updateField("name", value)}
                required
              />

              <Field
                label="Bölge"
                value={form.region}
                placeholder="Örnek: Göreme"
                onChange={(value) => updateField("region", value)}
              />

              <Field
                label="Adres"
                value={form.address}
                placeholder="Adres"
                onChange={(value) => updateField("address", value)}
              />

              <Field
                label="Telefon"
                value={form.phone}
                placeholder="0555 000 00 00"
                onChange={(value) => updateField("phone", value)}
                type="tel"
              />

              <Field
                label="Web sitesi"
                value={form.website}
                placeholder="https://..."
                onChange={(value) => updateField("website", value)}
                type="url"
              />

              <Field
                label="Instagram"
                value={form.instagram}
                placeholder="@isletmeadi"
                onChange={(value) => updateField("instagram", value)}
              />

              <Field
                label="Kişi başı ortalama fiyat"
                value={form.price}
                placeholder="Örnek: 750"
                onChange={(value) => updateField("price", value)}
                type="number"
              />

              <label style={styles.field}>
                <span style={styles.label}>Yeni kapak fotoğrafı</span>
                <input
                  id="new-business-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    setNewImage(event.target.files?.[0] ?? null)
                  }
                  style={styles.fileInput}
                />
                <small style={styles.helpText}>
                  Seçmezsen mevcut fotoğraf korunur.
                </small>
              </label>
            </div>

            {currentImage && (
              <div style={styles.currentImageBox}>
                <span style={styles.label}>Mevcut kapak fotoğrafı</span>
                <img
                  src={currentImage}
                  alt={form.name || "İşletme"}
                  style={styles.currentImage}
                />
              </div>
            )}

            <label style={styles.field}>
              <span style={styles.label}>Açıklama</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="İşletmeyi kısa ve etkili biçimde tanıt."
                rows={6}
                style={{
                  ...styles.input,
                  resize: "vertical",
                  minHeight: "130px",
                }}
              />
            </label>

            <div style={styles.switchGrid}>
              <label style={styles.switchCard}>
                <input
                  type="checkbox"
                  checked={form.verified}
                  onChange={(event) =>
                    updateField("verified", event.target.checked)
                  }
                />
                <span>
                  <strong>Doğrulanmış işletme</strong>
                  <small style={styles.switchHelp}>
                    İşletmeyi doğrulanmış olarak gösterir.
                  </small>
                </span>
              </label>

              <label style={styles.switchCard}>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) =>
                    updateField("featured", event.target.checked)
                  }
                />
                <span>
                  <strong>Öne çıkan işletme</strong>
                  <small style={styles.switchHelp}>
                    İşletmeyi öne çıkanlar bölümünde gösterir.
                  </small>
                </span>
              </label>
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

            <div style={styles.actions}>
              <a href="/admin/businesses" style={styles.cancelButton}>
                Vazgeç
              </a>

              <button
                type="submit"
                disabled={saving}
                style={{
                  ...styles.submitButton,
                  opacity: saving ? 0.65 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        style={styles.input}
      />
    </label>
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
    maxWidth: "1150px",
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

  backButton: {
    padding: "12px 18px",
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: "12px",
    color: "#171717",
    textDecoration: "none",
    fontWeight: 800,
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

  formCard: {
    padding: "30px",
    background: "#fff",
    border: "1px solid #ebe8e4",
    borderRadius: "22px",
    boxShadow: "0 20px 50px rgba(38, 30, 24, 0.06)",
  },

  sectionHeader: {
    marginBottom: "26px",
    paddingBottom: "22px",
    borderBottom: "1px solid #eee",
  },

  sectionTitle: {
    margin: "0 0 6px",
    fontSize: "22px",
  },

  sectionDescription: {
    margin: 0,
    color: "#737373",
    fontSize: "14px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "20px",
    marginBottom: "20px",
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

  fileInput: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "11px",
    border: "1px dashed #cfc9c2",
    borderRadius: "11px",
    background: "#faf9f7",
  },

  helpText: {
    color: "#8a8a8a",
    fontSize: "12px",
  },

  currentImageBox: {
    display: "grid",
    gap: "10px",
    marginBottom: "22px",
  },

  currentImage: {
    width: "100%",
    maxWidth: "480px",
    maxHeight: "280px",
    objectFit: "cover" as const,
    borderRadius: "14px",
    border: "1px solid #ebe8e4",
  },

  switchGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
    marginTop: "22px",
  },

  switchCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "16px",
    border: "1px solid #e5e5e5",
    borderRadius: "13px",
    background: "#faf9f7",
    cursor: "pointer",
  },

  switchHelp: {
    display: "block",
    marginTop: "5px",
    color: "#737373",
    lineHeight: 1.4,
  },

  message: {
    marginTop: "20px",
    padding: "14px 16px",
    border: "1px solid",
    borderRadius: "11px",
    fontWeight: 700,
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "28px",
    paddingTop: "24px",
    borderTop: "1px solid #eee",
  },

  cancelButton: {
    padding: "13px 18px",
    border: "1px solid #ddd",
    borderRadius: "11px",
    background: "#fff",
    color: "#333",
    textDecoration: "none",
    fontWeight: 800,
  },

  submitButton: {
    padding: "13px 22px",
    border: "none",
    borderRadius: "11px",
    background: "#ff5a1f",
    color: "#fff",
    fontWeight: 900,
  },
};
