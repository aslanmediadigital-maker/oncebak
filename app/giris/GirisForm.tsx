"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import { createClient } from "@/lib/supabase/client";
import styles from "../components/AuthPage.module.css";

type CallbackStatus = "onaylandi" | "onay-hatasi" | null;

const supabase = createClient();

export default function GirisForm({ durum }: { durum: CallbackStatus }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const isEmailUnconfirmed =
          error.code === "email_not_confirmed" ||
          error.message.toLowerCase().includes("email not confirmed");

        setErrorMessage(
          isEmailUnconfirmed
            ? "E-posta adresin henüz doğrulanmamış. Gelen kutundaki doğrulama bağlantısını kullan."
            : "Giriş yapılamadı. E-posta adresini ve şifreni kontrol et."
        );
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setErrorMessage(
        "Giriş işlemi tamamlanamadı. Lütfen kısa bir süre sonra tekrar dene."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <SiteHeader variant="solid" />
      <main className={styles.main}>
        <section className={styles.card} aria-labelledby="giris-basligi">
          <p className={styles.eyebrow}>Tekrar hoş geldin</p>
          <h1 className={styles.title} id="giris-basligi">
            Giriş yap
          </h1>
          <p className={styles.intro}>
            ÖnceBak hesabına e-posta adresin ve şifrenle giriş yap.
          </p>

          {durum === "onaylandi" && (
            <p
              className={`${styles.message} ${styles.success}`}
              role="status"
              aria-live="polite"
            >
              E-posta adresin doğrulandı. Şimdi giriş yapabilirsin.
            </p>
          )}
          {durum === "onay-hatasi" && (
            <p className={`${styles.message} ${styles.error}`} role="alert">
              Doğrulama bağlantısı geçersiz veya süresi dolmuş. Lütfen tekrar
              kayıt olmayı dene.
            </p>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="email">E-posta</label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Şifre</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {errorMessage && (
              <p className={`${styles.message} ${styles.error}`} role="alert">
                {errorMessage}
              </p>
            )}

            <button
              className={styles.submit}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>

          <p className={styles.switchText}>
            Henüz hesabın yok mu?{" "}
            <Link className={styles.switchLink} href="/kayit">
              Kayıt ol
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
