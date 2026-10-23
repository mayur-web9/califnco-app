import React, { useState } from "react";

export default function OrdersView({ orders, onUpdateOrderStatus }) {
  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "retail" | "bulk"
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filtered = orders.filter(o => {
    if (typeFilter !== "all" && o.type !== typeFilter) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const idMatch = o.id.toLowerCase().includes(q);
      const userMatch = (o.userId || "").toLowerCase().includes(q);
      const payMatch = (o.paymentId || "").toLowerCase().includes(q);
      const itemMatch = (o.items || []).some(i => (i.name || "").toLowerCase().includes(q));
      return idMatch || userMatch || payMatch || itemMatch;
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fulfillment & Order Operations</h1>
          <p className="page-subtitle">Manage customer retail checkouts & dealer bulk wholesale dispatches</p>
        </div>
        <div className="header-actions">
          <input
            type="text"
            className="search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search orders, items, pay ID..."
          />
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {["all", "retail", "bulk"].map(t => (
            <button
              key={t}
              className={`btn btn-sm ${typeFilter === t ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setTypeFilter(t)}
            >
              {t.toUpperCase()} ({t === "all" ? orders.length : orders.filter(o => o.type === t).length})
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>STATUS:</span>
          <select
            className="select-input"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="glass-card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order / Date</th>
                <th>Type</th>
                <th>Customer / Dealer</th>
                <th>Purchased Items</th>
                <th>Total</th>
                <th>Payment / Tracking</th>
                <th>Status</th>
                <th>Fulfill Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(order => (
                  <tr key={order.id}>
                    <td>
                      <div style={{ fontWeight: "800", color: "#fff" }}>
                        #{order.id.slice(-6).toUpperCase()}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "Recent"}
                      </div>
                    </td>
                    <td>
                      <span className={`chip ${order.type === "bulk" ? "bulk" : "retail"}`}>
                        {order.type || "retail"}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: "13px", fontWeight: "600" }}>
                        UID: {order.userId?.slice(0, 8)}...
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {order.address?.city ? `${order.address.city} (${order.address.pincode || ""})` : "Standard"}
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: "240px" }}>
                        {order.items?.map((it, idx) => (
                          <div key={idx} style={{ fontSize: "12px", color: "var(--text-main)", marginBottom: "2px" }}>
                            • {it.name} <strong style={{ color: "var(--accent)" }}>x{it.qty}</strong>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: "var(--accent)", fontSize: "15px" }}>
                        Rs. {(Number(order.total) || 0).toLocaleString("en-IN")}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--text-muted)" }}>
                        {order.paymentId ? order.paymentId.slice(0, 16) + "..." : "Invoice B2B"}
                      </div>
                      {order.razorpayOrderId && (
                        <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                          RZP: {order.razorpayOrderId.slice(-8)}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`chip ${order.status || "pending"}`}>
                        {order.status || "pending"}
                      </span>
                    </td>
                    <td>
                      <select
                        className="select-input"
                        value={order.status || "pending"}
                        onChange={e => onUpdateOrderStatus(order.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
