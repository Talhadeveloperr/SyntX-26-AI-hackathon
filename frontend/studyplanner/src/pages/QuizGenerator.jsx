import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import MaterialIcon from "../components/MaterialIcon";
import { useStudyMaterials } from "../context/StudyMaterialsContext";
import { generateQuiz, submitQuiz } from "../api/quizApi";

const COUNTS = [2, 4, 6];

const QUESTION = {
  text: "Which principle states that it is impossible to simultaneously know both the precise position and momentum of a particle?",
  options: [
    { id: "a", text: "Schrödinger's Cat Paradox",         state: "neutral"  },
    { id: "b", text: "Heisenberg Uncertainty Principle",  state: "correct"  },
    { id: "c", text: "Planck's Constant Hypothesis",      state: "wrong"    },
    { id: "d", text: "Bohr's Atomic Model",               state: "neutral"  },
  ],
};

function optionStyle(state) {
  if (state === "correct") return { background: "rgba(25,135,84,0.1)", border: "1px solid rgba(25,135,84,0.45)", color: "#81c995" };
  if (state === "wrong")   return { background: "rgba(220,53,69,0.08)", border: "1px solid rgba(220,53,69,0.4)", color: "#ffb4ab" };
  return { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(199,196,215,0.75)" };
}

export default function QuizGenerator() {
  const [subject,     setSubject]     = useState(null);
  const [difficulty,  setDifficulty]  = useState(3);
  const [count,       setCount]       = useState(20);

  const diffLabel = ["", "Easy", "Medium", "Hard"][difficulty];

  // ── Subject & Document layer — shared via context ───────────────────────
  const { subjects, subjectDocs, loading, addSubject, removeSubject, addDocs } = useStudyMaterials();

  // UI-only local states
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [addingSubject,   setAddingSubject]   = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [docDragOver,     setDocDragOver]     = useState(false);
  const [expandedLibId,   setExpandedLibId]   = useState(null);
  const [stagedFiles,     setStagedFiles]     = useState({});  // { [subjectId]: File[] } — pending upload
  const [saving,          setSaving]          = useState(false);
  const [subjectAdding,   setSubjectAdding]   = useState(false);

  // ── Quiz session states ──────────────────────────────────────────────────
  const [quizData,     setQuizData]     = useState(null);   // full generate API response
  const [quizLoading,  setQuizLoading]  = useState(false);
  const [quizError,    setQuizError]    = useState(null);
  const [currentQIdx,  setCurrentQIdx]  = useState(0);      // 0-based index into quizData.questions
  const [selectedOpt,  setSelectedOpt]  = useState(null);   // option id (number) chosen by user
  const [revealed,     setRevealed]     = useState(false);  // true once user picks an option
  const [answers,      setAnswers]      = useState([]);     // accumulated { question_id, selected_option_id }
  const [submitResult, setSubmitResult] = useState(null);   // submit API response
  const [submitting,   setSubmitting]   = useState(false);
  // ────────────────────────────────────────────────────────────────────────

  const activeSubject    = subjects.find(s => s.id === activeSubjectId) || null;
  const activeStagedDocs = stagedFiles[activeSubjectId] || [];

  // Set default quiz subject when subjects load
  useEffect(() => {
    if (subjects.length > 0 && subject === null) setSubject(subjects[0].id);
  }, [subjects, subject]);

  // Log payload whenever subject, difficulty, or count changes
  useEffect(() => {
    if (subject === null) return;
    const selectedSubject = subjects.find(s => s.id === subject);
    const payload = {
      student_id:    1,
      subject_id:    subject,
      subject_name:  selectedSubject?.name ?? "",
      difficulty:    ["", "Easy", "Medium", "Hard"][difficulty],
      num_questions: count,
    };
    console.log("Quiz Generator Payload:", payload);
  }, [subject, difficulty, count, subjects]);

  const handleAddSubject = async () => {
    const name = newSubjectInput.trim();
    if (!name || subjectAdding) return;
    setSubjectAdding(true);
    try {
      const id = await addSubject(name);
      setNewSubjectInput("");
      setAddingSubject(false);
      setActiveSubjectId(id);
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
    setStagedFiles(prev => ({
      ...prev,
      [activeSubjectId]: [...(prev[activeSubjectId] || []), ...Array.from(files)],
    }));
  };

  const handleDocFileChange = (e) => pushDocs(e.target.files);
  const handleDocDrop = (e) => { e.preventDefault(); setDocDragOver(false); pushDocs(e.dataTransfer.files); };

  const handleRemoveStagedFile = (idx) => {
    setStagedFiles(prev => ({
      ...prev,
      [activeSubjectId]: (prev[activeSubjectId] || []).filter((_, i) => i !== idx),
    }));
  };

  const handleSaveDocs = async () => {
    const files = stagedFiles[activeSubjectId];
    if (!activeSubjectId || !files?.length) return;
    setSaving(true);
    try {
      await addDocs(activeSubjectId, files);
      setStagedFiles(prev => { const n = { ...prev }; delete n[activeSubjectId]; return n; });
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const docTypeIcon = (name) => {
    const ext = name.split(".").pop().toLowerCase();
    if (["pdf"].includes(ext))                    return { icon: "picture_as_pdf", color: "#ffb0cd" };
    if (["doc","docx"].includes(ext))             return { icon: "description",    color: "#c0c1ff" };
    if (["ppt","pptx"].includes(ext))             return { icon: "slideshow",      color: "#ffd580" };
    if (["jpg","jpeg","png","gif"].includes(ext)) return { icon: "image",          color: "#81c995" };
    return { icon: "insert_drive_file", color: "rgba(199,196,215,0.5)" };
  };
  // ────────────────────────────────────────────────────────────────────────

  // ── Quiz helpers ─────────────────────────────────────────────────────────
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
    const payload = {
      student_id:    1,
      subject_id:    subject,
      subject_name:  sel?.name ?? "",
      difficulty:    ["", "Easy", "Medium", "Hard"][difficulty],
      num_questions: count,
    };
    setQuizLoading(true);
    setQuizError(null);
    setQuizData(null);
    setCurrentQIdx(0);
    setSelectedOpt(null);
    setRevealed(false);
    setAnswers([]);
    setSubmitResult(null);
    try {
      const data = await generateQuiz(payload);
      setQuizData(data);
    } catch {
      setQuizError("Failed to generate quiz. Please try again.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectOption = (optId) => {
    if (revealed) return;
    setSelectedOpt(optId);
    setRevealed(true);
  };

  const advanceOrSubmit = async (allAnswers) => {
    if (isLastQ) {
      setSubmitting(true);
      try {
        const res = await submitQuiz({ quiz_id: quizData.quiz_id, student_id: 1, answers: allAnswers });
        setSubmitResult(res);
      } catch { /* silent */ }
      finally { setSubmitting(false); }
    } else {
      setAnswers(allAnswers);
      setCurrentQIdx(i => i + 1);
      setSelectedOpt(null);
      setRevealed(false);
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
    setSubmitResult(null);
    setQuizData(null);
    setCurrentQIdx(0);
    setSelectedOpt(null);
    setRevealed(false);
    setAnswers([]);
    setQuizError(null);
  };
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Layout title="Quiz Generator">
      <div style={{ padding: "28px 32px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>

          {/* ── Subject & Document Management ───────────────────────────── */}
          <div className="glass-card" style={{ borderRadius: "16px", padding: "20px 24px", marginBottom: "24px" }}>

            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: (loading || subjects.length) ? "16px" : "0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "rgba(192,193,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MaterialIcon name="library_books" size={18} style={{ color: "#c0c1ff" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#d4e4fa" }}>Study Materials</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "rgba(199,196,215,0.45)" }}>Add subjects and upload your documents</p>
                </div>
              </div>
              <button
                onClick={() => { setAddingSubject(v => !v); setNewSubjectInput(""); }}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "7px 14px", borderRadius: "8px", cursor: "pointer",
                  background: addingSubject ? "rgba(192,193,255,0.15)" : "rgba(192,193,255,0.08)",
                  border: "1px solid rgba(192,193,255,0.25)", color: "#c0c1ff",
                  fontSize: "12px", fontWeight: 700,
                }}
              >
                <MaterialIcon name={addingSubject ? "close" : "add"} size={15} />
                {addingSubject ? "Cancel" : "Add Subject"}
              </button>
            </div>

            {/* Add-subject input */}
            {addingSubject && (
              <div style={{ display: "flex", gap: "8px", marginBottom: subjects.length ? "16px" : "0" }}>
                <input
                  autoFocus
                  value={newSubjectInput}
                  onChange={e => setNewSubjectInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !subjectAdding && handleAddSubject()}
                  placeholder="e.g. Quantum Physics, World History…"
                  style={{
                    flex: 1, padding: "9px 14px",
                    background: "rgba(1,15,31,0.7)", border: "1px solid rgba(192,193,255,0.25)",
                    borderRadius: "9px", color: "#d4e4fa", fontSize: "13px", outline: "none",
                  }}
                />
                <button
                  onClick={handleAddSubject}
                  disabled={subjectAdding}
                  style={{
                    padding: "9px 18px", borderRadius: "9px", border: "none",
                    background: "linear-gradient(135deg,#c0c1ff,#ffb0cd)",
                    color: "#051424", fontWeight: 700, fontSize: "13px",
                    cursor: subjectAdding ? "not-allowed" : "pointer",
                    opacity: subjectAdding ? 0.7 : 1,
                  }}
                >
                  {subjectAdding ? "Adding…" : "Add"}
                </button>
              </div>
            )}

            {/* Loading skeleton while fetching subjects */}
            {loading && subjects.length === 0 && !addingSubject && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: "28px", width: "100px", borderRadius: "999px", background: "rgba(255,255,255,0.05)", animation: "sm-pulse 1.5s ease infinite" }} />
                ))}
              </div>
            )}

            {/* Subject chips */}
            {subjects.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: activeSubject ? "20px" : "0" }}>
                {subjects.map(s => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "6px 12px", borderRadius: "999px", cursor: "pointer",
                      background: activeSubjectId === s.id ? "rgba(192,193,255,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${activeSubjectId === s.id ? "rgba(192,193,255,0.45)" : "rgba(255,255,255,0.1)"}`,
                    }}
                    onClick={() => setActiveSubjectId(activeSubjectId === s.id ? null : s.id)}
                  >
                    <MaterialIcon name="folder" size={13} style={{ color: activeSubjectId === s.id ? "#c0c1ff" : "rgba(199,196,215,0.4)" }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: activeSubjectId === s.id ? "#c0c1ff" : "rgba(199,196,215,0.65)" }}>{s.name}</span>
                    {subjectDocs[s.id]?.length > 0 && (
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#c0c1ff", background: "rgba(192,193,255,0.2)", borderRadius: "999px", padding: "1px 6px" }}>
                        {subjectDocs[s.id].length}
                      </span>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); handleRemoveSubject(s.id); }}
                      style={{ background: "none", border: "none", padding: "0 0 0 2px", cursor: "pointer", display: "flex", alignItems: "center", color: "rgba(199,196,215,0.35)", lineHeight: 1 }}
                    >
                      <MaterialIcon name="close" size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Document panel for selected subject */}
            {activeSubject && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "rgba(199,196,215,0.5)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Documents — {activeSubject.name}
                  </p>
                  <label style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    padding: "5px 12px", borderRadius: "7px", cursor: "pointer",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(199,196,215,0.6)", fontSize: "11px", fontWeight: 600,
                  }}>
                    <MaterialIcon name="upload_file" size={13} />
                    Browse files
                    <input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.png" onChange={handleDocFileChange} style={{ display: "none" }} />
                  </label>
                </div>

                {/* Drop zone — shows staged (not-yet-uploaded) files */}
                <div
                  onDragOver={e => { e.preventDefault(); setDocDragOver(true); }}
                  onDragLeave={() => setDocDragOver(false)}
                  onDrop={handleDocDrop}
                  style={{
                    borderRadius: "10px", padding: activeStagedDocs.length ? "12px" : "28px 20px",
                    border: `1.5px dashed ${docDragOver ? "rgba(192,193,255,0.6)" : "rgba(255,255,255,0.1)"}`,
                    background: docDragOver ? "rgba(192,193,255,0.05)" : "transparent",
                    transition: "all 0.15s",
                    display: "flex", flexDirection: "column", gap: "8px",
                    alignItems: activeStagedDocs.length ? "stretch" : "center",
                    justifyContent: activeStagedDocs.length ? "flex-start" : "center",
                  }}
                >
                  {activeStagedDocs.length === 0 ? (
                    <>
                      <MaterialIcon name="cloud_upload" size={28} style={{ color: "rgba(192,193,255,0.3)" }} />
                      <p style={{ margin: 0, fontSize: "12px", color: "rgba(199,196,215,0.4)", textAlign: "center" }}>
                        Drag &amp; drop books, notes, or slides here
                      </p>
                    </>
                  ) : (
                    activeStagedDocs.map((file, idx) => {
                      const { icon, color } = docTypeIcon(file.name);
                      return (
                        <div key={idx} style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          padding: "8px 12px", borderRadius: "8px",
                          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                        }}>
                          <MaterialIcon name={icon} size={16} style={{ color, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: "12px", color: "rgba(199,196,215,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                          <button
                            onClick={() => handleRemoveStagedFile(idx)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(199,196,215,0.3)", display: "flex", padding: 0 }}
                          >
                            <MaterialIcon name="close" size={13} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Upload staged files to backend */}
                {activeStagedDocs.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                    <button
                      onClick={handleSaveDocs}
                      disabled={saving}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "8px 18px", borderRadius: "8px", border: "none",
                        cursor: saving ? "not-allowed" : "pointer",
                        background: "linear-gradient(135deg,#c0c1ff,#ffb0cd)",
                        color: "#051424", fontSize: "12px", fontWeight: 700,
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      <MaterialIcon name={saving ? "hourglass_top" : "cloud_upload"} size={14} />
                      {saving ? "Uploading…" : `Save ${activeStagedDocs.length} document${activeStagedDocs.length !== 1 ? "s" : ""} to backend`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* ──────────────────────────────────────────────────────────────── */}

          {/* ── Study Library — shows uploaded docs from backend ─────────── */}
          {subjects.length > 0 && (
            <div className="glass-card" style={{ borderRadius: "16px", padding: "18px 24px", marginBottom: "24px" }}>
              <p style={{ margin: "0 0 14px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(199,196,215,0.4)" }}>
                Study Library — {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {subjects.map(s => {
                  const docs  = subjectDocs[s.id] || [];
                  const open  = expandedLibId === s.id;
                  return (
                    <div key={s.id} style={{ borderRadius: "10px", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                      {/* Row header */}
                      <button
                        onClick={() => setExpandedLibId(open ? null : s.id)}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: "10px",
                          padding: "10px 14px", background: open ? "rgba(192,193,255,0.06)" : "rgba(255,255,255,0.02)",
                          border: "none", cursor: "pointer", textAlign: "left",
                        }}
                      >
                        <MaterialIcon name="folder" size={15} style={{ color: open ? "#c0c1ff" : "rgba(199,196,215,0.4)", flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: open ? "#d4e4fa" : "rgba(199,196,215,0.7)" }}>{s.name}</span>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(199,196,215,0.35)" }}>
                          {docs.length} doc{docs.length !== 1 ? "s" : ""}
                        </span>
                        <MaterialIcon name={open ? "expand_less" : "expand_more"} size={15} style={{ color: "rgba(199,196,215,0.35)", flexShrink: 0 }} />
                      </button>
                      {/* Doc list */}
                      {open && docs.length > 0 && (
                        <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: "5px" }}>
                          {docs.map(doc => {
                            const { icon, color } = docTypeIcon(doc.name);
                            return (
                              <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "7px", background: "rgba(255,255,255,0.02)" }}>
                                <MaterialIcon name={icon} size={13} style={{ color, flexShrink: 0 }} />
                                <span style={{ fontSize: "12px", color: "rgba(199,196,215,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{doc.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {open && docs.length === 0 && (
                        <p style={{ margin: 0, padding: "6px 14px 12px", fontSize: "11px", color: "rgba(199,196,215,0.3)", fontStyle: "italic" }}>No documents uploaded yet.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* ──────────────────────────────────────────────────────────────── */}

          {/* Controls */}
          <div className="glass-card" style={{ borderRadius: "16px", padding: "20px 24px", marginBottom: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", alignItems: "end" }}>

              {/* Subject */}
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(199,196,215,0.5)", marginBottom: "8px" }}>Subject</label>
                <select
                  value={subject ?? ""}
                  onChange={e => setSubject(Number(e.target.value))}
                  disabled={loading}
                  style={{
                    width: "100%", padding: "9px 12px",
                    background: "rgba(1,15,31,0.7)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "9px", color: "#d4e4fa", fontSize: "13px", outline: "none",
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {subjects.length === 0
                    ? <option value="">No subjects yet</option>
                    : subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                  }
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(199,196,215,0.5)" }}>Difficulty</label>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#c0c1ff" }}>{diffLabel}</span>
                </div>
                <input
                  type="range" min="1" max="3" value={difficulty}
                  onChange={e => setDifficulty(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#c0c1ff" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  {["Easy","Medium","Hard"].map(l => (
                    <span key={l} style={{ fontSize: "9px", fontWeight: 600, color: "rgba(199,196,215,0.3)", textTransform: "uppercase" }}>{l}</span>
                  ))}
                </div>
              </div>

              {/* Count */}
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(199,196,215,0.5)", marginBottom: "8px" }}>Questions</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  {COUNTS.map(n => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      style={{
                        flex: 1, padding: "9px 4px", borderRadius: "8px",
                        border: `1px solid ${count === n ? "rgba(192,193,255,0.4)" : "rgba(255,255,255,0.1)"}`,
                        background: count === n ? "rgba(192,193,255,0.1)" : "transparent",
                        color: count === n ? "#c0c1ff" : "rgba(199,196,215,0.5)",
                        fontSize: "13px", fontWeight: count === n ? 700 : 400, cursor: "pointer",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Quiz button inside controls card */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <button
                onClick={handleGenerateQuiz}
                disabled={subject === null || loading || quizLoading}
                style={{
                  display: "flex", alignItems: "center", gap: "7px",
                  padding: "10px 26px", borderRadius: "10px", border: "none",
                  background: subject === null ? "rgba(192,193,255,0.1)" : "linear-gradient(135deg,#c0c1ff,#ffb0cd)",
                  color: subject === null ? "#c0c1ff" : "#051424",
                  fontWeight: 700, fontSize: "14px",
                  cursor: subject === null || loading || quizLoading ? "not-allowed" : "pointer",
                  opacity: subject === null || loading ? 0.5 : 1,
                  border: subject === null ? "1px solid rgba(192,193,255,0.25)" : "none",
                }}
              >
                <MaterialIcon name="auto_awesome" size={16} />
                Generate Quiz
              </button>
            </div>
          </div>

          {/* ── Quiz error banner ───────────────────────────────────────── */}
          {quizError && (
            <div style={{ padding: "14px 20px", borderRadius: "12px", background: "rgba(220,53,69,0.08)", border: "1px solid rgba(220,53,69,0.3)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <MaterialIcon name="error_outline" size={18} style={{ color: "#ffb4ab", flexShrink: 0 }} />
              <p style={{ margin: 0, color: "#ffb4ab", fontSize: "13px" }}>{quizError}</p>
            </div>
          )}

          {/* ── Quiz generating — loading card ──────────────────────────── */}
          {quizLoading && (
            <div className="glass-card" style={{ borderRadius: "16px", padding: "56px 32px", marginBottom: "24px", textAlign: "center" }}>
              <MaterialIcon name="hourglass_top" size={40} style={{ color: "#c0c1ff", display: "block", margin: "0 auto 16px", animation: "sm-pulse 1.2s ease infinite" }} />
              <p style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "#d4e4fa" }}>Generating your quiz…</p>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(199,196,215,0.4)" }}>This may take a moment — {count} question{count !== 1 ? "s" : ""} being crafted</p>
            </div>
          )}

          {/* ── Submit result ────────────────────────────────────────────── */}
          {submitResult && (
            <div className="glass-card" style={{ borderRadius: "16px", padding: "48px 32px", marginBottom: "24px", textAlign: "center" }}>
              <div style={{ width: "68px", height: "68px", borderRadius: "50%", background: "rgba(129,201,149,0.12)", border: "1px solid rgba(129,201,149,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                <MaterialIcon name="emoji_events" size={34} style={{ color: "#81c995" }} />
              </div>
              <p style={{ margin: "0 0 4px", fontSize: "36px", fontWeight: 800, color: "#d4e4fa", letterSpacing: "-0.02em" }}>
                {submitResult.score} <span style={{ fontSize: "18px", fontWeight: 500, color: "rgba(199,196,215,0.4)" }}>/ {submitResult.total_questions}</span>
              </p>
              <p style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: submitResult.percentage >= 70 ? "#81c995" : submitResult.percentage >= 40 ? "#ffb783" : "#ffb4ab" }}>
                {submitResult.percentage}%
              </p>
              <p style={{ margin: "0 0 28px", fontSize: "13px", color: "rgba(199,196,215,0.4)" }}>
                {submitResult.percentage >= 70 ? "Great job!" : submitResult.percentage >= 40 ? "Good effort — keep practising!" : "Keep studying and try again!"}
              </p>
              <button
                onClick={handleRetry}
                style={{
                  padding: "10px 28px", borderRadius: "10px", border: "none",
                  background: "linear-gradient(135deg,#c0c1ff,#ffb0cd)",
                  color: "#051424", fontWeight: 700, fontSize: "14px", cursor: "pointer",
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* ── Real question card (quiz active) ─────────────────────────── */}
          {quizData && !submitResult && currentQ && (
            <>
              <div className="glass-card" style={{ borderRadius: "16px", padding: "28px 32px", marginBottom: "16px", position: "relative", overflow: "hidden" }}>
                {/* Progress line */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "rgba(255,255,255,0.05)" }}>
                  <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(to right,#c0c1ff,#ffb0cd)", transition: "width 0.4s ease" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#c0c1ff", background: "rgba(192,193,255,0.1)", border: "1px solid rgba(192,193,255,0.2)", borderRadius: "999px", padding: "4px 12px" }}>
                    Question {currentQIdx + 1} of {totalQ}
                  </span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {Array.from({ length: Math.min(5, totalQ) }, (_, i) => (
                      <div key={i} style={{ width: "28px", height: "3px", borderRadius: "999px", background: i < currentQIdx + 1 ? "#c0c1ff" : "rgba(255,255,255,0.1)", transition: "background 0.3s" }} />
                    ))}
                  </div>
                </div>

                <h3 style={{ margin: "0 0 24px", fontSize: "20px", fontWeight: 700, color: "#d4e4fa", lineHeight: 1.4 }}>
                  {currentQ.question}
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {currentQ.options.map(opt => {
                    const state = getOptState(opt.id);
                    const s = optionStyle(state);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        style={{
                          ...s, padding: "14px 18px", borderRadius: "12px",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          cursor: revealed ? "default" : "pointer", textAlign: "left", width: "100%",
                          fontSize: "14px", fontWeight: state === "neutral" ? 400 : 600,
                          transition: "all 0.2s",
                        }}
                      >
                        <span>{opt.text}</span>
                        {state === "correct" && <MaterialIcon name="check_circle" size={20} style={{ color: "#81c995" }} />}
                        {state === "wrong"   && <MaterialIcon name="cancel"       size={20} style={{ color: "#ffb4ab" }} />}
                        {state === "neutral" && <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.18)" }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer navigation — real quiz */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  onClick={handleSkip}
                  disabled={submitting}
                  style={{ padding: "10px 24px", borderRadius: "9px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(199,196,215,0.6)", fontSize: "14px", cursor: submitting ? "not-allowed" : "pointer" }}
                >
                  Skip Question
                </button>
                <button
                  onClick={handleNext}
                  disabled={!revealed || submitting}
                  style={{
                    padding: "10px 28px", borderRadius: "9px", border: "none",
                    background: !revealed ? "rgba(192,193,255,0.1)" : "linear-gradient(135deg,#c0c1ff,#ffb0cd)",
                    color: !revealed ? "#c0c1ff" : "#051424", fontWeight: 700, fontSize: "14px",
                    cursor: !revealed || submitting ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: "7px",
                    opacity: !revealed ? 0.6 : 1,
                    border: !revealed ? "1px solid rgba(192,193,255,0.2)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {submitting ? "Submitting…" : isLastQ ? "Submit Quiz" : "Next Question"}
                  {!submitting && !isLastQ && <MaterialIcon name="arrow_forward" size={18} />}
                  {!submitting && isLastQ  && <MaterialIcon name="check"         size={18} />}
                </button>
              </div>
            </>
          )}

          {/* ── Static placeholder question card (before generation) ──────── */}
          {!quizData && !quizLoading && !submitResult && (
            <>
              <div className="glass-card" style={{ borderRadius: "16px", padding: "28px 32px", marginBottom: "16px", position: "relative", overflow: "hidden" }}>
                {/* Progress line */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "rgba(255,255,255,0.05)" }}>
                  <div style={{ height: "100%", width: "20%", background: "linear-gradient(to right,#c0c1ff,#ffb0cd)" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#c0c1ff", background: "rgba(192,193,255,0.1)", border: "1px solid rgba(192,193,255,0.2)", borderRadius: "999px", padding: "4px 12px" }}>
                    Question 4 of {count}
                  </span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{ width: "28px", height: "3px", borderRadius: "999px", background: i <= 4 ? "#c0c1ff" : "rgba(255,255,255,0.1)" }} />
                    ))}
                  </div>
                </div>

                <h3 style={{ margin: "0 0 24px", fontSize: "20px", fontWeight: 700, color: "#d4e4fa", lineHeight: 1.4 }}>
                  {QUESTION.text}
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {QUESTION.options.map(opt => {
                    const s = optionStyle(opt.state);
                    return (
                      <button
                        key={opt.id}
                        style={{
                          ...s, padding: "14px 18px", borderRadius: "12px",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          cursor: "pointer", textAlign: "left", width: "100%",
                          fontSize: "14px", fontWeight: opt.state === "neutral" ? 400 : 600,
                        }}
                      >
                        <span>{opt.text}</span>
                        {opt.state === "correct" && <MaterialIcon name="check_circle" size={20} style={{ color: "#81c995" }} />}
                        {opt.state === "wrong"   && <MaterialIcon name="cancel" size={20} style={{ color: "#ffb4ab" }} />}
                        {opt.state === "neutral" && <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.18)" }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Explanation */}
              <div className="glass-card" style={{ borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", borderColor: "rgba(192,193,255,0.2)" }}>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(192,193,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <MaterialIcon name="auto_awesome" size={20} style={{ color: "#c0c1ff" }} />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700, color: "#c0c1ff" }}>AI Explanation</p>
                    <p style={{ margin: 0, fontSize: "14px", color: "rgba(199,196,215,0.7)", lineHeight: 1.65 }}>
                      The <strong style={{ color: "#d4e4fa" }}>Heisenberg Uncertainty Principle</strong>, formulated in 1927, is a fundamental concept of quantum mechanics. It states that the more precisely the position of a particle is determined, the less precisely its momentum can be known — and vice versa. This is not a measurement limitation but a fundamental property of quantum systems.
                    </p>
                    <div style={{ display: "flex", gap: "20px", marginTop: "14px" }}>
                      <button style={{ background: "none", border: "none", color: "#c0c1ff", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", padding: 0 }}>
                        <MaterialIcon name="menu_book" size={15} />
                        Read Chapter 4.2
                      </button>
                      <button style={{ background: "none", border: "none", color: "#c0c1ff", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", padding: 0 }}>
                        <MaterialIcon name="bolt" size={15} />
                        Similar questions
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer navigation — static placeholder */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button style={{ padding: "10px 24px", borderRadius: "9px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(199,196,215,0.6)", fontSize: "14px", cursor: "pointer" }}>
                  Skip Question
                </button>
                <button style={{
                  padding: "10px 28px", borderRadius: "9px", border: "none",
                  background: "linear-gradient(135deg,#c0c1ff,#ffb0cd)",
                  color: "#051424", fontWeight: 700, fontSize: "14px",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "7px",
                }}>
                  Next Question
                  <MaterialIcon name="arrow_forward" size={18} />
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      <style>{`
        @keyframes sm-pulse { 0%,100%{opacity:1}50%{opacity:0.45} }
      `}</style>
    </Layout>
  );
}
