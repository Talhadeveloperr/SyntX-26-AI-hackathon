import React, { useState, useEffect, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../components/Layout";
import MaterialIcon from "../components/MaterialIcon";
import { AuthContext } from "../context/AuthContext";
import {
  getDeadlines, addDeadline, updateDeadline, deleteDeadline,
  getSessions, addSession, getStats,
} from "../api/studyplannerApi";

function toYMD(date) { return date.toISOString().split("T")[0]; }

function getMondayOf(date) {
  const d = new Date(date), day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function monthLabel(days) {
  const opts = { month: "long", year: "numeric" };
  if (days[0].getMonth() === days[6].getMonth()) return days[0].toLocaleDateString("en-US", opts);
  return `${days[0].toLocaleDateString("en-US", { month: "short" })} – ${days[6].toLocaleDateString("en-US", opts)}`;
}

function timeRemaining(dateStr) {
  const diff = new Date(dateStr + "T23:59:59") - new Date();
  if (diff < 0) return { text: "Overdue",         color: "var(--red)",  glow: "rgba(248,113,113,0.2)", icon: "warning"        };
  const h = Math.floor(diff / 36e5), d = Math.floor(h / 24), r = h % 24;
  if (d === 0) return { text: `${h}h left`,        color: "var(--red)",  glow: "rgba(248,113,113,0.2)", icon: "timer"          };
  if (d <= 2)  return { text: `${d}d ${r}h left`,  color: "var(--gold)", glow: "rgba(245,158,11,0.2)",  icon: "schedule"       };
  return             { text: `${d} days left`,     color: "var(--text-2)", glow: "rgba(124,58,237,0.12)", icon: "calendar_today" };
}

function dlProgress(createdAt, deadlineStr) {
  if (!createdAt) return 0;
  const total   = new Date(deadlineStr + "T23:59:59") - new Date(createdAt);
  const elapsed = Date.now() - new Date(createdAt);
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

const P = {
  High:   { border: "var(--red)",           bg: "rgba(248,113,113,0.06)",  glow: "rgba(248,113,113,0.15)",  badge: { label: "Urgent",  color: "var(--red)",           bg: "rgba(248,113,113,0.12)" } },
  Medium: { border: "var(--gold)",          bg: "rgba(245,158,11,0.06)",   glow: "rgba(245,158,11,0.15)",   badge: { label: "Warning", color: "var(--gold)",          bg: "rgba(245,158,11,0.12)"  } },
  Low:    { border: "var(--primary-light)", bg: "rgba(124,58,237,0.04)",   glow: "rgba(124,58,237,0.1)",    badge: { label: "Planned", color: "var(--text-2)",         bg: "rgba(255,255,255,0.07)" } },
};

const CAL_CLR = {
  High:   { bg: "rgba(248,113,113,0.15)", bl: "var(--red)"           },
  Medium: { bg: "rgba(245,158,11,0.15)",  bl: "var(--gold)"          },
  Low:    { bg: "rgba(124,58,237,0.15)",  bl: "var(--primary-light)" },
};

const DAYS = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
const DUR  = [{ l:"30m",v:30 },{ l:"1h",v:60 },{ l:"1.5h",v:90 },{ l:"2h",v:120 },{ l:"3h",v:180 }];

export default function StudyPlanner() {
  const { user } = useContext(AuthContext);

  const [deadlines, setDeadlines] = useState([]);
  const [sessions,  setSessions]  = useState([]);
  const [stats,     setStats]     = useState({ focus_hours_week:0, upcoming_deadlines:0, completed_deadlines:0 });
  const [loading,   setLoading]   = useState(true);
  const [fetchErr,  setFetchErr]  = useState("");

  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()));
  const [rightTab,  setRightTab]  = useState("deadline");

  const emptyDL   = { subject_name:"", description:"", deadline_date:"", priority:"Medium" };
  const emptySess = { subject_name:"", session_date:toYMD(new Date()), duration_minutes:60, notes:"" };

  const [dlForm,    setDlForm]    = useState(emptyDL);
  const [dlLoading, setDlLoading] = useState(false);
  const [dlMsg,     setDlMsg]     = useState({ t:"", s:"" });

  const [sessForm,    setSessForm]    = useState(emptySess);
  const [sessLoading, setSessLoading] = useState(false);
  const [sessMsg,     setSessMsg]     = useState({ t:"", s:"" });

  const flash = (set, t, s) => { set({ t, s }); setTimeout(() => set({ t:"", s:"" }), 3500); };

  const fetchAll = useCallback(async () => {
    setLoading(true); setFetchErr("");
    try {
      const [a, b, c] = await Promise.all([getDeadlines(), getSessions(), getStats()]);
      setDeadlines(a.data); setSessions(b.data); setStats(c.data);
    } catch { setFetchErr("Failed to load data. Please refresh."); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAddDL = async (e) => {
    e.preventDefault();
    if (!dlForm.subject_name.trim() || !dlForm.deadline_date) return flash(setDlMsg, "err", "Subject and date are required.");
    setDlLoading(true);
    try { await addDeadline(dlForm); flash(setDlMsg,"ok","Deadline synced!"); setDlForm(emptyDL); fetchAll(); }
    catch (err) { flash(setDlMsg,"err",err.response?.data?.error || "Failed."); }
    finally { setDlLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this deadline?")) return;
    try { await deleteDeadline(id); setDeadlines(p => p.filter(d => d.deadline_id !== id)); getStats().then(r=>setStats(r.data)).catch(()=>{}); }
    catch { alert("Failed to delete."); }
  };

  const handleToggle = async (dl) => {
    const ns = dl.status === "completed" ? "pending" : "completed";
    try { await updateDeadline(dl.deadline_id, { ...dl, status: ns }); setDeadlines(p => p.map(d => d.deadline_id===dl.deadline_id ? {...d,status:ns} : d)); getStats().then(r=>setStats(r.data)).catch(()=>{}); }
    catch { alert("Failed to update."); }
  };

  const handleAddSess = async (e) => {
    e.preventDefault();
    if (!sessForm.subject_name.trim() || !sessForm.session_date) return flash(setSessMsg,"err","Subject and date are required.");
    setSessLoading(true);
    try { await addSession(sessForm); flash(setSessMsg,"ok","Session logged!"); setSessForm(emptySess); fetchAll(); }
    catch (err) { flash(setSessMsg,"err",err.response?.data?.error || "Failed."); }
    finally { setSessLoading(false); }
  };

  const weekDays        = getWeekDays(weekStart);
  const today           = toYMD(new Date());
  const dlForDay        = (d) => deadlines.filter(x => x.deadline_date===toYMD(d) && x.status==="pending");
  const sessForDay      = (d) => sessions.filter(x => x.session_date===toYMD(d));
  const pending         = deadlines.filter(d=>d.status==="pending").sort((a,b)=>new Date(a.deadline_date)-new Date(b.deadline_date));
  const completed       = deadlines.filter(d=>d.status==="completed");
  const completionPct   = deadlines.length>0 ? Math.round((stats.completed_deadlines/deadlines.length)*100) : 0;
  const nextDL          = pending[0];
  const recentS         = sessions.slice(0,7).reverse();
  const maxMin          = Math.max(...recentS.map(s=>s.duration_minutes),1);

  const itemAnim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

  return (
    <Layout title="Study Planner">
      <div className="sp-wrap" style={{ overflowAuto: true }}>
        <div style={{ maxWidth:"1440px", margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

            <AnimatePresence>
              {fetchErr && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="sp-banner-err" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MaterialIcon name="error_outline" size={18} />{fetchErr}
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Insights */}
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
                <div className="sp-icon-chip">
                  <MaterialIcon name="auto_awesome" size={20} style={{ color: "var(--primary-light)" }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: "var(--text-1)" }}>AI Insights</h3>
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-3)" }}>Personalized recommendations</p>
                </div>
              </div>
              <div className="sp-no-scroll" style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}>
                {loading
                  ? [1,2,3].map(i=><div key={i} className="sp-skeleton-pill" />)
                  : pending.length===0
                    ? <div className="sp-chip sp-chip-ok"><MaterialIcon name="check_circle" size={15} style={{ marginRight:"4px" }} />All clear — no upcoming deadlines!</div>
                    : pending.slice(0,3).map((dl,i)=>{
                        const tr=timeRemaining(dl.deadline_date);
                        const variants=["sp-chip-a","sp-chip-b","sp-chip-c"];
                        const labels=["Focus:","Review:","Due soon:"];
                        return (
                          <motion.div key={dl.deadline_id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.08 }}
                            className={`sp-chip ${variants[i]}`}>
                            <MaterialIcon name={tr.icon} size={14} />
                            <span style={{ fontWeight: 700 }}>{labels[i]}</span>
                            <span>{dl.subject_name}</span>
                            <span className="sp-time-pill" style={{ background:tr.glow, color:tr.color }}>{tr.text}</span>
                          </motion.div>
                        );
                      })
                }
              </div>
            </motion.section>

            {/* Main grid */}
            <div className="row g-4">

              {/* LEFT 8/12 */}
              <div className="col-12 col-lg-8 d-flex flex-column gap-4">

                {/* Calendar */}
                <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }} className="sp-card">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"12px", marginBottom:"24px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                      <h4 style={{ margin:0, fontFamily:"Space Grotesk, sans-serif", fontSize:"22px", fontWeight:700, letterSpacing:"-0.02em", color:"var(--text-1)" }}>
                        {monthLabel(weekDays)}
                      </h4>
                      <div style={{ display:"flex", gap:"4px" }}>
                        <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} className="sp-nav-btn" onClick={()=>setWeekStart(d=>{const n=new Date(d);n.setDate(n.getDate()-7);return n;})}>
                          <MaterialIcon name="chevron_left" size={18} />
                        </motion.button>
                        <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }} className="sp-today-btn" onClick={()=>setWeekStart(getMondayOf(new Date()))}>Today</motion.button>
                        <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} className="sp-nav-btn" onClick={()=>setWeekStart(d=>{const n=new Date(d);n.setDate(n.getDate()+7);return n;})}>
                          <MaterialIcon name="chevron_right" size={18} />
                        </motion.button>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"20px" }}>
                      {[["var(--primary-light)","Deadline"],["var(--pink)","Session"]].map(([c,l])=>(
                        <div key={l} style={{ display:"flex", alignItems:"center", gap:"7px", fontSize:"11px", color:"var(--text-3)" }}>
                          <span style={{ width:"8px", height:"8px", borderRadius:"2px", background:c, display:"inline-block" }} />{l}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
                    <div className="sp-cal-wrap" style={{ minWidth:"720px" }}>
                      <div className="d-flex sp-cal-head">
                        {DAYS.map((name,i)=>{
                          const day=weekDays[i], isT=toYMD(day)===today, isW=i>=5;
                          return (
                            <div key={name} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"12px 0 10px", gap:"4px", borderRight:i<6?"1px solid rgba(255,255,255,0.05)":"none" }}>
                              <span style={{ fontSize:"9px", fontWeight:700, letterSpacing:"0.1em", color:isT?"var(--primary-light)":isW?"rgba(232,121,249,0.4)":"var(--text-4)" }}>{name}</span>
                              {isT
                                ? <span className="sp-today-dot">{day.getDate()}</span>
                                : <span style={{ fontSize:"14px", fontWeight:400, color:isW?"var(--text-4)":"rgba(212,228,250,0.4)" }}>{day.getDate()}</span>
                              }
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display:"flex", minHeight:"200px" }}>
                        {weekDays.map((day,i)=>{
                          const ymd=toYMD(day), isT=ymd===today, isW=i>=5;
                          const dls=dlForDay(day), sess=sessForDay(day);
                          return (
                            <div key={ymd}
                              style={{ flex:1, padding:"8px", display:"flex", flexDirection:"column", gap:"4px", borderRight:i<6?"1px solid rgba(255,255,255,0.05)":"none", background:isT?"rgba(124,58,237,0.05)":isW?"rgba(0,0,0,0.1)":"transparent", boxShadow:isT?"inset 0 0 0 1px rgba(124,58,237,0.12)":"none", cursor:"pointer", position:"relative", transition:"background 0.15s" }}
                              onClick={()=>{ setSessForm(f=>({...f,session_date:ymd})); setRightTab("session"); }}>
                              {dls.map(dl=>{
                                const c=CAL_CLR[dl.priority]||CAL_CLR.Low;
                                return <div key={dl.deadline_id} className="sp-ev" style={{ background:c.bg, borderLeft:`2px solid ${c.bl}` }}>{dl.subject_name.length>13?dl.subject_name.slice(0,12)+"…":dl.subject_name}</div>;
                              })}
                              {sess.map(s=>(
                                <div key={s.session_id} className="sp-ev" style={{ background:"rgba(232,121,249,0.12)", borderLeft:"2px solid var(--pink)" }}>
                                  {s.subject_name.length>11?s.subject_name.slice(0,10)+"…":s.subject_name}
                                  <span style={{ opacity:0.55, marginLeft:"3px" }}>{s.duration_minutes}m</span>
                                </div>
                              ))}
                              {dls.length===0&&sess.length===0&&(
                                <div className="sp-add-hint"><MaterialIcon name="add" size={13} /></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Stats bento */}
                <div className="row g-3">
                  {/* Focus hours */}
                  <div className="col-12 col-sm-4">
                    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }} className="sp-stat-card sp-stat-a h-100">
                      <div className="sp-stat-icon" style={{ background:"rgba(124,58,237,0.1)" }}>
                        <MaterialIcon name="timer" size={20} style={{ color:"var(--primary-light)" }} />
                      </div>
                      <p className="sp-stat-label">Focus Hours</p>
                      <p className="sp-stat-num">{loading?"—":stats.focus_hours_week}<span className="sp-stat-unit">hrs</span></p>
                      <p className="sp-stat-sub">last 7 days</p>
                      <div style={{ display:"flex", alignItems:"flex-end", gap:"3px", marginTop:"16px", height:"40px" }}>
                        {recentS.length>0
                          ? recentS.map((s,i)=>{
                              const pct=Math.max(10,Math.round((s.duration_minutes/maxMin)*100));
                              return (
                                <motion.div key={i} initial={{ height:0 }} animate={{ height:`${pct}%` }} transition={{ delay:i*0.05, duration:0.4, ease:"easeOut" }}
                                  title={`${s.subject_name}: ${s.duration_minutes}m`}
                                  style={{ flex:1, borderRadius:"3px 3px 0 0", background:i===recentS.length-1?"linear-gradient(to top,#7c3aed,#a78bfa)":"rgba(124,58,237,0.25)" }} />
                              );
                            })
                          : <p style={{ margin:0, fontSize:"11px", color:"var(--text-4)", alignSelf:"center", width:"100%", textAlign:"center" }}>No sessions yet</p>
                        }
                      </div>
                    </motion.div>
                  </div>

                  {/* Completion */}
                  <div className="col-12 col-sm-4">
                    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }} className="sp-stat-card sp-stat-b h-100">
                      <div className="sp-stat-icon" style={{ background:"rgba(232,121,249,0.1)" }}>
                        <MaterialIcon name="task_alt" size={20} style={{ color:"var(--pink)" }} />
                      </div>
                      <p className="sp-stat-label">Completion</p>
                      <p className="sp-stat-num">{loading?"—":`${completionPct}`}<span className="sp-stat-unit">%</span></p>
                      <p className="sp-stat-sub">{nextDL?`Next: ${nextDL.subject_name.slice(0,16)}`:"All done!"}</p>
                      <div style={{ width:"100%", borderRadius:"999px", overflow:"hidden", marginTop:"16px", height:"4px", background:"rgba(255,255,255,0.08)" }}>
                        <motion.div initial={{ width:0 }} animate={{ width:`${completionPct}%` }} transition={{ duration:0.8, ease:"easeOut" }}
                          style={{ height:"100%", borderRadius:"999px", background:"linear-gradient(to right,var(--pink),var(--primary-light))" }} />
                      </div>
                    </motion.div>
                  </div>

                  {/* Pending */}
                  <div className="col-12 col-sm-4">
                    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="sp-stat-card sp-stat-c h-100">
                      <div className="sp-stat-icon" style={{ background:"rgba(245,158,11,0.1)" }}>
                        <MaterialIcon name="event_busy" size={20} style={{ color:"var(--gold)" }} />
                      </div>
                      <p className="sp-stat-label">Pending</p>
                      <p className="sp-stat-num">{loading?"—":pending.length}<span className="sp-stat-unit"> tasks</span></p>
                      <p className="sp-stat-sub">{stats.completed_deadlines} completed</p>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* RIGHT 4/12 */}
              <div className="col-12 col-lg-4 d-flex flex-column gap-4">

                {/* Tabs */}
                <div className="sp-tabs">
                  {[{k:"deadline",ico:"event_available",lbl:"Add Deadline"},{k:"session",ico:"timer",lbl:"Log Session"}].map(({k,ico,lbl})=>(
                    <button key={k} className={`sp-tab ${rightTab===k?"sp-tab-on":""}`} onClick={()=>setRightTab(k)}>
                      <MaterialIcon name={ico} size={15} style={{ marginRight:"4px" }} />{lbl}
                    </button>
                  ))}
                </div>

                {/* Deadline form */}
                <AnimatePresence mode="wait">
                  {rightTab==="deadline" && (
                    <motion.div key="dlform" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} className="sp-form-card">
                      <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"22px" }}>
                        <div className="sp-form-ico" style={{ background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.2)" }}>
                          <MaterialIcon name="event_available" size={20} style={{ color:"var(--primary-light)" }} />
                        </div>
                        <div>
                          <h4 style={{ margin:0, fontSize:"16px", fontWeight:700, fontFamily:"Space Grotesk, sans-serif", color:"var(--text-1)" }}>Add Deadline</h4>
                          <p style={{ margin:0, fontSize:"11px", color:"var(--text-3)" }}>Sync to your calendar</p>
                        </div>
                      </div>

                      <AnimatePresence>
                        {dlMsg.s && (
                          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                            className={`sp-msg ${dlMsg.t==="ok"?"sp-msg-ok":"sp-msg-err"}`} style={{ marginBottom:"14px", overflow:"hidden" }}>
                            <MaterialIcon name={dlMsg.t==="ok"?"check_circle":"error"} size={15} style={{ marginRight:"6px" }} />{dlMsg.s}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <form onSubmit={handleAddDL} style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                        <div className="sp-field">
                          <label className="sp-lbl">Subject Name *</label>
                          <div className="sp-ig">
                            <span className="sp-ig-ico"><MaterialIcon name="book" size={16} /></span>
                            <input className="sp-in" placeholder="e.g. Molecular Biology" value={dlForm.subject_name} onChange={e=>setDlForm(f=>({...f,subject_name:e.target.value}))} required />
                          </div>
                        </div>
                        <div className="sp-field">
                          <label className="sp-lbl">Description</label>
                          <div className="sp-ig">
                            <span className="sp-ig-ico"><MaterialIcon name="notes" size={16} /></span>
                            <input className="sp-in" placeholder="Chapter, topic, notes…" value={dlForm.description} onChange={e=>setDlForm(f=>({...f,description:e.target.value}))} />
                          </div>
                        </div>
                        <div className="row g-2">
                          <div className="col-7 sp-field">
                            <label className="sp-lbl">Date *</label>
                            <div className="sp-ig">
                              <span className="sp-ig-ico"><MaterialIcon name="calendar_month" size={16} /></span>
                              <input type="date" className="sp-in sp-date" value={dlForm.deadline_date} onChange={e=>setDlForm(f=>({...f,deadline_date:e.target.value}))} required />
                            </div>
                          </div>
                          <div className="col-5 sp-field">
                            <label className="sp-lbl">Priority</label>
                            <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
                              {["High","Medium","Low"].map(p=>(
                                <motion.button key={p} type="button" whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} className="sp-pri-btn"
                                  style={{ borderColor:dlForm.priority===p?P[p].border:"rgba(255,255,255,0.1)", color:dlForm.priority===p?P[p].border:"var(--text-3)", background:dlForm.priority===p?P[p].bg:"transparent" }}
                                  onClick={()=>setDlForm(f=>({...f,priority:p}))}>
                                  {p}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <motion.button type="submit" whileHover={!dlLoading?{ scale:1.02, boxShadow:"0 4px 16px rgba(124,58,237,0.3)" }:{}} whileTap={!dlLoading?{ scale:0.97 }:{}}
                          className="sp-btn sp-btn-primary" disabled={dlLoading}>
                          {dlLoading
                            ? <><span className="spinner-border spinner-border-sm me-2"/>Saving…</>
                            : <><span style={{ display:"inline-flex", alignItems:"center", marginRight:"8px" }}><MaterialIcon name="add_circle" size={16} /></span>Sync to Calendar</>}
                        </motion.button>
                      </form>
                    </motion.div>
                  )}

                  {/* Session form */}
                  {rightTab==="session" && (
                    <motion.div key="sessform" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} className="sp-form-card">
                      <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"22px" }}>
                        <div className="sp-form-ico" style={{ background:"rgba(232,121,249,0.1)", border:"1px solid rgba(232,121,249,0.2)" }}>
                          <MaterialIcon name="timer" size={20} style={{ color:"var(--pink)" }} />
                        </div>
                        <div>
                          <h4 style={{ margin:0, fontSize:"16px", fontWeight:700, fontFamily:"Space Grotesk, sans-serif", color:"var(--text-1)" }}>Log Session</h4>
                          <p style={{ margin:0, fontSize:"11px", color:"var(--text-3)" }}>Track your focus time</p>
                        </div>
                      </div>

                      <AnimatePresence>
                        {sessMsg.s && (
                          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                            className={`sp-msg ${sessMsg.t==="ok"?"sp-msg-ok":"sp-msg-err"}`} style={{ marginBottom:"14px", overflow:"hidden" }}>
                            <MaterialIcon name={sessMsg.t==="ok"?"check_circle":"error"} size={15} style={{ marginRight:"6px" }} />{sessMsg.s}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <form onSubmit={handleAddSess} style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                        <div className="sp-field">
                          <label className="sp-lbl">Subject *</label>
                          <div className="sp-ig">
                            <span className="sp-ig-ico"><MaterialIcon name="school" size={16} /></span>
                            <input className="sp-in" placeholder="e.g. Calculus III" value={sessForm.subject_name} onChange={e=>setSessForm(f=>({...f,subject_name:e.target.value}))} required />
                          </div>
                        </div>
                        <div className="sp-field">
                          <label className="sp-lbl">Date *</label>
                          <div className="sp-ig">
                            <span className="sp-ig-ico"><MaterialIcon name="calendar_month" size={16} /></span>
                            <input type="date" className="sp-in sp-date" value={sessForm.session_date} onChange={e=>setSessForm(f=>({...f,session_date:e.target.value}))} required />
                          </div>
                        </div>
                        <div className="sp-field">
                          <label className="sp-lbl">Duration</label>
                          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                            {DUR.map(({l,v})=>(
                              <motion.button key={v} type="button" whileHover={{ scale:1.06 }} whileTap={{ scale:0.95 }} className="sp-dur-btn"
                                style={{ borderColor:sessForm.duration_minutes===v?"var(--pink)":"rgba(255,255,255,0.1)", color:sessForm.duration_minutes===v?"var(--pink)":"var(--text-3)", background:sessForm.duration_minutes===v?"rgba(232,121,249,0.1)":"transparent" }}
                                onClick={()=>setSessForm(f=>({...f,duration_minutes:v}))}>
                                {l}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                        <div className="sp-field">
                          <label className="sp-lbl">Notes</label>
                          <div className="sp-ig">
                            <span className="sp-ig-ico"><MaterialIcon name="edit_note" size={16} /></span>
                            <input className="sp-in" placeholder="What did you cover?" value={sessForm.notes} onChange={e=>setSessForm(f=>({...f,notes:e.target.value}))} />
                          </div>
                        </div>
                        <motion.button type="submit" whileHover={!sessLoading?{ scale:1.02, boxShadow:"0 4px 16px rgba(232,121,249,0.25)" }:{}} whileTap={!sessLoading?{ scale:0.97 }:{}}
                          className="sp-btn sp-btn-secondary" disabled={sessLoading}>
                          {sessLoading
                            ? <><span className="spinner-border spinner-border-sm me-2"/>Logging…</>
                            : <><span style={{ display:"inline-flex", alignItems:"center", marginRight:"8px" }}><MaterialIcon name="play_circle" size={16} /></span>Log Session</>}
                        </motion.button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Deadline list */}
                <section style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <h4 style={{ margin:0, fontSize:"16px", fontWeight:700, fontFamily:"Space Grotesk, sans-serif", color:"var(--text-1)" }}>Critical Deadlines</h4>
                    {!loading && <span className="sp-badge">{pending.length} pending</span>}
                  </div>

                  {loading
                    ? [1,2,3].map(i=><div key={i} className="sp-dl-skel" />)
                    : pending.length===0
                      ? (
                        <div className="sp-empty">
                          <span style={{ opacity:0.25 }}><MaterialIcon name="task_alt" size={36} /></span>
                          <p style={{ margin:0, fontSize:"14px", color:"var(--text-2)" }}>No pending deadlines</p>
                          <p style={{ margin:0, fontSize:"12px", color:"var(--text-4)" }}>Add one using the form above</p>
                        </div>
                      )
                      : (
                        <motion.div variants={container} initial="hidden" animate="show" style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                          {pending.map(dl=>{
                            const cfg=P[dl.priority]||P.Low, tr=timeRemaining(dl.deadline_date), pg=dlProgress(dl.created_at,dl.deadline_date);
                            return (
                              <motion.div key={dl.deadline_id} variants={itemAnim}
                                whileHover={{ y:-2, boxShadow:`0 8px 32px ${cfg.glow}` }}
                                className="sp-dl-card"
                                style={{ background:cfg.bg, borderLeft:`3px solid ${cfg.border}`, boxShadow:`0 4px 20px ${cfg.glow}`, transition:"all 0.2s" }}>
                                <div style={{ position:"absolute", borderRadius:"50%", width:"60px", height:"60px", background:cfg.glow, filter:"blur(20px)", top:"-10px", right:"-10px", pointerEvents:"none" }} />

                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
                                  <h5 style={{ margin:0, fontSize:"14px", fontWeight:700, color:"var(--text-1)", maxWidth:"calc(100% - 80px)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{dl.subject_name}</h5>
                                  <span className="sp-pri-badge" style={{ background:cfg.badge.bg, color:cfg.badge.color, flexShrink:0 }}>{cfg.badge.label}</span>
                                </div>

                                {dl.description && <p style={{ margin:"0 0 6px", fontSize:"12px", color:"var(--text-3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{dl.description}</p>}

                                <p style={{ margin:"0 0 12px", fontSize:"11px", color:"var(--text-4)" }}>
                                  {new Date(dl.deadline_date+"T00:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
                                </p>

                                <div style={{ width:"100%", borderRadius:"999px", overflow:"hidden", marginBottom:"12px", height:"3px", background:"rgba(255,255,255,0.06)" }}>
                                  <motion.div initial={{ width:0 }} animate={{ width:`${pg}%` }} transition={{ duration:0.8, ease:"easeOut" }}
                                    style={{ height:"100%", borderRadius:"999px", background:cfg.border, opacity:0.65 }} />
                                </div>

                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                  <div style={{ display:"flex", alignItems:"center", gap:"6px", color:tr.color }}>
                                    <MaterialIcon name={tr.icon} size={14} />
                                    <span style={{ fontSize:"12px", fontWeight:700 }}>{tr.text}</span>
                                  </div>
                                  <div style={{ display:"flex", gap:"6px" }}>
                                    <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} title="Mark complete" className="sp-act sp-act-done" onClick={()=>handleToggle(dl)}>
                                      <MaterialIcon name="check" size={14} />
                                    </motion.button>
                                    <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} title="Delete" className="sp-act sp-act-del" onClick={()=>handleDelete(dl.deadline_id)}>
                                      <MaterialIcon name="delete" size={14} />
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      )
                  }

                  {completed.length>0 && (
                    <details style={{ marginTop:"4px" }}>
                      <summary className="sp-summary">
                        <MaterialIcon name="expand_more" size={13} />
                        {completed.length} completed
                      </summary>
                      <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginTop:"8px" }}>
                        {completed.map(dl=>(
                          <div key={dl.deadline_id} className="sp-dl-done" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <div style={{ minWidth:0 }}>
                              <p style={{ margin:0, fontWeight:700, textDecoration:"line-through", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:"13px", color:"rgba(212,228,250,0.35)" }}>{dl.subject_name}</p>
                              <p style={{ margin:0, fontSize:"11px", color:"var(--text-4)" }}>{dl.deadline_date}</p>
                            </div>
                            <div style={{ display:"flex", gap:"6px", marginLeft:"8px", flexShrink:0 }}>
                              <button className="sp-act" onClick={()=>handleToggle(dl)} style={{ borderColor:"rgba(255,255,255,0.1)" }}>
                                <MaterialIcon name="undo" size={13} />
                              </button>
                              <button className="sp-act sp-act-del" onClick={()=>handleDelete(dl.deadline_id)}>
                                <MaterialIcon name="delete" size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </section>

                {/* AI Advisor */}
                <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="sp-advisor">
                  <div className="sp-advisor-glow" />
                  <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"14px" }}>
                    <div className="sp-advisor-ico">
                      <MaterialIcon name="robot_2" size={20} style={{ color:"var(--primary-light)" }} />
                    </div>
                    <div style={{ flexGrow:1 }}>
                      <p style={{ margin:0, fontWeight:700, fontSize:"14px", color:"var(--text-1)", fontFamily:"Space Grotesk, sans-serif" }}>Deep Focus AI</p>
                      <p style={{ margin:0, fontSize:"10px", color:"rgba(124,58,237,0.6)", letterSpacing:"0.09em", textTransform:"uppercase" }}>Advisor</p>
                    </div>
                    <span className="sp-live-dot" />
                  </div>
                  <p style={{ margin:0, fontStyle:"italic", fontSize:"13px", lineHeight:1.75, color:"var(--text-2)" }}>
                    {pending.length>0
                      ?`You have ${pending.length} pending deadline${pending.length>1?"s":""}. Prioritise "${pending[0].subject_name}" — it's due soonest.`
                      :"No pending deadlines — great discipline! Keep logging sessions to maintain your streak."}
                  </p>
                </motion.div>

              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .sp-wrap { padding: 28px 32px; min-height: 100vh; overflow: auto; }
        @media(max-width:768px){ .sp-wrap{ padding:16px; } }

        .sp-card {
          background: rgba(12,18,40,0.7);
          border: 1px solid rgba(124,58,237,0.12);
          border-radius: 24px; padding: 24px;
          backdrop-filter: blur(16px);
        }

        .sp-banner-err {
          padding: 12px 18px; border-radius: 14px; font-size: 13px; font-weight: 500;
          background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25); color: var(--red);
        }

        .sp-icon-chip {
          width: 42px; height: 42px; border-radius: 12px;
          background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.25);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .sp-chip {
          display: flex; align-items: center; gap: 10px; padding: 7px 18px;
          border-radius: 999px; white-space: nowrap; font-size: 13px; font-weight: 500;
          border: 1px solid transparent; flex-shrink: 0;
        }
        .sp-chip-a { background: rgba(124,58,237,0.1); border-color: rgba(124,58,237,0.25); color: var(--text-1); }
        .sp-chip-b { background: rgba(232,121,249,0.1); border-color: rgba(232,121,249,0.25); color: var(--text-1); }
        .sp-chip-c { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.25); color: var(--text-1); }
        .sp-chip-ok { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); color: var(--text-3); font-size: 13px; padding: 7px 22px; border-radius: 999px; }
        .sp-time-pill { padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
        .sp-skeleton-pill { width: 200px; height: 38px; border-radius: 999px; background: rgba(255,255,255,0.04); flex-shrink: 0; animation: sp-shimmer 1.5s ease infinite; }

        .sp-cal-wrap { border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; overflow: hidden; background: rgba(0,0,0,0.2); }
        .sp-cal-head { background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .sp-today-dot {
          width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg,#7c3aed,#a78bfa);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 12px; color: #fff;
          box-shadow: 0 0 12px rgba(124,58,237,0.4);
        }
        .sp-nav-btn {
          width: 32px; height: 32px; border-radius: 9px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1); color: var(--text-1);
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: background 0.15s;
        }
        .sp-nav-btn:hover { background: rgba(255,255,255,0.1); }
        .sp-today-btn {
          height: 32px; padding: 0 14px; border-radius: 9px;
          background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.3);
          color: var(--primary-light); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s;
        }
        .sp-today-btn:hover { background: rgba(124,58,237,0.18); }
        .sp-ev {
          border-radius: 6px; padding: 3px 7px; font-size: 11px; font-weight: 500;
          line-height: 1.4; color: var(--text-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .sp-add-hint {
          position: absolute; bottom: 5px; right: 5px;
          color: rgba(199,196,215,0.3); opacity: 0;
          background: rgba(0,0,0,0.35); border-radius: 50%; width: 18px; height: 18px;
          display: flex; align-items: center; justify-content: center;
        }
        .sp-day-col:hover .sp-add-hint { opacity: 1; }

        .sp-stat-card {
          background: rgba(12,18,40,0.7); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 20px; display: flex; flex-direction: column;
          backdrop-filter: blur(12px);
        }
        .sp-stat-a { border-top: 2px solid rgba(124,58,237,0.5); }
        .sp-stat-b { border-top: 2px solid rgba(232,121,249,0.5); }
        .sp-stat-c { border-top: 2px solid rgba(245,158,11,0.5); }
        .sp-stat-icon { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .sp-stat-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-4); margin: 12px 0 4px; }
        .sp-stat-num { font-size: 36px; font-weight: 800; line-height: 1; letter-spacing: -0.03em; color: var(--text-1); margin: 0; font-family: Space Grotesk, sans-serif; }
        .sp-stat-unit { font-size: 14px; font-weight: 400; opacity: 0.4; margin-left: 3px; }
        .sp-stat-sub { font-size: 11px; color: var(--text-4); margin: 5px 0 0; }

        .sp-tabs { display: flex; gap: 5px; padding: 5px; border-radius: 16px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.07); }
        .sp-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 9px 8px; border-radius: 11px; border: none; font-size: 12px; font-weight: 600; cursor: pointer; color: var(--text-4); background: transparent; transition: all 0.15s; font-family: Plus Jakarta Sans, sans-serif; }
        .sp-tab-on { background: rgba(124,58,237,0.12); color: var(--primary-light); border: 1px solid rgba(124,58,237,0.2); }
        .sp-tab:not(.sp-tab-on):hover { background: rgba(255,255,255,0.06); color: var(--text-2); }

        .sp-form-card { background: rgba(12,18,40,0.7); border: 1px solid rgba(124,58,237,0.12); border-radius: 22px; padding: 22px; backdrop-filter: blur(16px); }
        .sp-form-ico { width: 44px; height: 44px; border-radius: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sp-field { display: flex; flex-direction: column; gap: 5px; }
        .sp-lbl { font-size: 10px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--text-4); padding-left: 3px; }
        .sp-ig { position: relative; display: flex; align-items: center; }
        .sp-ig-ico { position: absolute; left: 13px; color: var(--text-4); pointer-events: none; z-index: 1; }
        .sp-in {
          width: 100%; background: rgba(6,6,17,0.8) !important; border: 1px solid rgba(124,58,237,0.2) !important;
          color: var(--text-1) !important; border-radius: 12px !important;
          padding: 10px 13px 10px 40px !important; font-size: 13px !important;
          box-shadow: none !important; outline: none; transition: border-color 0.2s, box-shadow 0.2s; font-family: Plus Jakarta Sans, sans-serif;
        }
        .sp-in:focus { border-color: rgba(124,58,237,0.5) !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.08) !important; }
        .sp-in::placeholder { color: var(--text-4); }
        .sp-date::-webkit-calendar-picker-indicator { filter: invert(0.8); opacity: 0.4; cursor: pointer; }
        .sp-pri-btn { padding: 7px 9px; border-radius: 9px; border: 1px solid; font-size: 12px; font-weight: 700; cursor: pointer; text-align: center; transition: all 0.15s; }
        .sp-dur-btn { padding: 8px 14px; border-radius: 10px; border: 1px solid; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .sp-btn { width: 100%; padding: 12px; border-radius: 14px; border: none; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: Space Grotesk, sans-serif; }
        .sp-btn:hover:not(:disabled) { opacity: 0.88; }
        .sp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sp-btn-primary { background: linear-gradient(135deg,#7c3aed,#a78bfa); color: #fff; }
        .sp-btn-secondary { background: linear-gradient(135deg,#e879f9,#c026d3); color: #fff; }

        .sp-msg { display: flex; align-items: center; gap: 9px; padding: 10px 14px; border-radius: 12px; font-size: 13px; font-weight: 500; }
        .sp-msg-ok  { background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.2); color: var(--primary-light); }
        .sp-msg-err { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); color: var(--red); }

        .sp-dl-card { border-radius: 20px; padding: 18px; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.07); }
        .sp-pri-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; padding: 3px 10px; border-radius: 999px; }
        .sp-badge { background: rgba(124,58,237,0.1); color: var(--primary-light); font-size: 11px; font-weight: 700; padding: 3px 12px; border-radius: 999px; border: 1px solid rgba(124,58,237,0.2); }
        .sp-act { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: var(--text-3); cursor: pointer; padding: 0; transition: all 0.15s; }
        .sp-act:hover { background: rgba(255,255,255,0.08); }
        .sp-act-done:hover { background: rgba(124,58,237,0.15) !important; color: var(--primary-light) !important; border-color: rgba(124,58,237,0.35) !important; }
        .sp-act-del:hover  { background: rgba(248,113,113,0.15) !important; color: var(--red) !important; border-color: rgba(248,113,113,0.35) !important; }
        .sp-dl-skel { height: 120px; border-radius: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); animation: sp-shimmer 1.5s ease infinite; }
        .sp-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 36px 20px; background: rgba(0,0,0,0.15); border: 1px dashed rgba(255,255,255,0.1); border-radius: 20px; text-align: center; }
        .sp-dl-done { padding: 11px 14px; border-radius: 14px; background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.06); }
        .sp-summary { list-style: none; display: flex; align-items: center; gap: 7px; color: var(--text-4); font-size: 12px; cursor: pointer; padding: 5px 3px; }
        details summary::-webkit-details-marker { display: none; }

        .sp-advisor { position: relative; overflow: hidden; background: rgba(124,58,237,0.05); border: 1px solid rgba(124,58,237,0.18); border-radius: 20px; padding: 22px; }
        .sp-advisor-glow { position: absolute; width: 120px; height: 120px; border-radius: 50%; background: radial-gradient(circle,rgba(124,58,237,0.15),transparent 70%); top: -30px; right: -30px; pointer-events: none; }
        .sp-advisor-ico { width: 44px; height: 44px; border-radius: 16px; flex-shrink: 0; background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.25); display: flex; align-items: center; justify-content: center; }
        .sp-live-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 6px var(--green); animation: sp-pulse-dot 2s ease infinite; }

        @keyframes sp-shimmer { 0%,100%{opacity:0.35} 50%{opacity:0.65} }
        @keyframes sp-pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }

        .sp-no-scroll::-webkit-scrollbar { display: none; }
        .sp-no-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .sp-wrap::-webkit-scrollbar { width: 4px; }
        .sp-wrap::-webkit-scrollbar-track { background: transparent; }
        .sp-wrap::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 99px; }
      `}</style>
    </Layout>
  );
}
