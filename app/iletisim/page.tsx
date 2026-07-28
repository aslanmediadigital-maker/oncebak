"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type FormState = {
  businessName: string;
  category: string;
  region: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  website: string;
  googleMapsUrl: string;
  description: string;
  priceLevel: string;
  menuUrl: string;
};

const initialForm: FormState = {
  businessName: "",
  category: "",
  region: "",
  address: "",
  phone: "",
  whatsapp: "",
  email: "",
  instagram: "",
  website: "",
  googleMapsUrl: "",
  description: "",
  priceLevel: "",
  menuUrl: "",
};

export default function IletisimPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [menuPreview, setMenuPreview] = useState("");
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const menuInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const galleryPreviews = useMemo(
    () =>
      galleryFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [galleryFiles]
  );

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      galleryPreviews.forEach((item) => URL.revokeObjectURL(item.url));
      if (menuPreview) URL.revokeObjectURL(menuPreview);
    };
  }, [coverPreview, galleryPreviews, menuPreview]);

  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setStatus(null);

    if (!file) {
      setCoverFile(null);
      setCoverPreview("");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      event.target.value = "";
      setStatus({
        type: "error",
        message: "Kapak fotoğrafı JPG, PNG veya WEBP formatında olmalıdır.",
      });
      return;
    }

    if (file.size > maxSize) {
      event.target.value = "";
      setStatus({
        type: "error",
        message: "Kapak fotoğrafı en fazla 10 MB olabilir.",
      });
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function removeCover() {
    setCoverFile(null);
    setCoverPreview("");

    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  }

  function handleGalleryChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    setStatus(null);

    if (selectedFiles.length === 0) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 10 * 1024 * 1024;

    const invalidType = selectedFiles.find(
      (file) => !allowedTypes.includes(file.type)
    );

    if (invalidType) {
      setStatus({
        type: "error",
        message: "Galeri fotoğrafları JPG, PNG veya WEBP formatında olmalıdır.",
      });
      return;
    }

    const oversized = selectedFiles.find((file) => file.size > maxSize);

    if (oversized) {
      setStatus({
        type: "error",
        message: "Her galeri fotoğrafı en fazla 10 MB olabilir.",
      });
      return;
    }

    setGalleryFiles((current) => {
      const combined = [...current, ...selectedFiles];

      if (combined.length > 12) {
        setStatus({
          type: "error",
          message: "Galeriye en fazla 12 fotoğraf ekleyebilirsiniz.",
        });
      }

      return combined.slice(0, 12);
    });
  }

  function removeGalleryFile(index: number) {
    setGalleryFiles((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function handleMenuChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setStatus(null);

    if (!file) {
      setMenuFile(null);
      setMenuPreview("");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    const maxSize = 15 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      event.target.value = "";
      setStatus({
        type: "error",
        message: "Menü PDF, JPG, PNG veya WEBP formatında olmalıdır.",
      });
      return;
    }

    if (file.size > maxSize) {
      event.target.value = "";
      setStatus({
        type: "error",
        message: "Menü dosyası en fazla 15 MB olabilir.",
      });
      return;
    }

    setMenuFile(file);
    setMenuPreview(URL.createObjectURL(file));
  }

  function removeMenu() {
    setMenuFile(null);
    setMenuPreview("");

    if (menuInputRef.current) {
      menuInputRef.current.value = "";
    }
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const uploadedPaths: string[] = [];

    try {
      const requestFolder = `requests/${crypto.randomUUID()}`;
      let coverImageUrl: string | null = null;
      const galleryUrls: string[] = [];
      let menuFileUrl: string | null = null;

      if (coverFile) {
        const extension =
          coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${requestFolder}/cover/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("business-images")
          .upload(path, coverFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: coverFile.type,
          });

        if (uploadError) {
          throw new Error(`Kapak fotoğrafı yüklenemedi: ${uploadError.message}`);
        }

        uploadedPaths.push(path);

        const { data } = supabase.storage
          .from("business-images")
          .getPublicUrl(path);

        coverImageUrl = data.publicUrl;
      }

      for (const file of galleryFiles) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${requestFolder}/gallery/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("business-images")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) {
          throw new Error(
            `Galeri fotoğraflarından biri yüklenemedi: ${uploadError.message}`
          );
        }

        uploadedPaths.push(path);

        const { data } = supabase.storage
          .from("business-images")
          .getPublicUrl(path);

        galleryUrls.push(data.publicUrl);
      }

      if (menuFile) {
        const extension =
          menuFile.name.split(".").pop()?.toLowerCase() ||
          (menuFile.type === "application/pdf" ? "pdf" : "jpg");
        const path = `${requestFolder}/menu/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("business-images")
          .upload(path, menuFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: menuFile.type,
          });

        if (uploadError) {
          throw new Error(`Menü dosyası yüklenemedi: ${uploadError.message}`);
        }

        uploadedPaths.push(path);

        const { data } = supabase.storage
          .from("business-images")
          .getPublicUrl(path);

        menuFileUrl = data.publicUrl;
      }

      const { error } = await supabase.from("business_requests").insert({
        business_name: form.businessName.trim(),
        category: form.category.trim(),
        region: form.region.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
        instagram: form.instagram.trim() || null,
        website: form.website.trim() || null,
        google_maps_url: form.googleMapsUrl.trim() || null,
        description: form.description.trim() || null,
        price_level: form.priceLevel ? Number(form.priceLevel) : null,
        menu_url: form.menuUrl.trim() || null,
        cover_image_url: coverImageUrl,
        gallery_urls: galleryUrls,
        menu_file_url: menuFileUrl,
      });

      if (error) {
        throw new Error(error.message);
      }

      setStatus({
        type: "success",
        message:
          "Başvurunuz ve medya dosyalarınız başarıyla alındı. Bilgilerinizi inceledikten sonra sizinle iletişime geçeceğiz.",
      });

      setForm(initialForm);
      removeCover();
      setGalleryFiles([]);
      removeMenu();

      if (galleryInputRef.current) {
        galleryInputRef.current.value = "";
      }
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("business-images").remove(uploadedPaths);
      }

      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? `Başvuru gönderilemedi: ${error.message}`
            : "Başvuru gönderilemedi. Lütfen tekrar deneyin.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="legal-page">
      <header className="legal-header">
        <div className="legal-shell">
          <Link href="/" className="legal-brand">
            Önce<span>Bak</span>
          </Link>
        </div>
      </header>

      <section className="legal-shell legal-content">
        <span className="legal-eyebrow">İŞLETMENİ TANIT</span>
        <h1>ÖnceBak&apos;ta yerini al.</h1>

        <p className="lead">
          İşletmenizi platformda tanıtmak için aşağıdaki başvuru formunu
          doldurun. Başvurunuz incelendikten sonra sizinle iletişime geçeceğiz.
        </p>

        <article className="legal-card">
          <div className="card-heading">
            <div>
              <span className="step-label">BAŞVURU FORMU</span>
              <h2>İşletme bilgileri</h2>
            </div>
            <p>
              Yıldız (*) bulunan alanların doldurulması zorunludur.
            </p>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>
                <span>İşletme adı *</span>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(event) =>
                    updateField("businessName", event.target.value)
                  }
                  placeholder="Örnek: Kapadokya Kahve Evi"
                  required
                />
              </label>

              <label>
                <span>Kategori *</span>
                <input
                  type="text"
                  value={form.category}
                  onChange={(event) =>
                    updateField("category", event.target.value)
                  }
                  placeholder="Restoran, kafe, otel..."
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                <span>Bölge *</span>
                <input
                  type="text"
                  value={form.region}
                  onChange={(event) =>
                    updateField("region", event.target.value)
                  }
                  placeholder="Göreme, Ürgüp, Avanos..."
                  required
                />
              </label>

              <label>
                <span>Telefon *</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    updateField("phone", event.target.value)
                  }
                  placeholder="05xx xxx xx xx"
                  required
                />
              </label>
            </div>

            <label>
              <span>Adres *</span>
              <input
                type="text"
                value={form.address}
                onChange={(event) =>
                  updateField("address", event.target.value)
                }
                placeholder="İşletmenin açık adresi"
                required
              />
            </label>

            <div className="form-row">
              <label>
                <span>WhatsApp</span>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={(event) =>
                    updateField("whatsapp", event.target.value)
                  }
                  placeholder="05xx xxx xx xx"
                />
              </label>

              <label>
                <span>E-posta</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField("email", event.target.value)
                  }
                  placeholder="ornek@isletme.com"
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                <span>Instagram</span>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(event) =>
                    updateField("instagram", event.target.value)
                  }
                  placeholder="@kullaniciadi"
                />
              </label>

              <label>
                <span>Web sitesi</span>
                <input
                  type="url"
                  value={form.website}
                  onChange={(event) =>
                    updateField("website", event.target.value)
                  }
                  placeholder="https://..."
                />
              </label>
            </div>

            <label>
              <span>Google Maps bağlantısı</span>
              <input
                type="url"
                value={form.googleMapsUrl}
                onChange={(event) =>
                  updateField("googleMapsUrl", event.target.value)
                }
                placeholder="https://maps.google.com/..."
              />
            </label>

            <label>
              <span>Kısa açıklama</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="İşletmenizi, sunduğunuz hizmetleri ve öne çıkan özelliklerinizi kısaca anlatın."
              />
            </label>

            <div className="cover-upload">
              <div className="cover-upload-heading">
                <div>
                  <span>Kapak fotoğrafı</span>
                  <small>
                    JPG, PNG veya WEBP · En fazla 10 MB
                  </small>
                </div>

                {coverFile && (
                  <button
                    type="button"
                    className="remove-cover"
                    onClick={removeCover}
                  >
                    Fotoğrafı kaldır
                  </button>
                )}
              </div>

              <label className="cover-dropzone">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverChange}
                />

                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Kapak fotoğrafı ön izlemesi"
                  />
                ) : (
                  <span className="cover-placeholder">
                    <b>↑</b>
                    <strong>Kapak fotoğrafını seç</strong>
                    <small>
                      İşletmenizi en iyi anlatan yatay bir görsel kullanın.
                    </small>
                  </span>
                )}
              </label>
            </div>

            <div className="gallery-upload">
              <div className="media-section-heading">
                <div>
                  <span>Galeri fotoğrafları</span>
                  <small>
                    En fazla 12 fotoğraf · Her biri en fazla 10 MB
                  </small>
                </div>
                <b>{galleryFiles.length}/12</b>
              </div>

              <label className="gallery-dropzone">
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleGalleryChange}
                  disabled={galleryFiles.length >= 12}
                />
                <span>
                  <b>＋</b>
                  <strong>Galeri fotoğraflarını seç</strong>
                  <small>Birden fazla görseli aynı anda seçebilirsiniz.</small>
                </span>
              </label>

              {galleryPreviews.length > 0 && (
                <div className="gallery-preview-grid">
                  {galleryPreviews.map((item, index) => (
                    <div key={`${item.file.name}-${index}`}>
                      <img
                        src={item.url}
                        alt={`Galeri ön izlemesi ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryFile(index)}
                        aria-label="Galeri fotoğrafını kaldır"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="menu-upload">
              <div className="media-section-heading">
                <div>
                  <span>Menü dosyası</span>
                  <small>PDF, JPG, PNG veya WEBP · En fazla 15 MB</small>
                </div>

                {menuFile && (
                  <button
                    type="button"
                    className="remove-cover"
                    onClick={removeMenu}
                  >
                    Menüyü kaldır
                  </button>
                )}
              </div>

              <label className="menu-dropzone">
                <input
                  ref={menuInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={handleMenuChange}
                />

                {menuFile ? (
                  menuFile.type === "application/pdf" ? (
                    <span className="menu-file-card">
                      <b>PDF</b>
                      <strong>{menuFile.name}</strong>
                      <small>Menü dosyası seçildi.</small>
                    </span>
                  ) : (
                    <img
                      src={menuPreview}
                      alt="Menü ön izlemesi"
                    />
                  )
                ) : (
                  <span className="cover-placeholder">
                    <b>↑</b>
                    <strong>Menü dosyasını seç</strong>
                    <small>
                      Menü PDF veya tek bir menü görseli yükleyebilirsiniz.
                    </small>
                  </span>
                )}
              </label>
            </div>

            <div className="form-row">
              <label>
                <span>Ortalama kişi başı fiyat</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.priceLevel}
                  onChange={(event) =>
                    updateField("priceLevel", event.target.value)
                  }
                  placeholder="Örnek: 750"
                />
              </label>

              <label>
                <span>Menü bağlantısı</span>
                <input
                  type="url"
                  value={form.menuUrl}
                  onChange={(event) =>
                    updateField("menuUrl", event.target.value)
                  }
                  placeholder="https://..."
                />
              </label>
            </div>

            {status && (
              <div className={`form-status ${status.type}`}>
                {status.message}
              </div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={submitting}
            >
              {submitting ? "Gönderiliyor..." : "Başvuruyu Gönder →"}
            </button>
          </form>
        </article>

        <section className="process-card">
          <span className="step-label">SONRA NE OLACAK?</span>
          <div className="process-grid">
            <div>
              <b>01</b>
              <strong>Başvurun ulaşır</strong>
              <p>Formdaki bilgiler güvenli biçimde sistemimize kaydedilir.</p>
            </div>

            <div>
              <b>02</b>
              <strong>Bilgileri inceleriz</strong>
              <p>İşletme ve iletişim bilgilerini kontrol ederiz.</p>
            </div>

            <div>
              <b>03</b>
              <strong>Seninle iletişime geçeriz</strong>
              <p>Gerekli olduğunda ek bilgi veya görsel talep ederiz.</p>
            </div>

            <div>
              <b>04</b>
              <strong>İşletmen yayınlanır</strong>
              <p>Onaylanan işletme ÖnceBak&apos;ta ziyaretçilere açılır.</p>
            </div>
          </div>
        </section>

        <Link href="/" className="cta-link">
          Ana sayfaya dön →
        </Link>
      </section>

      <style jsx global>{`
        :root {
          --accent: #f36f32;
          --accent-dark: #d6531b;
          --dark: #181310;
          --cream: #f7f3ee;
          --text: #241c17;
          --muted: #746a63;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: var(--cream);
          color: var(--text);
          font-family: Arial, Helvetica, sans-serif;
        }

        button,
        input,
        textarea {
          font: inherit;
        }

        .legal-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at top right,
              rgba(243, 111, 50, 0.13),
              transparent 28%
            ),
            var(--cream);
        }

        .legal-header {
          padding: 24px 0;
          background: #100c0a;
        }

        .legal-shell {
          width: min(900px, calc(100% - 32px));
          margin: 0 auto;
        }

        .legal-brand {
          color: white;
          font-size: 25px;
          font-weight: 950;
          letter-spacing: -1.2px;
          text-decoration: none;
        }

        .legal-brand span {
          color: var(--accent);
        }

        .legal-content {
          padding: 85px 0 110px;
        }

        .legal-eyebrow,
        .step-label {
          color: var(--accent);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 2px;
        }

        h1 {
          margin: 14px 0 20px;
          font-size: clamp(48px, 8vw, 78px);
          line-height: 0.95;
          letter-spacing: -4px;
        }

        .lead {
          max-width: 720px;
          margin: 0 0 42px;
          color: var(--muted);
          font-size: 17px;
          line-height: 1.8;
        }

        .legal-card,
        .process-card {
          margin-top: 18px;
          padding: 30px;
          border: 1px solid rgba(36, 28, 23, 0.11);
          border-radius: 22px;
          background: white;
          box-shadow: 0 18px 55px rgba(48, 30, 19, 0.07);
        }

        .card-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 28px;
        }

        .card-heading h2 {
          margin: 8px 0 0;
          font-size: 28px;
          letter-spacing: -1.2px;
        }

        .card-heading p {
          max-width: 280px;
          margin: 0;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.65;
        }

        .form-grid {
          display: grid;
          gap: 18px;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .form-grid label {
          display: grid;
          gap: 8px;
          font-size: 11px;
          font-weight: 900;
        }

        .form-grid label > span {
          color: var(--text);
        }

        .form-grid input,
        .form-grid textarea {
          width: 100%;
          padding: 14px 15px;
          border: 1px solid rgba(36, 28, 23, 0.14);
          border-radius: 14px;
          background: #fffdfa;
          color: var(--text);
          outline: none;
          transition: 0.2s ease;
        }

        .form-grid textarea {
          min-height: 150px;
          resize: vertical;
        }

        .form-grid input:focus,
        .form-grid textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px rgba(243, 111, 50, 0.09);
        }

        .cover-upload {
          display: grid;
          gap: 12px;
        }

        .cover-upload-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
        }

        .cover-upload-heading > div {
          display: grid;
          gap: 5px;
        }

        .cover-upload-heading span {
          font-size: 11px;
          font-weight: 900;
        }

        .cover-upload-heading small {
          color: var(--muted);
          font-size: 10px;
          font-weight: 500;
        }

        .remove-cover {
          padding: 0;
          border: 0;
          background: transparent;
          color: #a62b1d;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .cover-dropzone {
          position: relative;
          min-height: 230px;
          overflow: hidden;
          display: grid !important;
          place-items: center;
          border: 1.5px dashed rgba(36, 28, 23, 0.2);
          border-radius: 17px;
          background: #fffaf6;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .cover-dropzone:hover {
          border-color: var(--accent);
          background: #fff6f0;
        }

        .cover-dropzone input {
          position: absolute;
          inset: 0;
          z-index: 2;
          width: 100%;
          height: 100%;
          padding: 0;
          border: 0;
          opacity: 0;
          cursor: pointer;
        }

        .cover-dropzone img {
          width: 100%;
          height: 300px;
          display: block;
          object-fit: cover;
        }

        .cover-placeholder {
          display: grid;
          place-items: center;
          gap: 8px;
          padding: 30px;
          text-align: center;
        }

        .cover-placeholder b {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: rgba(243, 111, 50, 0.12);
          color: var(--accent);
          font-size: 22px;
        }

        .cover-placeholder strong {
          font-size: 13px;
        }

        .cover-placeholder small {
          max-width: 360px;
          color: var(--muted);
          font-size: 10px;
          font-weight: 500;
          line-height: 1.6;
        }

        .gallery-upload,
        .menu-upload {
          display: grid;
          gap: 12px;
        }

        .media-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
        }

        .media-section-heading > div {
          display: grid;
          gap: 5px;
        }

        .media-section-heading span {
          font-size: 11px;
          font-weight: 900;
        }

        .media-section-heading small {
          color: var(--muted);
          font-size: 10px;
          font-weight: 500;
        }

        .media-section-heading > b {
          color: var(--accent);
          font-size: 11px;
        }

        .gallery-dropzone,
        .menu-dropzone {
          position: relative;
          overflow: hidden;
          display: grid !important;
          min-height: 150px;
          place-items: center;
          border: 1.5px dashed rgba(36, 28, 23, 0.2);
          border-radius: 17px;
          background: #fffaf6;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .gallery-dropzone:hover,
        .menu-dropzone:hover {
          border-color: var(--accent);
          background: #fff6f0;
        }

        .gallery-dropzone input,
        .menu-dropzone input {
          position: absolute;
          inset: 0;
          z-index: 2;
          width: 100%;
          height: 100%;
          padding: 0;
          border: 0;
          opacity: 0;
          cursor: pointer;
        }

        .gallery-dropzone > span {
          display: grid;
          place-items: center;
          gap: 7px;
          padding: 25px;
          text-align: center;
        }

        .gallery-dropzone > span > b {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: rgba(243, 111, 50, 0.12);
          color: var(--accent);
          font-size: 20px;
        }

        .gallery-dropzone strong,
        .menu-dropzone strong {
          font-size: 12px;
        }

        .gallery-dropzone small,
        .menu-dropzone small {
          color: var(--muted);
          font-size: 10px;
          font-weight: 500;
        }

        .gallery-preview-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .gallery-preview-grid > div {
          position: relative;
          height: 135px;
          overflow: hidden;
          border-radius: 14px;
          background: #eee;
        }

        .gallery-preview-grid img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .gallery-preview-grid button {
          position: absolute;
          top: 7px;
          right: 7px;
          z-index: 3;
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 50%;
          background: rgba(20, 16, 13, 0.82);
          color: white;
          font-size: 16px;
          cursor: pointer;
        }

        .menu-dropzone img {
          width: 100%;
          max-height: 360px;
          display: block;
          object-fit: contain;
          background: #f2efec;
        }

        .menu-file-card {
          display: grid;
          place-items: center;
          gap: 8px;
          padding: 28px;
          text-align: center;
        }

        .menu-file-card > b {
          display: grid;
          width: 55px;
          height: 55px;
          place-items: center;
          border-radius: 16px;
          background: #ffe8e4;
          color: #a62b1d;
          font-size: 13px;
        }

        .submit-button {
          min-height: 52px;
          padding: 0 22px;
          border: 0;
          border-radius: 999px;
          background: var(--accent);
          color: white;
          font-size: 12px;
          font-weight: 950;
          cursor: pointer;
          transition: 0.25s ease;
        }

        .submit-button:hover:not(:disabled) {
          background: var(--accent-dark);
          transform: translateY(-2px);
        }

        .submit-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .form-status {
          padding: 14px 16px;
          border-radius: 14px;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.6;
        }

        .form-status.success {
          background: #e8f7ec;
          color: #256c39;
        }

        .form-status.error {
          background: #ffe8e4;
          color: #a62b1d;
        }

        .process-card {
          margin-top: 26px;
        }

        .process-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-top: 22px;
        }

        .process-grid > div {
          min-height: 170px;
          padding: 20px;
          border: 1px solid rgba(36, 28, 23, 0.1);
          border-radius: 17px;
          background: #fffaf6;
        }

        .process-grid b {
          display: block;
          margin-bottom: 20px;
          color: var(--accent);
          font-size: 11px;
        }

        .process-grid strong {
          display: block;
          font-size: 14px;
          line-height: 1.35;
        }

        .process-grid p {
          margin: 10px 0 0;
          color: var(--muted);
          font-size: 11px;
          line-height: 1.7;
        }

        .cta-link {
          display: inline-flex;
          margin-top: 24px;
          padding: 14px 19px;
          border-radius: 999px;
          background: var(--accent);
          color: white;
          font-size: 12px;
          font-weight: 900;
          text-decoration: none;
        }

        .cta-link:hover {
          background: var(--accent-dark);
        }

        @media (max-width: 760px) {
          .legal-content {
            padding: 60px 0 85px;
          }

          .card-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .form-row,
          .process-grid {
            grid-template-columns: 1fr;
          }

          .gallery-preview-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .legal-card,
          .process-card {
            padding: 22px;
          }

          h1 {
            letter-spacing: -3px;
          }
        }
      `}</style>
    </main>
  );
}
