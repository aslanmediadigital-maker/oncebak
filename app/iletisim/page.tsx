"use client";

import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

const PHONE_DISPLAY = "0551 067 79 05";
const PHONE_URL = "tel:+905510677905";
const WHATSAPP_URL = "https://wa.me/905510677905";
const EMAIL = "oncebakiletisim@gmail.com";
const EMAIL_URL = "mailto:oncebakiletisim@gmail.com";

export default function IletisimPage() {
  return (
    <main className="ob-contact-page">
      <SiteHeader variant="solid" activePage="contact" />

      <section className="ob-contact-main">
        <div className="ob-contact-shell">
          <div className="ob-contact-intro">
            <span>BİZE ULAŞIN</span>
            <h1>ÖnceBak ile iletişime geçin</h1>
            <p>
              Sorularınız, önerileriniz ve işletme iş birlikleri için doğrudan
              bizimle iletişime geçebilirsiniz.
            </p>
          </div>

          <div className="ob-contact-grid">
            <article className="ob-contact-card">
              <div className="ob-contact-card__heading">
                <span>TELEFON &amp; WHATSAPP</span>
                <h2>Doğrudan bize ulaşın</h2>
              </div>

              <a
                href={PHONE_URL}
                className="ob-contact-card__value"
                aria-label={`ÖnceBak telefon numarasını ara: ${PHONE_DISPLAY}`}
              >
                {PHONE_DISPLAY}
              </a>

              <p>
                Telefonla arayabilir veya WhatsApp üzerinden mesaj
                gönderebilirsiniz.
              </p>

              <div className="ob-contact-card__actions">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="ob-contact-button ob-contact-button--primary"
                  aria-label="ÖnceBak'a WhatsApp üzerinden mesaj gönder"
                >
                  WhatsApp&apos;tan Yaz
                </a>
                <a
                  href={PHONE_URL}
                  className="ob-contact-button ob-contact-button--secondary"
                  aria-label={`ÖnceBak'ı ara: ${PHONE_DISPLAY}`}
                >
                  Ara
                </a>
              </div>
            </article>

            <article className="ob-contact-card">
              <div className="ob-contact-card__heading">
                <span>E-POSTA</span>
                <h2>Bize e-posta gönderin</h2>
              </div>

              <a
                href={EMAIL_URL}
                className="ob-contact-card__value ob-contact-card__value--email"
                aria-label={`ÖnceBak'a e-posta gönder: ${EMAIL}`}
              >
                {EMAIL}
              </a>

              <p>
                Sorularınız ve iş birliği talepleriniz için e-posta üzerinden
                iletişime geçebilirsiniz.
              </p>

              <div className="ob-contact-card__actions">
                <a
                  href={EMAIL_URL}
                  className="ob-contact-button ob-contact-button--secondary"
                  aria-label={`ÖnceBak'a e-posta gönder: ${EMAIL}`}
                >
                  E-posta Gönder
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <SiteFooter activePage="contact" />

      <style jsx>{`
        .ob-contact-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f7f3ee;
          color: #181310;
        }

        .ob-contact-shell {
          width: min(1120px, calc(100% - 36px));
          margin: 0 auto;
        }

        .ob-contact-main {
          flex: 1;
          padding: 100px 0 112px;
        }

        .ob-contact-intro {
          max-width: 760px;
          margin-bottom: 46px;
        }

        .ob-contact-intro > span,
        .ob-contact-card__heading > span {
          color: #d6531b;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 1.9px;
        }

        .ob-contact-intro h1 {
          margin: 18px 0 20px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(44px, 6vw, 70px);
          font-weight: 500;
          letter-spacing: -2.8px;
          line-height: 1;
        }

        .ob-contact-intro p {
          max-width: 690px;
          margin: 0;
          color: #6f625b;
          font-size: 17px;
          line-height: 1.7;
        }

        .ob-contact-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .ob-contact-card {
          min-width: 0;
          display: flex;
          align-items: flex-start;
          flex-direction: column;
          padding: 34px;
          border: 1px solid #e5d9cf;
          border-radius: 22px;
          background: #fff;
          box-shadow: 0 14px 38px rgba(46, 30, 20, 0.055);
        }

        .ob-contact-card__heading h2 {
          margin: 12px 0 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 29px;
          font-weight: 500;
          letter-spacing: -0.8px;
        }

        .ob-contact-card__value {
          max-width: 100%;
          margin-top: 34px;
          color: #181310;
          font-size: clamp(25px, 3.2vw, 36px);
          font-weight: 900;
          letter-spacing: -1px;
          overflow-wrap: anywhere;
          text-decoration: none;
        }

        .ob-contact-card__value--email {
          font-size: clamp(18px, 2.1vw, 27px);
          letter-spacing: -0.5px;
        }

        .ob-contact-card > p {
          max-width: 470px;
          margin: 14px 0 0;
          color: #746a63;
          font-size: 13px;
          line-height: 1.7;
        }

        .ob-contact-card__actions {
          width: 100%;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: auto;
          padding-top: 34px;
        }

        .ob-contact-button {
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 19px;
          border: 1px solid #ddd0c5;
          border-radius: 13px;
          font-size: 12px;
          font-weight: 900;
          text-decoration: none;
          transition:
            background 180ms ease,
            border-color 180ms ease,
            color 180ms ease;
        }

        .ob-contact-button--primary {
          border-color: #f36f32;
          background: #f36f32;
          color: #fff;
        }

        .ob-contact-button--primary:hover {
          border-color: #d6531b;
          background: #d6531b;
        }

        .ob-contact-button--secondary {
          background: #fff;
          color: #181310;
        }

        .ob-contact-button--secondary:hover {
          border-color: #cbbbae;
          background: #f7f3ee;
        }

        .ob-contact-page a:focus-visible {
          outline: 3px solid rgba(243, 111, 50, 0.45);
          outline-offset: 4px;
        }

        @media (max-width: 760px) {
          .ob-contact-main {
            padding: 72px 0 82px;
          }

          .ob-contact-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .ob-contact-shell {
            width: min(100% - 24px, 1120px);
          }

          .ob-contact-main {
            padding-top: 58px;
          }

          .ob-contact-intro {
            margin-bottom: 32px;
          }

          .ob-contact-intro h1 {
            font-size: 44px;
            letter-spacing: -2px;
          }

          .ob-contact-intro p {
            font-size: 15px;
          }

          .ob-contact-card {
            padding: 25px 21px;
            border-radius: 19px;
          }

          .ob-contact-card__actions {
            display: grid;
          }

        }
      `}</style>
    </main>
  );
}
