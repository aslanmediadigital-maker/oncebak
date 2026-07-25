"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    if (!name.trim()) {
      setMessage("İşletme adı zorunludur.");
      return;
    }

    setLoading(true);

    try {
      let imageUrl: string | null = null;

      if (image) {
        const fileExtension = image.name.split(".").pop();
        const fileName = `${Date.now()}-${createSlug(name)}.${fileExtension}`;
        const filePath = `businesses/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("business-images")
          .upload(filePath, image);

        if (uploadError) {
          throw new Error(`Fotoğraf yüklenemedi: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("business-images")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      const slug = createSlug(name);

      const { error: insertError } = await supabase
        .from("businesses")
        .insert({
          name: name.trim(),
          description: description.trim(),
          location: location.trim(),
          phone: phone.trim(),
          website: website.trim(),
          image_url: imageUrl,
          slug,
        });

      if (insertError) {
        throw new Error(`İşletme kaydedilemedi: ${insertError.message}`);
      }

      setMessage("İşletme başarıyla kaydedildi.");

      setName("");
      setDescription("");
      setLocation("");
      setPhone("");
      setWebsite("");
      setImage(null);

      const fileInput = document.getElementById(
        "business-image"
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Beklenmeyen bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#f5f5f5",
        color: "#111",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          background: "#fff",
          padding: "30px",
          borderRadius: "16px",
        }}
      >
        <h1>ÖnceBak Yönetim Paneli</h1>

        <p>Yeni işletme bilgilerini buradan ekleyebilirsin.</p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: "16px",
            marginTop: "30px",
          }}
        >
          <input
            type="text"
            placeholder="İşletme adı"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            style={inputStyle}
          />

          <textarea
            placeholder="İşletme açıklaması"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Konum"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            style={inputStyle}
          />

          <input
            type="tel"
            placeholder="Telefon"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            style={inputStyle}
          />

          <input
            type="url"
            placeholder="Web sitesi"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            style={inputStyle}
          />

          <input
            id="business-image"
            type="file"
            accept="image/*"
            onChange={(event) =>
              setImage(event.target.files?.[0] ?? null)
            }
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "15px",
              border: "none",
              borderRadius: "10px",
              background: loading ? "#777" : "#111",
              color: "#fff",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Kaydediliyor..." : "İşletmeyi Kaydet"}
          </button>

          {message && (
            <p
              style={{
                margin: 0,
                padding: "12px",
                borderRadius: "10px",
                background: "#f0f0f0",
                fontWeight: 600,
              }}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "14px",
  border: "1px solid #ddd",
  borderRadius: "10px",
  fontSize: "16px",
};
