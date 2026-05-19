import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../components/Layout";
import MaterialIcon from "../components/MaterialIcon";
import { useStudyMaterials } from "../context/StudyMaterialsContext";
import { generateQuiz, submitQuiz } from "../api/quizApi";

const COUNTS = [2, 4, 6];

const QUESTION = {
  text: "Which principle states that it is impossible to simultaneously know both the precise position and momentum of a particle?",
  options: [
    { id: "a", text: "Schrödinger's Cat Paradox",        state: "neutral" },
    { id: "b", text: "Heisenberg Uncertainty Principle", state: "correct" },
    { id: "c", text: "Planck's Constant Hypothesis",     state: "wrong"   },
    { id: "d", text: "Bohr's Atomic Model",              state: "neutral" },
  ],
};

function optionStyle(state) {
  if (state === "correct") return { background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.4)", color: "var(--green)" };
  if (state === "wrong")   return { background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.35)", color: "var(--red)" };
  return { background: "rgba(12,12,30,0.5)", border: "1px solid rgba(255,255,255,0.09)", color: "var(--text-2)" };
}

const panel = {
  background: "rgba(12,18,40,0.6)",
  border: "1px solid rgba(124,58,237,0.12)",
  backdropFilter: "blur(16px)",
  borderRadius: "20px",
};

