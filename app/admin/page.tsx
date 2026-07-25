export default function AdminPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "20px",
        background: "#f5f5f5",
        color: "#111",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "32px",
          background: "#fff",
          borderRadius: "16px",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginTop: 0 }}>ÖnceBak Yönetim Paneli</h1>

        <p style={{ lineHeight: 1.6 }}>
          Yönetim paneli güvenli giriş sistemi hazırlanırken geçici olarak
          kullanıma kapalıdır.
        </p>

        <a
          href="/"
          style={{
            display: "inline-block",
            marginTop: "16px",
            padding: "13px 22px",
            background: "#111",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "10px",
            fontWeight: 700,
          }}
        >
          Ana Sayfaya Dön
        </a>
      </div>
    </main>
  );
}
