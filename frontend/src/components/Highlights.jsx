import { useState, useEffect } from "react";
import client from "../api/client";
import Avatar from "./Avatar";

export default function Highlights({ club }) {
  const [highlights, setHighlights] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [page, setPage] = useState("");
  const [saving, setSaving] = useState(false);

  const accent = club?.accent || "#c9a96e";

  useEffect(() => {
    if (!club?.id) return;
    client.get(`/api/clubs/${club.id}/highlights`)
      .then((r) => setHighlights(r.data))
      .catch(() => {});
  }, [club?.id]);

  const submit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const res = await client.post(`/api/clubs/${club.id}/highlights`, {
        text: text.trim(),
        page_number: page ? parseInt(page) : null,
      });
      setHighlights((prev) => [res.data, ...prev]);
      setText("");
      setPage("");
      setShowForm(false);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const toggleLike = async (h) => {
    try {
      const res = await client.post(`/api/highlights/${h.id}/like`);
      setHighlights((prev) =>
        prev.map((item) =>
          item.id === h.id
            ? {
                ...item,
                liked_by_me: res.data.liked,
                likes_count: res.data.liked ? item.likes_count + 1 : item.likes_count - 1,
              }
            : item
        )
      );
    } catch {}
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.75rem", color: "#6b5e4e", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {highlights.length} highlights from the club
        </span>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            background: "none", border: `1px solid ${accent}66`,
            color: accent, padding: "5px 12px", borderRadius: "6px",
            cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit",
          }}
        >
          {showForm ? "Cancel" : "+ Add Highlight"}
        </button>
      </div>

      {showForm && (
        <div style={{ padding: "1rem", background: "#13100d", borderRadius: "8px", border: `1px solid ${accent}33` }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the passage you want to highlight..."
            rows={3}
            style={{
              width: "100%", background: "#1a1610",
              border: "1px solid #3a3028", borderRadius: "6px",
              padding: "10px", color: "#e8e0d5",
              fontFamily: "'Georgia', serif", fontSize: "0.875rem",
              outline: "none", resize: "vertical", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <input
              value={page}
              onChange={(e) => setPage(e.target.value)}
              placeholder="Page #"
              type="number"
              style={{
                width: 90, background: "#1a1610",
                border: "1px solid #3a3028", borderRadius: "6px",
                padding: "8px", color: "#e8e0d5",
                fontFamily: "inherit", fontSize: "0.875rem", outline: "none",
              }}
            />
            <button
              onClick={submit}
              disabled={saving}
              style={{
                background: accent, border: "none", borderRadius: "6px",
                padding: "8px 16px", cursor: "pointer",
                color: "#0e0c0a", fontWeight: "bold", fontSize: "0.8rem",
                fontFamily: "inherit",
              }}
            >Save</button>
          </div>
        </div>
      )}

      {highlights.map((h) => (
        <div key={h.id} style={{
          padding: "1.25rem 1.5rem",
          background: "#13100d", borderRadius: "8px",
          border: "1px solid #2a2420",
          borderLeft: `3px solid ${accent}`,
        }}>
          <p style={{
            margin: "0 0 12px 0",
            fontSize: "0.95rem", fontStyle: "italic",
            lineHeight: 1.7, color: "#d4c8b8",
          }}>"{h.text}"</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Avatar name={h.user_name} avatarUrl={h.user_avatar} size={24} />
              <span style={{ fontSize: "0.72rem", color: "#7a6b58" }}>{h.user_name}</span>
              {h.page_number && (
                <span style={{ fontSize: "0.65rem", color: "#4a3f32" }}>p. {h.page_number}</span>
              )}
            </div>
            <button
              onClick={() => toggleLike(h)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: h.liked_by_me ? accent : "#6b5e4e",
                fontSize: "0.75rem", fontFamily: "inherit",
                display: "flex", gap: "4px", alignItems: "center",
              }}
            >
              ♥ <span>{h.likes_count}</span>
            </button>
          </div>
        </div>
      ))}

      {highlights.length === 0 && !showForm && (
        <div style={{ textAlign: "center", color: "#4a3f32", fontSize: "0.85rem", marginTop: "2rem" }}>
          No highlights yet. Be the first to add one!
        </div>
      )}
    </div>
  );
}
