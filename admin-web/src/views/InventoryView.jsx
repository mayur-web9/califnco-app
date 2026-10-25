import React, { useState } from "react";
import { doc, updateDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

export default function InventoryView({ products, onRefresh }) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all"); // "all" | "low" | "out"
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // New product form state
  const [form, setForm] = useState({
    id: "",
    name: "",
    category: "Purifier",
    price: "",
    wholesalePrice: "",
    minQty: "5",
    stock: "25",
    description: "",
    imageUrl: ""
  });

  const categories = ["all", "Purifier", "Dispenser", "Pump", "Filter", "Spare", "Accessory"];

  async function handleDeleteProduct(prod) {
    if (!prod || !prod.id) return;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${prod.name}" (${prod.id}) from the catalog?\n\nThis will remove it from both retail and wholesale stores.`
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      await deleteDoc(doc(db, "products", prod.id));
      try {
        await deleteDoc(doc(db, "wholesale", prod.id));
      } catch (err) {
        // Wholesale document may not exist for custom items
      }
      setSelectedProduct(null);
      setIsAdding(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Failed to delete product: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  const filtered = products.filter(p => {
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (stockFilter === "low" && (Number(p.stock) >= 10 || Number(p.stock) <= 0)) return false;
    if (stockFilter === "out" && Number(p.stock) > 0) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const nameMatch = (p.name || "").toLowerCase().includes(q);
      const idMatch = (p.id || "").toLowerCase().includes(q);
      const catMatch = (p.category || "").toLowerCase().includes(q);
      return nameMatch || idMatch || catMatch;
    }
    return true;
  });

  async function handleQuickStockChange(prod, delta) {
    const newStock = Math.max(0, (Number(prod.stock) || 0) + delta);
    try {
      await updateDoc(doc(db, "products", prod.id), {
        stock: newStock
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Failed to update stock: " + err.message);
    }
  }

  function openEditModal(prod) {
    setSelectedProduct(prod);
    setForm({
      id: prod.id,
      name: prod.name || "",
      category: prod.category || "Purifier",
      price: prod.price || "",
      wholesalePrice: prod.wholesalePrice || Math.round(prod.price * 0.7) || "",
      minQty: prod.minQty || "5",
      stock: prod.stock ?? "0",
      description: prod.description || "",
      imageUrl: prod.imageUrl || ""
    });
    setIsAdding(false);
  }

  function openAddModal() {
    const generatedId = `prod_custom_${Date.now().toString().slice(-6)}`;
    setSelectedProduct(null);
    setForm({
      id: generatedId,
      name: "",
      category: "Purifier",
      price: "",
      wholesalePrice: "",
      minQty: "5",
      stock: "20",
      description: "",
      imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80"
    });
    setIsAdding(true);
  }

  async function handleSaveProduct(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      alert("Please provide product name and price.");
      return;
    }

    setSaving(true);
    try {
      const priceNum = Number(form.price);
      const stockNum = Number(form.stock) || 0;
      const wholesaleNum = form.wholesalePrice ? Number(form.wholesalePrice) : Math.round(priceNum * 0.7);
      const minQtyNum = Number(form.minQty) || 5;

      const productPayload = {
        id: form.id,
        name: form.name.trim(),
        category: form.category,
        price: priceNum,
        stock: stockNum,
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim() || "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80",
        rating: selectedProduct ? (selectedProduct.rating || 4.8) : 5.0,
        reviewCount: selectedProduct ? (selectedProduct.reviewCount || 10) : 1,
        updatedAt: serverTimestamp()
      };

      if (isAdding) {
        productPayload.createdAt = serverTimestamp();
      }

      // Write to products/{id}
      await setDoc(doc(db, "products", form.id), productPayload, { merge: true });

      // Write / sync to wholesale/{id}
      await setDoc(doc(db, "wholesale", form.id), {
        productId: form.id,
        productName: form.name.trim(),
        category: form.category,
        price: wholesaleNum,
        minQty: minQtyNum,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setSelectedProduct(null);
      setIsAdding(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Failed to save product: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Catalog & Inventory Management</h1>
          <p className="page-subtitle">Track warehouse stock, update retail MSRP & configure wholesale pricing</p>
        </div>
        <div className="header-actions">
          <input
            type="text"
            className="search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products by name or SKU..."
          />
          <button className="btn btn-primary" onClick={openAddModal}>
            + Add New Product
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`btn btn-sm ${categoryFilter === cat ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
          <button
            className={`btn btn-sm ${stockFilter === "all" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setStockFilter("all")}
          >
            All Stock ({products.length})
          </button>
          <button
            className={`btn btn-sm ${stockFilter === "low" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setStockFilter("low")}
            style={stockFilter === "low" ? { background: "var(--warning)", color: "#000" } : {}}
          >
            ⚠️ Low Stock ({products.filter(p => Number(p.stock) > 0 && Number(p.stock) < 10).length})
          </button>
          <button
            className={`btn btn-sm ${stockFilter === "out" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setStockFilter("out")}
            style={stockFilter === "out" ? { background: "var(--danger)", color: "#fff" } : {}}
          >
            🚫 Out of Stock ({products.filter(p => Number(p.stock) <= 0).length})
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-card" style={{ padding: 0 }}>
        <div className="table-container">
          <table style={{ tableLayout: "fixed", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ width: "68px" }}>Item</th>
                <th style={{ width: "32%" }}>Product Details</th>
                <th style={{ width: "12%" }}>Category</th>
                <th style={{ width: "16%" }}>Retail Price</th>
                <th style={{ width: "17%" }}>Stock Level</th>
                <th style={{ width: "12%" }}>Status</th>
                <th style={{ width: "110px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filtered.map(prod => {
                  const stockNum = Number(prod.stock) || 0;
                  const isLow = stockNum > 0 && stockNum < 10;
                  const isOut = stockNum <= 0;

                  return (
                    <tr key={prod.id}>
                      <td>
                        <img
                          src={prod.imageUrl || "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=100"}
                          alt={prod.name}
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "8px",
                            objectFit: "cover",
                            border: "1px solid var(--border-color)",
                            background: "rgba(255,255,255,0.05)"
                          }}
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=100";
                          }}
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: "700", color: "#fff", marginBottom: "2px" }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "monospace" }}>
                          SKU: {prod.id}
                        </div>
                      </td>
                      <td>
                        <span className="chip" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}>
                          {prod.category || "Purifier"}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: "700", color: "var(--accent)" }}>
                          Rs. {Number(prod.price || 0).toLocaleString("en-IN")}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                          Rating: ⭐ {prod.rating || 4.8} ({prod.reviewCount || 0})
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "2px 8px", fontSize: "14px", lineHeight: "1" }}
                            onClick={() => handleQuickStockChange(prod, -1)}
                            title="Decrement 1"
                          >
                            -
                          </button>
                          <span style={{
                            fontWeight: "800",
                            fontSize: "14px",
                            minWidth: "32px",
                            textAlign: "center",
                            color: isOut ? "var(--danger)" : isLow ? "var(--warning)" : "var(--text-main)"
                          }}>
                            {stockNum}
                          </span>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "2px 8px", fontSize: "14px", lineHeight: "1" }}
                            onClick={() => handleQuickStockChange(prod, 1)}
                            title="Increment 1"
                          >
                            +
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "2px 6px", fontSize: "10px", color: "var(--accent)" }}
                            onClick={() => handleQuickStockChange(prod, 10)}
                            title="Add 10 units"
                          >
                            +10
                          </button>
                        </div>
                      </td>
                      <td>
                        {isOut ? (
                          <span className="chip cancelled">Out of Stock</span>
                        ) : isLow ? (
                          <span className="chip pending">Low Stock ({stockNum})</span>
                        ) : (
                          <span className="chip confirmed">In Stock</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditModal(prod)}
                            title="Edit Product"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: "var(--danger)", borderColor: "rgba(239, 68, 68, 0.3)" }}
                            onClick={() => handleDeleteProduct(prod)}
                            title="Delete Product"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {(selectedProduct || isAdding) && (
        <div className="modal-backdrop" onClick={() => { setSelectedProduct(null); setIsAdding(false); }}>
          <div className="modal-content" style={{ maxWidth: "560px" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {isAdding ? "✨ Add New Catalog Product" : `✏️ Edit Product: ${form.name}`}
              </h2>
              <button
                className="modal-close"
                onClick={() => { setSelectedProduct(null); setIsAdding(false); }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Califnco Titan 10-Stage RO Purifier"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Product SKU / ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.id}
                    onChange={e => setForm({ ...form, id: e.target.value })}
                    disabled={!isAdding}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Purifier">Purifier</option>
                    <option value="Filter">Filter</option>
                    <option value="Spare">Spare</option>
                    <option value="Accessory">Accessory</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Retail Price (MSRP Rs.)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="14999"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Wholesale Price (Rs.)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.wholesalePrice}
                    onChange={e => setForm({ ...form, wholesalePrice: e.target.value })}
                    placeholder="9800"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Units In Stock</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    placeholder="30"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Min Bulk Qty (Dealers)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.minQty}
                    onChange={e => setForm({ ...form, minQty: e.target.value })}
                    placeholder="5"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="form-label">Image URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={form.imageUrl}
                    onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="form-label">Description & Key Specifications</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Purification capacity, stages, filter life..."
                    style={{ resize: "vertical" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
                {!isAdding && selectedProduct ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ color: "var(--danger)", borderColor: "rgba(239, 68, 68, 0.4)" }}
                    onClick={() => handleDeleteProduct(selectedProduct)}
                    disabled={saving}
                  >
                    🗑️ Delete Product
                  </button>
                ) : <div />}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setSelectedProduct(null); setIsAdding(false); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? "Saving Changes..." : isAdding ? "Publish to Catalog" : "Update Product"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
