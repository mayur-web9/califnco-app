import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export default function ServicesView({ services, onRefresh }) {
  const [filter, setFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [techNotes, setTechNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const filtered = services.filter(s => {
    if (filter === "all") return true;
    return s.status === filter;
  });

  async function handleUpdateStatus(id, newStatus) {
    try {
      await updateDoc(doc(db, "services", id), {
        status: newStatus
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Failed to update ticket: " + err.message);
    }
  }

  async function handleSaveNotes() {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, "services", selectedTicket.id), {
        notes: techNotes
      });
      setSelectedTicket(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Failed to save notes: " + err.message);
    } finally {
      setUpdating(false);
    }
  }

  function openNotesModal(ticket) {
    setSelectedTicket(ticket);
    setTechNotes(ticket.notes || "");
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Service Tickets & Technician Dispatch</h1>
          <p className="page-subtitle">Schedule technician visits, maintenance requests & warranty inspections</p>
        </div>
        <div className="header-actions">
          {["all", "pending", "in-progress", "resolved"].map(st => (
            <button
              key={st}
              className={`btn btn-sm ${filter === st ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter(st)}
            >
              {st.toUpperCase()} ({st === "all" ? services.length : services.filter(s => s.status === st).length})
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Customer Info</th>
                <th>Service Address</th>
                <th>Reported Issue</th>
                <th>Technician Notes</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                    No service bookings match filter "{filter}".
                  </td>
                </tr>
              ) : (
                filtered.map(ticket => (
                  <tr key={ticket.id}>
                    <td>
                      <strong style={{ color: "#fff" }}>#{ticket.id.slice(-6).toUpperCase()}</strong>
                      <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                        {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString("en-IN") : "Recent"}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: "700", color: "var(--text-main)" }}>
                        {ticket.userName || "Customer"}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--accent)" }}>
                        📞 {ticket.phone || "No phone"}
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: "200px", fontSize: "13px", color: "var(--text-muted)" }}>
                        {ticket.address || "-"}
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: "260px", fontSize: "13px", lineHeight: "1.4" }}>
                        {ticket.issue}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "12px", color: ticket.notes ? "var(--text-main)" : "var(--text-dim)", maxWidth: "160px" }}>
                        {ticket.notes || "None assigned"}
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: "6px", fontSize: "11px", padding: "3px 8px" }}
                        onClick={() => openNotesModal(ticket)}
                      >
                        ✏️ {ticket.notes ? "Edit Note" : "Assign Note"}
                      </button>
                    </td>
                    <td>
                      <span className={`chip ${ticket.status || "pending"}`}>
                        {ticket.status || "pending"}
                      </span>
                    </td>
                    <td>
                      <select
                        className="select-input"
                        value={ticket.status || "pending"}
                        onChange={e => handleUpdateStatus(ticket.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technician Notes Modal */}
      {selectedTicket && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Technician Notes: #{selectedTicket.id.slice(-6).toUpperCase()}</h3>
              <button className="modal-close" onClick={() => setSelectedTicket(null)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Issue Summary</label>
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "var(--text-muted)", marginBottom: "14px" }}>
                {selectedTicket.issue}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Technician Assignment & Inspection Notes</label>
              <textarea
                className="form-input"
                style={{ height: "100px", resize: "vertical" }}
                value={techNotes}
                onChange={e => setTechNotes(e.target.value)}
                placeholder="e.g. Assigned to Rajesh Kumar (Tech #4). Scheduled for tomorrow 10:00 AM. Requires 75 GPD membrane replacement."
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedTicket(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSaveNotes} disabled={updating}>
                {updating ? "Saving..." : "Save Technician Notes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
