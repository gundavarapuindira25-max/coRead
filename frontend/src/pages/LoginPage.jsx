import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/");
  }, [user, loading]);

  return (
    <div style={{
      fontFamily: "'Georgia', 'Times New Roman', serif",
      background: "#0e0c0a",
      minHeight: "100vh",
      color: "#e8e0d5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ fontSize: 64, marginBottom: "1rem" }}>📖</div>
        <h1 style={{
          fontSize: "2.5rem",
          fontStyle: "italic",
          color: "#f0e6d3",
          margin: "0 0 8px",
          letterSpacing: "0.05em",
        }}>CoRead</h1>
        <p style={{ color: "#6b5e4e", fontSize: "1rem", marginBottom: "2.5rem", lineHeight: 1.6 }}>
          Read together. Think together.<br />
          A collaborative book club platform.
        </p>

        {/* Features */}
        <div style={{ marginBottom: "2.5rem", display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            ["📚", "Join clubs around books you love"],
            ["💬", "Discuss chapters as a group"],
            ["✨", "Share and like highlights"],
            ["📈", "Track your reading progress"],
          ].map(([icon, text]) => (
            <div key={text} style={{
              display: "flex", alignItems: "center", gap: "12px",
              background: "#13100d", padding: "10px 16px",
              borderRadius: "8px", border: "1px solid #2a2420",
              fontSize: "0.85rem", color: "#a89880",
            }}>
              <span style={{ fontSize: "1.1rem" }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>

        <a
          href={`${API_URL}/api/auth/google`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            background: "#f0e6d3",
            color: "#0e0c0a",
            padding: "14px 28px",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "0.95rem",
            textDecoration: "none",
            letterSpacing: "0.03em",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.target.style.opacity = "1")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </a>

        <p style={{ marginTop: "1.5rem", fontSize: "0.7rem", color: "#4a3f32" }}>
          Free forever · No credit card required
        </p>
      </div>
    </div>
  );
}
