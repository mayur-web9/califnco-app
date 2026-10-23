import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export default function DealersView({ dealers, onRefresh }) {
  const [filter, setFilter] = useState("pending"); // "pending" | "approved" | "all"
  const [loadingUid, setLoadingUid] = useState(null);
  const [msg, setMsg] = useState("");

  const filtered = dealers.filter(d => {
    if (filter === "all") return true;
    return d.dealerStatus === filter;
  });

  async function handleSetStatus(uid, newStatus) {
    setLoadingUid(uid);
    setMsg("");
    try {
      await updateDoc(doc(db, "users", uid), {
        dealerStatus: newStatus
      });
      setMsg(`Dealer status updated to: ${newStatus}`);
      setTimeout(() => setMsg(""), 3000);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Failed to update dealer status: " + err.message);
    } finally {
      setLoadingUid(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dealer Applications & Pipeline</h1>
          <p className="page-subtitle">Review business credentials & grant B2B wholesale access</p>
        </div>
        <div className="header-actions">
          <button
            className={`btn ${filter === "pending" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter("pending")}
          >
            Pending Review ({dealers.filter(d => d.dealerStatus === "pending").length})
          </button>
          <button
            className={`btn ${filter === "approved" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter("approved")}
          >
            Approved ({dealers.filter(d => d.dealerStatus === "approved").length})
          </button>
          <button
            className={`btn ${filter === "all" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter("all")}
          >
            All Dealers ({dealers.length})
          </button>
        </div>
      </div>

      {msg && (
        <div style={{
          background: "var(--success-bg)",
          border: "1px solid rgba(16, 185, 129, 0.4)",
          color: "var(--success)",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "16px",
          fontSize: "13px",
          fontWeight: "600"
        }}>
          ✓ {msg}
        </div>
      )}

      <div className="glass-card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Dealer / Business</th>
                <th>Contact Details</th>
                <th>Location</th>
                <th>Status</th>
                <th>Review Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                    No dealers found matching "{filter}" filter.
                  </td>
                </tr>
              ) : (
                filtered.map(dealer => (
                  <tr key={dealer.uid}>
                    <td>
                      <div style={{ fontWeight: "700", color: "#fff", fontSize: "15px" }}>
                        {dealer.name || "Unnamed Dealer"}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--accent)" }}>
                        UID: {dealer.uid.slice(0, 10)}...
                      </div>
                    </td>
                    <td>
                      <div>{dealer.email}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {dealer.phone || "No phone provided"}
                      </div>
                    </td>
                    <td>
                      <div>{dealer.address?.city ? `${dealer.address.city}, ${dealer.address.state || ""}` : "Location pending"}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                        PIN: {dealer.address?.pincode || "-"}
                      </div>
                    </td>
                    <td>
                      <span className={`chip ${dealer.dealerStatus || "pending"}`}>
                        {dealer.dealerStatus || "pending"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {dealer.dealerStatus !== "approved" && (
                          <button
                            className="btn btn-success btn-sm"
                            disabled={loadingUid === dealer.uid}
                            onClick={() => handleSetStatus(dealer.uid, "approved")}
                          >
                            ✓ Approve
                          </button>
                        )}
                        {dealer.dealerStatus !== "rejected" && (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={loadingUid === dealer.uid}
                            onClick={() => handleSetStatus(dealer.uid, "rejected")}
                          >
                            ✕ Reject
                          </button>
                        )}
                        {dealer.dealerStatus === "approved" && (
                          <button
                            className="btn btn-secondary btn-sm"
                            disabled={loadingUid === dealer.uid}
                            onClick={() => handleSetStatus(dealer.uid, "pending")}
                          >
                            Hold (Pending)
                          </button>
                        )}
                      </div>
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
