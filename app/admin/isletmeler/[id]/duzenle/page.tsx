"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Category = {
  id: string | number;
  name: string;
};

type OpeningHours = Record<string, string>;

type BusinessRecord = {
  id: string | number;
  name: string;
  slug: string;
  category_id: string | number | null;
  region: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  google_maps_url: string | null;
  cover_image: string | null;
  gallery: string[] | null;
  menu_url: string | null;
  opening_hours: OpeningHours | null;
  features: string[] | null;
  price_level: number | null;
  rating: number | null;
  verified: boolean | null;
  featured: boolean | null;
};

const REGIONS = [
  "Nevşehir",
  "Göreme",
  "Ürgüp",
  "Avanos",
  "Uçhisar",
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

function isPdf(value: string) {
  return value.split("?")[0].toLowerCase().endsWith(".pdf");
}

export default function EditBusinessPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const businessId = params?.id;

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
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
  const [openingHours, setOpeningHours] =
    useState<OpeningHours>(DEFAULT_HOURS);

  const [currentCover, setCurrentCover] = useState<string | null>(null);
  const [currentGallery, setCurrentGallery] = useState<string[]>([]);
  const [currentMenu, setCurrentMenu] = useState<string | null>(null);

  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [newMenuFile, setNewMenuFile] = useState<File | null>(null);

  const newCoverPreview = useMemo(
    () => (newCoverFile ? URL.createObjectURL(newCoverFile) : ""),
    [newCoverFile]
  );

  const newGalleryPreviews = useMemo(
    () =>
      newGalleryFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [newGalleryFiles]
  );

  const newMenuPreview = useMemo(
    () => (newMenuFile ? URL.createObjectURL(newMenuFile) : ""),
    [newMenuFile]
  );

  useEffect(() => {
    if (!businessId) return;

    async function loadBusiness() {
      setPageLoading(true);
      setMessage(null);

      const [businessResult, categoryResult] = await Promise.all([
        supabase
          .from("businesses")
          .select(
            `
              id,
              name,
              slug,
              category_id,
              region,
              description,
              address,
              phone,
              whatsapp,
              instagram,
              website,
              google_maps_url,
              cover_image,
              gallery,
              menu_url,
              opening_hours,
              features,
              price_level,
              rating,
              verified,
              featured
            `
          )
          .eq("id", businessId)
          .maybeSingle(),
        supabase
          .from("categories")
          .select("id, name")
          .order("name", { ascending: true }),
      ]);

      if (categoryResult.error) {
        setMessage({
          type: "error",
          text: `Kategoriler yüklenemedi: ${categoryResult.error.message}`,
        });
      } else {
        setCategories((categoryResult.data ?? []) as Category[]);
      }

      if (businessResult.error) {
        setMessage({
          type: "error",
          text: `İşletme yüklenemedi: ${businessResult.error.message}`,
        });
        setPageLoading(false);
        return;
      }

      if (!businessResult.data) {
        setNotFound(true);
        setPageLoading(false);
        return;
      }

      const business = businessResult.data as BusinessRecord;

      setName(business.name ?? "");
      setSlug(business.slug ?? "");
      setCategoryId(
        business.category_id !== null ? String(business.category_id) : ""
      );
      setRegion(business.region ?? "Nevşehir");
      setDescription(business.description ?? "");
      setAddress(business.address ?? "");
      setPhone(business.phone ?? "");
      setWhatsapp(business.whatsapp ?? "");
      setInstagram(business.instagram ?? "");
      setWebsite(business.website ?? "");
      setGoogleMapsUrl(business.google_maps_url ?? "");
      setPriceLevel(
        business.price_level !== null ? String(business.price_level) : ""
      );
      setRating(String(business.rating ?? 0));
      setVerified(Boolean(business.verified));
      setFeatured(Boolean(business.featured));
      setFeatures(
        Array.isArray(business.features) ? business.features : []
      );
      setOpeningHours({
        ...DEFAULT_HOURS,
        ...(business.opening_hours ?? {}),
      });

      setCurrentCover(business.cover_image ?? null);
      setCurrentGallery(
        Array.isArray(business.gallery) ? business.gallery : []
      );
      setCurrentMenu(business.menu_url ?? null);

      setPageLoading(false);
    }

    loadBusiness();
  }, [businessId]);

  useEffect(() => {
    return () => {
      if (newCoverPreview) URL.revokeObjectURL(newCoverPreview);
      newGalleryPreviews.forEach((item) =>
        URL.revokeObjectURL(item.url)
      );
      if (newMenuPreview) URL.revokeObjectURL(newMenuPreview);
    };
  }, [newCoverPreview, newGalleryPreviews, newMenuPreview]);

  function toggleFeature(feature: string) {
    setFeatures((current) =>
      current.includes(feature)
        ? current.filter((item) => item !== feature)
        : [...current, feature]
    );
  }

  function handleNewGalleryFiles(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selected = Array.from(event.target.files ?? []);
    const available = Math.max(0, 12 - currentGallery.length);

    setNewGalleryFiles((current) =>
      [...current, ...selected].slice(0, available)
    );

    event.target.value = "";
  }

  function removeNewGalleryFile(index: number) {
    setNewGalleryFiles((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function removeCurrentGalleryImage(index: number) {
    setCurrentGallery((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
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

    const { data } = supabase.storage
      .from("business-media")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!businessId) return;

    if (!name.trim()) {
      setMessage({
        type: "error",
        text: "İşletme adı zorunludur.",
      });
      return;
    }

    if (!slug.trim()) {
      setMessage({
        type: "error",
        text: "Slug alanı boş bırakılamaz.",
      });
      return;
    }

    if (!categoryId) {
      setMessage({
        type: "error",
        text: "Bir kategori seçmelisin.",
      });
      return;
    }

    if (!currentCover && !newCoverFile) {
      setMessage({
        type: "error",
        text: "İşletmenin bir kapak fotoğrafı olmalıdır.",
      });
      return;
    }

    const numericRating = Number(rating || 0);

    if (
      !Number.isFinite(numericRating) ||
      numericRating < 0 ||
      numericRating > 5
    ) {
      setMessage({
        type: "error",
        text: "Puan 0 ile 5 arasında olmalıdır.",
      });
      return;
    }

    setSaving(true);

    try {
      const cleanSlug = slugify(slug);

      const { data: duplicateSlug, error: duplicateError } =
        await supabase
          .from("businesses")
          .select("id")
          .eq("slug", cleanSlug)
          .neq("id", businessId)
          .maybeSingle();

      if (duplicateError) throw new Error(duplicateError.message);

      if (duplicateSlug) {
        throw new Error(
          "Bu slug başka bir işletmede kullanılıyor."
        );
      }

      const folder = `${cleanSlug}-${businessId}`;

      let coverImage = currentCover;

      if (newCoverFile) {
        const path = `${folder}/cover/${crypto.randomUUID()}-${sanitizeFileName(
          newCoverFile.name
        )}`;
        coverImage = await uploadFile(newCoverFile, path);
      }

      const uploadedGallery: string[] = [];

      for (const file of newGalleryFiles) {
        const path = `${folder}/gallery/${crypto.randomUUID()}-${sanitizeFileName(
          file.name
        )}`;
        uploadedGallery.push(await uploadFile(file, path));
      }

      const gallery = [...currentGallery, ...uploadedGallery].slice(
        0,
        12
      );

      let menuUrl = currentMenu;

      if (newMenuFile) {
        const path = `${folder}/menu/${crypto.randomUUID()}-${sanitizeFileName(
          newMenuFile.name
        )}`;
        menuUrl = await uploadFile(newMenuFile, path);
      }

      const { error } = await supabase
        .from("businesses")
        .update({
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
          gallery,
          menu_url: menuUrl,
          opening_hours: openingHours,
          features,
          price_level: priceLevel ? Number(priceLevel) : null,
          rating: numericRating,
          verified,
          featured,
        })
        .eq("id", businessId);

      if (error) throw new Error(error.message);

      setCurrentCover(coverImage);
      setCurrentGallery(gallery);
      setCurrentMenu(menuUrl);

      setNewCoverFile(null);
      setNewGalleryFiles([]);
      setNewMenuFile(null);
      setSlug(cleanSlug);

      setMessage({
        type: "success",
        text: "İşletme başarıyla güncellendi.",
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? `Güncelleme başarısız: ${error.message}`
            : "İşletme güncellenemedi.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (pageLoading) {
    return (
      <main className="center-page">
        <div className="spinner" />
        <strong>İşletme bilgileri yükleniyor</strong>

        <PageStyles />
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="center-page">
        <div className="not-found-icon">!</div>
        <h1>İşletme bulunamadı</h1>
        <p>Bu kayıt silinmiş veya geçersiz olabilir.</p>
        <Link href="/admin/isletmeler">İşletmelere dön</Link>

        <PageStyles />
      </main>
    );
  }

  return (
    <main className="admin-page">
      <aside className="sidebar">
        <div>
          <Link href="/admin" className="brand">
            Önce<span>Bak</span>
          </Link>

          <p className="panel-label">Yönetim Paneli</p>

          <nav>
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/yeni-isletme">
              ＋ Yeni İşletme
            </Link>
            <Link href="/admin/isletmeler" className="active">
              İşletmeler
            </Link>
            <Link href="/">Ana Siteyi Görüntüle</Link>
          </nav>
        </div>

        <p className="sidebar-note">
          İşletme bilgilerini ve medya dosyalarını buradan
          güncelleyebilirsin.
        </p>
      </aside>

      <section className="workspace">
        <header className="page-header">
          <div>
            <span className="eyebrow">İŞLETME YÖNETİMİ</span>
            <h1>İşletmeyi düzenle</h1>
            <p>
              Mevcut bilgileri, görselleri ve menüyü güncelle.
            </p>
          </div>

          <div className="header-actions">
            <Link
              href={`/mekan/${slug}`}
              target="_blank"
              className="ghost-button"
            >
              Sayfayı görüntüle
            </Link>

            <Link
              href="/admin/isletmeler"
              className="ghost-button"
            >
              İşletmelere dön
            </Link>
          </div>
        </header>

        {message && (
          <div className={`status ${message.type}`}>
            <strong>
              {message.type === "success" ? "Başarılı" : "Hata"}
            </strong>
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <section className="form-card">
            <div className="card-heading">
              <span>01</span>
              <div>
                <h2>Temel bilgiler</h2>
                <p>İşletmenin adı, kategorisi ve açıklaması.</p>
              </div>
            </div>

            <div className="form-grid two">
              <Field label="İşletme adı" required>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </Field>

              <Field
                label="Slug"
                hint="Sayfa adresinde görünür"
                required
              >
                <input
                  value={slug}
                  onChange={(event) =>
                    setSlug(slugify(event.target.value))
                  }
                  required
                />
              </Field>

              <Field label="Kategori" required>
                <select
                  value={categoryId}
                  onChange={(event) =>
                    setCategoryId(event.target.value)
                  }
                  required
                >
                  <option value="">Kategori seç</option>

                  {categories.map((category) => (
                    <option
                      value={String(category.id)}
                      key={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Bölge" required>
                <select
                  value={region}
                  onChange={(event) =>
                    setRegion(event.target.value)
                  }
                >
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
                  onChange={(event) =>
                    setAddress(event.target.value)
                  }
                  placeholder="Mahalle, cadde, sokak ve numara"
                />
              </Field>

              <Field label="Açıklama" className="full">
                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
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
                <p>
                  Telefon, sosyal medya ve harita bağlantıları.
                </p>
              </div>
            </div>

            <div className="form-grid two">
              <Field label="Telefon">
                <input
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="0555 000 00 00"
                />
              </Field>

              <Field label="WhatsApp">
                <input
                  value={whatsapp}
                  onChange={(event) =>
                    setWhatsapp(event.target.value)
                  }
                  placeholder="905550000000"
                />
              </Field>

              <Field label="Instagram">
                <input
                  value={instagram}
                  onChange={(event) =>
                    setInstagram(event.target.value)
                  }
                  placeholder="@isletmeadi"
                />
              </Field>

              <Field label="Web sitesi">
                <input
                  value={website}
                  onChange={(event) =>
                    setWebsite(event.target.value)
                  }
                  placeholder="https://..."
                />
              </Field>

              <Field
                label="Google Maps bağlantısı"
                className="full"
              >
                <input
                  value={googleMapsUrl}
                  onChange={(event) =>
                    setGoogleMapsUrl(event.target.value)
                  }
                  placeholder="https://maps.google.com/..."
                />
              </Field>
            </div>
          </section>

          <section className="form-card">
            <div className="card-heading">
              <span>03</span>
              <div>
                <h2>Kapak fotoğrafı</h2>
                <p>
                  Yeni bir dosya seçmezsen mevcut kapak korunur.
                </p>
              </div>
            </div>

            <div className="media-layout">
              <div className="current-media">
                <div className="media-title">
                  <strong>Mevcut kapak</strong>
                </div>

                {(newCoverPreview || currentCover) ? (
                  <img
                    className="cover-preview"
                    src={newCoverPreview || currentCover || ""}
                    alt="Kapak"
                  />
                ) : (
                  <div className="media-empty">
                    Kapak fotoğrafı yok
                  </div>
                )}
              </div>

              <UploadBox
                title="Yeni kapak seç"
                description="JPG, PNG veya WEBP"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setNewCoverFile(
                    event.target.files?.[0] ?? null
                  )
                }
              />
            </div>

            {newCoverFile && (
              <button
                type="button"
                className="remove-new-button"
                onClick={() => setNewCoverFile(null)}
              >
                Yeni kapak seçimini iptal et
              </button>
            )}
          </section>

          <section className="form-card">
            <div className="card-heading">
              <span>04</span>
              <div>
                <h2>Galeri</h2>
                <p>
                  Mevcut fotoğrafları kaldırabilir ve yenilerini
                  ekleyebilirsin. En fazla 12 fotoğraf.
                </p>
              </div>
            </div>

            {currentGallery.length > 0 && (
              <>
                <div className="media-title">
                  <strong>
                    Mevcut galeri ({currentGallery.length})
                  </strong>
                </div>

                <div className="gallery-preview">
                  {currentGallery.map((url, index) => (
                    <div key={`${url}-${index}`}>
                      <img
                        src={url}
                        alt={`Galeri ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          removeCurrentGalleryImage(index)
                        }
                        title="Galeriden kaldır"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {newGalleryPreviews.length > 0 && (
              <>
                <div className="media-title new-title">
                  <strong>
                    Kaydedilecek yeni fotoğraflar (
                    {newGalleryPreviews.length})
                  </strong>
                </div>

                <div className="gallery-preview">
                  {newGalleryPreviews.map((item, index) => (
                    <div
                      key={`${item.file.name}-${index}`}
                      className="new-gallery-item"
                    >
                      <img
                        src={item.url}
                        alt={`Yeni galeri ${index + 1}`}
                      />
                      <span>Yeni</span>
                      <button
                        type="button"
                        onClick={() =>
                          removeNewGalleryFile(index)
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {currentGallery.length +
              newGalleryFiles.length <
              12 && (
              <div className="gallery-upload">
                <UploadBox
                  title="Galeriye fotoğraf ekle"
                  description={`Kalan hak: ${
                    12 -
                    currentGallery.length -
                    newGalleryFiles.length
                  }`}
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleNewGalleryFiles}
                />
              </div>
            )}

            {currentGallery.length === 0 &&
              newGalleryFiles.length === 0 && (
                <p className="empty-note">
                  Bu işletmede henüz galeri fotoğrafı yok.
                </p>
              )}
          </section>

          <section className="form-card">
            <div className="card-heading">
              <span>05</span>
              <div>
                <h2>Menü</h2>
                <p>
                  PDF veya görsel menü işletme sayfasında doğrudan
                  gösterilir.
                </p>
              </div>
            </div>

            {(newMenuPreview || currentMenu) && (
              <div className="menu-area">
                <div className="media-title">
                  <strong>
                    {newMenuFile
                      ? "Kaydedilecek yeni menü"
                      : "Mevcut menü"}
                  </strong>
                </div>

                {isPdf(
                  newMenuFile?.name ||
                    newMenuPreview ||
                    currentMenu ||
                    ""
                ) ? (
                  <iframe
                    src={newMenuPreview || currentMenu || ""}
                    title="Menü önizleme"
                  />
                ) : (
                  <img
                    className="menu-preview"
                    src={newMenuPreview || currentMenu || ""}
                    alt="Menü"
                  />
                )}
              </div>
            )}

            {!newMenuPreview && !currentMenu && (
              <p className="empty-note">
                Bu işletmede henüz menü dosyası yok.
              </p>
            )}

            <div className="menu-actions">
              <UploadBox
                title="Yeni menü seç"
                description="PDF, JPG, PNG veya WEBP"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setNewMenuFile(
                    event.target.files?.[0] ?? null
                  )
                }
              />

              {(currentMenu || newMenuFile) && (
                <button
                  type="button"
                  className="remove-menu-button"
                  onClick={() => {
                    setNewMenuFile(null);
                    setCurrentMenu(null);
                  }}
                >
                  Menüyü kaldır
                </button>
              )}
            </div>
          </section>

          <section className="form-card">
            <div className="card-heading">
              <span>06</span>
              <div>
                <h2>Fiyat ve görünürlük</h2>
                <p>
                  İşletmenin puanı ve öne çıkarma seçenekleri.
                </p>
              </div>
            </div>

            <div className="form-grid two">
              <Field label="Ortalama fiyat">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={priceLevel}
                  onChange={(event) =>
                    setPriceLevel(event.target.value)
                  }
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
                  onChange={(event) =>
                    setRating(event.target.value)
                  }
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
              <span>07</span>
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
                  className={
                    features.includes(feature) ? "selected" : ""
                  }
                >
                  <span>
                    {features.includes(feature) ? "✓" : "+"}
                  </span>
                  {feature}
                </button>
              ))}
            </div>
          </section>

          <section className="form-card">
            <div className="card-heading">
              <span>08</span>
              <div>
                <h2>Çalışma saatleri</h2>
                <p>
                  Kapalı günler için kutuya “Kapalı” yazabilirsin.
                </p>
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
              <strong>Değişiklikleri kaydet</strong>
              <span>
                Bilgiler işletme sayfasında güncellenecek.
              </span>
            </div>

            <button type="submit" disabled={saving}>
              {saving
                ? "Dosyalar yükleniyor..."
                : "Değişiklikleri kaydet"}
            </button>
          </div>
        </form>
      </section>

      <PageStyles />
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
  onChange,
}: {
  title: string;
  description: string;
  accept: string;
  multiple?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="upload-box">
      <input
        type="file"
        accept={accept}
        multiple={multiple}
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

function PageStyles() {
  return (
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
      textarea,
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

      .header-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 9px;
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
        font-size: 10px;
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

      form {
        display: grid;
        gap: 20px;
      }

      .form-card {
        padding: 30px;
        border: 1px solid var(--line);
        border-radius: 23px;
        background: white;
        box-shadow: 0 16px 50px rgba(44, 28, 18, 0.04);
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

      .field.full {
        grid-column: 1 / -1;
      }

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

      input,
      textarea,
      select {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 12px;
        outline: none;
        background: #fbf9f7;
        color: var(--ink);
        transition:
          border-color 0.2s ease,
          box-shadow 0.2s ease;
      }

      input,
      select {
        min-height: 47px;
        padding: 0 13px;
      }

      textarea {
        resize: vertical;
        padding: 13px;
        line-height: 1.6;
      }

      input:focus,
      textarea:focus,
      select:focus {
        border-color: rgba(255, 90, 31, 0.65);
        box-shadow: 0 0 0 4px rgba(255, 90, 31, 0.08);
      }

      .media-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) minmax(230px, 0.6fr);
        align-items: stretch;
        gap: 16px;
      }

      .current-media {
        min-width: 0;
      }

      .media-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 11px;
      }

      .media-title strong {
        font-size: 11px;
      }

      .media-title.new-title {
        margin-top: 24px;
      }

      .cover-preview {
        width: 100%;
        height: 360px;
        display: block;
        border-radius: 17px;
        object-fit: cover;
        background: #eee9e4;
      }

      .media-empty {
        height: 360px;
        display: grid;
        place-items: center;
        border: 1px dashed var(--line);
        border-radius: 17px;
        background: #fbf9f7;
        color: var(--muted);
        font-size: 11px;
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

      .media-layout .upload-box {
        min-height: 100%;
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

      .remove-new-button {
        margin-top: 12px;
        padding: 9px 12px;
        border: 1px solid #f4c7c3;
        border-radius: 9px;
        background: #fff1f0;
        color: var(--danger);
        font-size: 9px;
        font-weight: 900;
        cursor: pointer;
      }

      .gallery-preview {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }

      .gallery-preview > div {
        position: relative;
        height: 140px;
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
        background: rgba(20, 16, 13, 0.82);
        color: white;
        cursor: pointer;
      }

      .new-gallery-item > span {
        position: absolute;
        left: 7px;
        bottom: 7px;
        padding: 5px 7px;
        border-radius: 999px;
        background: var(--accent);
        color: white;
        font-size: 8px;
        font-weight: 950;
      }

      .gallery-upload {
        max-width: 330px;
        margin-top: 22px;
      }

      .menu-area iframe {
        width: 100%;
        height: 650px;
        border: 1px solid var(--line);
        border-radius: 16px;
        background: #eee;
      }

      .menu-preview {
        width: 100%;
        max-height: 700px;
        display: block;
        border-radius: 16px;
        object-fit: contain;
        background: #f3efeb;
      }

      .menu-actions {
        display: grid;
        grid-template-columns: minmax(240px, 330px) auto;
        align-items: stretch;
        gap: 12px;
        margin-top: 20px;
      }

      .remove-menu-button {
        padding: 12px 18px;
        border: 1px solid #f4c7c3;
        border-radius: 14px;
        background: #fff1f0;
        color: var(--danger);
        font-size: 10px;
        font-weight: 900;
        cursor: pointer;
      }

      .empty-note {
        margin: 0;
        padding: 18px;
        border: 1px dashed var(--line);
        border-radius: 13px;
        background: #fbf9f7;
        color: var(--muted);
        font-size: 11px;
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
        transition: background 0.2s ease;
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
        box-shadow: 0 2px 7px rgba(0, 0, 0, 0.15);
        transition: transform 0.2s ease;
      }

      .switch.active {
        background: var(--accent);
      }

      .switch.active::after {
        transform: translateX(19px);
      }

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
        border-color: rgba(255, 90, 31, 0.35);
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
        border: 1px solid rgba(255, 255, 255, 0.7);
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 24px 70px rgba(42, 27, 17, 0.16);
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
        min-width: 205px;
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
        opacity: 0.65;
        cursor: wait;
      }

      .center-page {
        min-height: 100vh;
        display: grid;
        align-content: center;
        justify-items: center;
        padding: 30px;
        background: var(--paper);
        color: var(--ink);
        text-align: center;
      }

      .center-page strong {
        margin-top: 15px;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 22px;
        font-weight: 500;
      }

      .center-page h1 {
        margin: 15px 0 7px;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 38px;
        font-weight: 500;
      }

      .center-page p {
        margin: 0 0 18px;
        color: var(--muted);
      }

      .center-page a {
        padding: 12px 17px;
        border-radius: 999px;
        background: var(--accent);
        color: white;
        font-size: 11px;
        font-weight: 900;
        text-decoration: none;
      }

      .not-found-icon {
        width: 48px;
        height: 48px;
        display: grid;
        place-items: center;
        border-radius: 15px;
        background: #fff0e9;
        color: var(--accent);
        font-size: 24px;
        font-weight: 900;
      }

      .spinner {
        width: 36px;
        height: 36px;
        border: 3px solid #eee6df;
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 980px) {
        .admin-page {
          grid-template-columns: 1fr;
        }

        .sidebar {
          position: static;
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
          width: min(100% - 28px, 1080px);
          padding-top: 34px;
        }

        .media-layout {
          grid-template-columns: 1fr;
        }

        .media-layout .upload-box {
          min-height: 170px;
        }
      }

      @media (max-width: 700px) {
        .page-header {
          flex-direction: column;
        }

        .header-actions {
          justify-content: flex-start;
        }

        .page-header h1 {
          font-size: 45px;
          letter-spacing: -2px;
        }

        .form-card {
          padding: 22px 17px;
        }

        .form-grid.two,
        .toggle-grid,
        .feature-grid,
        .hours-grid,
        .menu-actions {
          grid-template-columns: 1fr;
        }

        .field.full {
          grid-column: auto;
        }

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

        .submit-bar button {
          width: 100%;
        }

        .menu-area iframe {
          height: 520px;
        }

        .cover-preview,
        .media-empty {
          height: 280px;
        }
      }
    `}</style>
  );
}
