"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./SiteChrome.module.css";

const supabase = createClient();

type SiteHeaderProps = {
  variant?: "overlay" | "solid";
  activePage?: "contact";
  isHomePage?: boolean;
  onHomeNavigate?: () => void;
};

export default function SiteHeader({
  variant = "overlay",
  activePage,
  isHomePage = false,
  onHomeNavigate,
}: SiteHeaderProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (variant === "solid") return;

    function handleScroll() {
      setScrolled(window.scrollY > 24);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [variant]);

  useEffect(() => {
    let isActive = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isActive || event === "INITIAL_SESSION") return;
      setUser(session?.user ?? null);
      if (!session?.user) setAccountMenuOpen(false);
    });

    async function loadUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (isActive) setUser(currentUser);
    }

    void loadUser();

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setAccountMenuOpen(false);
      accountButtonRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  const headerClassName = [
    styles.topbar,
    variant === "solid" ? styles.topbarSolid : styles.topbarOverlay,
    variant === "overlay" && scrolled ? styles.topbarScrolled : "",
  ]
    .filter(Boolean)
    .join(" ");
  const sectionPrefix = isHomePage ? "" : "/";

  function handleHomeNavigate(event: MouseEvent<HTMLAnchorElement>) {
    if (!onHomeNavigate) return;
    event.preventDefault();
    onHomeNavigate();
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    setSignOutError("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setSignOutError("Çıkış yapılamadı. Lütfen tekrar deneyin.");
      setIsSigningOut(false);
      return;
    }

    setUser(null);
    setAccountMenuOpen(false);
    setIsSigningOut(false);
    router.replace("/");
    router.refresh();
  }

  const metadataName = user?.user_metadata?.display_name;
  const accountLabel =
    typeof metadataName === "string" && metadataName.trim()
      ? metadataName.trim()
      : "Hesabım";

  return (
    <header className={headerClassName}>
      <div className={`${styles.shell} ${styles.nav}`}>
        <Link
          href="/"
          className={styles.brand}
          aria-label="ÖnceBak ana sayfa"
          onClick={handleHomeNavigate}
        >
          Önce<span>Bak</span>
          <small>Gitmeden önce bak.</small>
        </Link>

        <nav className={styles.navLinks} aria-label="Ana menü">
          <Link href="/" onClick={handleHomeNavigate}>
            Ana Sayfa
          </Link>
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

        <div className={styles.headerActions}>
          <div className={styles.authArea}>
            {user === undefined && (
              <span className={styles.authPlaceholder} aria-hidden="true" />
            )}

            {user === null && (
              <div className={styles.signedOutLinks}>
                <Link href="/giris" className={styles.loginLink}>
                  Giriş Yap
                </Link>
                <Link href="/kayit" className={styles.registerLink}>
                  Kayıt Ol
                </Link>
              </div>
            )}

            {user && (
              <div className={styles.accountMenu} ref={accountMenuRef}>
                <button
                  ref={accountButtonRef}
                  type="button"
                  className={styles.accountButton}
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  aria-controls="site-account-menu"
                  onClick={() => {
                    setSignOutError("");
                    setAccountMenuOpen((isOpen) => !isOpen);
                  }}
                >
                  <span>{accountLabel}</span>
                  <span className={styles.accountChevron} aria-hidden="true">
                    ▾
                  </span>
                </button>

                {accountMenuOpen && (
                  <div
                    id="site-account-menu"
                    className={styles.accountDropdown}
                    role="menu"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                    >
                      {isSigningOut ? "Çıkış yapılıyor…" : "Çıkış Yap"}
                    </button>
                    {signOutError && (
                      <p className={styles.authError} role="alert">
                        {signOutError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <Link href="/isletmeni-tanit" className={styles.businessLink}>
            İşletmeni Tanıt
          </Link>
        </div>
      </div>
    </header>
  );
}
