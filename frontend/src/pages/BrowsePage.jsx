import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import BookSearch from "../components/BookSearch";

const ACCENT_COLORS = ["#c9a96e", "#7eb8d4", "#a8d4a8", "#d4a8c8", "#d4c8a8"];

export default function BrowsePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState({});
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    client.get("/api/clubs/browse")
      .then((r) => setClubs(r.data.map((c, i) => ({ ...c, accent: ACCENT_COLORS[i % ACCENT_COLORS.length] }))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const join = async (clubId) => {
    setJoining((p) => ({ ...p, [clubId]: true }));
    try {
      await client.post(`/api/clubs/${clubId}/join`);
      navigate("/");
    } catch (err) {
      if (err.response?.status === 409) navigate("/"); // already a member
    } finally {
      setJoining((p) => ({ ...p, [clubId]: false }));
    }
  };

  return (
    <div style={{
      fontFamily: "'Georgia', 'Times New Roman', serif",
      background: "#0e0c0a", minHeight: "100vh",
      color: "#e8e0d5",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid #2a2420",
        padding: "0 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "60px", background: "#0e0c0a",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px", cursor: "pointer" }} onClick={() => navigate("/")}>📖</span>
          <span
            onClick={() => navigate("/")}
            style={{ fontSize: "1.3rem", fontWeight: "bold", letterSpacing: "0.05em", color: "#f0e6d3", fontStyle: "italic", cursor: "pointer" }}
          >CoRead</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate("/")}
            style={{ background: "none", border: "1px solid #3a3028", color: "#a89880", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit" }}
          >← My Clubs</button>
          <Avatar name={user?.name} avatarUrl={user?.avatar_url} size={34} />
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: "1.4rem", color: "#f0e6d3", fontStyle: "italic" }}>Discover Clubs</h2>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#6b5e4e" }}>Browse all reading clubs and join one</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: "#c9a96e", border: "none", borderRadius: "8px",
              padding: "8px 18px", cursor: "pointer", color: "#0e0c0a",
              fontWeight: "bold", fontSize: "0.85rem", fontFamily: "inherit",
            }}
          >+ Create Club</button>
        </div>

        {loading && <div style={{ color: "#4a3f32", textAlign: "center", marginTop: "3rem" }}>Loading clubs...</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {clubs.map((club) => (
            <div key={club.id} style={{
              background: "#13100d", borderRadius: "10px",
              border: "1px solid #2a2420", padding: "1.25rem",
              display: "flex", flexDirection: "column", gap: "12px",
            }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{
                  width: 50, height: 70, borderRadius: "4px", flexShrink: 0,
                  background: "linear-gradient(135deg, #57534e, #1c1917)",
                  border: `2px solid ${club.accent}44`, overflow: "hidden",
                }}>
                  {club.book?.cover_url && (
                    <img src={club.book.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: "#f0e6d3", lineHeight: 1.3, marginBottom: "2px" }}>
                    {club.book?.title}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#7a6b58", marginBottom: "6px" }}>{club.book?.author}</div>
                  <div style={{ fontSize: "0.72rem", color: club.accent }}>{club.name}</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "#6b5e4e" }}>👥 {club.member_count} members</span>
                <button
                  onClick={() => join(club.id)}
                  disabled={joining[club.id]}
                  style={{
                    background: club.accent, border: "none", borderRadius: "6px",
                    padding: "6px 14px", cursor: "pointer",
                    color: "#0e0c0a", fontWeight: "bold", fontSize: "0.75rem",
                    fontFamily: "inherit", opacity: joining[club.id] ? 0.6 : 1,
                  }}
                >
                  {joining[club.id] ? "Joining..." : "Join"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && clubs.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "4rem", color: "#4a3f32" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📚</div>
            <p>No clubs yet. Be the first to create one!</p>
          </div>
        )}
      </div>

      {showCreate && (
        <BookSearch
          onClubCreated={() => navigate("/")}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
