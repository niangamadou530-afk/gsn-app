"use client";

export default function GlobalError() {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "sans-serif", background: "#f8fafc", color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px" }}>
        <div style={{ maxWidth: "400px", width: "100%", background: "#fff", padding: "30px", borderRadius: "16px", border: "1px solid #e2e8f0", textAlign: "center" }}>
          <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 10px" }}>Une interruption est survenue</h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px" }}>L&apos;application a rencontré un incident passager.</p>
          <button
            type="button"
            onClick={() => { if (typeof window !== "undefined") window.location.reload(); }}
            style={{ width: "100%", padding: "12px", background: "#005bbf", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}
          >
            Recharger
          </button>
        </div>
      </body>
    </html>
  );
}
