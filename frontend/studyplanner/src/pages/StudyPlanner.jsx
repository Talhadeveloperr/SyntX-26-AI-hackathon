import React, { useState, useEffect, useContext, useCallback } from "react";
import Layout from "../components/Layout";
import MaterialIcon from "../components/MaterialIcon";
import { AuthContext } from "../context/AuthContext";
import {
  getDeadlines, addDeadline, updateDeadline, deleteDeadline,
  getSessions, addSession, getStats,
} from "../api/studyplannerApi";

// ─── helpers ──────────────────────────────────────────────────────────────────
function toYMD(date) { return date.toISOString().split("T")[0]; }

function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
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
  if (diff < 0) return { text: "Overdue",              color: "#ffb4ab", glow: "rgba(255,180,171,0.25)", icon: "warning"        };
  const h = Math.floor(diff / 36e5), d = Math.floor(h / 24), r = h % 24;
  if (d === 0) return { text: `${h}h left`,            color: "#ffb4ab", glow: "rgba(255,180,171,0.25)", icon: "timer"          };
  if (d <= 2)  return { text: `${d}d ${r}h left`,      color: "#ffb783", glow: "rgba(255,183,131,0.25)", icon: "schedule"       };
  return             { text: `${d} days left`,         color: "#c7c4d7", glow: "rgba(199,196,215,0.15)", icon: "calendar_today" };
}

