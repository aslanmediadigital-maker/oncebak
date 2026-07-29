"use client";

import Link from "next/link";

export default function GizlilikPage() {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <div className="legal-shell">
          <Link href="/" className="legal-brand">Önce<span>Bak</span></Link>
        </div>
      </header>

      <section className="legal-shell legal-content">
        <span className="legal-eyebrow">GİZLİLİK</span>
        <h1>Gizliliğinize önem veriyoruz.</h1>
        <p className="lead">
          Bu sayfa, ÖnceBak&apos;ı kullanırken hangi bilgilerin işlenebileceğini
          ve bu bilgilerin hangi amaçlarla kullanılabileceğini açıklar.
        </p>

        <article className="legal-card">
          <h2>Toplanabilecek bilgiler</h2>
          <p>
            İşletmeni Tanıt başvuru formu üzerinden paylaştığınız işletme ve
            iletişim bilgileri, başvurunuzu değerlendirmek ve sizinle iletişime
            geçmek amacıyla kullanılabilir.
          </p>
        </article>

        <article className="legal-card">
          <h2>Çerezler ve analiz</h2>
          <p>
            Site performansını ve kullanım deneyimini geliştirmek için temel
            analiz araçları ve zorunlu çerezler kullanılabilir.
          </p>
        </article>

        <article className="legal-card">
          <h2>Üçüncü taraf bağlantıları</h2>
          <p>
            İşletme sayfalarında Google Maps, WhatsApp, Instagram veya işletmeye
            ait web sitesi gibi üçüncü taraf bağlantılar bulunabilir. Bu
            hizmetlerin kendi gizlilik politikaları geçerlidir.
          </p>
        </article>

        <Link href="/" className="cta-link">Ana sayfaya dön →</Link>
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

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--cream);
    color: var(--text);
    font-family: Arial, Helvetica, sans-serif;
  }

  .legal-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at top right, rgba(243,111,50,.13), transparent 28%),
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

  .legal-brand span { color: var(--accent); }

  .legal-content {
    padding: 85px 0 110px;
  }

  .legal-eyebrow {
    color: var(--accent);
    font-size: 10px;
    font-weight: 950;
    letter-spacing: 2px;
  }

  h1 {
    margin: 14px 0 20px;
    font-size: clamp(48px, 8vw, 78px);
    line-height: .95;
    letter-spacing: -4px;
  }

  .lead {
    max-width: 720px;
    margin: 0 0 42px;
    color: var(--muted);
    font-size: 17px;
    line-height: 1.8;
  }

  .legal-card {
    margin-top: 18px;
    padding: 30px;
    border: 1px solid rgba(36,28,23,.11);
    border-radius: 22px;
    background: white;
    box-shadow: 0 18px 55px rgba(48,30,19,.07);
  }

  .legal-card h2 {
    margin: 0 0 12px;
    font-size: 24px;
    letter-spacing: -1px;
  }

  .legal-card p, .legal-card li {
    color: var(--muted);
    font-size: 14px;
    line-height: 1.8;
  }

  .legal-card ul {
    margin: 0;
    padding-left: 20px;
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

  .cta-link:hover { background: var(--accent-dark); }

  .form-grid {
    display: grid;
    gap: 16px;
  }

  .form-grid label {
    display: grid;
    gap: 8px;
    font-size: 11px;
    font-weight: 900;
  }

  .form-grid input,
  .form-grid textarea {
    width: 100%;
    padding: 14px 15px;
    border: 1px solid rgba(36,28,23,.14);
    border-radius: 14px;
    background: #fffdfa;
    color: var(--text);
    font: inherit;
    outline: none;
  }

  .form-grid textarea {
    min-height: 150px;
    resize: vertical;
  }

  .form-grid input:focus,
  .form-grid textarea:focus {
    border-color: var(--accent);
  }

  .form-note {
    margin-top: 14px;
    color: var(--muted);
    font-size: 12px;
  }
`}</style>

    </main>
  );
}
