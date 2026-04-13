import { useState, useEffect } from "react";

const PASSWORD = "admin123";
const SESSION_KEY = "adminAuth";

export function AdminPasswordGate({ children }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      setAuthed(true);
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  function handleLock() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setInput("");
    setError(null);
  }

  if (authed) {
    return (
      <div>
        {/* Lock bar — sits above the admin content */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "0.6rem 1.5rem",
          borderBottom: "1px solid #f1f5f9",
          background: "#fff",
        }}>
          <button
            onClick={handleLock}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.4rem 1rem",
              border: "1px solid #e5e7eb",
              borderRadius: "0.375rem",
              background: "#fff",
              fontSize: "0.85rem", fontWeight: 600,
              color: "#374151", cursor: "pointer",
            }}
          >
            🔒 Lock
          </button>
        </div>
        {children}
      </div>
    );
  }

  function handleSubmit() {
    if (input === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setAuthed(true);
    } else {
      setError("Incorrect password. Please try again.");
    }
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", padding: "2rem",
    }}>
      <div style={{
        width: "100%", maxWidth: 360, padding: "2rem",
        border: "1px solid #e5e7eb", borderRadius: "0.75rem",
        background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
      }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
          🔒 Admin Access
        </h2>
        <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
          Enter the admin password to continue.
        </p>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.4rem", color: "#374151" }}>
            Password
          </label>
          <input
            type="password"
            placeholder="Enter password"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
            style={{
              width: "100%", padding: "0.5rem 0.75rem",
              border: "1px solid #d1d5db", borderRadius: "0.375rem",
              fontSize: "0.95rem", outline: "none", boxSizing: "border-box",
            }}
          />
          {error && (
            <p style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: "0.4rem" }}>{error}</p>
          )}
        </div>
        <button
          onClick={handleSubmit}
          style={{
            width: "100%", padding: "0.6rem",
            background: "#0284c7", color: "#fff",
            border: "none", borderRadius: "0.375rem",
            fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
          }}
        >
          Unlock
        </button>
      </div>
    </div>
  );
}