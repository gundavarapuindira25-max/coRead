const COLORS = [
  "#9f1239", "#1d4ed8", "#065f46", "#b45309",
  "#5b21b6", "#0e7490", "#be185d", "#15803d",
];

function colorForName(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

export default function Avatar({ name, avatarUrl, size = 32, style = {} }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", ...style }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      backgroundColor: colorForName(name),
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: "bold", color: "#fff",
      flexShrink: 0,
      ...style,
    }}>
      {initials(name)}
    </div>
  );
}
