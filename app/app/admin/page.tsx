export default function AdminPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#f5f5f5",
        color: "#111",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          background: "#fff",
          padding: "30px",
          borderRadius: "16px",
        }}
      >
        <h1>ÖnceBak Yönetim Paneli</h1>

        <p>Buradan işletme ekleyebileceksin.</p>

        <form
          style={{
            display: "grid",
            gap: "16px",
            marginTop: "30px",
          }}
        >
          <input
            type="text"
            placeholder="İşletme adı"
            style={inputStyle}
          />

          <textarea
            placeholder="İşletme açıklaması"
            rows={5}
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Konum"
            style={inputStyle}
          />

          <input
            type="tel"
            placeholder="Telefon"
            style={inputStyle}
          />

          <input
            type="url"
            placeholder="Web sitesi"
            style={inputStyle}
          />

          <input type="file" accept="image/*" />

          <button
            type="button"
            style={{
              padding: "15px",
              border: "none",
              borderRadius: "10px",
              background: "#111",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            İşletmeyi Kaydet
          </button>
        </form>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px",
  border: "1px solid #ddd",
  borderRadius: "10px",
  fontSize: "16px",
};
