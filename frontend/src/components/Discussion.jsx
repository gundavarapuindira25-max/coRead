import { useRef, useEffect, useState } from "react";
import { usePolling } from "../hooks/usePolling";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import Avatar from "./Avatar";

export default function Discussion({ club }) {
  const { user } = useAuth();
  const { messages, addOptimistic } = usePolling(club?.id);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");

    // Optimistic update
    addOptimistic({
      id: `optimistic-${Date.now()}`,
      content,
      user_id: user.id,
      user_name: user.name,
      user_avatar: user.avatar_url,
      created_at: new Date().toISOString(),
    });

    try {
      await client.post(`/api/clubs/${club.id}/messages`, { content });
    } catch {
      // message will eventually appear on next poll
    } finally {
      setSending(false);
    }
  };

  const accent = club?.accent || "#c9a96e";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "1.5rem 2rem",
        display: "flex", flexDirection: "column", gap: "1rem",
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#4a3f32", fontSize: "0.85rem", marginTop: "3rem" }}>
            No messages yet. Start the discussion!
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.user_id === user?.id;
          return (
            <div key={msg.id} style={{
              display: "flex", gap: "10px",
              flexDirection: isMe ? "row-reverse" : "row",
            }}>
              <Avatar name={msg.user_name} avatarUrl={msg.user_avatar} size={32} />
              <div style={{ maxWidth: "70%" }}>
                <div style={{
                  display: "flex", gap: "8px", alignItems: "baseline",
                  marginBottom: "4px",
                  flexDirection: isMe ? "row-reverse" : "row",
                }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: isMe ? accent : "#c9b89a" }}>
                    {isMe ? "You" : msg.user_name}
                  </span>
                  <span style={{ fontSize: "0.65rem", color: "#4a3f32" }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div style={{
                  padding: "10px 14px",
                  background: isMe ? `${accent}18` : "#1a1610",
                  borderRadius: isMe ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                  border: isMe ? `1px solid ${accent}33` : "1px solid #2a2420",
                  fontSize: "0.85rem", lineHeight: 1.6, color: "#d4c8b8",
                }}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "1rem 2rem",
        borderTop: "1px solid #2a2420",
        display: "flex", gap: "10px",
        background: "#0b0908",
      }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Share your thoughts..."
          style={{
            flex: 1, background: "#1a1610",
            border: "1px solid #3a3028", borderRadius: "8px",
            padding: "10px 16px", color: "#e8e0d5",
            fontFamily: "'Georgia', serif", fontSize: "0.875rem", outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={sending}
          style={{
            background: accent, border: "none", borderRadius: "8px",
            padding: "10px 18px", cursor: "pointer",
            color: "#0e0c0a", fontWeight: "bold", fontSize: "0.8rem",
            fontFamily: "'Georgia', serif", opacity: sending ? 0.6 : 1,
          }}
        >Send</button>
      </div>
    </div>
  );
}
