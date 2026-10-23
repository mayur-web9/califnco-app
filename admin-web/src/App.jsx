import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { auth, db } from "./config/firebase";

// Views
import LoginView from "./views/LoginView";
import DashboardView from "./views/DashboardView";
import OrdersView from "./views/OrdersView";
import DealersView from "./views/DealersView";
import ServicesView from "./views/ServicesView";
import InventoryView from "./views/InventoryView";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Live Firestore collections
  const [orders, setOrders] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [toastMsg, setToastMsg] = useState("");

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  }

  // 1. Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data()?.role === "Admin") {
            setCurrentUser({ uid: user.uid, ...userDoc.data() });
          } else {
            await signOut(auth);
            setCurrentUser(null);
          }
        } catch (err) {
          console.error("Auth profile check failed:", err);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  // 2. Real-time Firestore Subscriptions (Active only when Admin is logged in)
  useEffect(() => {
    if (!currentUser) return;

    // A. Orders (Real-time)
    const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setOrders(list);
      },
      (err) => console.error("Orders sync error:", err)
    );

    // B. Dealers (users collection where role == 'Dealer')
    const usersQuery = query(collection(db, "users"));
    const unsubUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const dealerList = [];
        snapshot.docs.forEach(d => {
          const data = d.data();
          if (data.role === "Dealer") {
            dealerList.push({ uid: d.id, ...data });
          }
        });
        setDealers(dealerList);
      },
      (err) => console.error("Dealers sync error:", err)
    );

    // C. Services / Tickets (Real-time)
    const servicesQuery = query(collection(db, "services"), orderBy("createdAt", "desc"));
    const unsubServices = onSnapshot(
      servicesQuery,
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setServices(list);
      },
      (err) => console.error("Services sync error:", err)
    );

    // D. Products Catalog (Real-time)
    const productsQuery = query(collection(db, "products"));
    const unsubProducts = onSnapshot(
      productsQuery,
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // sort by name
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setProducts(list);
      },
      (err) => console.error("Products sync error:", err)
    );

    return () => {
      unsubOrders();
      unsubUsers();
      unsubServices();
      unsubProducts();
    };
  }, [currentUser]);

  // Order Status Updater
  async function handleUpdateOrderStatus(orderId, newStatus) {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      showToast(`Order #${orderId.slice(-6)} marked as ${newStatus}`);
    } catch (err) {
      alert("Failed to update order status: " + err.message);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    setCurrentUser(null);
  }

  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-dark)",
        color: "var(--accent)",
        fontSize: "18px",
        fontFamily: "var(--font-heading)"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px", animation: "spin 2s linear infinite" }}>💧</div>
          <div>Loading Califnco Command Center...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  // Badges
  const pendingDealersCount = dealers.filter(d => d.dealerStatus === "pending").length;
  const pendingServicesCount = services.filter(s => s.status === "pending" || s.status === "in-progress").length;
  const lowStockCount = products.filter(p => Number(p.stock) < 10).length;

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">💧</div>
          <div>
            <div className="brand-title">Califnco</div>
            <div className="brand-badge">Executive Console</div>
          </div>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <span className="nav-icon">📦</span>
            <span>Orders</span>
            {orders.length > 0 && <span className="nav-count">{orders.length}</span>}
          </button>

          <button
            className={`nav-item ${activeTab === "dealers" ? "active" : ""}`}
            onClick={() => setActiveTab("dealers")}
          >
            <span className="nav-icon">🤝</span>
            <span>Dealers</span>
            {pendingDealersCount > 0 && (
              <span className="nav-count alert">{pendingDealersCount}</span>
            )}
          </button>

          <button
            className={`nav-item ${activeTab === "services" ? "active" : ""}`}
            onClick={() => setActiveTab("services")}
          >
            <span className="nav-icon">🛠️</span>
            <span>Services</span>
            {pendingServicesCount > 0 && (
              <span className="nav-count">{pendingServicesCount}</span>
            )}
          </button>

          <button
            className={`nav-item ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            <span className="nav-icon">🏷️</span>
            <span>Inventory</span>
            {lowStockCount > 0 && (
              <span className="nav-count alert" title={`${lowStockCount} items low stock`}>{lowStockCount}</span>
            )}
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-profile">
            <div className="avatar">A</div>
            <div className="admin-info">
              <span className="admin-name">{currentUser.name || "Administrator"}</span>
              <span className="admin-role">Executive Admin</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign Out">
            🚪
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {toastMsg && (
          <div style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            background: "rgba(16, 185, 129, 0.95)",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
            fontWeight: "700",
            fontSize: "14px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span>✓</span> {toastMsg}
          </div>
        )}

        {activeTab === "dashboard" && (
          <DashboardView
            orders={orders}
            dealers={dealers}
            services={services}
            products={products}
            onNavigate={(tab) => setActiveTab(tab)}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {activeTab === "orders" && (
          <OrdersView
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {activeTab === "dealers" && (
          <DealersView
            dealers={dealers}
            onRefresh={() => {}}
          />
        )}

        {activeTab === "services" && (
          <ServicesView
            services={services}
            onRefresh={() => {}}
          />
        )}

        {activeTab === "inventory" && (
          <InventoryView
            products={products}
            onRefresh={() => {}}
          />
        )}
      </main>
    </div>
  );
}
