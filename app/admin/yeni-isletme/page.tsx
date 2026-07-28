"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import AdminSidebar from "../components/AdminSidebar";

type Category = {
  id: string | number;
  name: string;
};

type OpeningHours = Record<string, string>;

const REGIONS = [
  "Nevşehir",
  "Göreme",
  "Ürgüp",
  "Uçhisar",
  "Avanos",
  "Ortahisar",
];

const FEATURE_OPTIONS = [
  "Wi-Fi",
  "Otopark",
  "Manzara",
  "Açık Alan",
  "Kahvaltı",
  "Vegan Seçenek",
  "Çocuk Dostu",
  "Evcil Hayvan Dostu",
  "Rezervasyon",
];

const DAYS = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

const DEFAULT_HOURS: OpeningHours = {
  Pazartesi: "09:00 - 23:00",
  Salı: "09:00 - 23:00",
  Çarşamba: "09:00 - 23:00",
  Perşembe: "09:00 - 23:00",
  Cuma: "09:00 - 23:00",
  Cumartesi: "09:00 - 23:00",
  Pazar: "09:00 - 23:00",
};

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeFileName(name: string) {
  const extension = name.includes(".") ? name.split(".").pop() : "";
  const base = name.replace(/\.[^/.]+$/, "");
  const safeBase = slugify(base) || "dosya";
  return extension ? `${safeBase}.${extension.toLowerCase()}` : safeBase;
}

function getFileType(url: string) {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".pdf")) return "pdf";
  return "image";
}

