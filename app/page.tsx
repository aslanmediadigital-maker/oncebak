export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        background: "#ffffff",
      }}
    >
      <h1
        style={{
          fontSize: "56px",
          fontWeight: "700",
          marginBottom: "20px",
        }}
      >
        ÖnceBak
      </h1>

      <p
        style={{
          fontSize: "22px",
          color: "#666",
        }}
      >
        Gitmeden önce bak.
      </p>
    </main>
  );
}
