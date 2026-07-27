export default function AdminPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "40px",
          borderRadius: "16px",
          width: "500px",
          boxShadow: "0 10px 30px rgba(0,0,0,.1)",
        }}
      >
        <h1>ÖnceBak Yönetim Paneli</h1>

        <p>
          Buradan yeni işletmeler ekleyebilecek, düzenleyebilecek ve
          silebileceksin.
        </p>

        <hr />

        <h3>🚀 Yakında</h3>

        <ul>
          <li>✅ İşletme Ekle</li>
          <li>✅ Fotoğraf Yükle</li>
          <li>✅ Menü Ekle</li>
          <li>✅ Fiyat Güncelle</li>
          <li>✅ İşletme Düzenle</li>
        </ul>
      </div>
    </main>
  );
}