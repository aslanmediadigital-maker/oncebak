 "use client";

import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

type FormState = {
  name: string;
  description: string;
  region: string;
  address: string;
  phone: string;
  website: string;
  instagram: string;
  price: string;
};

const initialForm: FormState = {
  name: "",
  description: "",
  region: "",
  address: "",
  phone: "",
  website: "",
  instagram: "",
  price: "",
};

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

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  const [form, setForm] = useState<FormState>(initialForm);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (mounted) {
        setSession(currentSession);
        setAuthLoading(false);
      }
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

    setPassword("");
    setLoginLoading(false);
  }

  async function handleLogout() {
    setAuthMessage("");

    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

    if (error) {
      setAuthMessage(`Çıkış yapılamadı: ${error.message}`);
    }
  }

  function updateField(field: keyof FormState, value: string) {
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

    setLoading(true);

    try {
      const slug = `${createSlug(form.name)}-${Date.now()}`;
      let coverImage: string | null = null;

      if (image) {
        const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
        const filePath = `businesses/${slug}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("business-images")
          .upload(filePath, image, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Fotoğraf yüklenemedi: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("business-images")
          .getPublicUrl(filePath);

        coverImage = publicUrlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from("businesses")
        .insert({
          name: form.name.trim(),
          slug,
          description: form.description.trim() || null,
          region: form.region.trim() || null,
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          website: form.website.trim() || null,
          instagram: form.instagram.trim() || null,
          price_level: form.price ? price : null,
          rating: 0,
          verified: false,
          featured: false,
          cover_image: coverImage,
        });

      if (insertError) {
        throw new Error(`İşletme kaydedilemedi: ${insertError.message}`);
      }

      setSuccess(true);
      setMessage("İşletme başarıyla eklendi.");
      setForm(initialForm);
      setImage(null);

      const fileInput = document.getElementById(
        "business-image"
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
      setLoading(false);
    }
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

          {authMessage && (
            <div style={styles.authError}>{authMessage}</div>
          )}

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
    <main style={styles.page}>
      <aside style={styles.sidebar}>
        <div>
          <a href="/" style={styles.logo}>
            Önce<span style={{ color: "#ff5a1f" }}>Bak</span>
          </a>

          <p style={styles.panelLabel}>Yönetim Paneli</p>

          <nav style={styles.navigation}>
            <a href="/admin" style={styles.activeNavigationItem}>
              Dashboard
            </a>

            <a href="/admin/yeni-isletme" style={styles.navigationItem}>
              ＋ Yeni İşletme
            </a>

            <a href="/admin/isletmeler" style={styles.navigationItem}>
              İşletmeler
            </a>

            <a href="/" style={styles.navigationItem}>
              Ana Siteyi Görüntüle
            </a>
          </nav>
        </div>

        <p style={styles.sidebarNote}>
          İşletme bilgilerini buradan yönetebilirsin.
        </p>
      </aside>

      <section style={styles.content}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>ÖNCEBAK YÖNETİMİ</p>
            <h1 style={styles.title}>Yeni işletme ekle</h1>
            <p style={styles.subtitle}>
              İşletmenin temel bilgilerini ve kapak fotoğrafını ekle.
            </p>
          </div>

          <div style={styles.headerActions}>
            <a href="/" style={styles.siteButton}>
              Siteye Git →
            </a>

            <button
              type="button"
              onClick={handleLogout}
              style={styles.logoutButton}
            >
              Çıkış Yap
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.formCard}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>İşletme bilgileri</h2>
            <p style={styles.sectionDescription}>
              Yıldızlı alanların doldurulması zorunludur.
            </p>
          </div>

          <div style={styles.grid}>
            <Field
              label="İşletme adı *"
              value={form.name}
              placeholder="Örnek: Kapadokya Sofrası"
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
              placeholder="Göreme / Nevşehir"
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
              <span style={styles.label}>Kapak fotoğrafı</span>

              <input
                id="business-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) =>
                  setImage(event.target.files?.[0] ?? null)
                }
                style={styles.fileInput}
              />

              <small style={styles.helpText}>
                JPG, PNG veya WEBP yükleyebilirsin.
              </small>
            </label>
          </div>

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
            <button
              type="button"
              onClick={() => {
                setForm(initialForm);
                setImage(null);
                setMessage("");
                setSuccess(false);
              }}
              style={styles.resetButton}
              disabled={loading}
            >
              Formu Temizle
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                opacity: loading ? 0.65 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Kaydediliyor..." : "İşletmeyi Kaydet"}
            </button>
          </div>
        </form>
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

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  logoutButton: {
    padding: "12px 18px",
    border: "1px solid #e5e5e5",
    borderRadius: "12px",
    background: "#171717",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
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

  sidebarNote: {
    color: "#737373",
    fontSize: "13px",
    lineHeight: 1.6,
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

  siteButton: {
    padding: "12px 18px",
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: "12px",
    color: "#171717",
    textDecoration: "none",
    fontWeight: 800,
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

  resetButton: {
    padding: "13px 18px",
    border: "1px solid #ddd",
    borderRadius: "11px",
    background: "#fff",
    color: "#333",
    fontWeight: 800,
    cursor: "pointer",
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