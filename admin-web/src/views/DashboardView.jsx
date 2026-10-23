import React from "react";

export default function DashboardView({
  orders,
  dealers,
  services,
  products,
  onNavigate,
  onUpdateOrderStatus
}) {
  // Calculations
  const confirmedOrders = orders.filter(o => o.status === "confirmed" || o.status === "delivered" || o.status === "dispatched");
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  
  const retailOrders = orders.filter(o => o.type === "retail");
  const bulkOrders = orders.filter(o => o.type === "bulk");
  
  const pendingDealers = dealers.filter(d => d.dealerStatus === "pending");
  const pendingServices = services.filter(s => s.status === "pending" || s.status === "in-progress");
  const lowStockItems = products.filter(p => Number(p.stock) < 10);

  const recentOrders = orders.slice(0, 6);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Command Center</h1>
          <p className="page-subtitle">Real-time telemetry, order fulfillment & dealer pipeline</p>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Revenue</span>
            <div className="stat-icon-wrap" style={{ color: "var(--accent)" }}>💰</div>
          </div>
          <div className="stat-value">Rs. {totalRevenue.toLocaleString("en-IN")}</div>
          <div className="stat-hint">{confirmedOrders.length} confirmed transactions</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Orders</span>
            <div className="stat-icon-wrap" style={{ color: "#a855f7" }}>📦</div>
          </div>
          <div className="stat-value">{orders.length}</div>
          <div className="stat-hint">{retailOrders.length} retail • {bulkOrders.length} bulk wholesale</div>
        </div>

        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("dealers")}>
          <div className="stat-header">
            <span className="stat-label">Pending Dealers</span>
            <div className="stat-icon-wrap" style={{ color: "var(--warning)" }}>⏳</div>
          </div>
          <div className="stat-value" style={{ color: pendingDealers.length > 0 ? "var(--warning)" : "var(--text-main)" }}>
            {pendingDealers.length}
          </div>
          <div className="stat-hint">
            {pendingDealers.length > 0 ? "⚠️ Requires approval" : "All applications reviewed"}
          </div>
        </div>

        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("services")}>
          <div className="stat-header">
            <span className="stat-label">Open Service Tickets</span>
            <div className="stat-icon-wrap" style={{ color: "var(--info)" }}>🔧</div>
          </div>
          <div className="stat-value">{pendingServices.length}</div>
          <div className="stat-hint">Maintenance & technician visits</div>
        </div>

        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("inventory")}>
          <div className="stat-header">
            <span className="stat-label">Low Stock Alert</span>
            <div className="stat-icon-wrap" style={{ color: "var(--danger)" }}>⚠️</div>
          </div>
          <div className="stat-value" style={{ color: lowStockItems.length > 0 ? "var(--danger)" : "var(--success)" }}>
            {lowStockItems.length}
          </div>
          <div className="stat-hint">Items below 10 units</div>
        </div>
      </div>

      {/* Recent Orders Preview */}
      <div className="glass-card">
        <div className="card-title-bar">
          <h2 className="card-heading">Recent Orders & Dispatches</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("orders")}>
            View All Orders ({orders.length}) →
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Type</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                    No orders recorded yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <strong style={{ color: "var(--text-main)" }}>#{order.id.slice(-6).toUpperCase()}</strong>
                      <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("en-IN") : "Recent"}
                      </div>
                    </td>
                    <td>
                      <span className={`chip ${order.type === "bulk" ? "bulk" : "retail"}`}>
                        {order.type || "retail"}
                      </span>
                    </td>
                    <td>
                      <div style={{ maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {order.items?.map(i => `${i.name} (x${i.qty})`).join(", ") || "-"}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: "var(--accent)" }}>
                        Rs. {(Number(order.total) || 0).toLocaleString("en-IN")}
                      </strong>
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
