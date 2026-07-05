import { useState, useEffect } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

export default function ProgressTab({ club }) {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [myChapters, setMyChapters] = useState(0);
  const [saving, setSaving] = useState(false);

  const accent = club?.accent || "#c9a96e";
  const total = club?.book?.total_chapters || 20;

  useEffect(() => {
    if (!club?.id) return;
    client.get(`/api/clubs/${club.id}/progress`)
      .then((r) => {
        setMembers(r.data);
        const me = r.data.find((m) => m.user_id === user?.id);
        if (me) setMyChapters(me.chapters_read);
      })
      .catch(() => {});
  }, [club?.id]);

  const updateProgress = async () => {
    setSaving(true);
    try {
      await client.put(`/api/clubs/${club.id}/progress`, { chapters_read: myChapters });
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === user?.id
            ? { ...m, chapters_read: myChapters, percentage: Math.round(myChapters / total * 100) }
            : m
        )
      );
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const chaptersLeft = total - Math.round(total * ((members.find(m => m.user_id === user?.id)?.percentage || 0) / 100));

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2rem" }}>
      {/* Stats grid */}
      <div style={{ fontSize: "0.75rem", color: "#6b5e4e", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>
        Club Progress
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Chapters", val: total, accent: false },
          { label: "Next Session", val: club?.next_session ? new Date(club.next_session).toLocaleDateString() : "TBD", accent: false },
          { label: "My Progress", val: `${members.find(m => m.user_id === user?.id)?.percentage || 0}%`, accent: true },
          { label: "Members", val: club?.member_count || 0, accent: false },
        ].map((stat) => (
          <div key={stat.label} style={{ padding: "14px", background: "#13100d", borderRadius: "8px", border: "1px solid #2a2420" }}>
            <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#6b5e4e", marginBottom: "4px" }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "0.95rem", color: stat.accent ? accent : "#d4c8b8", fontWeight: stat.accent ? "bold" : "normal" }}>
              {stat.val}
            </div>
          </div>
        ))}
      </div>

      {/* Update my progress */}
      <div style={{ padding: "1rem", background: "#13100d", borderRadius: "8px", border: `1px solid ${accent}33`, marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.75rem", color: "#6b5e4e", marginBottom: "8px" }}>Update my chapters read</div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="range"
            min={0}
            max={total}
            value={myChapters}
            onChange={(e) => setMyChapters(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: accent }}
          />
          <span style={{ fontSize: "0.85rem", color: accent, fontWeight: "bold", width: 40 }}>
            {myChapters}/{total}
          </span>
          <button
            onClick={updateProgress}
            disabled={saving}
            style={{
              background: accent, border: "none", borderRadius: "6px",
              padding: "6px 14px", cursor: "pointer",
              color: "#0e0c0a", fontWeight: "bold", fontSize: "0.75rem",
              fontFamily: "inherit",
            }}
          >Save</button>
        </div>
      </div>

      {/* Member progress list */}
      <div style={{ fontSize: "0.75rem", color: "#6b5e4e", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
        Member Progress
      </div>
      {members
        .slice()
        .sort((a, b) => b.percentage - a.percentage)
        .map((m) => (
          <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
            <Avatar name={m.name} avatarUrl={m.avatar_url} size={28} />
            <span style={{ fontSize: "0.8rem", color: m.user_id === user?.id ? accent : "#a89880", width: 80, flexShrink: 0 }}>
              {m.user_id === user?.id ? "You" : m.name.split(" ")[0]}
            </span>
            <div style={{ flex: 1, height: 4, background: "#2a2420", borderRadius: 2 }}>
              <div style={{
                width: `${m.percentage}%`, height: "100%",
                background: `linear-gradient(90deg, ${accent}66, ${accent})`,
                borderRadius: 2, transition: "width 0.4s",
              }} />
            </div>
            <span style={{ fontSize: "0.72rem", color: "#6b5e4e", width: 36, textAlign: "right" }}>{m.percentage}%</span>
          </div>
        ))}
    </div>
  );
}
