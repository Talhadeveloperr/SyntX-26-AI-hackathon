import { useContext } from "react";
import Layout from "../components/Layout";
import { AuthContext } from "../context/AuthContext";
import Icon from "../components/Icon";

const HEAT = [
  "full","half","quarter","empty","half","full","full","half","empty","empty",
  "quarter","quarter","full","half","full","half","quarter","full","full","half",
  "quarter","empty","half","full","half","empty","quarter","full","quarter","half",
  "full","half","quarter","quarter","full","half","full","half","quarter","full",
  "half","quarter","full","half","empty","quarter","full","quarter","half","full",
  "quarter","half","quarter","empty","full","half","full","half","quarter","full",
];
const HEAT_C = {
  full:    "#c0c1ff",
  half:    "rgba(192,193,255,0.48)",
  quarter: "rgba(192,193,255,0.18)",
  empty:   "rgba(255,255,255,0.05)",
};

const QUICK_STATS = [
  { label: "Focus Hours", value: "18.5h",   icon: "timer",                color: "#c0c1ff" },
  { label: "Day Streak",  value: "12 days",  icon: "local_fire_department", color: "#ffb783" },
  { label: "Mastery",     value: "72%",      icon: "trending_up",           color: "#81c995" },
  { label: "Due Today",   value: "4 tasks",  icon: "event_note",            color: "#ffb0cd" },
];

