import { useContext, useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import { AuthContext } from "../context/AuthContext";
import { Menu, Search, Bell } from "lucide-react";

export default function Layout({ children, title }) {
  const { user } = useContext(AuthContext);
  const initial = user?.full_name?.[0]?.toUpperCase() || "S";
  const name    = user?.full_name?.split(" ")[0] || "Student";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchVal,   setSearchVal]   = useState("");

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-base)" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="sidebar-overlay d-lg-none"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar show={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className="layout-main"
        style={{ marginLeft: "240px", flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        {/* ── HEADER ── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 40,
          height: "60px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 clamp(16px, 3vw, 32px)",
          background: "rgba(6, 6, 17, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(124, 58, 237, 0.1)",
          flexShrink: 0,
        }}>
          {/* Left: hamburger + title */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="d-lg-none"
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "rgba(124, 58, 237, 0.08)",
                border: "1px solid rgba(124, 58, 237, 0.2)",
                borderRadius: "9px",
                color: "var(--text-1)",
                cursor: "pointer", padding: "7px", display: "flex", alignItems: "center",
              }}
            >
              <Menu size={20} />
            </motion.button>
            <div>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.01em" }}>
                {title}
              </h2>
            </div>
          </div>

          {/* Right: search + notifications + user */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Search */}
            <div style={{ position: "relative" }} className="d-none d-md-flex">
              <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="Search…"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                style={{
                  background: "rgba(12, 12, 30, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "10px",
                  padding: "7px 12px 7px 34px",
                  color: "var(--text-1)",
                  fontSize: "13px",
                  width: "180px",
                  outline: "none",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  transition: "border-color 0.2s, box-shadow 0.2s, width 0.3s",
                }}
                onFocus={e => {
                  e.target.style.borderColor = "rgba(124, 58, 237, 0.4)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(124, 58, 237, 0.1)";
                  e.target.style.width = "220px";
                }}
                onBlur={e => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.07)";
                  e.target.style.boxShadow = "none";
                  e.target.style.width = "180px";
                }}
              />
            </div>

            {/* Divider */}
            <div style={{ width: "1px", height: "22px", background: "var(--border-subtle)" }} className="d-none d-md-block" />

            {/* User chip */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "5px 12px 5px 5px",
                borderRadius: "10px",
                border: "1px solid rgba(124, 58, 237, 0.15)",
                background: "rgba(124, 58, 237, 0.06)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.3)"; e.currentTarget.style.background = "rgba(124, 58, 237, 0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.15)"; e.currentTarget.style.background = "rgba(124, 58, 237, 0.06)"; }}
            >
              <div style={{
                width: "28px", height: "28px", borderRadius: "8px",
                background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: 800, color: "#fff", flexShrink: 0,
                boxShadow: "0 2px 8px rgba(124, 58, 237, 0.4)",
              }}>
                {initial}
              </div>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-1)", fontFamily: "Plus Jakarta Sans, sans-serif" }} className="d-none d-sm-block">
                {name}
              </span>
            </motion.div>
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