function dlProgress(createdAt, deadlineStr) {
  if (!createdAt) return 0;
  const total   = new Date(deadlineStr + "T23:59:59") - new Date(createdAt);
  const elapsed = Date.now() - new Date(createdAt);
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

const P = {
  High:   { border: "#ffb4ab", bg: "rgba(255,180,171,0.06)", glow: "rgba(255,180,171,0.18)", badge: { label: "Urgent",  color: "#ffb4ab", bg: "rgba(255,180,171,0.15)" } },
  Medium: { border: "#ffb783", bg: "rgba(255,183,131,0.06)", glow: "rgba(255,183,131,0.18)", badge: { label: "Warning", color: "#ffb783", bg: "rgba(255,183,131,0.15)" } },
  Low:    { border: "#c0c1ff", bg: "rgba(192,193,255,0.04)", glow: "rgba(192,193,255,0.12)", badge: { label: "Planned", color: "#c7c4d7", bg: "rgba(255,255,255,0.08)"  } },
};

const CAL_CLR = {
  High:   { bg: "rgba(255,180,171,0.18)", bl: "#ffb4ab" },
  Medium: { bg: "rgba(255,183,131,0.18)", bl: "#ffb783" },
  Low:    { bg: "rgba(192,193,255,0.18)", bl: "#c0c1ff" },
};

const DAYS   = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
const DUR    = [{ l:"30m",v:30 },{ l:"1h",v:60 },{ l:"1.5h",v:90 },{ l:"2h",v:120 },{ l:"3h",v:180 }];

// ─── component ────────────────────────────────────────────────────────────────
export default function StudyPlanner() {
  useContext(AuthContext);

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
  }, []);

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

  return (
    <Layout title="Study Planner">
      <div className="sp-wrap overflow-auto">
        <div className="mx-auto" style={{ maxWidth:"1440px" }}>

          <div className="d-flex flex-column gap-5">

            {fetchErr && (
              <div className="sp-banner-err d-flex align-items-center gap-2">
                <MaterialIcon name="error_outline" size={18} />{fetchErr}
              </div>
            )}

            {/* ── AI INSIGHTS ── */}
            <section>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="sp-icon-chip">
                  <MaterialIcon name="auto_awesome" size={20} style={{ color: "#c0c1ff" }} />
                </div>
                <div>
                  <h3 className="m-0" style={{fontSize:"17px",fontWeight:700,fontFamily:"Geist,sans-serif",color:"#d4e4fa"}}>AI Insights</h3>
                  <p className="m-0" style={{fontSize:"11px",color:"rgba(199,196,215,0.5)"}}>Personalized recommendations</p>
                </div>
              </div>
              <div className="d-flex gap-3 overflow-auto pb-1 sp-no-scroll">
                {loading
                  ? [1,2,3].map(i=><div key={i} className="sp-skeleton-pill"/>)
                  : pending.length===0
                    ? <div className="sp-chip sp-chip-ok"><MaterialIcon name="check_circle" size={15} style={{ marginRight: "4px" }} />All clear — no upcoming deadlines!</div>
                    : pending.slice(0,3).map((dl,i)=>{
                        const tr=timeRemaining(dl.deadline_date);
                        const variants=["sp-chip-a","sp-chip-b","sp-chip-c"];
                        const labels=["Focus:","Review:","Due soon:"];
                        return (
                          <div key={dl.deadline_id} className={`sp-chip ${variants[i]}`}>
                            <MaterialIcon name={tr.icon} size={14} />
                            <span className="fw-bold">{labels[i]}</span>
                            <span>{dl.subject_name}</span>
                            <span className="sp-time-pill" style={{background:tr.glow,color:tr.color}}>{tr.text}</span>
                          </div>
                        );
                      })
                }
              </div>
            </section>

            {/* ── MAIN GRID ── */}
            <div className="row g-4">

              {/* ── LEFT 8/12 ── */}
              <div className="col-12 col-lg-8 d-flex flex-column gap-4">

                {/* CALENDAR */}
                <div className="sp-card">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                    <div className="d-flex align-items-center gap-3">
                      <h4 className="m-0" style={{fontFamily:"Geist,sans-serif",fontSize:"22px",fontWeight:700,letterSpacing:"-0.02em",color:"#d4e4fa"}}>
                        {monthLabel(weekDays)}
                      </h4>
                      <div className="d-flex gap-1">
                        <button className="sp-nav-btn" onClick={()=>setWeekStart(d=>{const n=new Date(d);n.setDate(n.getDate()-7);return n;})}>
                          <MaterialIcon name="chevron_left" size={18} />
                        </button>
                        <button className="sp-today-btn" onClick={()=>setWeekStart(getMondayOf(new Date()))}>Today</button>
                        <button className="sp-nav-btn" onClick={()=>setWeekStart(d=>{const n=new Date(d);n.setDate(n.getDate()+7);return n;})}>
                          <MaterialIcon name="chevron_right" size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="d-flex gap-4">
                      {[["#c0c1ff","Deadline"],["#ffb0cd","Session"]].map(([c,l])=>(
                        <div key={l} className="d-flex align-items-center gap-2" style={{fontSize:"11px",color:"rgba(199,196,215,0.55)"}}>
                          <span style={{width:"8px",height:"8px",borderRadius:"2px",background:c,display:"inline-block"}}/>
                          {l}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="w-100" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                    <div className="sp-cal-wrap" style={{ minWidth: "720px" }}>
                      {/* Header row */}
                      <div className="d-flex sp-cal-head">
                        {DAYS.map((name,i)=>{
                          const day=weekDays[i], isT=toYMD(day)===today, isW=i>=5;
                          return (
                            <div key={name} className="flex-fill d-flex flex-column align-items-center py-3 gap-1"
                              style={{borderRight:i<6?"1px solid rgba(255,255,255,0.06)":"none"}}>
                              <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.08em",color:isT?"#c0c1ff":isW?"rgba(255,176,205,0.4)":"rgba(199,196,215,0.4)"}}>
                                {name}
                              </span>
                              {isT
                                ? <span className="sp-today-dot">{day.getDate()}</span>
                                : <span style={{fontSize:"14px",fontWeight:400,color:isW?"rgba(199,196,215,0.3)":"rgba(212,228,250,0.45)"}}>{day.getDate()}</span>
                              }
                            </div>
                          );
                        })}
                      </div>
                      {/* Body row */}
                      <div className="d-flex" style={{minHeight:"200px"}}>
                        {weekDays.map((day,i)=>{
                          const ymd=toYMD(day), isT=ymd===today, isW=i>=5;
                          const dls=dlForDay(day), sess=sessForDay(day);
                          return (
                            <div key={ymd} className="flex-fill p-2 d-flex flex-column gap-1 sp-day-col"
                              style={{
                                borderRight:i<6?"1px solid rgba(255,255,255,0.06)":"none",
                                background:isT?"rgba(192,193,255,0.05)":isW?"rgba(0,0,0,0.12)":"transparent",
                                boxShadow:isT?"inset 0 0 0 1px rgba(192,193,255,0.1)":"none",
                                cursor:"pointer",position:"relative",
                              }}
                              onClick={()=>{ setSessForm(f=>({...f,session_date:ymd})); setRightTab("session"); }}>
                              {dls.map(dl=>{
                                const c=CAL_CLR[dl.priority]||CAL_CLR.Low;
                                return <div key={dl.deadline_id} className="sp-ev" style={{background:c.bg,borderLeft:`2px solid ${c.bl}`}}>{dl.subject_name.length>13?dl.subject_name.slice(0,12)+"…":dl.subject_name}</div>;
                              })}
                              {sess.map(s=>(
                                <div key={s.session_id} className="sp-ev" style={{background:"rgba(255,176,205,0.15)",borderLeft:"2px solid #ffb0cd"}}>
                                  {s.subject_name.length>11?s.subject_name.slice(0,10)+"…":s.subject_name}
                                  <span style={{opacity:0.55,marginLeft:"3px"}}>{s.duration_minutes}m</span>
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
                </div>

                {/* STATS BENTO */}
                <div className="row g-3">
                  {/* Focus hours */}
                  <div className="col-12 col-sm-4">
                    <div className="sp-stat-card sp-stat-a h-100">
                      <div className="sp-stat-icon" style={{background:"rgba(192,193,255,0.1)"}}>
                        <MaterialIcon name="timer" size={20} style={{ color: "#c0c1ff" }} />
                      </div>
                      <p className="sp-stat-label">Focus Hours</p>
                      <p className="sp-stat-num">{loading?"—":stats.focus_hours_week}<span className="sp-stat-unit">hrs</span></p>
                      <p className="sp-stat-sub">last 7 days</p>
                      <div className="d-flex align-items-end gap-1 mt-3" style={{height:"38px"}}>
                        {recentS.length>0
                          ? recentS.map((s,i)=>{
                              const pct=Math.max(10,Math.round((s.duration_minutes/maxMin)*100));
                              return <div key={i} title={`${s.subject_name}: ${s.duration_minutes}m`} className="flex-fill rounded-top" style={{height:`${pct}%`,background:i===recentS.length-1?"linear-gradient(to top,#c0c1ff,#e1e0ff)":"rgba(192,193,255,0.2)",transition:"height 0.5s"}}/>;
                            })
                          : [40,60,100,80,90,30,20].map((h,i)=><div key={i} className="flex-fill rounded-top" style={{height:`${h}%`,background:"rgba(192,193,255,0.08)"}}/>)
                        }
                      </div>
                    </div>
                  </div>

                  {/* Completion */}
                  <div className="col-12 col-sm-4">
                    <div className="sp-stat-card sp-stat-b h-100">
                      <div className="sp-stat-icon" style={{background:"rgba(255,176,205,0.1)"}}>
                        <MaterialIcon name="task_alt" size={20} style={{ color: "#ffb0cd" }} />
                      </div>
                      <p className="sp-stat-label">Completion</p>
                      <p className="sp-stat-num">{loading?"—":`${completionPct}`}<span className="sp-stat-unit">%</span></p>
                      <p className="sp-stat-sub">{nextDL?`Next: ${nextDL.subject_name.slice(0,16)}`:"All done!"}</p>
                      <div className="w-100 rounded-pill overflow-hidden mt-3" style={{height:"4px",background:"rgba(255,255,255,0.07)"}}>
                        <div className="h-100 rounded-pill" style={{width:`${completionPct}%`,background:"linear-gradient(to right,#ffb0cd,#c0c1ff)",transition:"width 0.8s ease"}}/>
                      </div>
                    </div>
                  </div>

                  {/* Pending */}
                  <div className="col-12 col-sm-4">
                    <div className="sp-stat-card sp-stat-c h-100">
                      <div className="sp-stat-icon" style={{background:"rgba(255,183,131,0.1)"}}>
                        <MaterialIcon name="event_busy" size={20} style={{ color: "#ffb783" }} />
                      </div>
                      <p className="sp-stat-label">Pending</p>
                      <p className="sp-stat-num">{loading?"—":pending.length}<span className="sp-stat-unit"> tasks</span></p>
                      <p className="sp-stat-sub">{stats.completed_deadlines} completed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── RIGHT 4/12 ── */}
              <div className="col-12 col-lg-4 d-flex flex-column gap-4">

                {/* TABS */}
                <div className="sp-tabs">
                  {[{k:"deadline",ico:"event_available",lbl:"Add Deadline"},{k:"session",ico:"timer",lbl:"Log Session"}].map(({k,ico,lbl})=>(
                    <button key={k} className={`sp-tab ${rightTab===k?"sp-tab-on":""}`} onClick={()=>setRightTab(k)}>
                      <MaterialIcon name={ico} size={15} style={{ marginRight: "4px" }} />{lbl}
                    </button>
                  ))}
                </div>

                {/* ADD DEADLINE FORM */}
                {rightTab==="deadline"&&(
                  <div className="sp-form-card">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div className="sp-form-ico" style={{background:"rgba(192,193,255,0.1)",border:"1px solid rgba(192,193,255,0.2)"}}>
                        <MaterialIcon name="event_available" size={20} style={{ color: "#c0c1ff" }} />
                      </div>
                      <div>
                        <h4 className="m-0" style={{fontSize:"16px",fontWeight:700,fontFamily:"Geist,sans-serif",color:"#d4e4fa"}}>Add Deadline</h4>
                        <p className="m-0" style={{fontSize:"11px",color:"rgba(199,196,215,0.5)"}}>Sync to your calendar</p>
                      </div>
                    </div>

                    {dlMsg.s&&<div className={`sp-msg ${dlMsg.t==="ok"?"sp-msg-ok":"sp-msg-err"} mb-3`}>
                      <MaterialIcon name={dlMsg.t==="ok"?"check_circle":"error"} size={15} style={{ marginRight: "4px" }} />{dlMsg.s}
                    </div>}

                    <form onSubmit={handleAddDL} className="d-flex flex-column gap-3">
                      <div className="sp-field">
                        <label className="sp-lbl">Subject Name *</label>
                        <div className="sp-ig">
                          <span className="sp-ig-ico" style={{ position: "absolute", left: "13px", zIndex: 1 }}><MaterialIcon name="book" size={16} /></span>
                          <input className="sp-in" placeholder="e.g. Molecular Biology" value={dlForm.subject_name} onChange={e=>setDlForm(f=>({...f,subject_name:e.target.value}))} required/>
                        </div>
                      </div>

                      <div className="sp-field">
                        <label className="sp-lbl">Description</label>
                        <div className="sp-ig">
                          <span className="sp-ig-ico" style={{ position: "absolute", left: "13px", zIndex: 1 }}><MaterialIcon name="notes" size={16} /></span>
                          <input className="sp-in" placeholder="Chapter, topic, notes…" value={dlForm.description} onChange={e=>setDlForm(f=>({...f,description:e.target.value}))}/>
                        </div>
                      </div>

                      <div className="row g-2">
                        <div className="col-7 sp-field">
                          <label className="sp-lbl">Date *</label>
                          <div className="sp-ig">
                            <span className="sp-ig-ico" style={{ position: "absolute", left: "13px", zIndex: 1 }}><MaterialIcon name="calendar_month" size={16} /></span>
                            <input type="date" className="sp-in sp-date" value={dlForm.deadline_date} onChange={e=>setDlForm(f=>({...f,deadline_date:e.target.value}))} required/>
                          </div>
                        </div>
                        <div className="col-5 sp-field">
                          <label className="sp-lbl">Priority</label>
                          <div className="d-flex flex-column gap-1">
                            {["High","Medium","Low"].map(p=>(
                              <button key={p} type="button" className="sp-pri-btn"
                                style={{borderColor:dlForm.priority===p?P[p].border:"rgba(255,255,255,0.1)",color:dlForm.priority===p?P[p].border:"rgba(199,196,215,0.5)",background:dlForm.priority===p?P[p].bg:"transparent"}}
                                onClick={()=>setDlForm(f=>({...f,priority:p}))}>
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button type="submit" className="sp-btn sp-btn-primary" disabled={dlLoading}>
                        {dlLoading?<><span className="spinner-border spinner-border-sm me-2"/>Saving…</>
                          :<><span className="me-2" style={{ display: "inline-flex", alignItems: "center" }}><MaterialIcon name="add_circle" size={16} /></span>Sync to Calendar</>}
                      </button>
                    </form>
                  </div>
                )}

                {/* LOG SESSION FORM */}
                {rightTab==="session"&&(
                  <div className="sp-form-card">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div className="sp-form-ico" style={{background:"rgba(255,176,205,0.1)",border:"1px solid rgba(255,176,205,0.2)"}}>
                        <MaterialIcon name="timer" size={20} style={{ color: "#ffb0cd" }} />
                      </div>
                      <div>
                        <h4 className="m-0" style={{fontSize:"16px",fontWeight:700,fontFamily:"Geist,sans-serif",color:"#d4e4fa"}}>Log Session</h4>
                        <p className="m-0" style={{fontSize:"11px",color:"rgba(199,196,215,0.5)"}}>Track your focus time</p>
                      </div>
                    </div>

                    {sessMsg.s&&<div className={`sp-msg ${sessMsg.t==="ok"?"sp-msg-ok":"sp-msg-err"} mb-3`}>
                      <MaterialIcon name={sessMsg.t==="ok"?"check_circle":"error"} size={15} style={{ marginRight: "4px" }} />{sessMsg.s}
                    </div>}

                    <form onSubmit={handleAddSess} className="d-flex flex-column gap-3">
                      <div className="sp-field">
                        <label className="sp-lbl">Subject *</label>
                        <div className="sp-ig">
                          <span className="sp-ig-ico" style={{ position: "absolute", left: "13px", zIndex: 1 }}><MaterialIcon name="school" size={16} /></span>
                          <input className="sp-in" placeholder="e.g. Calculus III" value={sessForm.subject_name} onChange={e=>setSessForm(f=>({...f,subject_name:e.target.value}))} required/>
                        </div>
                      </div>

                      <div className="sp-field">
                        <label className="sp-lbl">Date *</label>
                        <div className="sp-ig">
                          <span className="sp-ig-ico" style={{ position: "absolute", left: "13px", zIndex: 1 }}><MaterialIcon name="calendar_month" size={16} /></span>
                          <input type="date" className="sp-in sp-date" value={sessForm.session_date} onChange={e=>setSessForm(f=>({...f,session_date:e.target.value}))} required/>
                        </div>
                      </div>

                      <div className="sp-field">
                        <label className="sp-lbl">Duration</label>
                        <div className="d-flex gap-2 flex-wrap">
                          {DUR.map(({l,v})=>(
                            <button key={v} type="button" className="sp-dur-btn"
                              style={{borderColor:sessForm.duration_minutes===v?"#ffb0cd":"rgba(255,255,255,0.1)",color:sessForm.duration_minutes===v?"#ffb0cd":"rgba(199,196,215,0.5)",background:sessForm.duration_minutes===v?"rgba(255,176,205,0.1)":"transparent"}}
                              onClick={()=>setSessForm(f=>({...f,duration_minutes:v}))}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="sp-field">
                        <label className="sp-lbl">Notes</label>
                        <div className="sp-ig">
                          <span className="sp-ig-ico" style={{ position: "absolute", left: "13px", zIndex: 1 }}><MaterialIcon name="edit_note" size={16} /></span>
                          <input className="sp-in" placeholder="What did you cover?" value={sessForm.notes} onChange={e=>setSessForm(f=>({...f,notes:e.target.value}))}/>
                        </div>
                      </div>

                      <button type="submit" className="sp-btn sp-btn-secondary" disabled={sessLoading}>
                        {sessLoading?<><span className="spinner-border spinner-border-sm me-2"/>Logging…</>
                          :<><span className="me-2" style={{ display: "inline-flex", alignItems: "center" }}><MaterialIcon name="play_circle" size={16} /></span>Log Session</>}
                      </button>
                    </form>
                  </div>
                )}

                {/* DEADLINE LIST */}
                <section className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h4 className="m-0" style={{fontSize:"16px",fontWeight:700,fontFamily:"Geist,sans-serif",color:"#d4e4fa"}}>Critical Deadlines</h4>
                    {!loading&&<span className="sp-badge">{pending.length} pending</span>}
                  </div>

                  {loading
                    ? [1,2,3].map(i=><div key={i} className="sp-dl-skel"/>)
                    : pending.length===0
                      ? <div className="sp-empty">
                          <span style={{opacity:0.25}}><MaterialIcon name="task_alt" size={36} /></span>
                          <p className="m-0" style={{fontSize:"14px",color:"rgba(212,228,250,0.5)"}}>No pending deadlines</p>
                          <p className="m-0" style={{fontSize:"12px",color:"rgba(199,196,215,0.35)"}}>Add one using the form above</p>
                        </div>
                      : pending.map(dl=>{
                          const cfg=P[dl.priority]||P.Low, tr=timeRemaining(dl.deadline_date), pg=dlProgress(dl.created_at,dl.deadline_date);
                          return (
                            <div key={dl.deadline_id} className="sp-dl-card"
                              style={{background:cfg.bg,borderLeft:`3px solid ${cfg.border}`,boxShadow:`0 4px 24px ${cfg.glow}`}}>
                              {/* glow orb */}
                              <div className="position-absolute rounded-circle" style={{width:"70px",height:"70px",background:cfg.glow,filter:"blur(22px)",top:"-10px",right:"-10px",pointerEvents:"none"}}/>

                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h5 className="m-0 text-truncate me-2" style={{fontSize:"14px",fontWeight:700,color:"#d4e4fa",maxWidth:"calc(100% - 76px)"}}>{dl.subject_name}</h5>
                                <span className="sp-pri-badge flex-shrink-0" style={{background:cfg.badge.bg,color:cfg.badge.color}}>{cfg.badge.label}</span>
                              </div>

                              {dl.description&&<p className="m-0 mb-2 text-truncate" style={{fontSize:"12px",color:"rgba(199,196,215,0.6)"}}>{dl.description}</p>}

                              <p className="m-0 mb-3" style={{fontSize:"11px",color:"rgba(199,196,215,0.4)"}}>
                                {new Date(dl.deadline_date+"T00:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
                              </p>

                              {/* progress bar */}
                              <div className="w-100 rounded-pill overflow-hidden mb-3" style={{height:"3px",background:"rgba(255,255,255,0.06)"}}>
                                <div className="h-100 rounded-pill" style={{width:`${pg}%`,background:cfg.border,transition:"width 0.6s ease",opacity:0.65}}/>
                              </div>

                              <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2" style={{color:tr.color}}>
                                  <MaterialIcon name={tr.icon} size={14} />
                                  <span style={{fontSize:"12px",fontWeight:700}}>{tr.text}</span>
                                </div>
                                <div className="d-flex gap-2">
                                  <button title="Mark complete" className="sp-act sp-act-done" onClick={()=>handleToggle(dl)}>
                                    <MaterialIcon name="check" size={14} />
                                  </button>
                                  <button title="Delete" className="sp-act sp-act-del" onClick={()=>handleDelete(dl.deadline_id)}>
                                    <MaterialIcon name="delete" size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                  }

                  {/* Completed (collapsible) */}
                  {completed.length>0&&(
                    <details className="mt-1">
                      <summary className="sp-summary">
                        <MaterialIcon name="expand_more" size={13} />
                        {completed.length} completed
                      </summary>
                      <div className="d-flex flex-column gap-2 mt-2">
                        {completed.map(dl=>(
                          <div key={dl.deadline_id} className="sp-dl-done d-flex justify-content-between align-items-center">
                            <div style={{minWidth:0}}>
                              <p className="m-0 fw-bold text-decoration-line-through text-truncate" style={{fontSize:"13px",color:"rgba(212,228,250,0.4)"}}>{dl.subject_name}</p>
                              <p className="m-0" style={{fontSize:"11px",color:"rgba(199,196,215,0.3)"}}>{dl.deadline_date}</p>
                            </div>
                            <div className="d-flex gap-2 ms-2 flex-shrink-0">
                              <button className="sp-act" onClick={()=>handleToggle(dl)} style={{borderColor:"rgba(255,255,255,0.12)"}}>
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

                {/* AI ADVISOR */}
                <div className="sp-advisor">
                  <div className="sp-advisor-glow"/>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="sp-advisor-ico">
                      <MaterialIcon name="robot_2" size={20} style={{ color: "#c0c1ff" }} />
                    </div>
                    <div className="flex-grow-1">
                      <p className="m-0 fw-bold" style={{fontSize:"14px",color:"#d4e4fa",fontFamily:"Geist,sans-serif"}}>Deep Focus AI</p>
                      <p className="m-0" style={{fontSize:"10px",color:"rgba(192,193,255,0.5)",letterSpacing:"0.08em",textTransform:"uppercase"}}>Advisor</p>
                    </div>
                    <span className="sp-live-dot"/>
                  </div>
                  <p className="m-0 fst-italic" style={{fontSize:"13px",lineHeight:1.75,color:"rgba(199,196,215,0.75)"}}>
                    {pending.length>0
                      ?`You have ${pending.length} pending deadline${pending.length>1?"s":""}. Prioritise "${pending[0].subject_name}" — it's due soonest.`
                      :"No pending deadlines — great discipline! Keep logging sessions to maintain your streak."}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .sp-wrap { padding: 28px 32px; min-height: 100vh; }
        @media(max-width:768px){ .sp-wrap{ padding:16px; } }

        .sp-card {
          background: rgba(12,22,35,0.7);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 24px; padding: 24px;
        }

        .sp-banner-err {
          padding: 12px 18px; border-radius: 14px; font-size: 13px; font-weight: 500;
          background: rgba(255,180,171,0.1); border: 1px solid rgba(255,180,171,0.28); color: #ffb4ab;
        }

        .sp-icon-chip {
          width: 40px; height: 40px; border-radius: 12px;
          background: rgba(192,193,255,0.1); border: 1px solid rgba(192,193,255,0.25);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .sp-chip {
          display: flex; align-items: center; gap: 10px; padding: 7px 18px;
          border-radius: 999px; white-space: nowrap; font-size: 13px; font-weight: 500;
          border: 1px solid transparent; flex-shrink: 0;
        }
        .sp-chip-a { background: rgba(192,193,255,0.1); border-color: rgba(192,193,255,0.25); color: #eef2ff; }
        .sp-chip-b { background: rgba(255,176,205,0.1); border-color: rgba(255,176,205,0.25); color: #eef2ff; }
        .sp-chip-c { background: rgba(255,183,131,0.1); border-color: rgba(255,183,131,0.25); color: #eef2ff; }
        .sp-chip-ok { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.12); color: rgba(212,228,250,0.7); font-size: 13px; padding: 7px 22px; border-radius: 999px; }
        .sp-time-pill { padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
        .sp-skeleton-pill { width: 200px; height: 38px; border-radius: 999px; background: rgba(255,255,255,0.05); flex-shrink: 0; }

        .sp-cal-wrap { border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; background: rgba(0,0,0,0.2); }
        .sp-cal-head { background: rgba(0,0,0,0.35); border-bottom: 1px solid rgba(255,255,255,0.07); }
        .sp-today-dot {
          width: 26px; height: 26px; border-radius: 50%; background: #c0c1ff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 12px; color: #051424;
        }
        .sp-nav-btn {
          width: 32px; height: 32px; border-radius: 9px; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12); color: #d4e4fa;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .sp-nav-btn:hover { background: rgba(255,255,255,0.1); }
        .sp-today-btn {
          height: 32px; padding: 0 14px; border-radius: 9px;
          background: rgba(192,193,255,0.1); border: 1px solid rgba(192,193,255,0.25);
          color: #c0c1ff; font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .sp-today-btn:hover { background: rgba(192,193,255,0.18); }
        .sp-day-col { border-radius: 6px; }
        .sp-day-col:hover { background: rgba(255,255,255,0.05) !important; }
        .sp-ev {
          border-radius: 6px; padding: 3px 7px; font-size: 11px; font-weight: 500;
          line-height: 1.4; color: #eef2ff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .sp-add-hint {
          position: absolute; bottom: 5px; right: 5px;
          color: rgba(199,196,215,0.35); opacity: 0;
          background: rgba(0,0,0,0.35); border-radius: 50%; width: 18px; height: 18px;
          display: flex; align-items: center; justify-content: center;
        }
        .sp-day-col:hover .sp-add-hint { opacity: 1; }

        .sp-stat-card {
          background: rgba(12,22,35,0.7);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 20px;
          display: flex; flex-direction: column;
        }
        .sp-stat-a { border-top: 2px solid rgba(192,193,255,0.4); }
        .sp-stat-b { border-top: 2px solid rgba(255,176,205,0.4); }
        .sp-stat-c { border-top: 2px solid rgba(255,183,131,0.4); }
        .sp-stat-icon { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .sp-stat-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(212,228,250,0.5); margin: 12px 0 4px; }
        .sp-stat-num { font-size: 34px; font-weight: 800; line-height: 1; letter-spacing: -0.03em; color: #fff; margin: 0; }
        .sp-stat-unit { font-size: 14px; font-weight: 400; opacity: 0.45; margin-left: 3px; }
        .sp-stat-sub { font-size: 11px; color: rgba(212,228,250,0.45); margin: 5px 0 0; }

        .sp-tabs { display: flex; gap: 5px; padding: 5px; border-radius: 16px; background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.08); }
        .sp-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 9px 8px; border-radius: 11px; border: none; font-size: 12px; font-weight: 600; cursor: pointer; color: rgba(212,228,250,0.55); background: transparent; }
        .sp-tab-on { background: rgba(192,193,255,0.12); color: #e0e1ff; border: 1px solid rgba(192,193,255,0.18); }
        .sp-tab:not(.sp-tab-on):hover { background: rgba(255,255,255,0.07); color: rgba(212,228,250,0.85); }

        .sp-form-card { background: rgba(12,22,35,0.7); border: 1px solid rgba(255,255,255,0.09); border-radius: 22px; padding: 22px; }
        .sp-form-ico { width: 44px; height: 44px; border-radius: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sp-field { display: flex; flex-direction: column; gap: 5px; }
        .sp-lbl { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(212,228,250,0.55); padding-left: 3px; }
        .sp-ig { position: relative; display: flex; align-items: center; }
        .sp-ig-ico { position: absolute; left: 13px; font-size: 16px; color: rgba(212,228,250,0.35); pointer-events: none; z-index: 1; }
        .sp-in {
          width: 100%; background: rgba(0,0,0,0.4) !important; border: 1px solid rgba(255,255,255,0.1) !important;
          color: #fff !important; border-radius: 12px !important;
          padding: 10px 13px 10px 40px !important; font-size: 13px !important;
          box-shadow: none !important; outline: none;
        }
        .sp-in:focus { border-color: rgba(192,193,255,0.45) !important; background: rgba(0,0,0,0.55) !important; }
        .sp-in::placeholder { color: rgba(212,228,250,0.28); }
        .sp-date::-webkit-calendar-picker-indicator { filter: invert(0.8); opacity: 0.5; cursor: pointer; }
        .sp-pri-btn { padding: 7px 9px; border-radius: 9px; border: 1px solid; font-size: 12px; font-weight: 700; cursor: pointer; text-align: center; }
        .sp-dur-btn { padding: 7px 13px; border-radius: 9px; border: 1px solid; font-size: 12px; font-weight: 600; cursor: pointer; }
        .sp-btn { width: 100%; padding: 11px; border-radius: 12px; border: none; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .sp-btn:hover:not(:disabled) { opacity: 0.88; }
        .sp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sp-btn-primary { background: linear-gradient(135deg,#c0c1ff,#9a9be0); color: #0a0f1f; }
        .sp-btn-secondary { background: linear-gradient(135deg,#ffb0cd,#e88db0); color: #0a0f1f; }

        .sp-msg { display: flex; align-items: center; gap: 9px; padding: 9px 14px; border-radius: 12px; font-size: 13px; font-weight: 500; }
        .sp-msg-ok  { background: rgba(192,193,255,0.1); border: 1px solid rgba(192,193,255,0.25); color: #c0c1ff; }
        .sp-msg-err { background: rgba(255,180,171,0.1); border: 1px solid rgba(255,180,171,0.25); color: #ffb4ab; }

        .sp-dl-card { border-radius: 20px; padding: 18px; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
        .sp-pri-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; padding: 3px 10px; border-radius: 999px; }
        .sp-badge { background: rgba(192,193,255,0.1); color: #c0c1ff; font-size: 11px; font-weight: 700; padding: 3px 12px; border-radius: 999px; border: 1px solid rgba(192,193,255,0.2); }
        .sp-act { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.25); color: rgba(212,228,250,0.65); cursor: pointer; padding: 0; }
        .sp-act:hover { background: rgba(255,255,255,0.09); }
        .sp-act-done:hover { background: rgba(192,193,255,0.15) !important; color: #e0e1ff !important; border-color: rgba(192,193,255,0.35) !important; }
        .sp-act-del:hover  { background: rgba(255,180,171,0.15) !important; color: #ffc0b4 !important; border-color: rgba(255,180,171,0.35) !important; }
        .sp-dl-skel { height: 120px; border-radius: 20px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); }
        .sp-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 36px 20px; background: rgba(0,0,0,0.18); border: 1px dashed rgba(255,255,255,0.12); border-radius: 20px; text-align: center; }
        .sp-dl-done { padding: 11px 14px; border-radius: 14px; background: rgba(0,0,0,0.18); border: 1px solid rgba(255,255,255,0.06); }
        .sp-summary { list-style: none; display: flex; align-items: center; gap: 7px; color: rgba(212,228,250,0.45); font-size: 12px; cursor: pointer; padding: 5px 3px; }
        details summary::-webkit-details-marker { display: none; }

        .sp-advisor { position: relative; overflow: hidden; background: rgba(192,193,255,0.05); border: 1px solid rgba(192,193,255,0.18); border-radius: 20px; padding: 22px; }
        .sp-advisor-glow { position: absolute; width: 120px; height: 120px; border-radius: 50%; background: radial-gradient(circle,rgba(192,193,255,0.15),transparent 70%); top: -30px; right: -30px; pointer-events: none; }
        .sp-advisor-ico { width: 44px; height: 44px; border-radius: 16px; flex-shrink: 0; background: rgba(192,193,255,0.1); border: 1px solid rgba(192,193,255,0.25); display: flex; align-items: center; justify-content: center; }
        .sp-live-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #4caf50; }

        @keyframes sp-shimmer { 0%,100%{ opacity:0.4; } 50%{ opacity:0.75; } }

        .sp-no-scroll::-webkit-scrollbar { display: none; }
        .sp-no-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .sp-wrap::-webkit-scrollbar { width: 5px; }
        .sp-wrap::-webkit-scrollbar-track { background: transparent; }
        .sp-wrap::-webkit-scrollbar-thumb { background: rgba(192,193,255,0.25); border-radius: 99px; }
      `}</style>
    </Layout>
  );
}