import { useContext, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import { AuthContext } from "../context/AuthContext";
import { getStats, getDeadlines, getSessions } from "../api/studyplannerApi";
import { Timer, AlertCircle, CheckCircle2, Clock, TrendingUp, Zap, Calendar } from "lucide-react";

function toYMD(d) { return new Date(d).toISOString().split("T")[0]; }

function timeRemaining(dateStr) {
  const diff = new Date(dateStr + "T23:59:59") - new Date();
  if (diff < 0)  return { text: "Overdue",   color: "var(--red)"    };
  const d = Math.floor(diff / 864e5);
  if (d === 0)   return { text: "Due today", color: "var(--red)"    };
  if (d === 1)   return { text: "Tomorrow",  color: "var(--gold)"   };
  return           { text: `${d} days`,    color: "var(--text-3)" };
}

const PRIORITY_COLOR = { High: "#f87171", Medium: "#f59e0b", Low: "#a78bfa" };
const HEAT_C = {
  full:    "#7c3aed",
  half:    "rgba(124, 58, 237, 0.45)",
  quarter: "rgba(124, 58, 237, 0.18)",
  empty:   "rgba(255, 255, 255, 0.04)",
};

const panel = {
  padding: "22px 24px", borderRadius: "18px",
  background: "rgba(12, 12, 30, 0.7)",
  border: "1px solid rgba(255,255,255,0.07)",
  backdropFilter: "blur(16px)",
};

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const firstName = user?.full_name?.split(" ")[0] || "Student";

  const [stats,     setStats]     = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, d, se] = await Promise.all([getStats(), getDeadlines(), getSessions()]);
        setStats(s.data);
        setDeadlines(d.data);
        setSessions(se.data);
      } catch { }
      finally { setLoading(false); }
    }
    load();
  }, []);

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 5)  return "Working late";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 21) return "Good evening";
    return "Good night";
  }

  const pending  = deadlines.filter(d => d.status === "pending")
                            .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date));
  const upcoming = pending.slice(0, 3);

  const today = new Date();
  const heatCells = Array.from({ length: 60 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (59 - i));
    const ymd = toYMD(d);
    const mins = sessions.filter(s => s.session_date === ymd).reduce((sum, s) => sum + s.duration_minutes, 0);
    if (mins === 0)  return "empty";
    if (mins < 30)   return "quarter";
    if (mins < 90)   return "half";
    return "full";
  });

  const recentS = sessions.slice(0, 7).reverse();
  const maxMin  = Math.max(...recentS.map(s => s.duration_minutes), 1);

  const CARDS = [
    { label: "Focus Hours", value: loading ? "—" : `${stats?.focus_hours_week ?? 0}h`, unit: "this week",  icon: Timer,        color: "#7c3aed", glow: "rgba(124,58,237,0.2)"  },
    { label: "Upcoming",    value: loading ? "—" : String(stats?.upcoming_deadlines ?? 0), unit: "deadlines", icon: AlertCircle,  color: "#f59e0b", glow: "rgba(245,158,11,0.2)"  },
    { label: "Completed",   value: loading ? "—" : String(stats?.completed_deadlines ?? 0), unit: "tasks",    icon: CheckCircle2, color: "#34d399", glow: "rgba(52,211,153,0.2)"  },
    { label: "Pending",     value: loading ? "—" : String(pending.length),               unit: "tasks",     icon: Clock,        color: "#e879f9", glow: "rgba(232,121,249,0.2)" },
  ];

  const cVars = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const iVars = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } } };

  return (
    <Layout title="Dashboard">
      <div style={{ padding: "clamp(20px, 3vw, 32px)", maxWidth: "1260px", margin: "0 auto" }}>

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: "28px" }}
        >
          <h2 style={{ margin: "0 0 5px", fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.03em", fontFamily: "Space Grotesk, sans-serif" }}>
            {getGreeting()},{" "}
            <span style={{ background: "linear-gradient(135deg, #a78bfa, #e879f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {firstName}
            </span>. 👋
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-3)" }}>
            Ready to crush your goals today?
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={cVars}
          initial="hidden"
          animate="visible"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "22px" }}
        >
          {CARDS.map(({ label, value, unit, icon: Ic, color, glow }) => (
            <motion.div
              key={label}
              variants={iVars}
              whileHover={{ y: -4, scale: 1.02 }}
              style={{ ...panel, padding: "18px 20px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "14px", position: "relative", overflow: "hidden", cursor: "default" }}
            >
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "70px", height: "70px", borderRadius: "50%", background: glow, filter: "blur(20px)", pointerEvents: "none" }} />
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0, background: `${color}18`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ic size={20} color={color} strokeWidth={1.8} />
              </div>
              <div style={{ position: "relative", zIndex: 1 }}>
                <p style={{ margin: 0, fontSize: "clamp(18px, 2.5vw, 24px)", fontWeight: 800, color: "var(--text-1)", lineHeight: 1.1, fontFamily: "Space Grotesk, sans-serif" }}>{value}</p>
                <p style={{ margin: "3px 0 0", fontSize: "11px", color, fontWeight: 600 }}>{label}</p>
                <p style={{ margin: 0, fontSize: "10px", color: "var(--text-4)" }}>{unit}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr clamp(260px, 28%, 320px)", gap: "18px", alignItems: "start" }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Bar chart */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={panel}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <div>
                  <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: "14px", color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>Focus Sessions</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-3)" }}>
                    {recentS.length > 0 ? `Last ${recentS.length} logged sessions` : "No sessions logged yet"}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "999px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                  <TrendingUp size={13} color="#a78bfa" />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#a78bfa" }}>Activity</span>
                </div>
              </div>
              {recentS.length > 0 ? (
                <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "72px" }}>
                  {recentS.map((s, i) => {
                    const pct = Math.max(8, Math.round((s.duration_minutes / maxMin) * 100));
                    return (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.4 + i * 0.06 }}
                        title={`${s.subject_name}: ${s.duration_minutes}m`}
                        style={{ flex: 1, borderRadius: "5px 5px 0 0", background: i === recentS.length - 1 ? "linear-gradient(to top, #7c3aed, #a78bfa)" : "rgba(124,58,237,0.2)" }}
                      />
                    );
                  })}
                </div>
              ) : (
                <div style={{ height: "72px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px dashed rgba(255,255,255,0.07)" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-4)" }}>Log your first study session to see stats</p>
                </div>
              )}
            </motion.div>

            {/* Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={panel}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: "14px", color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>Study Intensity</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-3)" }}>Last 60 days</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-4)", marginRight: "2px" }}>Less</span>
                  {[HEAT_C.empty, HEAT_C.quarter, HEAT_C.half, HEAT_C.full].map((c, i) => (
                    <span key={i} style={{ width: "11px", height: "11px", borderRadius: "3px", background: c, display: "inline-block" }} />
                  ))}
                  <span style={{ fontSize: "10px", color: "var(--text-4)", marginLeft: "2px" }}>More</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(20, 1fr)", gap: "4px" }}>
                {heatCells.map((level, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 + i * 0.005 }}
                    whileHover={{ scale: 1.5 }}
                    style={{ aspectRatio: "1", borderRadius: "3px", background: HEAT_C[level] }}
                  />
                ))}
              </div>
            </motion.div>

            {/* AI Tips */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              style={{ ...panel, background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(232,121,249,0.06))", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={16} color="#a78bfa" />
                </div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>AI Study Tips</p>
              </div>
              {[
                { e: "💡", t: "Focus on your weakest subject first — your brain is freshest in the morning." },
                { e: "🎯", t: "Use the Pomodoro technique: 25min study, 5min break for optimal retention." },
                { e: "📚", t: "Review your flashcards before bed — sleep consolidates memory." },
              ].map(({ e, t }) => (
                <div key={t} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "14px", flexShrink: 0 }}>{e}</span>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text-2)", lineHeight: 1.55 }}>{t}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Upcoming Deadlines */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              style={{ ...panel, padding: "18px 20px", borderRadius: "16px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Calendar size={15} color="#a78bfa" />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>Upcoming Deadlines</p>
                </div>
                {!loading && upcoming.length > 0 && (
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--red)", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "999px", padding: "2px 9px" }}>
                    {upcoming.length} DUE
                  </span>
                )}
              </div>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: "54px", borderRadius: "10px" }} />)}
                </div>
              ) : upcoming.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <CheckCircle2 size={28} color="rgba(52,211,153,0.5)" style={{ display: "block", margin: "0 auto 8px" }} />
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-4)" }}>No upcoming deadlines</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {upcoming.map((dl, i) => {
                    const tr    = timeRemaining(dl.deadline_date);
                    const color = PRIORITY_COLOR[dl.priority] || "#a78bfa";
                    return (
                      <motion.div
                        key={dl.deadline_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.08 }}
                        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 12px", borderRadius: "11px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderLeft: `3px solid ${color}` }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dl.subject_name}</p>
                          <p style={{ margin: 0, fontSize: "11px", color: tr.color, fontWeight: 600 }}>{tr.text}</p>
                        </div>
                        <span style={{ fontSize: "9px", fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.05em", background: `${color}15`, border: `1px solid ${color}25`, borderRadius: "5px", padding: "2px 7px", flexShrink: 0 }}>
                          {dl.priority}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Pending tasks */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              style={{ ...panel, padding: "18px 20px", borderRadius: "16px" }}
            >
              <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: "14px", color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>All Pending</p>
              {loading ? (
                <div className="skeleton" style={{ height: "80px", borderRadius: "10px" }} />
              ) : pending.length === 0 ? (
                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-4)", textAlign: "center", padding: "16px 0" }}>
                  Nothing pending — well done! 🎉
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {pending.slice(0, 5).map((dl, i) => {
                    const color = PRIORITY_COLOR[dl.priority] || "#a78bfa";
                    return (
                      <motion.div
                        key={dl.deadline_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45 + i * 0.07 }}
                        style={{ padding: "10px 12px", borderRadius: "10px", borderLeft: `3px solid ${color}`, background: "rgba(255,255,255,0.025)" }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "150px" }}>
                            {dl.subject_name}
                          </span>
                          <span style={{ fontSize: "10px", fontWeight: 700, color }}>{dl.priority}</span>
                        </div>
                        <div style={{ height: "3px", borderRadius: "999px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: dl.status === "completed" ? "100%" : "18%" }}
                            transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                            style={{ height: "100%", borderRadius: "999px", background: color }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                  {pending.length > 5 && (
                    <p style={{ margin: 0, fontSize: "11px", color: "var(--text-4)", textAlign: "center", paddingTop: "4px" }}>
                      +{pending.length - 5} more in Study Planner
                    </p>
                  )}
                </div>
              )}
            </motion.div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
