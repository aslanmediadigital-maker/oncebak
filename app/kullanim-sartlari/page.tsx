import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Şartları",
  description:
    "ÖnceBak kullanım şartlarını inceleyin. Platformu kullanırken geçerli olan kurallar ve koşullar.",
  alternates: {
    canonical: "/kullanim-sartlari",
  },
};

export default function KullanimSartlariPage() {
  return (
    <main
      style={{
        background: "#f7f3ee",
        minHeight: "100vh",
        padding: "140px 20px 80px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "28px",
          padding: "48px",
          boxShadow: "0 20px 60px rgba(0,0,0,.06)",
        }}
      >
        <span
          style={{
            display: "inline-block",
            padding: "8px 14px",
            borderRadius: "999px",
            background: "#fff2e8",
            color: "#f36f32",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "1px",
          }}
        >
          KURUMSAL
        </span>

        <h1
          style={{
            margin: "20px 0",
            fontSize: "52px",
            lineHeight: 1,
          }}
        >
          Kullanım Şartları
        </h1>

        <p
          style={{
            color: "#5d5550",
            lineHeight: 1.9,
            fontSize: "18px",
          }}
        >
          ÖnceBak platformunu kullanarak aşağıdaki kullanım şartlarını kabul etmiş
          sayılırsınız.
        </p>

        <section>
          <h2>1. Hizmetin Amacı</h2>
          <p>
            ÖnceBak, Kapadokya bölgesindeki işletmeler hakkında bilgi sunan bir
            keşif platformudur. Platformdaki bilgiler mümkün olduğunca güncel
            tutulmaya çalışılır.
          </p>
        </section>

        <section>
          <h2>2. Bilgilerin Doğruluğu</h2>
          <p>
            Menüler, fiyatlar, çalışma saatleri ve diğer bilgiler zamanla
            değişebilir. Gitmeden önce işletme ile iletişime geçmeniz tavsiye
            edilir.
          </p>
        </section>

        <section>
          <h2>3. Sorumluluk</h2>
          <p>
            ÖnceBak, işletmeler tarafından sonradan değiştirilen fiyatlar,
            kampanyalar veya hizmetlerden sorumlu değildir.
          </p>
        </section>

        <section>
          <h2>4. Telif Hakları</h2>
          <p>
            ÖnceBak içerisindeki logo, tasarım ve içerikler izinsiz
            kopyalanamaz veya ticari amaçla kullanılamaz.
          </p>
        </section>

        <section>
          <h2>5. Güncellemeler</h2>
          <p>
            Kullanım şartları gerektiğinde güncellenebilir. Güncel sürüm her
            zaman bu sayfada yayınlanır.
          </p>
        </section>

        <p
          style={{
            marginTop: "50px",
            color: "#999",
            fontSize: "14px",
          }}
        >
          Son güncelleme: Temmuz 2026
        </p>
      </div>
    </main>
  );
}
