import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../components/Layout";
import Icon from "../components/Icon";
import { analyzePastPapers, getAnalyses } from "../api/pastpaperApi";

// ── static decorative data ────────────────────────────────────────────────────
const HEAT_LEVELS = Array.from({ length: 36 }, (_, i) => ({
  color: i % 5 === 0 ? "var(--pink)" : "var(--primary-light)",
  opacity: (Math.sin(i * 0.7) * 0.4 + 0.55).toFixed(2),
}));

const TOPIC_COLORS = ["var(--primary-light)", "var(--pink)", "var(--green)", "var(--gold)", "var(--cyan)"];

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

// ── helpers ───────────────────────────────────────────────────────────────────
function fileIcon(file) {
  if (file.type === "application/pdf") return { icon: "picture_as_pdf", color: "var(--pink)"          };
  if (file.type.startsWith("image/")) return { icon: "image",          color: "var(--primary-light)" };
  return                                      { icon: "description",    color: "var(--cyan)"           };
}

function fileIconFromName(name) {
  const ext = (name || "").split(".").pop().toLowerCase();
  if (ext === "pdf") return { icon: "picture_as_pdf", color: "var(--pink)" };
  if (["jpg","jpeg","png","webp","gif"].includes(ext)) return { icon: "image", color: "var(--green)" };
  return { icon: "description", color: "var(--primary-light)" };
}

function fileSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return                         `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr), diff = Math.floor((Date.now() - d) / 1000);
    if (diff < 60)     return "just now";
    if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
  } catch { return dateStr; }
}

function buildTopicBars(predictions) {
  const map = {};
  predictions.forEach(p => {
    if (!map[p.topic]) map[p.topic] = { total: 0, count: 0 };
    map[p.topic].total += p.confidence;
    map[p.topic].count += 1;
  });
  return Object.entries(map)
    .map(([name, { total, count }], i) => ({ name, pct: Math.round(total / count), color: TOPIC_COLORS[i % TOPIC_COLORS.length] }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);
}

const panel = {
  background: "rgba(12,18,40,0.6)",
  border: "1px solid rgba(124,58,237,0.12)",
  backdropFilter: "blur(16px)",
  borderRadius: "20px",
};

const fieldInput = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(6,6,17,0.8)", border: "1px solid rgba(124,58,237,0.2)",
  borderRadius: "10px", padding: "9px 12px",
  color: "var(--text-1)", fontSize: "13px", outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
  fontFamily: "Plus Jakarta Sans, sans-serif",
};

// ── component ─────────────────────────────────────────────────────────────────
export default function PastPapers() {
  const [dragging,    setDragging]    = useState(false);
  const [stagedFiles, setStagedFiles] = useState([]);
  const [analyzing,   setAnalyzing]   = useState(false);
  const [analyzed,    setAnalyzed]    = useState(false);
  const [error,       setError]       = useState(null);
  const fileInputRef                  = useRef(null);

  const [subjectId,   setSubjectId]   = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [paperName,   setPaperName]   = useState("");

  const [predictions,     setPredictions]     = useState([]);
  const [analysisResult,  setAnalysisResult]  = useState(null);
  const [analyses,        setAnalyses]        = useState([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);

  useEffect(() => {
    getAnalyses()
      .then(r => setAnalyses(r.data?.analyses ?? []))
      .catch(() => setAnalyses([]))
      .finally(() => setAnalysesLoading(false));
  }, []);

  function addFiles(incoming) {
    const valid = Array.from(incoming).filter(f => ACCEPTED_TYPES.includes(f.type));
    if (valid.length < incoming.length) alert("Some files were skipped — only PDF, DOCX, JPG, PNG, and WEBP are supported.");
    setStagedFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !existingNames.has(f.name))];
    });
    setAnalyzed(false); setError(null);
  }

  function removeFile(name) { setStagedFiles(prev => prev.filter(f => f.name !== name)); setAnalyzed(false); setError(null); }
  function handleDrop(e)    { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }
  function handleBrowse(e)  { addFiles(e.target.files); e.target.value = ""; }

  async function handleAnalyze() {
    if (!stagedFiles.length || !subjectId.trim()) return;
    const formData = new FormData();
    formData.append("student_id", "1");
    formData.append("subject_id", subjectId.trim());
    formData.append("subject_name_opt", subjectName.trim());
    formData.append("paper_name_opt", paperName.trim());
    stagedFiles.forEach(file => formData.append("files", file, file.name));

    console.log("=== PastPapers → POST /api/pastpapers/analyze ===");
    for (const [k, v] of formData.entries()) {
      if (v instanceof File) console.log(`  ${k}: File { name:"${v.name}", type:"${v.type}", size:${v.size} }`);
      else console.log(`  ${k}:`, v);
    }
    console.log("=================================================");

    setAnalyzing(true); setError(null);
    try {
      const res = await analyzePastPapers(formData);
      const data = res.data;
      setAnalysisResult(data);
      setPredictions(data.predictions ?? []);
      setAnalyzed(true);
      getAnalyses().then(r => setAnalyses(r.data?.analyses ?? [])).catch(() => {});
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Analysis failed. Please check your Subject ID and try again.";
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  }

  const canAnalyze   = stagedFiles.length > 0 && subjectId.trim() !== "";
  const topicBars    = buildTopicBars(predictions);
  const uniqueTopics = [...new Set(predictions.map(p => p.topic))];
  const topTopic     = topicBars[0];

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item      = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

  return (
    <Layout title="Past Papers Analyzer">
      <div style={{ padding: "28px 32px", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Upload zone */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              ...panel,
              borderStyle: "dashed", borderWidth: "2px",
              borderColor: dragging ? "rgba(124,58,237,0.65)" : "rgba(124,58,237,0.28)",
              padding: "56px 32px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              textAlign: "center", minHeight: "240px", cursor: "pointer",
              background: dragging ? "rgba(124,58,237,0.05)" : "rgba(12,18,40,0.6)",
              transition: "all 0.2s",
            }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "60px", height: "60px", borderRadius: "16px", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px", boxShadow: "0 0 30px rgba(124,58,237,0.15)" }}>
              <Icon name="cloud_upload" size={28} style={{ color: "var(--primary-light)" }} />
            </motion.div>
            <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 700, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>
              Drag and drop past paper files
            </h3>
            <p style={{ margin: "0 0 22px", fontSize: "14px", color: "var(--text-3)", maxWidth: "480px", lineHeight: 1.65 }}>
              Supports PDF, DOCX, JPG, PNG — upload multiple files at once. AI extracts text and predicts likely questions.
            </p>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={handleBrowse} />
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
              style={{ padding: "10px 28px", borderRadius: "999px", border: "1px solid rgba(124,58,237,0.35)", background: "rgba(124,58,237,0.1)", color: "var(--primary-light)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              Browse Files
            </motion.button>
          </motion.div>

          {/* Staged files + config */}
          <AnimatePresence>
            {stagedFiles.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{ ...panel, padding: "22px 26px" }}>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>
                    {stagedFiles.length} file{stagedFiles.length > 1 ? "s" : ""} ready for analysis
                  </p>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ padding: "6px 16px", borderRadius: "999px", border: "1px solid rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.08)", color: "var(--primary-light)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>
                    + Add More
                  </motion.button>
                </div>

                <motion.div variants={container} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "18px" }}>
                  {stagedFiles.map(file => {
                    const { icon, color } = fileIcon(file);
                    return (
                      <motion.div key={file.name} variants={item}
                        style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "12px", background: "rgba(6,6,17,0.6)", border: "1px solid rgba(124,58,237,0.1)" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon name={icon} size={18} style={{ color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
                          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-4)" }}>
                            {file.type === "application/pdf" ? "PDF" : file.type.startsWith("image/") ? "Image" : "Document"} · {fileSize(file.size)}
                          </p>
                        </div>
                        <motion.button whileHover={{ scale: 1.15, color: "var(--red)" }} whileTap={{ scale: 0.9 }}
                          onClick={() => removeFile(file.name)}
                          style={{ background: "none", border: "none", color: "var(--text-4)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}>
                          <Icon name="close" size={16} />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* Config fields */}
                <div style={{ borderTop: "1px solid rgba(124,58,237,0.1)", paddingTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "6px" }}>
                      Subject Name <span style={{ color: "var(--text-4)", fontWeight: 400 }}>(optional)</span>
                    </label>
                    <input type="text" placeholder="e.g. Human Computer Interaction" value={subjectName} onChange={e => setSubjectName(e.target.value)}
                      style={fieldInput}
                      onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.08)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(124,58,237,0.2)"; e.target.style.boxShadow = "none"; }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "6px" }}>
                      Subject ID <span style={{ color: "var(--pink)", fontWeight: 700 }}>*</span>
                    </label>
                    <input type="number" placeholder="e.g. 3" value={subjectId} onChange={e => setSubjectId(e.target.value)}
                      style={{ ...fieldInput, borderColor: subjectId.trim() ? "rgba(124,58,237,0.4)" : "rgba(124,58,237,0.2)" }}
                      onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.08)"; }}
                      onBlur={e => { e.target.style.borderColor = subjectId.trim() ? "rgba(124,58,237,0.4)" : "rgba(124,58,237,0.2)"; e.target.style.boxShadow = "none"; }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "6px" }}>
                      Paper Name <span style={{ color: "var(--text-4)", fontWeight: 400 }}>(optional)</span>
                    </label>
                    <input type="text" placeholder="e.g. Winter Exam 2025" value={paperName} onChange={e => setPaperName(e.target.value)}
                      style={fieldInput}
                      onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.08)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(124,58,237,0.2)"; e.target.style.boxShadow = "none"; }} />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", padding: "10px 14px", borderRadius: "10px", background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)", color: "var(--red)", fontSize: "12px", overflow: "hidden" }}>
                      <Icon name="error_outline" size={14} />{error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={canAnalyze && !analyzing ? { scale: 1.01, boxShadow: "0 4px 20px rgba(124,58,237,0.3)" } : {}}
                  whileTap={canAnalyze && !analyzing ? { scale: 0.98 } : {}}
                  onClick={handleAnalyze} disabled={analyzing || !canAnalyze}
                  style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: !canAnalyze ? "rgba(255,255,255,0.04)" : analyzing ? "rgba(124,58,237,0.15)" : "linear-gradient(135deg,#7c3aed,#a78bfa)", color: !canAnalyze ? "var(--text-4)" : analyzing ? "var(--primary-light)" : "#fff", fontSize: "13px", fontWeight: 700, cursor: analyzing || !canAnalyze ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s", fontFamily: "Space Grotesk, sans-serif" }}>
                  {analyzing
                    ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ display:"inline-block" }}><Icon name="hourglass_top" size={16} /></motion.span>Analyzing papers…</>
                    : <><Icon name="auto_awesome" size={16} />Analyze Papers{!subjectId.trim() ? " (Subject ID required)" : ""}</>
                  }
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {analyzed && predictions.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Predicted Questions */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ ...panel, padding: "24px 26px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div>
                      <p style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>Predicted Exam Questions</p>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-3)" }}>
                        {analysisResult?.subject_name && `${analysisResult.subject_name} · `}
                        {analysisResult?.paper_name && `${analysisResult.paper_name} · `}
                        {predictions.length} question{predictions.length !== 1 ? "s" : ""} predicted
                      </p>
                    </div>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="auto_awesome" size={18} style={{ color: "var(--primary-light)" }} />
                    </div>
                  </div>
                  <motion.div variants={container} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {predictions.map(({ prediction_id, question_text, confidence, topic, total_marks }) => (
                      <motion.div key={prediction_id} variants={item}
                        whileHover={{ x: 3, borderColor: confidence >= 90 ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.14)" }}
                        style={{ padding: "18px 20px", borderRadius: "14px", background: "rgba(6,6,17,0.6)", border: `1px solid ${confidence >= 90 ? "rgba(124,58,237,0.22)" : "rgba(255,255,255,0.07)"}`, transition: "all 0.2s" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px", marginBottom: "12px" }}>
                          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-1)", lineHeight: 1.6, flex: 1 }}>{question_text}</p>
                          <span style={{ flexShrink: 0, padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 800, background: confidence >= 90 ? "rgba(124,58,237,0.15)" : "rgba(232,121,249,0.1)", color: confidence >= 90 ? "var(--primary-light)" : "var(--pink)", fontFamily: "Space Grotesk, sans-serif" }}>
                            {confidence}%
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {[topic, `[${total_marks} marks]`].map(tag => (
                            <span key={tag} style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", background: "rgba(12,12,30,0.7)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-3)" }}>{tag}</span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>

                {/* Heatmap + Topics */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ ...panel, padding: "24px 26px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                      <div>
                        <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>Topic Frequency Heatmap</p>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-3)" }}>Distribution across analyzed papers</p>
                      </div>
                      <Icon name="leaderboard" size={20} style={{ color: "var(--text-4)" }} />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", height: "160px", alignContent: "flex-start" }}>
                      {HEAT_LEVELS.map((cell, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: cell.opacity, scale: 1 }}
                          transition={{ delay: i * 0.01, duration: 0.2 }}
                          whileHover={{ scale: 1.4, opacity: 1 }}
                          style={{ width: "calc(8.33% - 4px)", height: "28px", borderRadius: "4px", background: cell.color, cursor: "pointer" }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
                      <span style={{ fontSize: "10px", color: "var(--text-4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Low Frequency</span>
                      <span style={{ fontSize: "10px", color: "var(--text-4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>High Frequency</span>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    style={{ ...panel, padding: "24px 26px", display: "flex", flexDirection: "column" }}>
                    <p style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: 700, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>Predicted Topics</p>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "18px" }}>
                      {topicBars.map(({ name, pct, color }, i) => (
                        <div key={name}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-1)" }}>{name}</span>
                            <span style={{ fontSize: "12px", fontWeight: 700, color }}>{pct}% AI</span>
                          </div>
                          <div style={{ height: "5px", borderRadius: "999px", background: "rgba(255,255,255,0.07)" }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.08 + 0.3, duration: 0.6, ease: "easeOut" }}
                              style={{ height: "100%", background: color, borderRadius: "999px", boxShadow: `0 0 6px ${color}` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    {topTopic && (
                      <div style={{ marginTop: "20px", padding: "11px 14px", borderRadius: "12px", background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.2)" }}>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--primary-light)", display: "flex", alignItems: "flex-start", gap: "7px", lineHeight: 1.55 }}>
                          <Icon name="auto_awesome" size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                          High confidence in {topTopic.name} at {topTopic.pct}%.
                        </p>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Extracted topic tags */}
                {uniqueTopics.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ ...panel, padding: "22px 26px" }}>
                    <p style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>Extracted Topics</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {uniqueTopics.map((text, i) => (
                        <motion.span key={text} whileHover={{ scale: 1.06, y: -2 }}
                          style={{ padding: "6px 16px", borderRadius: "999px", fontSize: "13px", border: `1px solid ${i === 0 ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.1)"}`, background: i === 0 ? "rgba(124,58,237,0.1)" : "rgba(12,12,30,0.6)", color: i === 0 ? "var(--primary-light)" : "var(--text-3)", cursor: "pointer", display: "inline-block", transition: "all 0.15s" }}>
                          {text}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent Analysis */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>Recent Analysis</p>
            </div>

            {analysesLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
                {[1,2,3,4].map(i => <div key={i} style={{ borderRadius: "16px", height: "152px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", animation: "pp-pulse 1.5s ease infinite" }} />)}
              </div>
            ) : analyses.length === 0 ? (
              <div style={{ padding: "32px", borderRadius: "16px", border: "1px dashed rgba(124,58,237,0.2)", textAlign: "center", color: "var(--text-4)", fontSize: "13px" }}>
                No analyses yet — upload and analyze your first past paper above.
              </div>
            ) : (
              <motion.div variants={container} initial="hidden" animate="show" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
                {analyses.map((entry) => {
                  const { icon, color } = fileIconFromName(entry.file_name);
                  return (
                    <motion.div key={entry.analysis_id} variants={item}
                      whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(124,58,237,0.15)" }}
                      style={{ ...panel, overflow: "hidden", cursor: "pointer", transition: "all 0.2s" }}>
                      <div style={{ height: "100px", background: "rgba(6,6,17,0.8)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 100%, rgba(124,58,237,0.08), transparent 70%)" }} />
                        <Icon name={icon} size={36} style={{ color }} />
                      </div>
                      <div style={{ padding: "14px 16px" }}>
                        <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {entry.paper_name || entry.subject_name}
                        </p>
                        <p style={{ margin: "0 0 2px", fontSize: "11px", color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.subject_name}</p>
                        <p style={{ margin: 0, fontSize: "11px", color: "var(--text-4)" }}>{formatDate(entry.analyzed_at)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>

        </div>
      </div>
      <style>{`@keyframes pp-pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
    </Layout>
  );
}
