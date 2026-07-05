import { useState } from "react";
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

export default function Sidebar({ clubs, activeId, currentUserId, onSelect, onCreateClick, onLeave, onDelete }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [confirmId, setConfirmId] = useState(null); // club awaiting delete confirm

  const handleLeave = (e, club) => {
    e.stopPropagation();
    if (window.confirm(`Leave "${club.name}"?`)) {
      onLeave(club.id);
    }
  };

  const handleDelete = (e, club) => {
    e.stopPropagation();
    setConfirmId(club.id);
  };

  const confirmDelete = (e, club) => {
    e.stopPropagation();
    setConfirmId(null);
    onDelete(club.id);
  };

  const cancelDelete = (e) => {
    e.stopPropagation();
    setConfirmId(null);
  };

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

      {clubs.map((club, i) => {
        const isCreator = club.created_by === currentUserId;
        const isHovered = hoveredId === club.id;
        const isConfirming = confirmId === club.id;

        return (
          <div
            key={club.id}
            onClick={() => onSelect(club.id)}
            onMouseEnter={() => setHoveredId(club.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              padding: "12px", borderRadius: "8px", cursor: "pointer",
              marginBottom: "8px", position: "relative",
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
              <div style={{ minWidth: 0, flex: 1 }}>
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

            {/* Action buttons — shown on hover */}
            {isHovered && !isConfirming && (
              <div style={{
                position: "absolute", top: "8px", right: "8px",
                display: "flex", gap: "4px",
              }}
                onClick={(e) => e.stopPropagation()}
              >
                {isCreator ? (
                  <button
                    onClick={(e) => handleDelete(e, club)}
                    title="Delete club"
                    style={{
                      background: "#3a1a1a", border: "1px solid #6b2020",
                      color: "#c97070", borderRadius: "4px",
                      padding: "3px 7px", cursor: "pointer",
                      fontSize: "0.65rem", fontFamily: "inherit",
                    }}
                  >Delete</button>
                ) : (
                  <button
                    onClick={(e) => handleLeave(e, club)}
                    title="Leave club"
                    style={{
                      background: "#2a2420", border: "1px solid #4a3a28",
                      color: "#a89070", borderRadius: "4px",
                      padding: "3px 7px", cursor: "pointer",
                      fontSize: "0.65rem", fontFamily: "inherit",
                    }}
                  >Leave</button>
                )}
              </div>
            )}

            {/* Delete confirmation */}
            {isConfirming && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  marginTop: "8px", padding: "8px",
                  background: "#2a1a1a", borderRadius: "6px",
                  border: "1px solid #6b2020",
                }}
              >
                <div style={{ fontSize: "0.7rem", color: "#c97070", marginBottom: "6px" }}>
                  Delete this club and all its data?
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={(e) => confirmDelete(e, club)}
                    style={{
                      background: "#6b2020", border: "none", borderRadius: "4px",
                      padding: "4px 10px", cursor: "pointer",
                      color: "#f0d0d0", fontSize: "0.65rem", fontFamily: "inherit",
                    }}
                  >Yes, delete</button>
                  <button
                    onClick={cancelDelete}
                    style={{
                      background: "#2a2420", border: "1px solid #4a3a28", borderRadius: "4px",
                      padding: "4px 10px", cursor: "pointer",
                      color: "#a89880", fontSize: "0.65rem", fontFamily: "inherit",
                    }}
                  >Cancel</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

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
