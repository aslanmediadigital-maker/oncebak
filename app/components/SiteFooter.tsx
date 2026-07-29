import Link from "next/link";
import styles from "./SiteChrome.module.css";

export default function SiteFooter({
  activePage,
}: {
  activePage?: "contact";
}) {
  const contactClassName = activePage === "contact" ? styles.active : undefined;

  return (
    <footer className={styles.footer}>
      <div className={`${styles.shell} ${styles.footerContent}`}>
        <div>
          <Link
            href="/"
            className={`${styles.brand} ${styles.footerBrand}`}
            aria-label="ÖnceBak ana sayfa"
          >
            Önce<span>Bak</span>
          </Link>
          <p>
            Kapadokya&apos;daki restoranları, kafeleri ve aktiviteleri güncel
            bilgilerle keşfet. Gitmeden önce bak, sürpriz yaşamadan karar ver.
          </p>
        </div>

        <div>
          <strong>Keşfet</strong>
          <Link href="/#mekanlar">Mekânlar</Link>
          <Link href="/#kategoriler">Kategoriler</Link>
          <Link href="/#nasil-calisir">Nasıl Çalışır?</Link>
        </div>

        <div>
          <strong>Kurumsal</strong>
          <Link href="/hakkimizda">Hakkımızda</Link>
          <Link href="/gizlilik">Gizlilik Politikası</Link>
          <Link href="/kullanim-sartlari">Kullanım Şartları</Link>
          <Link
            href="/iletisim"
            className={contactClassName}
            aria-current={activePage === "contact" ? "page" : undefined}
          >
            İletişim
          </Link>
        </div>

        <div className={styles.footerBusiness}>
          <strong>İşletme Sahibi misiniz?</strong>
          <p>
            İşletmenizi ÖnceBak&apos;ta tanıtın ve Kapadokya&apos;yı keşfeden
            daha fazla kişiye ulaşın.
          </p>
          <Link
            href="/isletmeni-tanit"
            className={styles.footerBusinessButton}
          >
            İşletmeni Tanıt →
          </Link>
        </div>
      </div>

      <div className={`${styles.shell} ${styles.copyright}`}>
        <span>© {new Date().getFullYear()} ÖnceBak. Tüm hakları saklıdır.</span>
        <div className={styles.copyrightLinks}>
          <Link href="/hakkimizda">Hakkımızda</Link>
          <Link href="/gizlilik">Gizlilik</Link>
          <Link href="/kullanim-sartlari">Kullanım Şartları</Link>
          <Link
            href="/iletisim"
            className={contactClassName}
            aria-current={activePage === "contact" ? "page" : undefined}
          >
            İletişim
          </Link>
        </div>
      </div>
    </footer>
  );
}
