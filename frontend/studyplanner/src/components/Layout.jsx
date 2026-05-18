//136.243.35.104:8501/api/chat/message net::ERR_FAILEDimport 
import { useContext, useState } from "react";
import Sidebar from "./Sidebar";
import { AuthContext } from "../context/AuthContext";
import { Menu } from "lucide-react";

export default function Layout({ children, title }) {
  const { user } = useContext(AuthContext);
  const initial = user?.full_name?.[0]?.toUpperCase() || "S";
  const name    = user?.full_name?.split(" ")[0] || "Student";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#051424" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay d-lg-none" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar show={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className="layout-main"
        style={{ marginLeft: "256px", flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        {/* Header */}
        <header style={{
          position: "sticky", top: 0, zIndex: 40,
          height: "56px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px",
          backgroundColor: "#051424",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Mobile hamburger */}
            <button
              className="d-lg-none"
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none", border: "none", color: "#d4e4fa",
                cursor: "pointer", padding: "4px", display: "flex", alignItems: "center",
              }}
            >
              <Menu size={22} />
            </button>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#d4e4fa" }}>
              {title}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="text"
              placeholder="Search…"
              style={{
                background: "rgba(1,15,31,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "6px 12px",
                color: "#d4e4fa",
                fontSize: "13px",
                width: "160px",
                outline: "none",
              }}
            />
            <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)" }} />
            <div style={{
              display: "flex", alignItems: "center", gap: "7px",
              padding: "4px 10px 4px 4px",
              borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
            }}>
              <div style={{
                width: "26px", height: "26px", borderRadius: "6px",
                background: "linear-gradient(135deg,#c0c1ff,#ffb0cd)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: 800, color: "#051424", flexShrink: 0,
              }}>
                {initial}
              </div>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(212,228,250,0.8)" }}>
                {name}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
