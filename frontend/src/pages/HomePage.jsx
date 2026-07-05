import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import Sidebar from "../components/Sidebar";
import Discussion from "../components/Discussion";
import Highlights from "../components/Highlights";
import ProgressTab from "../components/ProgressTab";
import BookSearch from "../components/BookSearch";
import Avatar from "../components/Avatar";

const ACCENT_COLORS = ["#c9a96e", "#7eb8d4", "#a8d4a8", "#d4a8c8", "#d4c8a8"];

function enrichClub(club, index) {
  return { ...club, accent: ACCENT_COLORS[index % ACCENT_COLORS.length] };
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [activeClubId, setActiveClubId] = useState(null);
  const [activeTab, setActiveTab] = useState("discussion");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get("/api/clubs")
      .then((r) => {
        const enriched = r.data.map(enrichClub);
        setClubs(enriched);
        if (enriched.length > 0) setActiveClubId(enriched[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleClubCreated = (club) => {
    const enriched = enrichClub(club, clubs.length);
    setClubs((prev) => [enriched, ...prev]);
    setActiveClubId(enriched.id);
    setShowCreate(false);
  };

  const handleLeave = async (clubId) => {
    try {
      await client.delete(`/api/clubs/${clubId}/leave`);
      setClubs((prev) => prev.filter((c) => c.id !== clubId));
      if (activeClubId === clubId) setActiveClubId(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Could not leave club.");
    }
  };

  const handleDelete = async (clubId) => {
    try {
      await client.delete(`/api/clubs/${clubId}`);
      setClubs((prev) => prev.filter((c) => c.id !== clubId));
      if (activeClubId === clubId) setActiveClubId(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Could not delete club.");
    }
  };

  const activeClub = clubs.find((c) => c.id === activeClubId);

  return (
    <div style={{
      fontFamily: "'Georgia', 'Times New Roman', serif",
      background: "#0e0c0a", minHeight: "100vh",
      color: "#e8e0d5", display: "flex", flexDirection: "column",
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
          <span style={{ fontSize: "22px" }}>📖</span>
          <span style={{
            fontSize: "1.3rem", fontWeight: "bold",
            letterSpacing: "0.05em", color: "#f0e6d3", fontStyle: "italic",
          }}>CoRead</span>
          <span style={{
            fontSize: "0.65rem", background: "#3a2e20", color: "#c9a96e",
            padding: "2px 8px", borderRadius: "20px",
            letterSpacing: "0.1em", textTransform: "uppercase", fontStyle: "normal",
          }}>beta</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "0.8rem", color: "#7a6b58" }}>{user?.name}</span>
          <Avatar name={user?.name} avatarUrl={user?.avatar_url} size={34} />
          <button
            onClick={logout}
            style={{
              background: "none", border: "1px solid #3a3028",
              color: "#6b5e4e", padding: "5px 12px",
              borderRadius: "6px", cursor: "pointer",
              fontSize: "0.75rem", fontFamily: "inherit",
            }}
          >Sign out</button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 60px)" }}>
        <Sidebar
          clubs={clubs}
          activeId={activeClubId}
          currentUserId={user?.id}
          onSelect={(id) => { setActiveClubId(id); setActiveTab("discussion"); }}
          onCreateClick={() => setShowCreate(true)}
          onLeave={handleLeave}
          onDelete={handleDelete}
        />

        {/* Main content */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {loading && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#4a3f32" }}>
              Loading your clubs...
            </div>
          )}

          {!loading && !activeClub && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
              <div style={{ fontSize: "3rem" }}>📚</div>
              <p style={{ color: "#6b5e4e", fontSize: "1rem" }}>Join or create a book club to get started.</p>
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  background: "#c9a96e", border: "none", borderRadius: "8px",
                  padding: "10px 24px", cursor: "pointer", color: "#0e0c0a",
                  fontWeight: "bold", fontFamily: "inherit",
                }}
              >Create a Club</button>
            </div>
          )}

          {activeClub && (
            <>
              {/* Book hero */}
              <div style={{
                padding: "1.5rem 2rem",
                background: "linear-gradient(180deg, #1a1410 0%, #0e0c0a 100%)",
                borderBottom: "1px solid #2a2420",
              }}>
                <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                  <div style={{
                    width: 64, height: 88, borderRadius: "4px",
                    background: "linear-gradient(135deg, #57534e, #1c1917)",
                    border: `2px solid ${activeClub.accent}66`,
                    flexShrink: 0, overflow: "hidden",
                    boxShadow: `0 8px 24px ${activeClub.accent}22`,
                  }}>
                    {activeClub.book?.cover_url && (
                      <img src={activeClub.book.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <h1 style={{ margin: 0, fontSize: "1.3rem", color: "#f0e6d3", fontStyle: "italic" }}>
                        {activeClub.book?.title}
                      </h1>
                      <span style={{ fontSize: "0.7rem", color: "#7a6b58" }}>by {activeClub.book?.author}</span>
                    </div>
                    <div style={{ display: "flex", gap: "16px", marginBottom: "10px" }}>
                      <span style={{ fontSize: "0.75rem", color: activeClub.accent }}>📖 {activeClub.name}</span>
                      <span style={{ fontSize: "0.75rem", color: "#6b5e4e" }}>👥 {activeClub.member_count} members</span>
                      {activeClub.next_session && (
                        <span style={{ fontSize: "0.75rem", color: "#6b5e4e" }}>
                          🗓 Next: {new Date(activeClub.next_session).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{
                display: "flex", borderBottom: "1px solid #2a2420",
                background: "#0b0908", padding: "0 2rem",
              }}>
                {["discussion", "highlights", "progress"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: "none", border: "none",
                      padding: "14px 20px", cursor: "pointer",
                      fontSize: "0.8rem", letterSpacing: "0.08em",
                      textTransform: "capitalize",
                      color: activeTab === tab ? activeClub.accent : "#6b5e4e",
                      borderBottom: activeTab === tab ? `2px solid ${activeClub.accent}` : "2px solid transparent",
                      fontFamily: "inherit", transition: "color 0.2s",
                    }}
                  >{tab}</button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {activeTab === "discussion" && <Discussion club={activeClub} />}
                {activeTab === "highlights" && <Highlights club={activeClub} />}
                {activeTab === "progress" && <ProgressTab club={activeClub} />}
              </div>
            </>
          )}
        </main>
      </div>

      {showCreate && (
        <BookSearch
          onClubCreated={handleClubCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