export default function QuizGenerator() {
  const [subject,    setSubject]    = useState(null);
  const [difficulty, setDifficulty] = useState(3);
  const [count,      setCount]      = useState(20);

  const diffLabel = ["", "Easy", "Medium", "Hard"][difficulty];
  const diffColor = ["", "var(--green)", "var(--gold)", "var(--red)"][difficulty];

  const { subjects, subjectDocs, loading, addSubject, removeSubject, addDocs } = useStudyMaterials();

  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [addingSubject,   setAddingSubject]   = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [docDragOver,     setDocDragOver]     = useState(false);
  const [expandedLibId,   setExpandedLibId]   = useState(null);
  const [stagedFiles,     setStagedFiles]     = useState({});
  const [saving,          setSaving]          = useState(false);
  const [subjectAdding,   setSubjectAdding]   = useState(false);

  const [quizData,     setQuizData]     = useState(null);
  const [quizLoading,  setQuizLoading]  = useState(false);
  const [quizError,    setQuizError]    = useState(null);
  const [currentQIdx,  setCurrentQIdx]  = useState(0);
  const [selectedOpt,  setSelectedOpt]  = useState(null);
  const [revealed,     setRevealed]     = useState(false);
  const [answers,      setAnswers]      = useState([]);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitting,   setSubmitting]   = useState(false);

  const activeSubject    = subjects.find(s => s.id === activeSubjectId) || null;
  const activeStagedDocs = stagedFiles[activeSubjectId] || [];

  useEffect(() => {
    if (subjects.length > 0 && subject === null) setSubject(subjects[0].id);
  }, [subjects, subject]);

  useEffect(() => {
    if (subject === null) return;
    const sel = subjects.find(s => s.id === subject);
    console.log("Quiz Generator Payload:", { student_id: 1, subject_id: subject, subject_name: sel?.name ?? "", difficulty: ["","Easy","Medium","Hard"][difficulty], num_questions: count });
  }, [subject, difficulty, count, subjects]);

  const handleAddSubject = async () => {
    const name = newSubjectInput.trim();
    if (!name || subjectAdding) return;
    setSubjectAdding(true);
    try {
      const id = await addSubject(name);
      setNewSubjectInput(""); setAddingSubject(false); setActiveSubjectId(id);
    } catch { /* silent */ }
    finally { setSubjectAdding(false); }
  };

  const handleRemoveSubject = (id) => {
    removeSubject(id);
    if (activeSubjectId === id) setActiveSubjectId(null);
    setStagedFiles(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const pushDocs = (files) => {
    if (!activeSubjectId || !files.length) return;
    setStagedFiles(prev => ({ ...prev, [activeSubjectId]: [...(prev[activeSubjectId] || []), ...Array.from(files)] }));
  };

  const handleDocFileChange = (e) => pushDocs(e.target.files);
  const handleDocDrop = (e) => { e.preventDefault(); setDocDragOver(false); pushDocs(e.dataTransfer.files); };

  const handleRemoveStagedFile = (idx) => {
    setStagedFiles(prev => ({ ...prev, [activeSubjectId]: (prev[activeSubjectId] || []).filter((_, i) => i !== idx) }));
  };

  const handleSaveDocs = async () => {
    const files = stagedFiles[activeSubjectId];
    if (!activeSubjectId || !files?.length) return;
    setSaving(true);
    try { await addDocs(activeSubjectId, files); setStagedFiles(prev => { const n = { ...prev }; delete n[activeSubjectId]; return n; }); }
    catch { /* silent */ }
    finally { setSaving(false); }
  };

  const docTypeIcon = (name) => {
    const ext = name.split(".").pop().toLowerCase();
    if (["pdf"].includes(ext))                    return { icon: "picture_as_pdf", color: "var(--pink)" };
    if (["doc","docx"].includes(ext))             return { icon: "description",    color: "var(--primary-light)" };
    if (["ppt","pptx"].includes(ext))             return { icon: "slideshow",      color: "var(--gold)" };
    if (["jpg","jpeg","png","gif"].includes(ext)) return { icon: "image",          color: "var(--green)" };
    return { icon: "insert_drive_file", color: "var(--text-2)" };
  };

  const currentQ    = quizData ? quizData.questions[currentQIdx] : null;
  const totalQ      = quizData ? quizData.questions.length : count;
  const isLastQ     = quizData ? currentQIdx === quizData.questions.length - 1 : false;
  const progressPct = quizData ? Math.round((currentQIdx / quizData.questions.length) * 100) : 20;

  const getOptState = (optId) => {
    if (!revealed) return "neutral";
    if (optId === currentQ?.correct_option_id) return "correct";
    if (optId === selectedOpt) return "wrong";
    return "neutral";
  };

  const handleGenerateQuiz = async () => {
    if (subject === null) return;
    const sel = subjects.find(s => s.id === subject);
    const payload = { student_id: 1, subject_id: subject, subject_name: sel?.name ?? "", difficulty: ["","Easy","Medium","Hard"][difficulty], num_questions: count };
    setQuizLoading(true); setQuizError(null); setQuizData(null); setCurrentQIdx(0); setSelectedOpt(null); setRevealed(false); setAnswers([]); setSubmitResult(null);
    try { const data = await generateQuiz(payload); setQuizData(data); }
    catch { setQuizError("Failed to generate quiz. Please try again."); }
    finally { setQuizLoading(false); }
  };

  const handleSelectOption = (optId) => { if (revealed) return; setSelectedOpt(optId); setRevealed(true); };

  const advanceOrSubmit = async (allAnswers) => {
    if (isLastQ) {
      setSubmitting(true);
      try { const res = await submitQuiz({ quiz_id: quizData.quiz_id, student_id: 1, answers: allAnswers }); setSubmitResult(res); }
      catch { /* silent */ }
      finally { setSubmitting(false); }
    } else {
      setAnswers(allAnswers); setCurrentQIdx(i => i + 1); setSelectedOpt(null); setRevealed(false);
    }
  };

  const handleNext = () => {
    if (!currentQ || !revealed || submitting) return;
    advanceOrSubmit([...answers, { question_id: currentQ.question_id, selected_option_id: selectedOpt }]);
  };

  const handleSkip = () => {
    if (!quizData || submitting) return;
    const rec = currentQ ? { question_id: currentQ.question_id, selected_option_id: 0 } : null;
    advanceOrSubmit(rec ? [...answers, rec] : answers);
  };

  const handleRetry = () => {
    setSubmitResult(null); setQuizData(null); setCurrentQIdx(0); setSelectedOpt(null); setRevealed(false); setAnswers([]); setQuizError(null);
  };

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item      = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  return (
    <Layout title="Quiz Generator">
      <div style={{ padding: "28px 32px", minHeight: "100vh" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Study Materials */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ ...panel, padding: "22px 26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: (loading || subjects.length) ? "18px" : "0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MaterialIcon name="library_books" size={19} style={{ color: "var(--primary-light)" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>Study Materials</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-3)" }}>Add subjects and upload your documents</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setAddingSubject(v => !v); setNewSubjectInput(""); }}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "10px", cursor: "pointer", background: addingSubject ? "rgba(124,58,237,0.15)" : "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", color: "var(--primary-light)", fontSize: "12px", fontWeight: 700 }}
              >
                <MaterialIcon name={addingSubject ? "close" : "add"} size={15} />
                {addingSubject ? "Cancel" : "Add Subject"}
              </motion.button>
            </div>

            <AnimatePresence>
              {addingSubject && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ display: "flex", gap: "8px", marginBottom: subjects.length ? "18px" : "0", overflow: "hidden" }}
                >
                  <input
                    autoFocus value={newSubjectInput}
                    onChange={e => setNewSubjectInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !subjectAdding && handleAddSubject()}
                    placeholder="e.g. Quantum Physics, World History…"
                    style={{ flex: 1, padding: "10px 14px", background: "rgba(6,6,17,0.8)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "10px", color: "var(--text-1)", fontSize: "13px", outline: "none", transition: "border-color 0.2s" }}
                    onFocus={e => e.target.style.borderColor = "rgba(124,58,237,0.6)"}
                    onBlur={e => e.target.style.borderColor = "rgba(124,58,237,0.3)"}
                  />
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleAddSubject} disabled={subjectAdding}
                    style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: subjectAdding ? "not-allowed" : "pointer", opacity: subjectAdding ? 0.7 : 1 }}
                  >
                    {subjectAdding ? "Adding…" : "Add"}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {loading && subjects.length === 0 && !addingSubject && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[1, 2, 3].map(i => <div key={i} style={{ height: "30px", width: "110px", borderRadius: "999px", background: "rgba(12,12,30,0.6)", animation: "qz-pulse 1.5s ease infinite" }} />)}
              </div>
            )}

            {subjects.length > 0 && (
              <motion.div variants={container} initial="hidden" animate="show" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: activeSubject ? "20px" : "0" }}>
                {subjects.map(s => (
                  <motion.div key={s.id} variants={item}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    style={{ display: "flex", alignItems: "center", gap: "7px", padding: "7px 14px", borderRadius: "999px", cursor: "pointer", background: activeSubjectId === s.id ? "rgba(124,58,237,0.15)" : "rgba(12,12,30,0.6)", border: `1px solid ${activeSubjectId === s.id ? "rgba(124,58,237,0.45)" : "rgba(255,255,255,0.1)"}`, transition: "all 0.2s" }}
                    onClick={() => setActiveSubjectId(activeSubjectId === s.id ? null : s.id)}
                  >
                    <MaterialIcon name="folder" size={13} style={{ color: activeSubjectId === s.id ? "var(--primary-light)" : "var(--text-3)" }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: activeSubjectId === s.id ? "var(--primary-light)" : "var(--text-2)" }}>{s.name}</span>
                    {subjectDocs[s.id]?.length > 0 && (
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--primary-light)", background: "rgba(124,58,237,0.2)", borderRadius: "999px", padding: "1px 7px" }}>{subjectDocs[s.id].length}</span>
                    )}
                    <button onClick={e => { e.stopPropagation(); handleRemoveSubject(s.id); }} style={{ background: "none", border: "none", padding: "0 0 0 2px", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--text-4)" }}>
                      <MaterialIcon name="close" size={12} />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <AnimatePresence>
              {activeSubject && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ borderTop: "1px solid rgba(124,58,237,0.1)", paddingTop: "18px", overflow: "hidden" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Documents — {activeSubject.name}</p>
                    <label style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", background: "rgba(12,12,30,0.6)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-2)", fontSize: "11px", fontWeight: 600 }}>
                      <MaterialIcon name="upload_file" size={13} />
                      Browse files
                      <input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.png" onChange={handleDocFileChange} style={{ display: "none" }} />
                    </label>
                  </div>

                  <div
                    onDragOver={e => { e.preventDefault(); setDocDragOver(true); }}
                    onDragLeave={() => setDocDragOver(false)}
                    onDrop={handleDocDrop}
                    style={{ borderRadius: "12px", padding: activeStagedDocs.length ? "12px" : "32px 20px", border: `1.5px dashed ${docDragOver ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.1)"}`, background: docDragOver ? "rgba(124,58,237,0.05)" : "transparent", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: "8px", alignItems: activeStagedDocs.length ? "stretch" : "center", justifyContent: activeStagedDocs.length ? "flex-start" : "center" }}
                  >
                    {activeStagedDocs.length === 0 ? (
                      <>
                        <MaterialIcon name="cloud_upload" size={30} style={{ color: "rgba(124,58,237,0.3)" }} />
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-4)", textAlign: "center" }}>Drag &amp; drop books, notes, or slides here</p>
                      </>
                    ) : activeStagedDocs.map((file, idx) => {
                      const { icon, color } = docTypeIcon(file.name);
                      return (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px", background: "rgba(12,12,30,0.5)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <MaterialIcon name={icon} size={16} style={{ color, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: "12px", color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                          <button onClick={() => handleRemoveStagedFile(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", display: "flex", padding: 0 }}>
                            <MaterialIcon name="close" size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {activeStagedDocs.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSaveDocs} disabled={saving}
                        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 20px", borderRadius: "10px", border: "none", cursor: saving ? "not-allowed" : "pointer", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", color: "#fff", fontSize: "12px", fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
                        <MaterialIcon name={saving ? "hourglass_top" : "cloud_upload"} size={14} />
                        {saving ? "Uploading…" : `Save ${activeStagedDocs.length} document${activeStagedDocs.length !== 1 ? "s" : ""}`}
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Study Library */}
          {subjects.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ ...panel, padding: "20px 26px" }}>
              <p style={{ margin: "0 0 14px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>
                Study Library — {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {subjects.map(s => {
                  const docs = subjectDocs[s.id] || [];
                  const open = expandedLibId === s.id;
                  return (
                    <div key={s.id} style={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                      <button onClick={() => setExpandedLibId(open ? null : s.id)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "11px 16px", background: open ? "rgba(124,58,237,0.06)" : "rgba(255,255,255,0.02)", border: "none", cursor: "pointer", textAlign: "left" }}>
                        <MaterialIcon name="folder" size={15} style={{ color: open ? "var(--primary-light)" : "var(--text-3)", flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: open ? "var(--text-1)" : "var(--text-2)" }}>{s.name}</span>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-4)" }}>{docs.length} doc{docs.length !== 1 ? "s" : ""}</span>
                        <MaterialIcon name={open ? "expand_less" : "expand_more"} size={15} style={{ color: "var(--text-4)", flexShrink: 0 }} />
                      </button>
                      <AnimatePresence>
                        {open && docs.length > 0 && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", padding: "0 16px 12px", display: "flex", flexDirection: "column", gap: "5px" }}>
                            {docs.map(doc => {
                              const { icon, color } = docTypeIcon(doc.name);
                              return (
                                <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "7px", background: "rgba(255,255,255,0.02)" }}>
                                  <MaterialIcon name={icon} size={13} style={{ color, flexShrink: 0 }} />
                                  <span style={{ fontSize: "12px", color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{doc.name}</span>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                        {open && docs.length === 0 && (
                          <p style={{ margin: 0, padding: "6px 16px 12px", fontSize: "11px", color: "var(--text-4)", fontStyle: "italic" }}>No documents uploaded yet.</p>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Controls */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ ...panel, padding: "22px 26px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", alignItems: "end" }}>
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: "8px" }}>Subject</label>
                <select value={subject ?? ""} onChange={e => setSubject(Number(e.target.value))} disabled={loading}
                  style={{ width: "100%", padding: "10px 14px", background: "rgba(6,6,17,0.8)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "10px", color: "var(--text-1)", fontSize: "13px", outline: "none", opacity: loading ? 0.5 : 1 }}>
                  {subjects.length === 0 ? <option value="">No subjects yet</option> : subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--text-3)" }}>Difficulty</label>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: diffColor }}>{diffLabel}</span>
                </div>
                <input type="range" min="1" max="3" value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--primary)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  {["Easy","Medium","Hard"].map(l => <span key={l} style={{ fontSize: "9px", fontWeight: 600, color: "var(--text-4)", textTransform: "uppercase" }}>{l}</span>)}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: "8px" }}>Questions</label>
                <div style={{ display: "flex", gap: "7px" }}>
                  {COUNTS.map(n => (
                    <motion.button key={n} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCount(n)}
                      style={{ flex: 1, padding: "10px 4px", borderRadius: "10px", border: `1px solid ${count === n ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.09)"}`, background: count === n ? "rgba(124,58,237,0.12)" : "transparent", color: count === n ? "var(--primary-light)" : "var(--text-3)", fontSize: "13px", fontWeight: count === n ? 700 : 400, cursor: "pointer", transition: "all 0.2s" }}>
                      {n}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "22px", paddingTop: "18px", borderTop: "1px solid rgba(124,58,237,0.1)" }}>
              <motion.button
                whileHover={subject !== null ? { scale: 1.03, boxShadow: "0 4px 20px rgba(124,58,237,0.35)" } : {}}
                whileTap={subject !== null ? { scale: 0.97 } : {}}
                onClick={handleGenerateQuiz}
                disabled={subject === null || loading || quizLoading}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 28px", borderRadius: "12px", border: subject === null ? "1px solid rgba(124,58,237,0.25)" : "none", background: subject === null ? "rgba(124,58,237,0.08)" : "linear-gradient(135deg,#7c3aed,#a78bfa)", color: subject === null ? "var(--primary-light)" : "#fff", fontWeight: 700, fontSize: "14px", cursor: subject === null || loading || quizLoading ? "not-allowed" : "pointer", opacity: subject === null || loading ? 0.5 : 1, fontFamily: "Space Grotesk, sans-serif" }}>
                <MaterialIcon name="auto_awesome" size={17} />
                Generate Quiz
              </motion.button>
            </div>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {quizError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ padding: "14px 20px", borderRadius: "12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", display: "flex", alignItems: "center", gap: "10px" }}>
                <MaterialIcon name="error_outline" size={18} style={{ color: "var(--red)", flexShrink: 0 }} />
                <p style={{ margin: 0, color: "var(--red)", fontSize: "13px" }}>{quizError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading */}
          <AnimatePresence>
            {quizLoading && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ ...panel, padding: "64px 32px", textAlign: "center" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} style={{ width: "48px", height: "48px", margin: "0 auto 20px", borderRadius: "50%", border: "3px solid rgba(124,58,237,0.15)", borderTopColor: "var(--primary-light)" }} />
                <p style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>Generating your quiz…</p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-3)" }}>{count} question{count !== 1 ? "s" : ""} being crafted by AI</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Score result */}
          <AnimatePresence>
            {submitResult && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ ...panel, padding: "56px 32px", textAlign: "center" }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}
                  style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <MaterialIcon name="emoji_events" size={36} style={{ color: "var(--green)" }} />
                </motion.div>
                <p style={{ margin: "0 0 4px", fontSize: "40px", fontWeight: 800, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.03em" }}>
                  {submitResult.score} <span style={{ fontSize: "18px", fontWeight: 500, color: "var(--text-3)" }}>/ {submitResult.total_questions}</span>
                </p>
                <p style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 700, color: submitResult.percentage >= 70 ? "var(--green)" : submitResult.percentage >= 40 ? "var(--gold)" : "var(--red)" }}>
                  {submitResult.percentage}%
                </p>
                <p style={{ margin: "0 0 32px", fontSize: "14px", color: "var(--text-3)" }}>
                  {submitResult.percentage >= 70 ? "Excellent work — keep it up!" : submitResult.percentage >= 40 ? "Good effort — keep practising!" : "Keep studying and try again!"}
                </p>
                <motion.button whileHover={{ scale: 1.04, boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }} whileTap={{ scale: 0.96 }} onClick={handleRetry}
                  style={{ padding: "11px 32px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                  Try Again
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live question card */}
          {quizData && !submitResult && currentQ && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ ...panel, padding: "32px", marginBottom: "16px", position: "relative", overflow: "hidden" }}>
                {/* Progress line */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "rgba(12,12,30,0.65)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{ height: "100%", background: "linear-gradient(to right,#7c3aed,#a78bfa)" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "26px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary-light)", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: "999px", padding: "4px 14px" }}>
                    Question {currentQIdx + 1} of {totalQ}
                  </span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {Array.from({ length: Math.min(5, totalQ) }, (_, i) => (
                      <motion.div key={i} animate={{ background: i < currentQIdx + 1 ? "#7c3aed" : "rgba(255,255,255,0.1)" }} transition={{ duration: 0.3 }}
                        style={{ width: "28px", height: "3px", borderRadius: "999px" }} />
                    ))}
                  </div>
                </div>

                <h3 style={{ margin: "0 0 26px", fontSize: "20px", fontWeight: 700, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1.4 }}>
                  {currentQ.question}
                </h3>

                <motion.div variants={container} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {currentQ.options.map(opt => {
                    const state = getOptState(opt.id);
                    const s = optionStyle(state);
                    return (
                      <motion.button key={opt.id} variants={item}
                        whileHover={!revealed ? { x: 4, borderColor: "rgba(124,58,237,0.4)" } : {}}
                        whileTap={!revealed ? { scale: 0.98 } : {}}
                        onClick={() => handleSelectOption(opt.id)}
                        style={{ ...s, padding: "15px 20px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: revealed ? "default" : "pointer", textAlign: "left", width: "100%", fontSize: "14px", fontWeight: state === "neutral" ? 400 : 600, transition: "all 0.2s" }}>
                        <span>{opt.text}</span>
                        {state === "correct" && <MaterialIcon name="check_circle" size={20} style={{ color: "var(--green)" }} />}
                        {state === "wrong"   && <MaterialIcon name="cancel"       size={20} style={{ color: "var(--red)" }} />}
                        {state === "neutral" && <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.18)" }} />}
                      </motion.button>
                    );
                  })}
                </motion.div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSkip} disabled={submitting}
                  style={{ padding: "11px 26px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "var(--text-3)", fontSize: "14px", cursor: submitting ? "not-allowed" : "pointer" }}>
                  Skip Question
                </motion.button>
                <motion.button
                  whileHover={revealed ? { scale: 1.03, boxShadow: "0 4px 20px rgba(124,58,237,0.35)" } : {}}
                  whileTap={revealed ? { scale: 0.97 } : {}}
                  onClick={handleNext} disabled={!revealed || submitting}
                  style={{ padding: "11px 30px", borderRadius: "10px", border: !revealed ? "1px solid rgba(124,58,237,0.2)" : "none", background: !revealed ? "rgba(124,58,237,0.08)" : "linear-gradient(135deg,#7c3aed,#a78bfa)", color: !revealed ? "var(--primary-light)" : "#fff", fontWeight: 700, fontSize: "14px", cursor: !revealed || submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", opacity: !revealed ? 0.6 : 1, transition: "all 0.2s", fontFamily: "Space Grotesk, sans-serif" }}>
                  {submitting ? "Submitting…" : isLastQ ? "Submit Quiz" : "Next Question"}
                  {!submitting && !isLastQ && <MaterialIcon name="arrow_forward" size={18} />}
                  {!submitting && isLastQ  && <MaterialIcon name="check"         size={18} />}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Static placeholder */}
          {!quizData && !quizLoading && !submitResult && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div style={{ ...panel, padding: "32px", marginBottom: "16px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "rgba(12,12,30,0.65)" }}>
                  <div style={{ height: "100%", width: "20%", background: "linear-gradient(to right,#7c3aed,#a78bfa)" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "26px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary-light)", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: "999px", padding: "4px 14px" }}>
                    Question 4 of {count}
                  </span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[1,2,3,4,5].map(i => <div key={i} style={{ width: "28px", height: "3px", borderRadius: "999px", background: i <= 4 ? "#7c3aed" : "rgba(255,255,255,0.1)" }} />)}
                  </div>
                </div>

                <h3 style={{ margin: "0 0 26px", fontSize: "20px", fontWeight: 700, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1.4 }}>
                  {QUESTION.text}
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {QUESTION.options.map(opt => {
                    const s = optionStyle(opt.state);
                    return (
                      <div key={opt.id} style={{ ...s, padding: "15px 20px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left", width: "100%", fontSize: "14px", fontWeight: opt.state === "neutral" ? 400 : 600 }}>
                        <span>{opt.text}</span>
                        {opt.state === "correct" && <MaterialIcon name="check_circle" size={20} style={{ color: "var(--green)" }} />}
                        {opt.state === "wrong"   && <MaterialIcon name="cancel"       size={20} style={{ color: "var(--red)" }} />}
                        {opt.state === "neutral" && <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.18)" }} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ ...panel, padding: "22px 26px", marginBottom: "20px" }}>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <MaterialIcon name="auto_awesome" size={20} style={{ color: "var(--primary-light)" }} />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700, color: "var(--primary-light)" }}>AI Explanation</p>
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--text-2)", lineHeight: 1.7 }}>
                      The <strong style={{ color: "var(--text-1)" }}>Heisenberg Uncertainty Principle</strong>, formulated in 1927, is a fundamental concept of quantum mechanics. It states that the more precisely the position of a particle is determined, the less precisely its momentum can be known — and vice versa.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <motion.button whileHover={{ scale: 1.02 }} style={{ padding: "11px 26px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "var(--text-3)", fontSize: "14px", cursor: "pointer" }}>Skip Question</motion.button>
                <motion.button whileHover={{ scale: 1.03, boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }} whileTap={{ scale: 0.97 }}
                  style={{ padding: "11px 30px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontFamily: "Space Grotesk, sans-serif" }}>
                  Next Question <MaterialIcon name="arrow_forward" size={18} />
                </motion.button>
              </div>
            </motion.div>
          )}

        </div>
      </div>
      <style>{`@keyframes qz-pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
    </Layout>
  );
}
