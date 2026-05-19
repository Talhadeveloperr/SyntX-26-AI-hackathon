import { useState, useRef, useEffect } from "react";
import Layout from "../components/Layout";
import Icon from "../components/Icon";
import { analyzePastPapers, getAnalyses } from "../api/pastpaperApi";

// ── static decorative data ────────────────────────────────────────────────────
const HEAT_LEVELS = Array.from({ length: 36 }, (_, i) => ({
  color: i % 5 === 0 ? "#ffb0cd" : "#c0c1ff",
  opacity: (Math.sin(i * 0.7) * 0.4 + 0.55).toFixed(2),
}));

const TOPIC_COLORS = ["#c0c1ff", "#ffb0cd", "#81c995", "#ffd580", "#c0a8ff"];

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
  if (file.type === "application/pdf") return "picture_as_pdf";
  if (file.type.startsWith("image/")) return "image";
  return "description";
}

function fileIconFromName(name) {
  const ext = (name || "").split(".").pop().toLowerCase();
  if (ext === "pdf") return "picture_as_pdf";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "image";
  return "description";
}

function fileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
  } catch { return dateStr; }
}

// derive topic bar chart from real predictions
function buildTopicBars(predictions) {
  const map = {};
  predictions.forEach(p => {
    if (!map[p.topic]) map[p.topic] = { total: 0, count: 0 };
    map[p.topic].total += p.confidence;
    map[p.topic].count += 1;
  });
  return Object.entries(map)
    .map(([name, { total, count }], i) => ({
      name,
      pct: Math.round(total / count),
      color: TOPIC_COLORS[i % TOPIC_COLORS.length],
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);
}

// ── component ─────────────────────────────────────────────────────────────────
export default function PastPapers() {
  const [dragging, setDragging]         = useState(false);
  const [stagedFiles, setStagedFiles]   = useState([]);
  const [analyzing, setAnalyzing]       = useState(false);
  const [analyzed, setAnalyzed]         = useState(false);
  const [error, setError]               = useState(null);
  const fileInputRef                    = useRef(null);

  // form fields for the API payload
  const [subjectId,   setSubjectId]   = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [paperName,   setPaperName]   = useState("");

  // real API results
  const [predictions,     setPredictions]     = useState([]);
  const [analysisResult,  setAnalysisResult]  = useState(null);
  const [analyses,        setAnalyses]        = useState([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);

  // load recent analyses on mount
  useEffect(() => {
    getAnalyses()
      .then(r => setAnalyses(r.data?.analyses ?? []))
      .catch(() => setAnalyses([]))
      .finally(() => setAnalysesLoading(false));
  }, []);

  function addFiles(incoming) {
    const valid = Array.from(incoming).filter(f => ACCEPTED_TYPES.includes(f.type));
    if (valid.length < incoming.length) {
      alert("Some files were skipped — only PDF, DOCX, JPG, PNG, and WEBP are supported.");
    }
    setStagedFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !existingNames.has(f.name))];
    });
    setAnalyzed(false);
    setError(null);
  }

  function removeFile(name) {
    setStagedFiles(prev => prev.filter(f => f.name !== name));
    setAnalyzed(false);
    setError(null);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function handleBrowse(e) {
    addFiles(e.target.files);
    e.target.value = "";
  }

  async function handleAnalyze() {
    if (!stagedFiles.length || !subjectId.trim()) return;

    const formData = new FormData();
    formData.append("student_id",      "1");
    formData.append("subject_id",      subjectId.trim());
    formData.append("subject_name_opt", subjectName.trim());
    formData.append("paper_name_opt",  paperName.trim());
    stagedFiles.forEach(file => formData.append("files", file, file.name));

    console.log("=== PastPapers → POST /api/pastpapers/analyze ===");
    for (const [k, v] of formData.entries()) {
      if (v instanceof File) {
        console.log(`  ${k}: File { name:"${v.name}", type:"${v.type}", size:${v.size} }`);
      } else {
        console.log(`  ${k}:`, v);
      }
    }
    console.log("=================================================");

    setAnalyzing(true);
    setError(null);
    try {
      const res = await analyzePastPapers(formData);
      const data = res.data;
      setAnalysisResult(data);
      setPredictions(data.predictions ?? []);
      setAnalyzed(true);
      // refresh recent analyses list
      getAnalyses()
        .then(r => setAnalyses(r.data?.analyses ?? []))
        .catch(() => {});
    } catch (err) {
      const msg = err.response?.data?.error
        || err.response?.data?.message
        || "Analysis failed. Please check your Subject ID and try again.";
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  }

  const canAnalyze = stagedFiles.length > 0 && subjectId.trim() !== "";
  const topicBars  = buildTopicBars(predictions);
  const uniqueTopics = [...new Set(predictions.map(p => p.topic))];
  const topTopic   = topicBars[0];

  return (
    <Layout title="Past Papers Analyzer">
      <div style={{ padding: "28px 32px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

          {/* Upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className="glass-card"
            style={{
              borderRadius: "16px", padding: "48px 32px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              textAlign: "center", minHeight: "220px",
              border: `2px dashed ${dragging ? "rgba(192,193,255,0.6)" : "rgba(192,193,255,0.25)"}`,
              marginBottom: stagedFiles.length ? "14px" : "20px",
              transition: "border-color 0.2s",
              background: dragging ? "rgba(192,193,255,0.04)" : undefined,
            }}
          >
            <Icon name="cloud_upload" size={44} style={{ color: "#c0c1ff", display: "block", marginBottom: "12px" }} />
            <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700, color: "#d4e4fa" }}>
              Drag and drop past paper files
            </h3>
            <p style={{ margin: "0 0 18px", fontSize: "13px", color: "rgba(199,196,215,0.5)" }}>
              Supports PDF, DOCX, JPG, PNG — upload multiple files at once. AI extracts text and predicts likely questions.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              style={{ display: "none" }}
              onChange={handleBrowse}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "9px 24px", borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.05)",
                color: "rgba(199,196,215,0.8)", fontSize: "13px", cursor: "pointer",
              }}
            >
              Browse Files
            </button>
          </div>

          {/* Staged files + config */}
          {stagedFiles.length > 0 && (
            <div className="glass-card" style={{ borderRadius: "16px", padding: "18px 24px", marginBottom: "20px" }}>

              {/* File list header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#d4e4fa" }}>
                  {stagedFiles.length} file{stagedFiles.length > 1 ? "s" : ""} ready for analysis
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "5px 13px", borderRadius: "999px",
                    border: "1px solid rgba(192,193,255,0.25)",
                    background: "rgba(192,193,255,0.07)",
                    color: "#c0c1ff", fontSize: "12px", cursor: "pointer",
                  }}
                >
                  + Add More
                </button>
              </div>

              {/* Files */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                {stagedFiles.map(file => (
                  <div
                    key={file.name}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "10px 14px", borderRadius: "10px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <Icon
                      name={fileIcon(file)}
                      size={22}
                      style={{ color: file.type === "application/pdf" ? "#ffb0cd" : "#c0c1ff", flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#d4e4fa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.name}
                      </p>
                      <p style={{ margin: 0, fontSize: "11px", color: "rgba(199,196,215,0.4)" }}>
                        {file.type === "application/pdf" ? "PDF" : file.type.startsWith("image/") ? "Image" : "Document"} · {fileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(file.name)}
                      style={{ background: "none", border: "none", color: "rgba(199,196,215,0.3)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Analysis config fields */}
              <div style={{
                borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "14px",
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "14px",
              }}>
                
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(199,196,215,0.4)", marginBottom: "5px" }}>
                    Subject Name <span style={{ color: "rgba(199,196,215,0.25)" }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Human Computer Interaction"
                    value={subjectName}
                    onChange={e => setSubjectName(e.target.value)}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(1,15,31,0.7)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px", padding: "7px 10px",
                      color: "#d4e4fa", fontSize: "13px", outline: "none",
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(192,193,255,0.4)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(199,196,215,0.4)", marginBottom: "5px" }}>
                    Subject ID <span style={{ color: "#ffb0cd" }}>*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 3"
                    value={subjectId}
                    onChange={e => setSubjectId(e.target.value)}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(1,15,31,0.7)", border: `1px solid ${subjectId.trim() ? "rgba(192,193,255,0.35)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: "8px", padding: "7px 10px",
                      color: "#d4e4fa", fontSize: "13px", outline: "none",
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(192,193,255,0.5)"}
                    onBlur={e => e.target.style.borderColor = subjectId.trim() ? "rgba(192,193,255,0.35)" : "rgba(255,255,255,0.1)"}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(199,196,215,0.4)", marginBottom: "5px" }}>
                    Paper Name <span style={{ color: "rgba(199,196,215,0.25)" }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Winter Exam 2025"
                    value={paperName}
                    onChange={e => setPaperName(e.target.value)}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(1,15,31,0.7)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px", padding: "7px 10px",
                      color: "#d4e4fa", fontSize: "13px", outline: "none",
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(192,193,255,0.4)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px",
                  padding: "10px 14px", borderRadius: "10px",
                  background: "rgba(255,180,171,0.07)", border: "1px solid rgba(255,180,171,0.2)",
                  color: "#ffb4ab", fontSize: "12px",
                }}>
                  <Icon name="error_outline" size={14} />
                  {error}
                </div>
              )}

              {/* Analyze button */}
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !canAnalyze}
                style={{
                  width: "100%", padding: "10px", borderRadius: "10px", border: "none",
                  background: !canAnalyze
                    ? "rgba(255,255,255,0.05)"
                    : analyzing
                      ? "rgba(192,193,255,0.2)"
                      : "rgba(192,193,255,0.9)",
                  color: !canAnalyze
                    ? "rgba(199,196,215,0.3)"
                    : analyzing
                      ? "rgba(199,196,215,0.5)"
                      : "#0c1623",
                  fontSize: "13px", fontWeight: 700,
                  cursor: analyzing || !canAnalyze ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                  transition: "all 0.2s",
                }}
              >
                {analyzing
                  ? <><Icon name="hourglass_top" size={15} />Analyzing papers…</>
                  : <><Icon name="auto_awesome" size={15} />Analyze Papers{!subjectId.trim() ? " (Subject ID required)" : ""}</>
                }
              </button>
            </div>
          )}

          {/* Results — shown after successful analysis */}
          {analyzed && predictions.length > 0 && (
            <>
              {/* Predicted Questions */}
              <div className="glass-card" style={{ borderRadius: "16px", padding: "22px 24px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
                  <div>
                    <p style={{ margin: "0 0 3px", fontSize: "15px", fontWeight: 700, color: "#d4e4fa" }}>Predicted Exam Questions</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "rgba(199,196,215,0.4)" }}>
                      {analysisResult?.subject_name && `${analysisResult.subject_name} · `}
                      {analysisResult?.paper_name && `${analysisResult.paper_name} · `}
                      {predictions.length} question{predictions.length !== 1 ? "s" : ""} predicted
                    </p>
                  </div>
                  <Icon name="auto_awesome" size={20} style={{ color: "#c0c1ff" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {predictions.map(({ prediction_id, question_text, confidence, topic, total_marks }) => (
                    <div
                      key={prediction_id}
                      style={{
                        padding: "16px 18px", borderRadius: "12px",
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${confidence >= 90 ? "rgba(192,193,255,0.25)" : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                        <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#d4e4fa", lineHeight: 1.55, flex: 1 }}>
                          {question_text}
                        </p>
                        <span style={{
                          flexShrink: 0, padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700,
                          background: confidence >= 90 ? "rgba(192,193,255,0.15)" : "rgba(255,176,205,0.1)",
                          color: confidence >= 90 ? "#c0c1ff" : "#ffb0cd",
                        }}>
                          {confidence}%
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {[topic, `[${total_marks} marks]`].map(tag => (
                          <span key={tag} style={{
                            padding: "3px 10px", borderRadius: "999px", fontSize: "11px",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "rgba(199,196,215,0.55)",
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", marginBottom: "20px" }}>
                {/* Heatmap */}
                <div className="glass-card" style={{ borderRadius: "16px", padding: "22px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
                    <div>
                      <p style={{ margin: "0 0 3px", fontSize: "15px", fontWeight: 700, color: "#d4e4fa" }}>Topic Frequency Heatmap</p>
                      <p style={{ margin: 0, fontSize: "12px", color: "rgba(199,196,215,0.4)" }}>Distribution across analyzed papers</p>
                    </div>
                    <Icon name="leaderboard" size={20} style={{ color: "rgba(199,196,215,0.3)" }} />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", height: "160px", alignContent: "flex-start" }}>
                    {HEAT_LEVELS.map((cell, i) => (
                      <div key={i} style={{ width: "calc(8.33% - 4px)", height: "28px", borderRadius: "3px", background: cell.color, opacity: cell.opacity }} />
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                    <span style={{ fontSize: "10px", color: "rgba(199,196,215,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Low Frequency</span>
                    <span style={{ fontSize: "10px", color: "rgba(199,196,215,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>High Frequency</span>
                  </div>
                </div>

                {/* Predicted topics — derived from real predictions */}
                <div className="glass-card" style={{ borderRadius: "16px", padding: "22px 24px", display: "flex", flexDirection: "column" }}>
                  <p style={{ margin: "0 0 18px", fontSize: "15px", fontWeight: 700, color: "#d4e4fa" }}>Predicted Topics</p>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
                    {topicBars.map(({ name, pct, color }) => (
                      <div key={name}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#d4e4fa" }}>{name}</span>
                          <span style={{ fontSize: "12px", fontWeight: 700, color }}>{pct}% AI</span>
                        </div>
                        <div style={{ height: "5px", borderRadius: "999px", background: "rgba(255,255,255,0.08)" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "999px" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {topTopic && (
                    <div style={{ marginTop: "18px", padding: "10px 12px", borderRadius: "10px", background: "rgba(192,193,255,0.07)", border: "1px solid rgba(192,193,255,0.18)" }}>
                      <p style={{ margin: 0, fontSize: "12px", color: "#c0c1ff", display: "flex", alignItems: "flex-start", gap: "7px", lineHeight: 1.5 }}>
                        <Icon name="auto_awesome" size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                        High confidence in {topTopic.name} at {topTopic.pct}%.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Extracted Topics tag cloud — from real prediction topics */}
              {uniqueTopics.length > 0 && (
                <div className="glass-card" style={{ borderRadius: "16px", padding: "20px 24px", marginBottom: "20px" }}>
                  <p style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700, color: "#d4e4fa" }}>Extracted Topics</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {uniqueTopics.map((text, i) => (
                      <span key={text} style={{
                        padding: "5px 14px", borderRadius: "999px", fontSize: "13px",
                        border: `1px solid ${i === 0 ? "rgba(192,193,255,0.28)" : "rgba(255,255,255,0.1)"}`,
                        background: i === 0 ? "rgba(192,193,255,0.08)" : "rgba(255,255,255,0.04)",
                        color: i === 0 ? "#c0c1ff" : "rgba(199,196,215,0.6)",
                        cursor: "pointer",
                      }}>
                        {text}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Recent Analysis — loaded from GET /analyses */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#d4e4fa" }}>Recent Analysis</p>
            </div>

            {analysesLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ borderRadius: "14px", height: "152px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", animation: "pp-pulse 1.5s ease infinite" }} />
                ))}
              </div>
            ) : analyses.length === 0 ? (
              <div style={{ padding: "32px", borderRadius: "14px", border: "1px dashed rgba(255,255,255,0.1)", textAlign: "center", color: "rgba(199,196,215,0.3)", fontSize: "13px" }}>
                No analyses yet — upload and analyze your first past paper above.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
                {analyses.map(item => (
                  <div key={item.analysis_id} className="glass-card" style={{ borderRadius: "14px", overflow: "hidden", cursor: "pointer" }}>
                    <div style={{ height: "100px", background: "rgba(12,22,35,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={fileIconFromName(item.file_name)} size={36} style={{ color: "rgba(199,196,215,0.3)" }} />
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600, color: "#d4e4fa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.paper_name || item.subject_name}
                      </p>
                      <p style={{ margin: "0 0 2px", fontSize: "11px", color: "rgba(199,196,215,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.subject_name}
                      </p>
                      <p style={{ margin: 0, fontSize: "11px", color: "rgba(199,196,215,0.3)" }}>
                        {formatDate(item.analyzed_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <style>{`@keyframes pp-pulse { 0%,100%{opacity:1}50%{opacity:0.45} }`}</style>
    </Layout>
  );
}
