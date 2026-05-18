import { useContext, useState, useEffect } from "react";
import Layout from "../components/Layout";
import { AuthContext } from "../context/AuthContext";
import Icon from "../components/Icon";
import { getStats, getDeadlines, getSessions } from "../api/studyplannerApi";

function toYMD(d) { return new Date(d).toISOString().split("T")[0]; }

function timeRemaining(dateStr) {
  const diff = new Date(dateStr + "T23:59:59") - new Date();
  if (diff < 0) return { text: "Overdue",    color: "#ffb4ab" };
  const d = Math.floor(diff / 864e5);
  if (d === 0) return { text: "Due today",   color: "#ffb4ab" };
  if (d === 1) return { text: "Tomorrow",    color: "#ffb783" };
  return             { text: `${d} days`,    color: "#c7c4d7" };
}

const PRIORITY_COLOR = { High: "#ffb4ab", Medium: "#ffb783", Low: "#c0c1ff" };

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
      } catch { /* silent — API errors already logged */ }
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

  const pending   = deadlines.filter(d => d.status === "pending")
                             .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date));
  const upcoming  = pending.slice(0, 3);

  // Build a 60-cell heatmap from actual session dates (last 3 months)
  const today     = new Date();
  const heatCells = Array.from({ length: 60 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (59 - i));
    const ymd = toYMD(d);
    const mins = sessions
      .filter(s => s.session_date === ymd)
      .reduce((sum, s) => sum + s.duration_minutes, 0);
    if (mins === 0)   return "empty";
    if (mins < 30)    return "quarter";
    if (mins < 90)    return "half";
    return "full";
  });
  const HEAT_C = {
    full:    "#c0c1ff",
    half:    "rgba(192,193,255,0.48)",
    quarter: "rgba(192,193,255,0.18)",
    empty:   "rgba(255,255,255,0.05)",
  };

  const QUICK_STATS = [
    {
      label: "Focus Hours",
      value: loading ? "—" : `${stats?.focus_hours_week ?? 0}`,
      unit:  "this week",
      icon:  "timer",
      color: "#c0c1ff",
    },
    {
      label: "Upcoming",
      value: loading ? "—" : String(stats?.upcoming_deadlines ?? 0),
      unit:  "deadlines",
      icon:  "event_note",
      color: "#ffb0cd",
    },
    {
      label: "Completed",
      value: loading ? "—" : String(stats?.completed_deadlines ?? 0),
      unit:  "tasks",
      icon:  "check_circle",
      color: "#81c995",
    },
    {
      label: "Pending",
      value: loading ? "—" : String(pending.length),
      unit:  "tasks",
      icon:  "event_busy",
      color: "#ffb783",
    },
  ];

  // Mini bar chart data from actual sessions (last 7)
  const recentS = sessions.slice(0, 7).reverse();
  const maxMin  = Math.max(...recentS.map(s => s.duration_minutes), 1);

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
          {QUICK_STATS.map(({ label, value, unit, icon, color }) => (
            <div key={label} style={{
              padding: "14px 16px", borderRadius: "12px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", gap: "12px",
            }}>
              <Icon name={icon} size={20} style={{ color }} />
              <div>
                <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#d4e4fa", lineHeight: 1.1 }}>{value}</p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "rgba(199,196,215,0.45)" }}>{label}</p>
                <p style={{ margin: 0, fontSize: "10px", color: "rgba(199,196,215,0.28)" }}>{unit}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", alignItems: "start" }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Focus hours bar chart */}
            <div className="glass-card" style={{ borderRadius: "16px", padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "14px", color: "#d4e4fa" }}>Focus Sessions</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "rgba(199,196,215,0.38)" }}>
                    {recentS.length > 0 ? `Last ${recentS.length} logged sessions` : "No sessions logged yet"}
                  </p>
                </div>
                <Icon name="timer" size={16} style={{ color: "rgba(199,196,215,0.3)" }} />
              </div>
              {recentS.length > 0 ? (
                <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "60px" }}>
                  {recentS.map((s, i) => {
                    const pct = Math.max(10, Math.round((s.duration_minutes / maxMin) * 100));
                    return (
                      <div
                        key={i}
                        title={`${s.subject_name}: ${s.duration_minutes}m on ${s.session_date}`}
                        style={{
                          flex: 1, height: `${pct}%`, borderRadius: "4px 4px 0 0",
                          background: i === recentS.length - 1
                            ? "linear-gradient(to top,#c0c1ff,#e1e0ff)"
                            : "rgba(192,193,255,0.2)",
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <div style={{ height: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "rgba(199,196,215,0.3)" }}>
                    Log your first study session to see stats
                  </p>
                </div>
              )}
            </div>

            {/* Activity heatmap */}
            <div className="glass-card" style={{ borderRadius: "16px", padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "14px", color: "#d4e4fa" }}>Study Intensity</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "rgba(199,196,215,0.38)" }}>Last 60 days · based on session minutes</p>
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
                {heatCells.map((level, i) => (
                  <div key={i} style={{ aspectRatio: "1", borderRadius: "2px", background: HEAT_C[level] }} />
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
                {!loading && upcoming.length > 0 && (
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#ffb4ab", background: "rgba(255,180,171,0.1)", border: "1px solid rgba(255,180,171,0.2)", borderRadius: "999px", padding: "2px 8px" }}>
                    {upcoming.length} DUE
                  </span>
                )}
              </div>

              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[1, 2].map(i => (
                    <div key={i} style={{ height: "52px", borderRadius: "10px", background: "rgba(255,255,255,0.04)" }} />
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <Icon name="check_circle" size={28} style={{ color: "rgba(129,201,149,0.5)", display: "block", margin: "0 auto 8px" }} />
                  <p style={{ margin: 0, fontSize: "12px", color: "rgba(199,196,215,0.4)" }}>No upcoming deadlines</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {upcoming.map(dl => {
                    const tr = timeRemaining(dl.deadline_date);
                    const color = PRIORITY_COLOR[dl.priority] || "#c0c1ff";
                    return (
                      <div key={dl.deadline_id} style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "10px 12px", borderRadius: "10px",
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                        borderLeft: `3px solid ${color}`,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "rgba(212,228,250,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {dl.subject_name}
                          </p>
                          <p style={{ margin: 0, fontSize: "11px", color: tr.color, fontWeight: 600 }}>{tr.text}</p>
                        </div>
                        <span style={{ fontSize: "9px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
                          {dl.priority}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pending tasks list */}
            <div className="glass-card" style={{ borderRadius: "14px", padding: "18px" }}>
              <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: "14px", color: "#d4e4fa" }}>All Pending</p>
              {loading ? (
                <div style={{ height: "80px", borderRadius: "10px", background: "rgba(255,255,255,0.04)" }} />
              ) : pending.length === 0 ? (
                <p style={{ margin: 0, fontSize: "12px", color: "rgba(199,196,215,0.35)", textAlign: "center", padding: "16px 0" }}>
                  Nothing pending — well done!
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {pending.slice(0, 4).map(dl => (
                    <div key={dl.deadline_id} style={{
                      padding: "10px 12px", borderRadius: "10px",
                      borderLeft: `3px solid ${PRIORITY_COLOR[dl.priority] || "#c0c1ff"}`,
                      background: "rgba(255,255,255,0.03)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#d4e4fa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "140px" }}>
                          {dl.subject_name}
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: PRIORITY_COLOR[dl.priority] || "#c0c1ff" }}>
                          {dl.priority}
                        </span>
                      </div>
                      <div style={{ height: "3px", borderRadius: "999px", background: "rgba(255,255,255,0.08)" }}>
                        <div style={{
                          height: "100%", borderRadius: "999px",
                          width: dl.status === "completed" ? "100%" : "15%",
                          background: PRIORITY_COLOR[dl.priority] || "#c0c1ff",
                        }} />
                      </div>
                    </div>
                  ))}
                  {pending.length > 4 && (
                    <p style={{ margin: 0, fontSize: "11px", color: "rgba(199,196,215,0.35)", textAlign: "center" }}>
                      +{pending.length - 4} more in Study Planner
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
