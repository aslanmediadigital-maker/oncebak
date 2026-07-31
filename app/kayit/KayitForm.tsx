"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import { createClient } from "@/lib/supabase/client";
import styles from "../components/AuthPage.module.css";

const supabase = createClient();

export default function KayitForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const normalizedName = displayName.trim();
    const normalizedEmail = email.trim();

    if (normalizedName.length < 2 || normalizedName.length > 60) {
      setErrorMessage("Görünen ad 2–60 karakter arasında olmalıdır.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Şifre en az 8 karakter olmalıdır.");
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage("Şifreler birbiriyle eşleşmiyor.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { display_name: normalizedName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMessage(
          "Kayıt işlemi tamamlanamadı. Bilgilerinizi kontrol edip tekrar deneyin."
        );
        return;
      }

      setSuccessMessage("Doğrulama bağlantısı e-posta adresine gönderildi.");
      setPassword("");
      setPasswordConfirm("");
    } catch {
      setErrorMessage(
        "Kayıt işlemi tamamlanamadı. Lütfen kısa bir süre sonra tekrar deneyin."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <SiteHeader variant="solid" />
      <main className={styles.main}>
        <section className={styles.card} aria-labelledby="kayit-basligi">
          <p className={styles.eyebrow}>ÖnceBak üyeliği</p>
          <h1 className={styles.title} id="kayit-basligi">
            Hesabını oluştur
          </h1>
          <p className={styles.intro}>
            Kapadokya keşiflerini kişisel hesabında bir araya getirmek için
            bilgilerini gir.
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="display-name">Görünen ad</label>
              <input
                id="display-name"
                name="displayName"
                type="text"
                autoComplete="name"
                minLength={2}
                maxLength={60}
                required
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                aria-describedby="display-name-hint"
              />
              <p className={styles.hint} id="display-name-hint">
                2–60 karakter arasında olmalıdır.
              </p>
            </div>

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
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby="password-hint"
              />
              <p className={styles.hint} id="password-hint">
                En az 8 karakter kullan.
              </p>
            </div>

            <div className={styles.field}>
              <label htmlFor="password-confirm">Şifre tekrarı</label>
              <input
                id="password-confirm"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
              />
            </div>

            {errorMessage && (
              <p className={`${styles.message} ${styles.error}`} role="alert">
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p
                className={`${styles.message} ${styles.success}`}
                role="status"
                aria-live="polite"
              >
                {successMessage}
              </p>
            )}

            <button
              className={styles.submit}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Hesap oluşturuluyor…" : "Kayıt Ol"}
            </button>
          </form>

          <p className={styles.switchText}>
            Zaten hesabın var mı?{" "}
            <Link className={styles.switchLink} href="/giris">
              Giriş yap
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
