import { useState } from "react";

const books = [
  {
    id: 1,
    title: "The Buried Giant",
    author: "Kazuo Ishiguro",
    cover: "bg-gradient-to-br from-stone-700 to-stone-900",
    accent: "#c9a96e",
    club: "Mythic Fiction Circle",
    members: 12,
    progress: 68,
    currentChapter: "Chapter 14: The Mist Deepens",
    totalChapters: 22,
    nextSession: "Mar 2, 8pm EST",
    highlights: [
      { user: "Mara K.", avatar: "MK", text: "\"She felt the mist was not merely weather, but memory itself made manifest.\"", page: 184, likes: 7 },
      { user: "James R.", avatar: "JR", text: "\"Wistan's silence spoke louder than any oath he could have sworn.\"", page: 201, likes: 4 },
      { user: "Sofia T.", avatar: "ST", text: "\"The village forgot not out of cruelty but out of mercy — or so they told themselves.\"", page: 167, likes: 9 },
    ],
    discussion: [
      { user: "Mara K.", avatar: "MK", time: "2h ago", msg: "The memory/mist metaphor is so heavy in ch. 14. Anyone else think the buried giant is literally their shared grief?" },
      { user: "James R.", avatar: "JR", time: "1h ago", msg: "Yes — I think Ishiguro is saying communities collectively choose forgetting. It's not passive." },
      { user: "Sofia T.", avatar: "ST", time: "45m ago", msg: "That reading makes Axl and Beatrice's journey so much more tragic. They're fighting against the community's survival mechanism." },
      { user: "You", avatar: "YO", time: "just now", msg: "What strikes me is Wistan — he *wants* the mist lifted, regardless of cost. He's the only honest character?", isMe: true },
    ]
  },
  {
    id: 2,
    title: "Piranesi",
    author: "Susanna Clarke",
    cover: "bg-gradient-to-br from-blue-900 to-slate-900",
    accent: "#7eb8d4",
    club: "Strange Worlds Society",
    members: 8,
    progress: 42,
    currentChapter: "Entry the Seventh",
    totalChapters: 16,
    nextSession: "Mar 5, 7pm EST",
    highlights: [
      { user: "Dev P.", avatar: "DP", text: "\"The House is valuable because it is the House. It is enough.\"", page: 95, likes: 11 },
      { user: "Nadia C.", avatar: "NC", text: "\"I am not the Beloved child of the House. I am its prisoner.\"", page: 110, likes: 8 },
    ],
    discussion: [
      { user: "Dev P.", avatar: "DP", time: "3h ago", msg: "The journal format is genius — we only know what Piranesi knows. Clarke weaponizes dramatic irony." },
      { user: "Nadia C.", avatar: "NC", time: "2h ago", msg: "Does anyone else feel like the House itself is the protagonist? Piranesi just lives inside it." },
    ]
  },
];

const avatarColors = {
  MK: "bg-rose-700", JR: "bg-blue-700", ST: "bg-emerald-700",
  YO: "bg-amber-600", DP: "bg-violet-700", NC: "bg-cyan-700",
};

export default function CoRead() {
  const [activeBook, setActiveBook] = useState(0);
  const [activeTab, setActiveTab] = useState("discussion");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(books[0].discussion);
  const [allMessages, setAllMessages] = useState({ 0: books[0].discussion, 1: books[1].discussion });

  const book = books[activeBook];

  const handleSend = () => {
    if (!message.trim()) return;
    const updated = [...(allMessages[activeBook] || []), {
      user: "You", avatar: "YO", time: "just now",
      msg: message, isMe: true
    }];
    setAllMessages(prev => ({ ...prev, [activeBook]: updated }));
    setMessage("");
  };

  const currentMessages = allMessages[activeBook] || [];

  return (
    <div style={{
      fontFamily: "'Georgia', 'Times New Roman', serif",
      background: "#0e0c0a",
      minHeight: "100vh",
      color: "#e8e0d5",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* This is the static design reference. The real app is in frontend/ */}
      <div style={{ padding: "2rem", color: "#6b5e4e", textAlign: "center" }}>
        This file is the original design mockup. Open <code>frontend/</code> for the real app.
      </div>
    </div>
  );
}
