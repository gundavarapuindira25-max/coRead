import { useState, useRef, useEffect } from "react";
import client from "../api/client";

export default function BookSearch({ onClubCreated, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [clubName, setClubName] = useState("");
  const [step, setStep] = useState("search"); // search | name
  const [creating, setCreating] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await client.get("/api/books/search", { params: { q: query } });
        setResults(res.data);
      } catch {
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  const selectBook = (book) => {
    setSelected(book);
    setClubName(`${book.title} Club`);
    setStep("name");
  };

  const create = async () => {
    if (!selected || !clubName.trim()) return;
    setCreating(true);
    try {
      // Add book first
      const bookRes = await client.post("/api/books", {
        google_book_id: selected.google_book_id,
        title: selected.title,
        author: selected.author,
        cover_url: selected.cover_url,
        description: selected.description,
        total_chapters: 20,
      });
      // Create club
      const clubRes = await client.post("/api/clubs", {
        name: clubName.trim(),
        book_id: bookRes.data.id,
      });
      onClubCreated(clubRes.data);
    } catch {
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000aa",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, fontFamily: "'Georgia', serif",
    }}>
      <div style={{
        background: "#13100d", borderRadius: "12px",
        border: "1px solid #2a2420", padding: "1.5rem",
        width: "90%", maxWidth: 480,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#f0e6d3", fontStyle: "italic" }}>
            {step === "search" ? "Find a Book" : "Name Your Club"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b5e4e", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
        </div>

        {step === "search" && (
          <>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or author..."
              style={{
                width: "100%", background: "#1a1610",
                border: "1px solid #3a3028", borderRadius: "8px",
                padding: "10px 14px", color: "#e8e0d5",
                fontFamily: "inherit", fontSize: "0.875rem", outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "8px", maxHeight: 300, overflowY: "auto" }}>
              {searching && <div style={{ color: "#6b5e4e", fontSize: "0.8rem", textAlign: "center" }}>Searching...</div>}
              {results.map((book) => (
                <div
                  key={book.google_book_id}
                  onClick={() => selectBook(book)}
                  style={{
                    display: "flex", gap: "10px", padding: "10px",
                    borderRadius: "8px", cursor: "pointer",
                    background: "#1a1610", border: "1px solid #2a2420",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#c9a96e55"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "#2a2420"}
                >
                  {book.cover_url ? (
                    <img src={book.cover_url} alt="" style={{ width: 40, height: 56, objectFit: "cover", borderRadius: 3 }} />
                  ) : (
                    <div style={{ width: 40, height: 56, background: "#2a2420", borderRadius: 3, flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#f0e6d3" }}>{book.title}</div>
                    <div style={{ fontSize: "0.72rem", color: "#7a6b58" }}>{book.author}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === "name" && (
          <>
            <div style={{ display: "flex", gap: "10px", marginBottom: "1rem", padding: "10px", background: "#1a1610", borderRadius: "8px", border: "1px solid #2a2420" }}>
              {selected?.cover_url ? (
                <img src={selected.cover_url} alt="" style={{ width: 40, height: 56, objectFit: "cover", borderRadius: 3 }} />
              ) : (
                <div style={{ width: 40, height: 56, background: "#2a2420", borderRadius: 3, flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#f0e6d3" }}>{selected?.title}</div>
                <div style={{ fontSize: "0.72rem", color: "#7a6b58" }}>{selected?.author}</div>
              </div>
            </div>
            <label style={{ fontSize: "0.75rem", color: "#6b5e4e", display: "block", marginBottom: "6px" }}>Club Name</label>
            <input
              autoFocus
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              style={{
                width: "100%", background: "#1a1610",
                border: "1px solid #3a3028", borderRadius: "8px",
                padding: "10px 14px", color: "#e8e0d5",
                fontFamily: "inherit", fontSize: "0.875rem", outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: "8px", marginTop: "1rem" }}>
              <button onClick={() => setStep("search")} style={{
                flex: 1, background: "none", border: "1px solid #3a3028",
                color: "#a89880", borderRadius: "8px", padding: "10px",
                cursor: "pointer", fontFamily: "inherit",
              }}>Back</button>
              <button onClick={create} disabled={creating || !clubName.trim()} style={{
                flex: 2, background: "#c9a96e", border: "none",
                borderRadius: "8px", padding: "10px",
                cursor: "pointer", color: "#0e0c0a",
                fontWeight: "bold", fontFamily: "inherit",
                opacity: creating ? 0.6 : 1,
              }}>
                {creating ? "Creating..." : "Create Club"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
