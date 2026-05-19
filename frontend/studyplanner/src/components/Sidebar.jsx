import { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import {
  Home, MessageSquare, HelpCircle, Layers,
  Calendar, GraduationCap, User, Brain, X, LogOut
} from "lucide-react";

const NAV = [
  { to: "/dashboard",      icon: Home,          label: "Home",          color: "#7c3aed" },
  { to: "/smart-chat",     icon: MessageSquare, label: "Smart Chat",    color: "#22d3ee" },
  { to: "/quiz-generator", icon: HelpCircle,    label: "Quiz Generator",color: "#f59e0b" },
  { to: "/flashcards",     icon: Layers,        label: "Flashcards",    color: "#e879f9" },
  { to: "/study-planner",  icon: Calendar,      label: "Study Planner", color: "#34d399" },
  { to: "/past-papers",    icon: GraduationCap, label: "Past Papers",   color: "#fb923c" },
  { to: "/profile",        icon: User,          label: "Profile",       color: "#a78bfa" },
];

export default function Sidebar({ show, onClose }) {
  const { pathname } = useLocation();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const initial  = user?.full_name?.[0]?.toUpperCase() || "S";
  const fullName = user?.full_name || "Student";
  const email    = user?.email || "";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className={`sidebar-container ${show ? "show" : ""}`}>

      {/* ── LOGO ── */}
      <div style={{ padding: "20px 16px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <motion.div
            whileHover={{ scale: 1.1 }}
            style={{
              width: "34px", height: "34px", borderRadius: "10px",
              background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(124, 58, 237, 0.45)",
              flexShrink: 0,
            }}
          >
            <Brain size={17} color="#fff" strokeWidth={2} />
          </motion.div>
          <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em", fontFamily: "Space Grotesk, sans-serif" }}>
            Brain<span style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Sync</span>
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          className="d-lg-none"
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)",
            borderRadius: "8px", color: "var(--text-2)", cursor: "pointer",
            padding: "5px", display: "flex", alignItems: "center",
          }}
        >
          <X size={18} />
        </motion.button>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent)", margin: "0 14px 12px" }} />

      {/* ── USER CHIP ── */}
      <motion.div
        whileHover={{ background: "rgba(124, 58, 237, 0.1)", borderColor: "rgba(124, 58, 237, 0.25)" }}
        style={{
          margin: "0 10px 14px",
          padding: "10px 12px",
          borderRadius: "12px",
          background: "rgba(124, 58, 237, 0.06)",
          border: "1px solid rgba(124, 58, 237, 0.12)",
          display: "flex", alignItems: "center", gap: "10px",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onClick={() => navigate("/profile")}
      >
        <div style={{
          width: "34px", height: "34px", borderRadius: "9px",
          background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "13px", fontWeight: 800, color: "#fff", flexShrink: 0,
          boxShadow: "0 3px 10px rgba(124, 58, 237, 0.4)",
        }}>
          {initial}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            {fullName}
          </p>
          <p style={{ margin: 0, fontSize: "10px", color: "var(--text-4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {email}
          </p>
        </div>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399", flexShrink: 0, boxShadow: "0 0 6px rgba(52, 211, 153, 0.6)" }} />
      </motion.div>

      {/* ── NAVIGATION ── */}
      <nav style={{ flex: 1, padding: "0 8px", display: "flex", flexDirection: "column", gap: "3px" }}>
        {NAV.map(({ to, icon: Icon, label, color }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              style={{ textDecoration: "none" }}
            >
              <motion.div
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: active ? 700 : 500,
                  color: active ? "var(--text-1)" : "var(--text-2)",
                  background: active
                    ? `linear-gradient(135deg, ${color}18, ${color}08)`
                    : "transparent",
                  border: "1px solid",
                  borderColor: active ? `${color}30` : "transparent",
                  transition: "background 0.2s, border-color 0.2s, color 0.2s",
                  position: "relative",
                  overflow: "hidden",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = `${color}0a`;
                    e.currentTarget.style.color = "var(--text-1)";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-2)";
                  }
                }}
              >
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeBar"
                    style={{
                      position: "absolute", left: 0, top: "20%", bottom: "20%",
                      width: "3px", borderRadius: "0 3px 3px 0",
                      background: `linear-gradient(180deg, ${color}, ${color}80)`,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <div style={{
                  width: "30px", height: "30px", borderRadius: "8px",
                  background: active ? `${color}20` : "rgba(255,255,255,0.04)",
                  border: active ? `1px solid ${color}30` : "1px solid transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 0.2s",
                }}>
                  <Icon size={15} color={active ? color : "var(--text-3)"} strokeWidth={active ? 2.2 : 1.8} />
                </div>
                {label}

                {active && (
                  <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* ── LOGOUT ── */}
      <div style={{ padding: "10px 8px 20px", flexShrink: 0 }}>
        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.2), transparent)", margin: "0 4px 12px" }} />
        <motion.button
          whileHover={{ x: 3, background: "rgba(248, 113, 113, 0.08)", borderColor: "rgba(248, 113, 113, 0.2)" }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "10px",
            padding: "9px 12px", borderRadius: "10px",
            background: "transparent",
            border: "1px solid transparent",
            color: "rgba(248, 113, 113, 0.6)",
            fontSize: "13px", fontWeight: 600,
            cursor: "pointer", textAlign: "left",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            transition: "all 0.2s",
          }}
        >
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(248, 113, 113, 0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <LogOut size={15} color="rgba(248, 113, 113, 0.6)" />
          </div>
          Sign Out
        </motion.button>
      </div>
    </aside>
  );
}
