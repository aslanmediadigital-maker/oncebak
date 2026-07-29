"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./SiteChrome.module.css";

type SiteHeaderProps = {
  variant?: "overlay" | "solid";
  activePage?: "contact";
};

export default function SiteHeader({
  variant = "overlay",
  activePage,
}: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (variant === "solid") return;

    function handleScroll() {
      setScrolled(window.scrollY > 24);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [variant]);

  const headerClassName = [
    styles.topbar,
    variant === "solid" ? styles.topbarSolid : styles.topbarOverlay,
    variant === "overlay" && scrolled ? styles.topbarScrolled : "",
  ]
    .filter(Boolean)
    .join(" ");
  const sectionPrefix = activePage === "contact" ? "/" : "";

  return (
    <header className={headerClassName}>
      <div className={`${styles.shell} ${styles.nav}`}>
        <Link href="/" className={styles.brand} aria-label="ÖnceBak ana sayfa">
          Önce<span>Bak</span>
          <small>Gitmeden önce bak.</small>
        </Link>

        <nav className={styles.navLinks} aria-label="Ana menü">
          <Link href="/">Ana Sayfa</Link>
          <Link href={`${sectionPrefix}#mekanlar`}>Mekânlar</Link>
          <Link href={`${sectionPrefix}#kategoriler`}>Kategoriler</Link>
          <Link href={`${sectionPrefix}#nasil-calisir`}>Nasıl Çalışır?</Link>
          {activePage === "contact" && (
            <Link
              href="/iletisim"
              className={styles.active}
              aria-current="page"
            >
              İletişim
            </Link>
          )}
        </nav>

        <Link href="/isletmeni-tanit" className={styles.businessLink}>
          İşletmeni Tanıt
        </Link>
      </div>
    </header>
  );
}
