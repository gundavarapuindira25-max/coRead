import { Link } from "react-router-dom";

const COVER_GRADIENTS = [
  "linear-gradient(135deg, #57534e, #1c1917)",
  "linear-gradient(135deg, #1e3a5f, #0f172a)",
  "linear-gradient(135deg, #3b1f3b, #0f0a0f)",
  "linear-gradient(135deg, #1a3a2a, #0a1a10)",
  "linear-gradient(135deg, #3a2a1a, #1a0a00)",
];

function coverGradient(index) {
  return COVER_GRADIENTS[index % COVER_GRADIENTS.length];
}

export default function Sidebar({ clubs, activeId, onSelect, onCreateClick }) {
  return (
    <aside style={{
      width: "260px", flexShrink: 0,
      borderRight: "1px solid #2a2420",
      padding: "1.5rem 1rem",
      overflowY: "auto", background: "#0b0908",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "#6b5e4e", marginBottom: "1rem" }}>
        My Clubs
      </div>

      {clubs.length === 0 && (
        <div style={{ fontSize: "0.8rem", color: "#4a3f32", marginBottom: "1rem" }}>
          You haven't joined any clubs yet.
        </div>
      )}

      {clubs.map((club, i) => (
        <div
          key={club.id}
          onClick={() => onSelect(club.id)}
          style={{
            padding: "12px", borderRadius: "8px", cursor: "pointer",
            marginBottom: "8px",
            background: activeId === club.id ? "#1e1812" : "transparent",
            border: activeId === club.id ? "1px solid #c9a96e33" : "1px solid transparent",
            transition: "all 0.2s",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{
              width: 38, height: 52, borderRadius: "3px",
              background: club.book?.cover_url ? undefined : coverGradient(i),
              flexShrink: 0,
              border: "2px solid #c9a96e44",
              overflow: "hidden",
            }}>
              {club.book?.cover_url && (
                <img src={club.book.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#f0e6d3", lineHeight: 1.3, marginBottom: "2px" }}>
                {club.book?.title}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#7a6b58", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {club.name}
              </div>
              <div style={{ fontSize: "0.65rem", color: "#6b5e4e" }}>
                {club.member_count} members
              </div>
            </div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={onCreateClick}
          style={{
            width: "100%", padding: "10px", borderRadius: "8px",
            background: "#1e1812", border: "1px dashed #3a3028",
            color: "#c9a96e", cursor: "pointer", fontSize: "0.8rem",
            fontFamily: "'Georgia', serif",
          }}
        >
          + Create a Club
        </button>
      </div>

      <div style={{ marginTop: "8px" }}>
        <Link
          to="/browse"
          style={{
            display: "block", width: "100%", padding: "8px",
            borderRadius: "8px", textAlign: "center",
            color: "#6b5e4e", fontSize: "0.75rem", textDecoration: "none",
          }}
        >
          Browse clubs →
        </Link>
      </div>
    </aside>
  );
}
