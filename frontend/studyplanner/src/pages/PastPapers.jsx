import { useState, useRef } from "react";
import Layout from "../components/Layout";
import Icon from "../components/Icon";

const TOPICS = [
  { name: "Cell Respiration",  pct: 98, color: "#c0c1ff" },
  { name: "Genetic Variation", pct: 85, color: "#ffb0cd" },
  { name: "Neurobiology",      pct: 72, color: "#c0c1ff" },
];

const TAGS = [
  { text: "Mitosis",           accent: true  },
  { text: "Photosynthesis",    accent: false },
  { text: "Cell Membrane",     accent: false },
  { text: "Active Transport",  accent: false },
  { text: "DNA Replication",   accent: true  },
  { text: "Enzyme Kinetics",   accent: false },
  { text: "Homeostasis",       accent: false },
  { text: "Osmosis",           accent: false },
  { text: "ATP Synthesis",     accent: false },
  { text: "Meiosis",           accent: true  },
  { text: "Metabolism",        accent: false },
  { text: "Protein Synthesis", accent: false },
  { text: "Endocytosis",       accent: false },
];

const PAPERS = [
  { name: "Biology Paper 1 2023",  icon: "picture_as_pdf", date: "2 days ago"  },
  { name: "Chemistry Mock V2",     icon: "description",    date: "5 days ago"  },
  { name: "Biology Paper 2 2022",  icon: "picture_as_pdf", date: "1 week ago"  },
  { name: "Physics Unit 4 Scan",   icon: "image",          date: "2 weeks ago" },
];

const HEAT_LEVELS = Array.from({ length: 36 }, (_, i) => ({
  color: i % 5 === 0 ? "#ffb0cd" : "#c0c1ff",
  opacity: (Math.sin(i * 0.7) * 0.4 + 0.55).toFixed(2),
}));

const PREDICTED_QUESTIONS = [
  {
    question: "Explain the role of ATP synthase in oxidative phosphorylation and describe how a proton gradient drives ATP production.",
    confidence: 94,
    topic: "Cell Respiration",
    paper: "Paper 2",
    marks: 6,
  },
  {
    question: "Compare and contrast mitosis and meiosis, highlighting the genetic significance of each process.",
    confidence: 88,
    topic: "Genetic Variation",
    paper: "Paper 1",
    marks: 4,
  },
  {
    question: "Describe the mechanism of competitive and non-competitive enzyme inhibition with relevant examples.",
    confidence: 82,
    topic: "Enzyme Kinetics",
    paper: "Paper 2",
    marks: 5,
  },
  {
    question: "Outline the stages of DNA replication, naming the key enzymes involved at each step.",
    confidence: 79,
    topic: "DNA Replication",
    paper: "Paper 1",
    marks: 4,
  },
  {
    question: "Explain how a nerve impulse is transmitted across a synapse and how inhibitory signals prevent depolarisation.",
    confidence: 75,
    topic: "Neurobiology",
    paper: "Paper 2",
    marks: 6,
  },
];

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

function fileIcon(file) {
  if (file.type === "application/pdf") return "picture_as_pdf";
  if (file.type.startsWith("image/")) return "image";
  return "description";
}

function fileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PastPapers() {
  const [dragging, setDragging]       = useState(false);
  const [stagedFiles, setStagedFiles] = useState([]);
  const [analyzing, setAnalyzing]     = useState(false);
  const [analyzed, setAnalyzed]       = useState(false);
  const fileInputRef                  = useRef(null);

  function addFiles(incoming) {
    const valid = Array.from(incoming).filter(f => ACCEPTED_TYPES.includes(f.type));
    if (valid.length < incoming.length) {
      alert("Some files were skipped — only PDF, DOCX, JPG, PNG, and WEBP are supported.");
    }
    setStagedFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const fresh = valid.filter(f => !existingNames.has(f.name));
      return [...prev, ...fresh];
    });
    setAnalyzed(false);
  }

  function removeFile(name) {
    setStagedFiles(prev => prev.filter(f => f.name !== name));
    setAnalyzed(false);
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

  function handleAnalyze() {
    if (!stagedFiles.length) return;

    const formData = new FormData();
    stagedFiles.forEach((file, idx) => {
      formData.append(`papers[${idx}]`, file, file.name);
    });

    // Metadata the backend will need alongside the files
    const meta = {
      fileCount: stagedFiles.length,
      files: stagedFiles.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size,
      })),
      requestedOutput: ["extract_text", "topic_frequency", "predict_questions"],
    };
    formData.append("meta", JSON.stringify(meta));

    console.log("=== PastPapers → /api/papers/analyze payload ===");
    console.log("FormData entries:");
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File { name: "${value.name}", type: "${value.type}", size: ${value.size} bytes }`);
      } else {
        console.log(`  ${key}:`, value);
      }
    }
    console.log("Metadata object:", meta);
    console.log("=================================================");

    setAnalyzing(true);
    // Simulate network round-trip — replace with real fetch() when backend is ready
    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
    }, 1800);
  }

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

          {/* Staged files list */}
          {stagedFiles.length > 0 && (
            <div
              className="glass-card"
              style={{ borderRadius: "16px", padding: "18px 24px", marginBottom: "20px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#d4e4fa" }}>
                  {stagedFiles.length} file{stagedFiles.length > 1 ? "s" : ""} ready for analysis
                </p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: "6px 14px", borderRadius: "999px",
                      border: "1px solid rgba(192,193,255,0.25)",
                      background: "rgba(192,193,255,0.07)",
                      color: "#c0c1ff", fontSize: "12px", cursor: "pointer",
                    }}
                  >
                    + Add More
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    style={{
                      padding: "6px 18px", borderRadius: "999px",
                      border: "none",
                      background: analyzing ? "rgba(192,193,255,0.2)" : "rgba(192,193,255,0.85)",
                      color: analyzing ? "rgba(199,196,215,0.5)" : "#0c1623",
                      fontSize: "12px", fontWeight: 700, cursor: analyzing ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: "6px",
                    }}
                  >
                    {analyzing
                      ? <><Icon name="hourglass_top" size={14} />Analyzing…</>
                      : <><Icon name="auto_awesome" size={14} />Analyze Papers</>
                    }
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
                        {file.type === "application/pdf" ? "PDF"
                          : file.type.startsWith("image/") ? "Image"
                          : "Document"} · {fileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(file.name)}
                      style={{
                        background: "none", border: "none",
                        color: "rgba(199,196,215,0.3)", cursor: "pointer", padding: "4px",
                        display: "flex", alignItems: "center",
                      }}
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results — only shown after analysis */}
          {analyzed && (
            <>
              {/* Predicted Questions */}
              <div className="glass-card" style={{ borderRadius: "16px", padding: "22px 24px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
                  <div>
                    <p style={{ margin: "0 0 3px", fontSize: "15px", fontWeight: 700, color: "#d4e4fa" }}>Predicted Exam Questions</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "rgba(199,196,215,0.4)" }}>
                      Based on topic frequency patterns across your uploaded papers
                    </p>
                  </div>
                  <Icon name="auto_awesome" size={20} style={{ color: "#c0c1ff" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {PREDICTED_QUESTIONS.map(({ question, confidence, topic, paper, marks }, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "16px 18px", borderRadius: "12px",
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${confidence >= 90 ? "rgba(192,193,255,0.25)" : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                        <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#d4e4fa", lineHeight: 1.55, flex: 1 }}>
                          {question}
                        </p>
                        <span
                          style={{
                            flexShrink: 0, padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700,
                            background: confidence >= 90 ? "rgba(192,193,255,0.15)" : "rgba(255,176,205,0.1)",
                            color: confidence >= 90 ? "#c0c1ff" : "#ffb0cd",
                          }}
                        >
                          {confidence}%
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {[topic, paper, `[${marks} marks]`].map(tag => (
                          <span
                            key={tag}
                            style={{
                              padding: "3px 10px", borderRadius: "999px", fontSize: "11px",
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              color: "rgba(199,196,215,0.55)",
                            }}
                          >
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
                      <div
                        key={i}
                        style={{
                          width: "calc(8.33% - 4px)", height: "28px", borderRadius: "3px",
                          background: cell.color, opacity: cell.opacity,
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                    <span style={{ fontSize: "10px", color: "rgba(199,196,215,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Low Frequency</span>
                    <span style={{ fontSize: "10px", color: "rgba(199,196,215,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>High Frequency</span>
                  </div>
                </div>

                {/* Predicted topics */}
                <div className="glass-card" style={{ borderRadius: "16px", padding: "22px 24px", display: "flex", flexDirection: "column" }}>
                  <p style={{ margin: "0 0 18px", fontSize: "15px", fontWeight: 700, color: "#d4e4fa" }}>Predicted Topics</p>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
                    {TOPICS.map(({ name, pct, color }) => (
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
                  <div style={{ marginTop: "18px", padding: "10px 12px", borderRadius: "10px", background: "rgba(192,193,255,0.07)", border: "1px solid rgba(192,193,255,0.18)" }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#c0c1ff", display: "flex", alignItems: "flex-start", gap: "7px", lineHeight: 1.5 }}>
                      <Icon name="auto_awesome" size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                      High confidence in Cell Respiration based on 5-year cycle analysis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tag cloud */}
              <div className="glass-card" style={{ borderRadius: "16px", padding: "20px 24px", marginBottom: "20px" }}>
                <p style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700, color: "#d4e4fa" }}>Extracted Topics</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {TAGS.map(({ text, accent }) => (
                    <span
                      key={text}
                      style={{
                        padding: "5px 14px", borderRadius: "999px", fontSize: "13px",
                        border: `1px solid ${accent ? "rgba(192,193,255,0.28)" : "rgba(255,255,255,0.1)"}`,
                        background: accent ? "rgba(192,193,255,0.08)" : "rgba(255,255,255,0.04)",
                        color: accent ? "#c0c1ff" : "rgba(199,196,215,0.6)",
                        cursor: "pointer",
                      }}
                    >
                      {text}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Recent analysis — always visible */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#d4e4fa" }}>Recent Analysis</p>
              <button style={{ background: "none", border: "none", color: "#c0c1ff", fontSize: "13px", fontWeight: 600, cursor: "pointer", padding: 0 }}>View History</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
              {PAPERS.map(({ name, icon, date }) => (
                <div key={name} className="glass-card" style={{ borderRadius: "14px", overflow: "hidden", cursor: "pointer" }}>
                  <div style={{ height: "100px", background: "rgba(12,22,35,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={icon} size={36} style={{ color: "rgba(199,196,215,0.3)" }} />
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <p style={{ margin: "0 0 3px", fontSize: "13px", fontWeight: 600, color: "#d4e4fa" }}>{name}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "rgba(199,196,215,0.4)" }}>Analyzed {date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
