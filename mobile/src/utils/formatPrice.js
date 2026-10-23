export function formatPrice(amount) {
  return "Rs. " + Number(amount).toLocaleString("en-IN");
}

export function formatDate(timestamp) {
  if (!timestamp) return "-";
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function statusColor(status) {
  const map = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
    shipped: "#8b5cf6",
    delivered: "#10b981",
    cancelled: "#ef4444",
    assigned: "#3b82f6",
    "in-progress": "#8b5cf6",
    resolved: "#10b981",
    approved: "#10b981",
    rejected: "#ef4444",
  };
  return map[status] || "#64748b";
}
