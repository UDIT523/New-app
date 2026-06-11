/** Formatting helpers used across pages. */

export function formatDate(value) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function todayISO() {
  return new Date().toISOString().split("T")[0];
}

/** ISO "2026-01-01" → display "01 Jan 2026" (legacy sheet/date-column format). */
export function formatDisplayDate(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Display "01 Jan 2026" → ISO "2026-01-01". Returns null when unparseable. */
export function parseDisplayDate(str) {
  if (!str) return null;
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatNumber(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString();
}

/** An item is low on stock when its latest quantity is strictly below reorder. */
export function isLowStock(qty, reorderLevel) {
  if (qty === null || qty === undefined) return false;
  return Number(qty) < Number(reorderLevel);
}

export function roleLabel(role) {
  switch (role) {
    case "admin":
      return "Administrator";
    case "manager":
      return "Manager";
    case "technician":
      return "Technician";
    default:
      return role || "—";
  }
}

export function initialsOf(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}