export default function NewBusinessPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [region, setRegion] = useState("Nevşehir");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");

  const [priceLevel, setPriceLevel] = useState("");
  const [rating, setRating] = useState("0");
  const [verified, setVerified] = useState(false);
  const [featured, setFeatured] = useState(false);

  const [features, setFeatures] = useState<string[]>([]);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(DEFAULT_HOURS);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [menuFile, setMenuFile] = useState<File | null>(null);

  const coverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : ""),
    [coverFile]
  );

  const galleryPreviews = useMemo(
    () => galleryFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [galleryFiles]
  );

  const menuPreview = useMemo(
    () => (menuFile ? URL.createObjectURL(menuFile) : ""),
    [menuFile]
  );

  useEffect(() => {
    async function loadCategories() {
      setLoadingCategories(true);

      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        setStatus({
          type: "error",
          text: `Kategoriler yüklenemedi: ${error.message}`,
        });
      } else {
        const rows = (data ?? []) as Category[];
        setCategories(rows);
        if (rows[0]) setCategoryId(String(rows[0].id));
      }

      setLoadingCategories(false);
    }

    loadCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      galleryPreviews.forEach((item) => URL.revokeObjectURL(item.url));
      if (menuPreview) URL.revokeObjectURL(menuPreview);
    };
  }, [coverPreview, galleryPreviews, menuPreview]);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function toggleFeature(feature: string) {
    setFeatures((current) =>
      current.includes(feature)
        ? current.filter((item) => item !== feature)
        : [...current, feature]
    );
  }

  function handleGalleryFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    setGalleryFiles((current) => [...current, ...selected].slice(0, 12));
    event.target.value = "";
  }

  function removeGalleryFile(index: number) {
    setGalleryFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function uploadFile(file: File, path: string) {
    const { error } = await supabase.storage
      .from("business-media")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from("business-media").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (!name.trim()) {
      setStatus({ type: "error", text: "İşletme adı zorunludur." });
      return;
    }

    if (!slug.trim()) {
      setStatus({ type: "error", text: "Slug alanı boş bırakılamaz." });
      return;
    }

    if (!categoryId) {
      setStatus({ type: "error", text: "Bir kategori seçmelisin." });
      return;
    }

    if (!coverFile) {
      setStatus({ type: "error", text: "Kapak fotoğrafı yüklemelisin." });
      return;
    }

    const numericRating = Number(rating || 0);
    if (numericRating < 0 || numericRating > 5) {
      setStatus({ type: "error", text: "Puan 0 ile 5 arasında olmalıdır." });
      return;
    }

    setSaving(true);

    const cleanSlug = slugify(slug);
    const folder = `${cleanSlug}-${Date.now()}`;

    try {
      const { data: existing } = await supabase
        .from("businesses")
        .select("id")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (existing) {
        throw new Error("Bu slug daha önce kullanılmış. Farklı bir slug gir.");
      }

      const coverPath = `${folder}/cover/${crypto.randomUUID()}-${sanitizeFileName(
        coverFile.name
      )}`;
      const coverImage = await uploadFile(coverFile, coverPath);

      const galleryUrls: string[] = [];
      for (const file of galleryFiles) {
        const path = `${folder}/gallery/${crypto.randomUUID()}-${sanitizeFileName(
          file.name
        )}`;
        galleryUrls.push(await uploadFile(file, path));
      }

      let menuUrl: string | null = null;
      if (menuFile) {
        const menuPath = `${folder}/menu/${crypto.randomUUID()}-${sanitizeFileName(
          menuFile.name
        )}`;
        menuUrl = await uploadFile(menuFile, menuPath);
      }

      const { error } = await supabase.from("businesses").insert({
        name: name.trim(),
        slug: cleanSlug,
        category_id: categoryId,
        region,
        description: description.trim() || null,
        address: address.trim() || null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        instagram: instagram.trim() || null,
        website: website.trim() || null,
        google_maps_url: googleMapsUrl.trim() || null,
        cover_image: coverImage,
        gallery: galleryUrls,
        menu_url: menuUrl,
        opening_hours: openingHours,
        features,
        price_level: priceLevel ? Number(priceLevel) : null,
        rating: numericRating,
        verified,
        featured,
      });

      if (error) throw new Error(error.message);

      setStatus({
        type: "success",
        text: "İşletme başarıyla oluşturuldu. Listeye yönlendiriliyorsun.",
      });

      setTimeout(() => router.push("/admin/isletmeler"), 900);
    } catch (error) {
      setStatus({
        type: "error",
        text:
          error instanceof Error
            ? `İşletme oluşturulamadı: ${error.message}`
            : "İşletme oluşturulamadı.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-page">
      <AdminSidebar />

      <section className="workspace">
        <header className="page-header">
          <div>
            <span className="eyebrow">İÇERİK YÖNETİMİ</span>
            <h1>Yeni işletme ekle</h1>
            <p>
              İşletmenin sayfada eksiksiz ve premium görünmesi için bilgileri doldur.
            </p>
          </div>

          <a href="/admin/isletmeler" className="ghost-button">
            İşletmelere dön
          </a>
        </header>

        {status && (
          <div className={`status ${status.type}`}>
            <strong>{status.type === "success" ? "Başarılı" : "Hata"}</strong>
            <span>{status.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <section className="form-card">
            <div className="card-heading">
              <span>01</span>
              <div>
                <h2>Temel bilgiler</h2>
                <p>İşletmenin adı, konumu ve açıklaması.</p>
              </div>
            </div>

            <div className="form-grid two">
              <Field label="İşletme adı" required>
                <input
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="Örn. Dibek Restaurant"
                  required
                />
              </Field>

              <Field label="Slug" hint="Sayfa adresinde görünür" required>
                <input
                  value={slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(slugify(event.target.value));
                  }}
                  placeholder="dibek-restaurant"
                  required
                />
              </Field>

              <Field label="Kategori" required>
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  disabled={loadingCategories}
                  required
                >
                  {loadingCategories && <option>Kategoriler yükleniyor...</option>}
                  {!loadingCategories && categories.length === 0 && (
                    <option value="">Kategori bulunamadı</option>
                  )}
                  {categories.map((category) => (
                    <option value={String(category.id)} key={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Bölge" required>
                <select value={region} onChange={(event) => setRegion(event.target.value)}>
                  {REGIONS.map((item) => (
                    <option value={item} key={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Adres" className="full">
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Mahalle, cadde, sokak ve numara"
                />
              </Field>

              <Field label="Açıklama" className="full">
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="İşletmenin atmosferini, mutfağını ve öne çıkan yanlarını anlat."
                  rows={6}
                />
              </Field>
            </div>
          </section>

          <section className="form-card">
            <div className="card-heading">
              <span>02</span>
              <div>
                <h2>İletişim ve konum</h2>
                <p>Kullanıcıların işletmeye kolayca ulaşmasını sağlar.</p>
              </div>
            </div>

            <div className="form-grid two">
              <Field label="Telefon">
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0555 000 00 00"
                />
              </Field>

              <Field label="WhatsApp">
                <input
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(event.target.value)}
                  placeholder="905550000000"
                />
              </Field>

              <Field label="Instagram">
                <input
                  value={instagram}
                  onChange={(event) => setInstagram(event.target.value)}
                  placeholder="@isletmeadi"
                />
              </Field>

              <Field label="Web sitesi">
                <input
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder="https://..."
                />
              </Field>

              <Field label="Google Maps bağlantısı" className="full">
                <input
                  value={googleMapsUrl}
                  onChange={(event) => setGoogleMapsUrl(event.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </Field>
            </div>
          </section>

          <section className="form-card">
            <div className="card-heading">
              <span>03</span>
              <div>
                <h2>Görseller ve menü</h2>
                <p>Dosyalar Supabase Storage alanına yüklenir.</p>
              </div>
            </div>

            <div className="media-grid">
              <UploadBox
                title="Kapak fotoğrafı"
                description="JPG, PNG veya WEBP"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
                required
              />

              <UploadBox
                title="Galeri fotoğrafları"
                description="En fazla 12 görsel"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleGalleryFiles}
              />

              <UploadBox
                title="Menü dosyası"
                description="PDF, JPG, PNG veya WEBP"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(event) => setMenuFile(event.target.files?.[0] ?? null)}
              />
            </div>

            {(coverPreview || galleryPreviews.length > 0 || menuPreview) && (
              <div className="preview-area">
                {coverPreview && (
                  <div className="preview-block">
                    <div className="preview-title">
                      <strong>Kapak önizleme</strong>
                      <button type="button" onClick={() => setCoverFile(null)}>
                        Kaldır
                      </button>
                    </div>
                    <img className="cover-preview" src={coverPreview} alt="Kapak önizleme" />
                  </div>
                )}

                {galleryPreviews.length > 0 && (
                  <div className="preview-block">
                    <div className="preview-title">
                      <strong>Galeri ({galleryPreviews.length})</strong>
                    </div>

                    <div className="gallery-preview">
                      {galleryPreviews.map((item, index) => (
                        <div key={`${item.file.name}-${index}`}>
                          <img src={item.url} alt={`Galeri ${index + 1}`} />
                          <button type="button" onClick={() => removeGalleryFile(index)}>
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {menuPreview && menuFile && (
                  <div className="preview-block">
                    <div className="preview-title">
                      <strong>Menü önizleme</strong>
                      <button type="button" onClick={() => setMenuFile(null)}>
                        Kaldır
                      </button>
                    </div>

                    {getFileType(menuFile.name) === "pdf" ? (
                      <iframe src={menuPreview} title="Menü PDF önizleme" />
                    ) : (
                      <img className="menu-preview" src={menuPreview} alt="Menü önizleme" />
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="form-card">
            <div className="card-heading">
              <span>04</span>
              <div>
                <h2>Fiyat ve görünürlük</h2>
                <p>Kartlarda ve detay sayfasında gösterilecek bilgiler.</p>
              </div>
            </div>

            <div className="form-grid two">
              <Field label="Ortalama fiyat">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={priceLevel}
                  onChange={(event) => setPriceLevel(event.target.value)}
                  placeholder="1000"
                />
              </Field>

              <Field label="Puan" hint="0 ile 5 arasında">
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                  placeholder="4.8"
                />
              </Field>
            </div>

            <div className="toggle-grid">
              <Toggle
                title="Doğrulanmış işletme"
                description="İşletme adının yanında doğrulanmış rozeti gösterilir."
                checked={verified}
                onChange={setVerified}
              />

              <Toggle
                title="Editörün seçimi"
                description="İşletme öne çıkan içerik olarak işaretlenir."
                checked={featured}
                onChange={setFeatured}
              />
            </div>
          </section>

          <section className="form-card">
            <div className="card-heading">
              <span>05</span>
              <div>
                <h2>Özellikler</h2>
                <p>İşletmenin sunduğu imkânları seç.</p>
              </div>
            </div>

            <div className="feature-grid">
              {FEATURE_OPTIONS.map((feature) => (
                <button
                  type="button"
                  key={feature}
                  onClick={() => toggleFeature(feature)}
                  className={features.includes(feature) ? "selected" : ""}
                >
                  <span>{features.includes(feature) ? "✓" : "+"}</span>
                  {feature}
                </button>
              ))}
            </div>
          </section>

          <section className="form-card">
            <div className="card-heading">
              <span>06</span>
              <div>
                <h2>Çalışma saatleri</h2>
                <p>Kapalı günler için “Kapalı” yazabilirsin.</p>
              </div>
            </div>

            <div className="hours-grid">
              {DAYS.map((day) => (
                <label key={day}>
                  <span>{day}</span>
                  <input
                    value={openingHours[day] ?? ""}
                    onChange={(event) =>
                      setOpeningHours((current) => ({
                        ...current,
                        [day]: event.target.value,
                      }))
                    }
                    placeholder="09:00 - 23:00"
                  />
                </label>
              ))}
            </div>
          </section>

          <div className="submit-bar">
            <div>
              <strong>İşletmeyi yayınlamaya hazır mısın?</strong>
              <span>Kaydettiğinde işletme ana sitede görüntülenebilir.</span>
            </div>

            <button type="submit" disabled={saving}>
              {saving ? "Dosyalar yükleniyor..." : "İşletmeyi oluştur"}
            </button>
          </div>
        </form>
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
          --success: #147a4b;
          --danger: #b42318;
        }

        * { box-sizing: border-box; }

        body {
          margin: 0;
          background: var(--paper);
          color: var(--ink);
          font-family: Arial, Helvetica, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        button, input, textarea, select { font: inherit; }

        .admin-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 250px minmax(0, 1fr);
        }

        .sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          padding: 30px 22px;
          background: var(--dark);
          color: white;
        }

        .brand {
          display: inline-block;
          margin: 3px 10px 38px;
          color: white;
          font-size: 25px;
          font-weight: 950;
          letter-spacing: -1.3px;
          text-decoration: none;
        }

        .brand span { color: var(--accent); }

        .sidebar nav { display: grid; gap: 7px; }

        .sidebar nav a {
          padding: 13px 14px;
          border-radius: 11px;
          color: rgba(255,255,255,.6);
          font-size: 12px;
          font-weight: 850;
          text-decoration: none;
        }

        .sidebar nav a:hover,
        .sidebar nav a.active {
          background: rgba(255,255,255,.08);
          color: white;
        }

        .workspace {
          width: min(1080px, calc(100% - 48px));
          margin: 0 auto;
          padding: 52px 0 90px;
        }

        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 28px;
          margin-bottom: 30px;
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

        .ghost-button {
          flex: none;
          padding: 12px 16px;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: white;
          color: var(--ink);
          font-size: 11px;
          font-weight: 900;
          text-decoration: none;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding: 15px 17px;
          border-radius: 13px;
          font-size: 12px;
        }

        .status.success {
          border: 1px solid #a8dfc4;
          background: #ecfdf3;
          color: var(--success);
        }

        .status.error {
          border: 1px solid #f4c7c3;
          background: #fff1f0;
          color: var(--danger);
        }

        form { display: grid; gap: 20px; }

        .form-card {
          padding: 30px;
          border: 1px solid var(--line);
          border-radius: 23px;
          background: white;
          box-shadow: 0 16px 50px rgba(44, 28, 18, .04);
        }

        .card-heading {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 28px;
        }

        .card-heading > span {
          width: 34px;
          height: 34px;
          display: grid;
          flex: none;
          place-items: center;
          border-radius: 10px;
          background: #fff0e9;
          color: var(--accent);
          font-size: 10px;
          font-weight: 950;
        }

        .card-heading h2 {
          margin: 0 0 5px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 28px;
          font-weight: 500;
          letter-spacing: -1px;
        }

        .card-heading p {
          margin: 0;
          color: var(--muted);
          font-size: 12px;
        }

        .form-grid {
          display: grid;
          gap: 18px;
        }

        .form-grid.two {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .field.full { grid-column: 1 / -1; }

        .field-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .field-label strong {
          font-size: 11px;
          font-weight: 900;
        }

        .field-label em {
          color: var(--muted);
          font-size: 9px;
          font-style: normal;
        }

        input, textarea, select {
          width: 100%;
          border: 1px solid var(--line);
          border-radius: 12px;
          outline: none;
          background: #fbf9f7;
          color: var(--ink);
          transition: border-color .2s ease, box-shadow .2s ease;
        }

        input, select {
          min-height: 47px;
          padding: 0 13px;
        }

        textarea {
          resize: vertical;
          padding: 13px;
          line-height: 1.6;
        }

        input:focus, textarea:focus, select:focus {
          border-color: rgba(255,90,31,.65);
          box-shadow: 0 0 0 4px rgba(255,90,31,.08);
        }

        .media-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .upload-box {
          position: relative;
          min-height: 145px;
          display: grid;
          place-items: center;
          padding: 20px;
          border: 1.5px dashed #d9cec6;
          border-radius: 17px;
          background: #fbf8f5;
          text-align: center;
          cursor: pointer;
        }

        .upload-box:hover {
          border-color: var(--accent);
          background: #fff8f4;
        }

        .upload-box input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .upload-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          margin: 0 auto 10px;
          border-radius: 12px;
          background: #fff0e9;
          color: var(--accent);
          font-size: 19px;
          font-weight: 950;
        }

        .upload-box strong {
          display: block;
          margin-bottom: 5px;
          font-size: 12px;
        }

        .upload-box small {
          color: var(--muted);
          font-size: 9px;
        }

        .preview-area {
          display: grid;
          gap: 22px;
          margin-top: 26px;
        }

        .preview-block {
          padding-top: 22px;
          border-top: 1px solid var(--line);
        }

        .preview-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 12px;
        }

        .preview-title strong { font-size: 12px; }

        .preview-title button {
          border: none;
          background: transparent;
          color: var(--danger);
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .cover-preview {
          width: 100%;
          max-height: 390px;
          display: block;
          border-radius: 16px;
          object-fit: cover;
        }

        .gallery-preview {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .gallery-preview > div {
          position: relative;
          height: 130px;
          overflow: hidden;
          border-radius: 13px;
          background: #eee;
        }

        .gallery-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .gallery-preview button {
          position: absolute;
          top: 7px;
          right: 7px;
          width: 27px;
          height: 27px;
          border: none;
          border-radius: 50%;
          background: rgba(20,16,13,.78);
          color: white;
          cursor: pointer;
        }

        .preview-block iframe {
          width: 100%;
          height: 650px;
          border: 1px solid var(--line);
          border-radius: 16px;
          background: #eee;
        }

        .menu-preview {
          width: 100%;
          max-height: 700px;
          border-radius: 16px;
          object-fit: contain;
          background: #f3efeb;
        }

        .toggle-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          margin-top: 20px;
        }

        .toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 17px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: #fbf9f7;
        }

        .toggle strong {
          display: block;
          margin-bottom: 5px;
          font-size: 11px;
        }

        .toggle small {
          display: block;
          color: var(--muted);
          font-size: 9px;
          line-height: 1.5;
        }

        .switch {
          position: relative;
          width: 44px;
          height: 25px;
          flex: none;
          border: none;
          border-radius: 999px;
          background: #d8d0ca;
          cursor: pointer;
          transition: background .2s ease;
        }

        .switch::after {
          content: "";
          position: absolute;
          top: 3px;
          left: 3px;
          width: 19px;
          height: 19px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 7px rgba(0,0,0,.15);
          transition: transform .2s ease;
        }

        .switch.active { background: var(--accent); }
        .switch.active::after { transform: translateX(19px); }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .feature-grid button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: #fbf9f7;
          color: var(--ink);
          font-size: 11px;
          font-weight: 850;
          text-align: left;
          cursor: pointer;
        }

        .feature-grid button span {
          width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: white;
          color: var(--muted);
        }

        .feature-grid button.selected {
          border-color: rgba(255,90,31,.35);
          background: #fff5f0;
          color: var(--accent);
        }

        .feature-grid button.selected span {
          background: var(--accent);
          color: white;
        }

        .hours-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .hours-grid label {
          display: grid;
          grid-template-columns: 120px minmax(0, 1fr);
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-radius: 13px;
          background: #fbf9f7;
        }

        .hours-grid label span {
          font-size: 10px;
          font-weight: 900;
        }

        .hours-grid input {
          min-height: 38px;
          background: white;
        }

        .submit-bar {
          position: sticky;
          z-index: 10;
          bottom: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 18px 20px;
          border: 1px solid rgba(255,255,255,.7);
          border-radius: 18px;
          background: rgba(255,255,255,.92);
          box-shadow: 0 24px 70px rgba(42,27,17,.16);
          backdrop-filter: blur(16px);
        }

        .submit-bar strong {
          display: block;
          margin-bottom: 4px;
          font-size: 12px;
        }

        .submit-bar span {
          color: var(--muted);
          font-size: 9px;
        }

        .submit-bar button {
          min-width: 190px;
          padding: 14px 18px;
          border: none;
          border-radius: 999px;
          background: var(--accent);
          color: white;
          font-size: 11px;
          font-weight: 950;
          cursor: pointer;
        }

        .submit-bar button:disabled {
          opacity: .65;
          cursor: wait;
        }

        @media (max-width: 980px) {
          .admin-page { grid-template-columns: 1fr; }

          .sidebar {
            position: static;
            height: auto;
            padding: 17px 20px;
          }

          .brand { margin: 0 0 14px; }

          .sidebar nav {
            display: flex;
            overflow-x: auto;
          }

          .sidebar nav a { flex: none; }

          .workspace {
            width: min(100% - 28px, 1080px);
            padding-top: 34px;
          }

          .media-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 700px) {
          .page-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .page-header h1 {
            font-size: 45px;
            letter-spacing: -2px;
          }

          .form-card { padding: 22px 17px; }

          .form-grid.two,
          .toggle-grid,
          .feature-grid,
          .hours-grid {
            grid-template-columns: 1fr;
          }

          .field.full { grid-column: auto; }

          .gallery-preview {
            grid-template-columns: repeat(2, 1fr);
          }

          .hours-grid label {
            grid-template-columns: 95px minmax(0, 1fr);
          }

          .submit-bar {
            align-items: stretch;
            flex-direction: column;
          }

          .submit-bar button { width: 100%; }

          .preview-block iframe { height: 520px; }
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  hint,
  required,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">
        <strong>
          {label}
          {required ? " *" : ""}
        </strong>
        {hint && <em>{hint}</em>}
      </span>
      {children}
    </label>
  );
}

function UploadBox({
  title,
  description,
  accept,
  multiple,
  required,
  onChange,
}: {
  title: string;
  description: string;
  accept: string;
  multiple?: boolean;
  required?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="upload-box">
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        required={required}
        onChange={onChange}
      />
      <span>
        <span className="upload-icon">↑</span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </label>
  );
}

function Toggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="toggle">
      <div>
        <strong>{title}</strong>
        <small>{description}</small>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`switch ${checked ? "active" : ""}`}
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}