const SUBJECTS = [
  { name: "Organic Chemistry", pct: 45, color: "#ffb4ab" },
  { name: "Linear Algebra",    pct: 52, color: "#ffb783" },
  { name: "Molecular Biology", pct: 68, color: "#c0c1ff" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const firstName = user?.full_name?.split(" ")[0] || "Student";

  return (
    <Layout title="Dashboard">
      <div style={{ padding: "28px 32px", maxWidth: "1200px", margin: "0 auto" }}>

        {/* Greeting */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: "28px", fontWeight: 700, color: "#d4e4fa" }}>
            {getGreeting()}, {firstName}.
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "rgba(199,196,215,0.5)" }}>
            Ready to crush your goals today?
          </p>
        </div>

        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>
          {QUICK_STATS.map(({ label, value, icon, color }) => (
            <div key={label} style={{
              padding: "14px 16px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", gap: "12px",
            }}>
              <Icon name={icon} size={20} style={{ color }} />
              <div>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#d4e4fa", lineHeight: 1.1 }}>{value}</p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "rgba(199,196,215,0.45)" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", alignItems: "start" }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Mastery + AI card */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

              {/* Mastery */}
              <div className="glass-card" style={{ borderRadius: "16px", padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <div style={{
                  width: "140px", height: "140px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "radial-gradient(closest-side,#051424 79%,transparent 80% 100%), conic-gradient(#c0c1ff 72%,rgba(255,255,255,0.08) 0)",
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "36px", fontWeight: 800, color: "#d4e4fa", lineHeight: 1 }}>72%</p>
                    <p style={{ margin: "4px 0 0", fontSize: "10px", fontWeight: 600, color: "rgba(192,193,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Mastery</p>
                  </div>
                </div>
                <p style={{ margin: "16px 0 4px", fontSize: "15px", fontWeight: 600, color: "#d4e4fa" }}>Overall Progress</p>
                <p style={{ margin: 0, fontSize: "12px", color: "rgba(199,196,215,0.45)" }}>
                  <span style={{ color: "#81c995", fontWeight: 600 }}>+12%</span> from last week
                </p>
              </div>

              {/* AI Suggestion */}
              <div className="glass-card" style={{
                borderRadius: "16px", padding: "24px 20px",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
              }}>
                <div>
                  <p style={{ margin: "0 0 12px", fontSize: "11px", fontWeight: 700, color: "#c0c1ff", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Suggestion</p>
                  <h4 style={{ margin: "0 0 8px", fontSize: "17px", fontWeight: 700, color: "#d4e4fa", lineHeight: 1.3 }}>
                    Revise Advanced Thermodynamics
                  </h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "rgba(199,196,215,0.55)", lineHeight: 1.6 }}>
                    Your recall dipped 15%. A 20-min quiz session can bring you back to mastery.
                  </p>
                </div>
                <button style={{
                  marginTop: "16px", padding: "9px 14px", width: "100%", borderRadius: "10px",
                  border: "1px solid rgba(192,193,255,0.25)",
                  background: "rgba(192,193,255,0.08)",
                  color: "#c0c1ff", fontWeight: 600, fontSize: "13px",
                  cursor: "pointer",
                }}>
                  Start Session
                </button>
              </div>
            </div>

            {/* Heatmap */}
            <div className="glass-card" style={{ borderRadius: "16px", padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "14px", color: "#d4e4fa" }}>Study Intensity</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "rgba(199,196,215,0.38)" }}>Last 3 months · 60 sessions</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "10px", color: "rgba(199,196,215,0.35)", marginRight: "2px" }}>Less</span>
                  {[HEAT_C.empty, HEAT_C.quarter, HEAT_C.half, HEAT_C.full].map((c, i) => (
                    <span key={i} style={{ width: "10px", height: "10px", borderRadius: "2px", background: c, display: "inline-block" }} />
                  ))}
                  <span style={{ fontSize: "10px", color: "rgba(199,196,215,0.35)", marginLeft: "2px" }}>More</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(20,1fr)", gap: "4px" }}>
                {HEAT.map((level, i) => (
                  <div key={i} style={{
                    aspectRatio: "1", borderRadius: "2px", background: HEAT_C[level],
                  }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                {["Oct 2024", "Nov 2024", "Dec 2024", "Jan 2025"].map(m => (
                  <span key={m} style={{ fontSize: "10px", color: "rgba(199,196,215,0.32)" }}>{m}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Upcoming Deadlines */}
            <div className="glass-card" style={{ borderRadius: "14px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#d4e4fa" }}>Upcoming Deadlines</p>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#ffb4ab", background: "rgba(255,180,171,0.1)", border: "1px solid rgba(255,180,171,0.2)", borderRadius: "999px", padding: "2px 8px" }}>2 DUE</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,180,171,0.05)", border: "1px solid rgba(255,180,171,0.14)" }}>
                  <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: "13px", color: "#d4e4fa" }}>Organic Chem Exam</p>
                  <p style={{ margin: "0 0 8px", fontSize: "11px", color: "#ffb4ab", fontWeight: 600 }}>Urgent</p>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {[["02","Days"],["14","Hrs"],["45","Min"]].map(([val, lbl]) => (
                      <div key={lbl} style={{ flex: 1, textAlign: "center", padding: "6px 4px", borderRadius: "7px", background: "rgba(255,255,255,0.06)" }}>
                        <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#d4e4fa", lineHeight: 1 }}>{val}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "9px", color: "rgba(199,196,215,0.4)", textTransform: "uppercase" }}>{lbl}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <Icon name="event" size={15} style={{ color: "rgba(199,196,215,0.45)" }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "rgba(212,228,250,0.75)" }}>Calculus III Quiz</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "rgba(199,196,215,0.38)" }}>Jan 18 · 09:00 AM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Needs Attention */}
            <div className="glass-card" style={{ borderRadius: "14px", padding: "18px" }}>
              <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: "14px", color: "#d4e4fa" }}>Needs Attention</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {SUBJECTS.map(({ name, pct, color }) => (
                  <div key={name} style={{ padding: "10px 12px", borderRadius: "10px", borderLeft: `3px solid ${color}`, background: "rgba(255,255,255,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#d4e4fa" }}>{name}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color }}>{pct}%</span>
                    </div>
                    <div style={{ height: "3px", borderRadius: "999px", background: "rgba(255,255,255,0.08)" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "999px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flashcard Blitz */}
            <div className="glass-card" style={{ borderRadius: "14px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <Icon name="style" size={20} style={{ color: "#c0c1ff" }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#d4e4fa" }}>Flashcard Blitz</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "rgba(199,196,215,0.42)" }}>5 mins · 20 cards due</p>
                </div>
              </div>
              <button style={{
                width: "100%", padding: "9px",
                borderRadius: "9px", border: "none",
                background: "#c0c1ff",
                color: "#051424", fontWeight: 700, fontSize: "13px",
                cursor: "pointer",
              }}>
                Quick Start
              </button>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
