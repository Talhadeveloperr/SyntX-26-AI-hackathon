import { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { 
  Home, 
  MessageSquare, 
  HelpCircle, 
  Layers, 
  Calendar, 
  GraduationCap, 
  User, 
  Sparkles, 
  X, 
  LogOut 
} from "lucide-react";

const NAV = [
  { to: "/dashboard",      icon: Home,           label: "Home"           },
  { to: "/smart-chat",     icon: MessageSquare,  label: "Smart Chat"     },
  { to: "/quiz-generator", icon: HelpCircle,     label: "Quiz Generator" },
  { to: "/flashcards",     icon: Layers,         label: "Flashcards"     },
  { to: "/study-planner",  icon: Calendar,       label: "Study Planner"  },
  { to: "/past-papers",    icon: GraduationCap,  label: "Past Papers"    },
  { to: "/profile",        icon: User,           label: "Profile"        },
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

      {/* Logo */}
      <div style={{ padding: "18px 16px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <Sparkles size={18} style={{ color: "#c0c1ff" }} />
          <span style={{ fontSize: "15px", fontWeight: 700, color: "#d4e4fa", letterSpacing: "-0.01em" }}>Study AI</span>
        </div>
        <button
          className="d-lg-none"
          onClick={onClose}
          style={{ background: "none", border: "none", color: "rgba(199,196,215,0.5)", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "0 14px 8px" }} />

      {/* User chip */}
      <div style={{ margin: "0 10px 10px", padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg,#c0c1ff,#ffb0cd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "#051424", flexShrink: 0 }}>
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#d4e4fa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fullName}</p>
          <p style={{ margin: 0, fontSize: "10px", color: "rgba(199,196,215,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 8px", display: "flex", flexDirection: "column", gap: "2px" }}>
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 12px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: active ? 600 : 400,
                color: active ? "#d4e4fa" : "rgba(199,196,215,0.55)",
                background: active ? "rgba(192,193,255,0.1)" : "transparent",
                border: "1px solid",
                borderColor: active ? "rgba(192,193,255,0.18)" : "transparent",
              }}
            >
              <Icon
                size={18}
                style={{
                  color: active ? "#c0c1ff" : "rgba(199,196,215,0.4)",
                }}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "10px 8px 16px", flexShrink: 0 }}>
        <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "0 4px 10px" }} />
        <button
          onClick={handleLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "10px",
            padding: "9px 12px", borderRadius: "8px",
            background: "transparent", border: "1px solid transparent",
            color: "rgba(255,180,171,0.6)", fontSize: "13px", fontWeight: 500,
            cursor: "pointer", textAlign: "left",
          }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
